export type CpmmQuoteInput = {
  amountIn: number;
  reserveIn: number;
  reserveOut: number;
  feeBps?: number;
};

export type CpmmQuoteResult = {
  ok: boolean;
  amountIn: number;
  amountInAfterFee: number;
  amountOut: number;
  feeAmount: number;
  feeBps: number;
  spotPrice: number;
  executionPrice: number;
  priceImpactPct: number;
  kBefore: number;
  kAfter: number;
  reserveInBefore: number;
  reserveOutBefore: number;
  reserveInAfter: number;
  reserveOutAfter: number;
  invariant: "x*y=k";
  error?: string;
};

export function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateCpmmQuote(input: CpmmQuoteInput): CpmmQuoteResult {
  const amountIn = toFiniteNumber(input.amountIn);
  const reserveIn = toFiniteNumber(input.reserveIn);
  const reserveOut = toFiniteNumber(input.reserveOut);
  const feeBps = Math.max(0, Math.min(10_000, toFiniteNumber(input.feeBps, 30)));

  const base: CpmmQuoteResult = {
    ok: false,
    amountIn,
    amountInAfterFee: 0,
    amountOut: 0,
    feeAmount: 0,
    feeBps,
    spotPrice: 0,
    executionPrice: 0,
    priceImpactPct: 0,
    kBefore: reserveIn * reserveOut,
    kAfter: reserveIn * reserveOut,
    reserveInBefore: reserveIn,
    reserveOutBefore: reserveOut,
    reserveInAfter: reserveIn,
    reserveOutAfter: reserveOut,
    invariant: "x*y=k",
  };

  if (amountIn <= 0) {
    return { ...base, error: "CPMM quote requires a positive input amount." };
  }

  if (reserveIn <= 0 || reserveOut <= 0) {
    return { ...base, error: "CPMM quote requires positive reserves." };
  }

  const feeAmount = amountIn * (feeBps / 10_000);
  const amountInAfterFee = amountIn - feeAmount;

  if (amountInAfterFee <= 0) {
    return { ...base, error: "Input amount is fully consumed by fee." };
  }

  const kBefore = reserveIn * reserveOut;
  const reserveInAfter = reserveIn + amountInAfterFee;
  const reserveOutAfter = kBefore / reserveInAfter;
  const amountOut = reserveOut - reserveOutAfter;

  const spotPrice = reserveOut / reserveIn;
  const executionPrice = amountOut / amountIn;
  const priceImpactPct =
    spotPrice > 0 ? Math.max(0, ((spotPrice - executionPrice) / spotPrice) * 100) : 0;

  return {
    ok: true,
    amountIn,
    amountInAfterFee,
    amountOut,
    feeAmount,
    feeBps,
    spotPrice,
    executionPrice,
    priceImpactPct,
    kBefore,
    kAfter: reserveInAfter * reserveOutAfter,
    reserveInBefore: reserveIn,
    reserveOutBefore: reserveOut,
    reserveInAfter,
    reserveOutAfter,
    invariant: "x*y=k",
  };
}

export function directionFromPoolTruth(poolTruth: any, from: string) {
  const fromValue = String(from || "").trim().toUpperCase();
  const base = poolTruth?.baseAsset || {};
  const quote = poolTruth?.quoteAsset || {};

  const baseSymbol = String(base.symbol || "").trim().toUpperCase();
  const quoteSymbol = String(quote.symbol || "").trim().toUpperCase();
  const baseAssetId = String(base.assetId || base.denom || "").trim().toLowerCase();
  const quoteAssetId = String(quote.assetId || quote.denom || "").trim().toLowerCase();

  const fromLower = fromValue.toLowerCase();

  const baseReserve = toFiniteNumber(poolTruth?.reserves?.baseDisplay);
  const quoteReserve = toFiniteNumber(poolTruth?.reserves?.quoteDisplay);

  if (fromValue === baseSymbol || fromLower === baseAssetId) {
    return {
      fromAsset: base,
      toAsset: quote,
      reserveIn: baseReserve,
      reserveOut: quoteReserve,
      direction: "base_to_quote",
    };
  }

  if (fromValue === quoteSymbol || fromLower === quoteAssetId) {
    return {
      fromAsset: quote,
      toAsset: base,
      reserveIn: quoteReserve,
      reserveOut: baseReserve,
      direction: "quote_to_base",
    };
  }

  return null;
}
