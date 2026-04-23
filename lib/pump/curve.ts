export type PumpLaunchRail = "pump.live";
export type PumpBaseAsset = "RIO";
export type PumpSide = "buy" | "sell";

export type PumpCurveInput = {
  tokenAddress: string;
  symbol: string;
  launchRail?: PumpLaunchRail;
  baseAsset?: PumpBaseAsset;

  realTokenReserve: number;
  realBaseReserve: number;
  virtualTokenReserve: number;
  virtualBaseReserve: number;

  targetBaseReserveForGraduation: number;
  feeBps?: number;
};

export type PumpBuyQuoteInput = {
  baseIn: number;
  slippageBps?: number;
};

export type PumpSellQuoteInput = {
  tokenIn: number;
  slippageBps?: number;
};

export type PumpExecutionInput =
  | {
      kind: "buy";
      curve: PumpCurveInput;
      trade: PumpBuyQuoteInput;
      previewOnly?: boolean;
      maxPriceImpactBps?: number;
    }
  | {
      kind: "sell";
      curve: PumpCurveInput;
      trade: PumpSellQuoteInput;
      previewOnly?: boolean;
      maxPriceImpactBps?: number;
    };

export type PumpCurveState = {
  tokenAddress: string;
  symbol: string;
  launchRail: "pump.live";
  standard: "SPO-20";
  baseAsset: "RIO";
  feeBps: number;

  reserves: {
    realTokenReserve: number;
    realBaseReserve: number;
    virtualTokenReserve: number;
    virtualBaseReserve: number;
    effectiveTokenReserve: number;
    effectiveBaseReserve: number;
  };

  pricing: {
    invariant: number;
    impliedPriceInBase: number;
    impliedMarketCapInBase: number;
  };

  graduation: {
    targetBaseReserveForGraduation: number;
    progressPercent: number;
    ready: boolean;
    remainingBaseToGraduate: number;
  };
};

export type PumpBuyQuote = {
  kind: "buy";
  baseIn: number;
  feeBps: number;
  feeBase: number;
  netBaseIn: number;
  tokenOut: number;
  effectivePriceInBase: number;
  priceImpactBps: number;
  minTokenOut: number;
  postTradeState: PumpCurveState;
};

export type PumpSellQuote = {
  kind: "sell";
  tokenIn: number;
  feeBps: number;
  grossBaseOut: number;
  feeBase: number;
  netBaseOut: number;
  effectivePriceInBase: number;
  priceImpactBps: number;
  minBaseOut: number;
  postTradeState: PumpCurveState;
};

export type PumpQuoteResult = PumpBuyQuote | PumpSellQuote;

export type PumpExecutionResult = {
  accepted: boolean;
  previewOnly: boolean;
  status: "preview" | "would_execute" | "rejected";
  reason?: string;

  protection: {
    enabled: boolean;
    maxPriceImpactBps: number;
    blocked: boolean;
    messages: string[];
  };

  stateBefore: PumpCurveState;
  stateAfter: PumpCurveState;
  quote: PumpQuoteResult;
};

function assertPositiveOrZero(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `${name} must be a finite number greater than or equal to zero`,
    );
  }
}

