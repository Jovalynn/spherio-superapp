import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import {
  executePumpTrade,
  getPumpCurveState,
  type PumpCurveInput,
} from "@/lib/pump/curve";
import { getPumpFeePolicy } from "@/lib/pump/economics";
import { admitPumpPreviewRequest } from "@/lib/pump/execution-safety.mjs";
import {
  buildPumpProtectionState,
  evaluatePumpTradeProtection,
  getDefaultPumpProtectionInput,
} from "@/lib/pump/protection";

type ExecuteSide = "buy" | "sell";

type PumpExecuteRequest = {
  side?: ExecuteSide;
  amount?: string | number;
  tokenAddress?: string;
  symbol?: string;
  totalSupply?: string | number;

  realTokenReserve?: string | number;
  realBaseReserve?: string | number;
  virtualTokenReserve?: string | number;
  virtualBaseReserve?: string | number;
  targetBaseReserveForGraduation?: string | number;
  feeBps?: string | number;
  slippageBps?: string | number;
  previewOnly?: boolean;
  maxPriceImpactBps?: string | number;
  traderAddress?: string;
  walletAdapter?: string;
  executionMode?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __pumpExecutePgPool: Pool | undefined;
}

function getPgPool() {
  if (!globalThis.__pumpExecutePgPool) {
    globalThis.__pumpExecutePgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return globalThis.__pumpExecutePgPool;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeTraderAddress(value: unknown, executionMode?: unknown): string {
  const address = String(value || "").trim();
  const mode = String(executionMode || "").trim();

  if (/^rio1[a-z0-9]{20,}$/i.test(address)) {
    return address;
  }

  if (mode === "riolight-wallet") {
    throw new Error("RioLight wallet execution requires a connected rio1 trader address.");
  }

  return "backend:pump.execute";
}

function round(value: number, decimals = 6): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildCurveInput(body: PumpExecuteRequest): PumpCurveInput {
  const tokenAddress = (body.tokenAddress || "").toString().trim();
  const symbol = ((body.symbol || "PUMP").toString().trim().toUpperCase() || "PUMP") as string;
  const totalSupply = Math.max(toNumber(body.totalSupply, 1_000_000_000), 1);

  const realTokenReserve = Math.max(
    toNumber(body.realTokenReserve, totalSupply * 0.8),
    0,
  );
  const realBaseReserve = Math.max(toNumber(body.realBaseReserve, 55_000), 0);
  const virtualTokenReserve = Math.max(
    toNumber(body.virtualTokenReserve, totalSupply * 0.2),
    0,
  );
  const virtualBaseReserve = Math.max(
    toNumber(body.virtualBaseReserve, 530_000),
    0,
  );
  const targetBaseReserveForGraduation = Math.max(
    toNumber(body.targetBaseReserveForGraduation, 650_000),
    1,
  );
  const feeBps = Math.max(toNumber(body.feeBps, 100), 0);

  return {
    tokenAddress,
    symbol,
    launchRail: "pump.live",
    baseAsset: "RIO",
    realTokenReserve,
    realBaseReserve,
    virtualTokenReserve,
    virtualBaseReserve,
    targetBaseReserveForGraduation,
    feeBps,
  };
}

async function buildCurveInputFromDb(body: PumpExecuteRequest): Promise<PumpCurveInput> {
  const fallback = buildCurveInput(body);
  const tokenAddress = fallback.tokenAddress.trim();

  if (!tokenAddress) return fallback;

  try {
    const pool = getPgPool();
    const result = await pool.query(
      `
        SELECT
          plt.token_symbol,
          pcs.real_rio_reserve_urio,
          pcs.real_token_reserve_base,
          pcs.virtual_rio_reserve_urio,
          pcs.virtual_token_reserve_base
        FROM pump_live_curve_state pcs
        LEFT JOIN pump_live_tokens plt
          ON plt.token_address = pcs.token_address
        WHERE pcs.token_address = $1
        LIMIT 1
      `,
      [tokenAddress],
    );

    const row = result.rows[0];
    if (!row) return fallback;

    return {
      ...fallback,
      symbol: String(row.token_symbol || fallback.symbol || "PUMP").toUpperCase(),
      realBaseReserve: toNumber(row.real_rio_reserve_urio, 0) / 1_000_000,
      realTokenReserve: toNumber(row.real_token_reserve_base, fallback.realTokenReserve * 1_000_000) / 1_000_000,
      virtualBaseReserve: toNumber(row.virtual_rio_reserve_urio, fallback.virtualBaseReserve * 1_000_000) / 1_000_000,
      virtualTokenReserve: toNumber(row.virtual_token_reserve_base, fallback.virtualTokenReserve * 1_000_000) / 1_000_000,
    };
  } catch (error) {
    console.error("pump_execute_load_curve_state_failed", error);
    return fallback;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PumpExecuteRequest;

    const side: ExecuteSide = body.side === "sell" ? "sell" : "buy";
    const amount = toNumber(body.amount, 0);
    const feePolicy = getPumpFeePolicy();

    if (amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Amount must be greater than zero." },
        { status: 400 },
      );
    }

    const admission = admitPumpPreviewRequest(toBoolean(body.previewOnly, true));
    if (!admission.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: admission.code,
          error: admission.error,
        },
        { status: admission.status },
      );
    }

    const previewOnly = admission.previewOnly;
    const curve = await buildCurveInputFromDb(body);
    const stateBefore = getPumpCurveState(curve);
    const traderAddress = normalizeTraderAddress(body.traderAddress, body.executionMode);
    const slippageBps = Math.max(toNumber(body.slippageBps, 100), 0);
    const maxPriceImpactBps = Math.max(toNumber(body.maxPriceImpactBps, 2_500), 0);

    const protectionState = buildPumpProtectionState(
      getDefaultPumpProtectionInput({
        tokenAddress: curve.tokenAddress,
        symbol: curve.symbol,
      }),
    );

    if (side === "buy") {
      const execution = executePumpTrade({
        kind: "buy",
        curve,
        trade: {
          baseIn: amount,
          slippageBps,
        },
        previewOnly,
        maxPriceImpactBps,
      });

      if (execution.quote.kind !== "buy") {
        throw new Error("Unexpected buy execution result");
      }

      const protectionEval = evaluatePumpTradeProtection({
        protection: protectionState,
        priceImpactBps: execution.quote.priceImpactBps,
        maxPriceImpactBps,
      });

      const accepted = execution.accepted && !protectionEval.blocked;
      const allMessages = [
        ...execution.protection.messages,
        ...protectionEval.messages,
        ...protectionEval.warnings,
      ].filter(Boolean);
      return NextResponse.json({
        ok: true,
        source: "curve_preview_only",
        treasuryRecipient: feePolicy.feeRecipient,
        execution: {
          status: accepted ? "preview" : "rejected",
          side,
          tokenAddress: curve.tokenAddress,
          symbol: curve.symbol,
          traderAddress,
          amountIn: round(execution.quote.baseIn, 6),
          amountInDenom: "RIO",
          feeAmount: round(execution.quote.feeBase, 6),
          feeDenom: "RIO",
          feeRecipient: feePolicy.feeRecipient,
          curveFeeBps: feePolicy.curveFeeBps,
          netAmountIn: round(execution.quote.netBaseIn, 6),
          amountOut: round(execution.quote.tokenOut, 2),
          amountOutDenom: curve.symbol,
          minAmountOut: round(execution.quote.minTokenOut, 2),
          minAmountOutDenom: curve.symbol,
          effectivePriceRio: round(execution.quote.effectivePriceInBase, 8),
          impliedMarketCapRio: round(
            execution.stateAfter.pricing.impliedMarketCapInBase,
            2,
          ),
          progressPercent: round(
            execution.stateAfter.graduation.progressPercent,
            2,
          ),
          curveState: execution.stateAfter.graduation.ready
            ? "graduation-ready"
            : "pre-graduation",
          priceImpactBps: round(execution.quote.priceImpactBps, 2),
          previewOnly,
          accepted,
          message: accepted
            ? "Buy preview only. No chain transaction was submitted."
            : allMessages.join(" ") || "Buy execution rejected by protection policy.",
        },
        authority: {
          stateBefore,
          stateAfter: execution.stateAfter,
          protection: {
            curve: execution.protection,
            policy: protectionState,
            enforcement: protectionEval,
          },
          slippageBps,
          maxPriceImpactBps,
        },
      });
    }

    const execution = executePumpTrade({
      kind: "sell",
      curve,
      trade: {
        tokenIn: amount,
        slippageBps,
      },
      previewOnly,
      maxPriceImpactBps,
    });

    if (execution.quote.kind !== "sell") {
      throw new Error("Unexpected sell execution result");
    }

    const protectionEval = evaluatePumpTradeProtection({
      protection: protectionState,
      priceImpactBps: execution.quote.priceImpactBps,
      maxPriceImpactBps,
    });

    const accepted = execution.accepted && !protectionEval.blocked;
    const allMessages = [
      ...execution.protection.messages,
      ...protectionEval.messages,
      ...protectionEval.warnings,
    ].filter(Boolean);
    return NextResponse.json({
      ok: true,
      source: "curve_preview_only",
      treasuryRecipient: feePolicy.feeRecipient,
      execution: {
        status: accepted ? "preview" : "rejected",
        side,
        tokenAddress: curve.tokenAddress,
        symbol: curve.symbol,
        traderAddress,
        amountIn: round(execution.quote.tokenIn, 2),
        amountInDenom: curve.symbol,
        feeAmount: round(execution.quote.feeBase, 6),
        feeDenom: "RIO",
        feeRecipient: feePolicy.feeRecipient,
        curveFeeBps: feePolicy.curveFeeBps,
        grossAmountOut: round(execution.quote.grossBaseOut, 6),
        grossAmountOutDenom: "RIO",
        amountOut: round(execution.quote.netBaseOut, 6),
        amountOutDenom: "RIO",
        minAmountOut: round(execution.quote.minBaseOut, 6),
        minAmountOutDenom: "RIO",
        effectivePriceRio: round(execution.quote.effectivePriceInBase, 8),
        impliedMarketCapRio: round(
          execution.stateAfter.pricing.impliedMarketCapInBase,
          2,
        ),
        progressPercent: round(
          execution.stateAfter.graduation.progressPercent,
          2,
        ),
        curveState: execution.stateAfter.graduation.ready
          ? "graduation-ready"
          : "pre-graduation",
        priceImpactBps: round(execution.quote.priceImpactBps, 2),
        previewOnly,
        accepted,
        message: accepted
          ? "Sell preview only. No chain transaction was submitted."
          : allMessages.join(" ") || "Sell execution rejected by protection policy.",
      },
      authority: {
        stateBefore,
        stateAfter: execution.stateAfter,
        protection: {
          curve: execution.protection,
          policy: protectionState,
          enforcement: protectionEval,
        },
        slippageBps,
        maxPriceImpactBps,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to execute trade.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
