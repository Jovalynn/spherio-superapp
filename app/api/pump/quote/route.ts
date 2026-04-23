import { NextRequest, NextResponse } from "next/server";
import {
  getPumpCurveState,
  getPumpQuote,
  type PumpCurveInput,
} from "@/lib/pump/curve";
import { getPumpFeePolicy } from "@/lib/pump/economics";

type QuoteSide = "buy" | "sell";

type PumpQuoteRequest = {
  side?: QuoteSide;
  amount?: string | number;
  tokenAddress?: string;
  symbol?: string;
  totalSupply?: string | number;

  // Optional authority inputs for the curve engine.
  realTokenReserve?: string | number;
  realBaseReserve?: string | number;
  virtualTokenReserve?: string | number;
  virtualBaseReserve?: string | number;
  targetBaseReserveForGraduation?: string | number;
  feeBps?: string | number;
  slippageBps?: string | number;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function round(value: number, decimals = 6): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildCurveInput(body: PumpQuoteRequest): PumpCurveInput {
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
    toNumber(body.targetBaseReserveForGraduation, 500_000),
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PumpQuoteRequest;

    const side: QuoteSide = body.side === "sell" ? "sell" : "buy";
    const amount = toNumber(body.amount, 0);
    const feePolicy = getPumpFeePolicy();

    if (amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Amount must be greater than zero." },
        { status: 400 },
      );
    }

    const curve = buildCurveInput(body);
    const slippageBps = Math.max(toNumber(body.slippageBps, 100), 0);
    const state = getPumpCurveState(curve);

    if (side === "buy") {
      const quote = getPumpQuote({
        kind: "buy",
        curve,
        trade: {
          baseIn: amount,
          slippageBps,
        },
      });

      if (quote.kind !== "buy") {
        throw new Error("Unexpected buy quote result");
      }

      return NextResponse.json({
        ok: true,
        source: "authoritative_curve_engine",
        treasuryRecipient: feePolicy.feeRecipient,
        state,
        quote: {
          side,
          tokenAddress: curve.tokenAddress,
          symbol: curve.symbol,
          amountIn: round(quote.baseIn, 6),
          amountInDenom: "RIO",
          feeAmount: round(quote.feeBase, 6),
          feeDenom: "RIO",
          feeRecipient: feePolicy.feeRecipient,
          curveFeeBps: feePolicy.curveFeeBps,
          netAmountIn: round(quote.netBaseIn, 6),
          estimatedAmountOut: round(quote.tokenOut, 2),
          estimatedAmountOutDenom: curve.symbol,
          minAmountOut: round(quote.minTokenOut, 2),
          minAmountOutDenom: curve.symbol,
          effectivePriceRio: round(quote.effectivePriceInBase, 8),
          impliedMarketCapRio: round(
            quote.postTradeState.pricing.impliedMarketCapInBase,
            2,
          ),
          progressPercent: round(
            quote.postTradeState.graduation.progressPercent,
            2,
          ),
          curveState: quote.postTradeState.graduation.ready
            ? "graduation-ready"
            : "pre-graduation",
          priceImpactBps: round(quote.priceImpactBps, 2),
          slippageBps,
        },
        authority: {
          reserves: state.reserves,
          pricing: state.pricing,
          graduation: state.graduation,
        },
      });
    }

    const quote = getPumpQuote({
      kind: "sell",
      curve,
      trade: {
        tokenIn: amount,
        slippageBps,
      },
    });

    if (quote.kind !== "sell") {
      throw new Error("Unexpected sell quote result");
    }

    return NextResponse.json({
      ok: true,
      source: "authoritative_curve_engine",
      treasuryRecipient: feePolicy.feeRecipient,
      state,
      quote: {
        side,
        tokenAddress: curve.tokenAddress,
        symbol: curve.symbol,
        amountIn: round(quote.tokenIn, 2),
        amountInDenom: curve.symbol,
        feeAmount: round(quote.feeBase, 6),
        feeDenom: "RIO",
        feeRecipient: feePolicy.feeRecipient,
        curveFeeBps: feePolicy.curveFeeBps,
        grossAmountOut: round(quote.grossBaseOut, 6),
        grossAmountOutDenom: "RIO",
        netAmountOut: round(quote.netBaseOut, 6),
        estimatedAmountOut: round(quote.netBaseOut, 6),
        estimatedAmountOutDenom: "RIO",
        minAmountOut: round(quote.minBaseOut, 6),
        minAmountOutDenom: "RIO",
        effectivePriceRio: round(quote.effectivePriceInBase, 8),
        impliedMarketCapRio: round(
          quote.postTradeState.pricing.impliedMarketCapInBase,
          2,
        ),
        progressPercent: round(
          quote.postTradeState.graduation.progressPercent,
          2,
        ),
        curveState: quote.postTradeState.graduation.ready
          ? "graduation-ready"
          : "pre-graduation",
        priceImpactBps: round(quote.priceImpactBps, 2),
        slippageBps,
      },
      authority: {
        reserves: state.reserves,
        pricing: state.pricing,
        graduation: state.graduation,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build quote.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