function assertStrictlyPositive(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite number greater than zero`);
  }
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

function round(value: number, decimals = 12) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clampMin(value: number, min = 0) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, value);
}

function getFeeBps(input?: number) {
  const feeBps = input ?? 100;
  assertPositiveOrZero(feeBps, "feeBps");
  return feeBps;
}

function getSlippageBps(input?: number) {
  const slippageBps = input ?? 100;
  assertPositiveOrZero(slippageBps, "slippageBps");
  return slippageBps;
}

export function buildPumpCurveState(input: PumpCurveInput): PumpCurveState {
  assertPositiveOrZero(input.realTokenReserve, "realTokenReserve");
  assertPositiveOrZero(input.realBaseReserve, "realBaseReserve");
  assertPositiveOrZero(input.virtualTokenReserve, "virtualTokenReserve");
  assertPositiveOrZero(input.virtualBaseReserve, "virtualBaseReserve");
  assertStrictlyPositive(
    input.targetBaseReserveForGraduation,
    "targetBaseReserveForGraduation",
  );

  const feeBps = getFeeBps(input.feeBps);

  const effectiveTokenReserve =
    input.realTokenReserve + input.virtualTokenReserve;
  const effectiveBaseReserve = input.realBaseReserve + input.virtualBaseReserve;

  assertStrictlyPositive(effectiveTokenReserve, "effectiveTokenReserve");
  assertStrictlyPositive(effectiveBaseReserve, "effectiveBaseReserve");

  const invariant = effectiveTokenReserve * effectiveBaseReserve;
  const impliedPriceInBase = effectiveBaseReserve / effectiveTokenReserve;
  const impliedMarketCapInBase = impliedPriceInBase * input.realTokenReserve;

  const progressPercent = clampPercent(
    (input.realBaseReserve / input.targetBaseReserveForGraduation) * 100,
  );

  const remainingBaseToGraduate = Math.max(
    0,
    input.targetBaseReserveForGraduation - input.realBaseReserve,
  );

  const ready = input.realBaseReserve >= input.targetBaseReserveForGraduation;

  return {
    tokenAddress: input.tokenAddress,
    symbol: input.symbol,
    launchRail: input.launchRail ?? "pump.live",
    standard: "SPO-20",
    baseAsset: input.baseAsset ?? "RIO",
    feeBps,
    reserves: {
      realTokenReserve: round(input.realTokenReserve, 12),
      realBaseReserve: round(input.realBaseReserve, 12),
      virtualTokenReserve: round(input.virtualTokenReserve, 12),
      virtualBaseReserve: round(input.virtualBaseReserve, 12),
      effectiveTokenReserve: round(effectiveTokenReserve, 12),
      effectiveBaseReserve: round(effectiveBaseReserve, 12),
    },
    pricing: {
      invariant: round(invariant, 12),
      impliedPriceInBase: round(impliedPriceInBase, 12),
      impliedMarketCapInBase: round(impliedMarketCapInBase, 12),
    },
    graduation: {
      targetBaseReserveForGraduation: round(
        input.targetBaseReserveForGraduation,
        12,
      ),
      progressPercent,
      ready,
      remainingBaseToGraduate: round(remainingBaseToGraduate, 12),
    },
  };
}

export function getPumpCurveState(input: PumpCurveInput): PumpCurveState {
  return buildPumpCurveState(input);
}

export function quotePumpBuy(
  curve: PumpCurveInput,
  trade: PumpBuyQuoteInput,
): PumpBuyQuote {
  assertStrictlyPositive(trade.baseIn, "baseIn");

  const feeBps = getFeeBps(curve.feeBps);
  const slippageBps = getSlippageBps(trade.slippageBps);

  const feeBase = (trade.baseIn * feeBps) / 10_000;
  const netBaseIn = trade.baseIn - feeBase;

  const pre = buildPumpCurveState(curve);
  const x = pre.reserves.effectiveTokenReserve;
  const y = pre.reserves.effectiveBaseReserve;
  const k = pre.pricing.invariant;

  const newY = y + netBaseIn;
  const newX = k / newY;
  const tokenOut = x - newX;

  if (!Number.isFinite(tokenOut) || tokenOut <= 0) {
    throw new Error("tokenOut must be greater than zero");
  }

  if (tokenOut > curve.realTokenReserve) {
    throw new Error("Insufficient real token reserve for buy quote");
  }

  const postInput: PumpCurveInput = {
    ...curve,
    realTokenReserve: curve.realTokenReserve - tokenOut,
    realBaseReserve: curve.realBaseReserve + netBaseIn,
    feeBps,
  };

  const postTradeState = buildPumpCurveState(postInput);
  const effectivePriceInBase = trade.baseIn / tokenOut;

  const priceImpactBps =
    pre.pricing.impliedPriceInBase > 0
      ? ((effectivePriceInBase - pre.pricing.impliedPriceInBase) /
          pre.pricing.impliedPriceInBase) *
        10_000
      : 0;

  const minTokenOut = tokenOut * (1 - slippageBps / 10_000);

  return {
    kind: "buy",
    baseIn: round(trade.baseIn, 12),
    feeBps,
    feeBase: round(feeBase, 12),
    netBaseIn: round(netBaseIn, 12),
    tokenOut: round(tokenOut, 12),
    effectivePriceInBase: round(effectivePriceInBase, 12),
    priceImpactBps: round(priceImpactBps, 4),
    minTokenOut: round(clampMin(minTokenOut, 0), 12),
    postTradeState,
  };
}

export function quotePumpSell(
  curve: PumpCurveInput,
  trade: PumpSellQuoteInput,
): PumpSellQuote {
  assertStrictlyPositive(trade.tokenIn, "tokenIn");

  const feeBps = getFeeBps(curve.feeBps);
  const slippageBps = getSlippageBps(trade.slippageBps);

  const pre = buildPumpCurveState(curve);
  const x = pre.reserves.effectiveTokenReserve;
  const y = pre.reserves.effectiveBaseReserve;
  const k = pre.pricing.invariant;

  const newX = x + trade.tokenIn;
  const newY = k / newX;
  const grossBaseOut = y - newY;

  if (!Number.isFinite(grossBaseOut) || grossBaseOut <= 0) {
    throw new Error("grossBaseOut must be greater than zero");
  }

  const feeBase = (grossBaseOut * feeBps) / 10_000;
  const netBaseOut = grossBaseOut - feeBase;

  if (netBaseOut > curve.realBaseReserve) {
    throw new Error("Insufficient real base reserve for sell quote");
  }

  const postInput: PumpCurveInput = {
    ...curve,
    realTokenReserve: curve.realTokenReserve + trade.tokenIn,
    realBaseReserve: curve.realBaseReserve - netBaseOut,
    feeBps,
  };

  const postTradeState = buildPumpCurveState(postInput);
  const effectivePriceInBase = netBaseOut / trade.tokenIn;

  const priceImpactBps =
    pre.pricing.impliedPriceInBase > 0
      ? ((pre.pricing.impliedPriceInBase - effectivePriceInBase) /
          pre.pricing.impliedPriceInBase) *
        10_000
      : 0;

  const minBaseOut = netBaseOut * (1 - slippageBps / 10_000);

  return {
    kind: "sell",
    tokenIn: round(trade.tokenIn, 12),
    feeBps,
    grossBaseOut: round(grossBaseOut, 12),
    feeBase: round(feeBase, 12),
    netBaseOut: round(netBaseOut, 12),
    effectivePriceInBase: round(effectivePriceInBase, 12),
    priceImpactBps: round(priceImpactBps, 4),
    minBaseOut: round(clampMin(minBaseOut, 0), 12),
    postTradeState,
  };
}

export function getPumpQuote(
  input:
    | {
        kind: "buy";
        curve: PumpCurveInput;
        trade: PumpBuyQuoteInput;
      }
    | {
        kind: "sell";
        curve: PumpCurveInput;
        trade: PumpSellQuoteInput;
      },
): PumpQuoteResult {
  if (input.kind === "buy") {
    return quotePumpBuy(input.curve, input.trade);
  }

  return quotePumpSell(input.curve, input.trade);
}

export function executePumpTrade(
  input: PumpExecutionInput,
): PumpExecutionResult {
  const previewOnly = input.previewOnly ?? true;
  const maxPriceImpactBps = input.maxPriceImpactBps ?? 2_500;
  const protectionMessages: string[] = [];

  const stateBefore = buildPumpCurveState(input.curve);
 
  const quote =
    input.kind === "buy"
      ? quotePumpBuy(input.curve, input.trade)
      : quotePumpSell(input.curve, input.trade);

  let blocked = false;

  if (Math.abs(quote.priceImpactBps) > maxPriceImpactBps) {
    blocked = true;
    protectionMessages.push(
      `Price impact ${round(Math.abs(quote.priceImpactBps), 4)} bps exceeds max ${round(
        maxPriceImpactBps,
        4,
      )} bps`,
    );
  }

  if (quote.kind === "buy" && quote.tokenOut <= 0) {
    blocked = true;
    protectionMessages.push("Buy results in zero token output");
  }

  if (quote.kind === "sell" && quote.netBaseOut <= 0) {
    blocked = true;
    protectionMessages.push("Sell results in zero base output");
  }

 const accepted = !blocked;

  return {
    accepted,
    previewOnly,
    status: blocked ? "rejected" : previewOnly ? "preview" : "would_execute",
    reason: blocked ? protectionMessages.join("; ") : undefined,
    protection: {
      enabled: true,
      maxPriceImpactBps,
      blocked,
      messages: protectionMessages,
    },
    stateBefore,
    stateAfter: quote.postTradeState,
    quote,
  };
}
