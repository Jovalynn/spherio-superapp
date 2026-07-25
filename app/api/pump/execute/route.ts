import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import {
  executePumpTrade,
  getPumpCurveState,
  type PumpCurveInput,
} from "@/lib/pump/curve";
import { getPumpFeePolicy } from "@/lib/pump/economics";
import {
  buildPumpProtectionState,
  evaluatePumpTradeProtection,
  getDefaultPumpProtectionInput,
} from "@/lib/pump/protection";

type ExecuteSide = "buy" | "sell";

const RIO_REFERENCE_PRICE_RUSD_ESTIMATE = 0.1;

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

function pseudoTxHash(symbol: string, side: ExecuteSide) {
  const seed = `${symbol}-${side}-${Date.now()}`.replace(/[^a-zA-Z0-9]/g, "");
  return `pump_${seed.slice(0, 24)}`;
}

function toBaseUnits(value: number, decimals = 6): string {
  const scaled = Math.max(0, Math.round(value * 10 ** decimals));
  return String(scaled);
}

function progressPercentFromState(stateAfter: any): number {
  const progress = toNumber(stateAfter?.graduation?.progressPercent, 0);
  return Math.max(0, Math.min(progress, 100));
}

function impliedPriceRioFromState(stateAfter: any): number {
  return Math.max(toNumber(stateAfter?.pricing?.impliedPriceInBase, 0), 0);
}

function impliedMarketCapRioFromState(stateAfter: any): number {
  return Math.max(toNumber(stateAfter?.pricing?.impliedMarketCapInBase, 0), 0);
}

function raisedRusdEquivalentFromState(stateAfter: any): number {
  const realBaseReserve = Math.max(toNumber(stateAfter?.reserves?.realBaseReserve, 0), 0);
  return realBaseReserve * RIO_REFERENCE_PRICE_RUSD_ESTIMATE;
}

function impliedMarketCapRusdFromState(stateAfter: any): number {
  return impliedMarketCapRioFromState(stateAfter) * RIO_REFERENCE_PRICE_RUSD_ESTIMATE;
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

async function persistPumpExecution(params: {
  accepted: boolean;
  previewOnly: boolean;
  side: ExecuteSide;
  tokenAddress: string;
  traderAddress: string;
  txHash: string;
  quote: any;
  stateAfter: any;
}) {
  if (!params.accepted || params.previewOnly || !params.tokenAddress) return;

  const pool = getPgPool();

  const current = await pool.query(
    `
      SELECT updated_height
      FROM pump_live_curve_state
      WHERE token_address = $1
      LIMIT 1
    `,
    [params.tokenAddress],
  );

  const previousHeight = toNumber(current.rows[0]?.updated_height, 0);
  const nextHeight = Math.max(previousHeight + 1, Math.floor(Date.now() / 1000));

  const realRioReserveUrio = toBaseUnits(params.stateAfter.reserves.realBaseReserve, 6);
  const realTokenReserveBase = toBaseUnits(params.stateAfter.reserves.realTokenReserve, 6);

  const tokenAmountBase =
    params.side === "buy"
      ? toBaseUnits(toNumber(params.quote.tokenOut, 0), 6)
      : toBaseUnits(toNumber(params.quote.tokenIn, 0), 6);

  const rioAmountUrio =
    params.side === "buy"
      ? toBaseUnits(toNumber(params.quote.baseIn, 0), 6)
      : toBaseUnits(toNumber(params.quote.grossBaseOut, 0), 6);

  const feeAmountUrio = toBaseUnits(toNumber(params.quote.feeBase, 0), 6);
  const priceRusd = toNumber(params.quote.effectivePriceInBase, 0);

  await pool.query("BEGIN");

  try {
    await pool.query(
      `
        INSERT INTO pump_live_trades (
          token_address,
          trader_address,
          side,
          token_amount_base,
          rio_amount_urio,
          fee_amount_urio,
          price_rusd,
          tx_hash,
          event_index,
          block_height,
          block_time
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
        ON CONFLICT (tx_hash, event_index) DO NOTHING
      `,
      [
        params.tokenAddress,
        params.traderAddress,
        params.side,
        tokenAmountBase,
        rioAmountUrio,
        feeAmountUrio,
        priceRusd,
        params.txHash,
        0,
        nextHeight,
      ],
    );

    const progressPercent = progressPercentFromState(params.stateAfter);
    const raisedRusdEquivalent = raisedRusdEquivalentFromState(params.stateAfter);
    const impliedPriceRio = impliedPriceRioFromState(params.stateAfter);
    const impliedMarketCapRusd = impliedMarketCapRusdFromState(params.stateAfter);

    await pool.query(
      `
        UPDATE pump_live_curve_state
        SET
          real_rio_reserve_urio = $2,
          real_token_reserve_base = $3,
          progress_percent = $4,
          raised_rusd_equivalent = $5,
          implied_price_rio = $6,
          implied_market_cap_rusd = $7,
          trade_count = (
            SELECT COUNT(*)
            FROM pump_live_trades
            WHERE token_address = $1
          ),
          buy_count = (
            SELECT COUNT(*)
            FROM pump_live_trades
            WHERE token_address = $1
              AND side = 'buy'
          ),
          sell_count = (
            SELECT COUNT(*)
            FROM pump_live_trades
            WHERE token_address = $1
              AND side = 'sell'
          ),
          unique_buyers = (
            SELECT COUNT(DISTINCT trader_address)
            FROM pump_live_trades
            WHERE token_address = $1
              AND side = 'buy'
              AND trader_address IS NOT NULL
              AND trader_address <> ''
          ),
          last_trade_height = $8,
          last_trade_tx_hash = $9,
          updated_height = $8,
          updated_at = now()
        WHERE token_address = $1
      `,
      [
        params.tokenAddress,
        realRioReserveUrio,
        realTokenReserveBase,
        progressPercent,
        raisedRusdEquivalent,
        impliedPriceRio,
        impliedMarketCapRusd,
        nextHeight,
        params.txHash,
      ],
    );

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
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

    const curve = await buildCurveInputFromDb(body);
    const stateBefore = getPumpCurveState(curve);
    const previewOnly = toBoolean(body.previewOnly, true);
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
      const txHash = pseudoTxHash(curve.symbol, side);

      await persistPumpExecution({
        accepted,
        previewOnly,
        side,
        tokenAddress: curve.tokenAddress,
        traderAddress,
        txHash,
        quote: execution.quote,
        stateAfter: execution.stateAfter,
      });

      return NextResponse.json({
        ok: true,
        source: "authoritative_curve_engine",
        treasuryRecipient: feePolicy.feeRecipient,
        execution: {
          status: accepted ? (previewOnly ? "preview" : "filled") : "rejected",
          side,
          tokenAddress: curve.tokenAddress,
          symbol: curve.symbol,
          traderAddress,
          txHash,
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
            ? previewOnly
              ? "Buy execution preview generated from Pump.live authoritative curve."
              : "Buy execution completed on Pump.live authoritative curve."
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
    const txHash = pseudoTxHash(curve.symbol, side);

    await persistPumpExecution({
      accepted,
      previewOnly,
      side,
      tokenAddress: curve.tokenAddress,
      traderAddress,
      txHash,
      quote: execution.quote,
      stateAfter: execution.stateAfter,
    });

    return NextResponse.json({
      ok: true,
      source: "authoritative_curve_engine",
      treasuryRecipient: feePolicy.feeRecipient,
      execution: {
        status: accepted ? (previewOnly ? "preview" : "filled") : "rejected",
        side,
        tokenAddress: curve.tokenAddress,
        symbol: curve.symbol,
        traderAddress,
        txHash,
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
          ? previewOnly
            ? "Sell execution preview generated from Pump.live authoritative curve."
            : "Sell execution completed on Pump.live authoritative curve."
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
