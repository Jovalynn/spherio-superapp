export type RioPriceContext = {
  rioRusd: number | null;
  rioUsd: number | null;
  rioUsdt: number | null;
  rioBtc: number | null;
  source: string;
  authority: string;
  updatedAt: string | null;
};

export function asFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function fetchRioPriceContext(origin: string): Promise<RioPriceContext> {
  try {
    const response = await fetch(`${origin}/api/rioex/valuation/rio`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const json = await response.json();

    const rioRusd = asFiniteNumber(json?.price?.rio?.rusd);
    const rioUsd = asFiniteNumber(json?.price?.rio?.usd);
    const rioUsdt = asFiniteNumber(json?.price?.rio?.usdt);
    const rioBtc = asFiniteNumber(json?.price?.rio?.btc);

    return {
      rioRusd,
      rioUsd,
      rioUsdt,
      rioBtc,
      source: json?.source ?? "rioex_valuation_rio",
      authority: json?.authority ?? "riodex_cpmm",
      updatedAt: json?.updated_at ?? null,
    };
  } catch {
    return {
      rioRusd: null,
      rioUsd: null,
      rioUsdt: null,
      rioBtc: null,
      source: "rioex_valuation_unavailable",
      authority: "unavailable",
      updatedAt: null,
    };
  }
}

function convertRioAmount(value: unknown, price: RioPriceContext) {
  const rio = asFiniteNumber(value);

  if (rio === null || price.rioRusd === null) {
    return {
      rio,
      rusd: null,
      usd: null,
      usdt: null,
      btc: null,
      valuationStatus: "unpriced",
      valuationSource: price.source,
      valuationAuthority: price.authority,
    };
  }

  return {
    rio,
    rusd: rio * price.rioRusd,
    usd: price.rioUsd !== null ? rio * price.rioUsd : null,
    usdt: price.rioUsdt !== null ? rio * price.rioUsdt : null,
    btc: price.rioBtc !== null ? rio * price.rioBtc : null,
    valuationStatus: "priced",
    valuationSource: price.source,
    valuationAuthority: price.authority,
  };
}


function convertRioToStable(rio: number | null, price: RioPriceContext) {
  if (rio === null || price.rioRusd === null) {
    return {
      rusd: null,
      usd: null,
      usdt: null,
      btc: null,
    };
  }

  return {
    rusd: rio * price.rioRusd,
    usd: price.rioUsd !== null ? rio * price.rioUsd : null,
    usdt: price.rioUsdt !== null ? rio * price.rioUsdt : null,
    btc: price.rioBtc !== null ? rio * price.rioBtc : null,
  };
}

function enrichScreenerLikeRow(out: Record<string, any>, price: RioPriceContext) {
  const baseAssetId = String(out.baseAssetId ?? out.base_asset_id ?? "").trim();
  const quoteAssetId = String(out.quoteAssetId ?? out.quote_asset_id ?? "").trim();
  const baseSymbol = String(out.baseSymbol ?? out.base_symbol ?? "").trim().toUpperCase();
  const quoteSymbol = String(out.quoteSymbol ?? out.quote_symbol ?? "").trim().toUpperCase();

  const isRioBase = baseAssetId === "urio" || baseSymbol === "RIO";
  const isRioQuote = quoteAssetId === "urio" || quoteSymbol === "RIO";

  const rawPrice = asFiniteNumber(out.price ?? out.effective_price ?? out.effectivePrice);
  const liquidityQuote = asFiniteNumber(out.liquidity_quote ?? out.liquidityQuote);

  const fdvReferenceValue = asFiniteNumber(out.fdv_reference_value ?? out.fdvReferenceValue);
  const fdvReferenceAsset = String(out.fdv_reference_asset ?? out.fdvReferenceAsset ?? "").trim().toUpperCase();

  const marketCap = asFiniteNumber(out.market_cap ?? out.marketCap);
  const fullyDilutedValue = asFiniteNumber(out.fully_diluted_value ?? out.fullyDilutedValue);

  let priceRio = asFiniteNumber(out.priceRio ?? out.price_rio);
  let liquidityRio = asFiniteNumber(out.liquidityRio ?? out.liquidity_rio);
  let fdvRio = asFiniteNumber(out.fdvRio ?? out.fdv_rio);
  let marketCapRio = asFiniteNumber(out.marketCapRio ?? out.market_cap_rio);

  // In RioDex screener rows, price is often asset_1 per asset_0.
  // For RIO/token rows this means token per 1 RIO, so token price in RIO is 1 / price.
  if (priceRio === null && rawPrice !== null && rawPrice > 0) {
    if (isRioBase && !isRioQuote) {
      priceRio = 1 / rawPrice;
    } else if (!isRioBase && isRioQuote) {
      priceRio = rawPrice;
    }
  }

  // liquidity_quote may be token-side liquidity for RIO/token rows.
  // If quote is RIO, liquidity_quote is already RIO-side.
  if (liquidityRio === null && liquidityQuote !== null && liquidityQuote > 0 && isRioQuote) {
    liquidityRio = liquidityQuote;
  }

  if (fdvRio === null && fdvReferenceValue !== null && fdvReferenceAsset === "RIO") {
    fdvRio = fdvReferenceValue;
  }

  if (marketCapRio === null && marketCap !== null && fdvReferenceAsset === "RIO") {
    marketCapRio = marketCap;
  }

  const priceStable = convertRioToStable(priceRio, price);
  const fdvStable = convertRioToStable(fdvRio, price);
  const marketCapStable = convertRioToStable(marketCapRio, price);

  const tokenPriceRusd: number | null = priceStable.rusd;
  const tokenPriceUsd: number | null = priceStable.usd;
  const tokenPriceUsdt: number | null = priceStable.usdt;

  // Only derive a denomination when its own price evidence is available.
  // Unknown quote liquidity must not be promoted to RUSD, USD, or USDT.
  let liquidityStable: {
    rusd: number | null;
    usd: number | null;
    usdt: number | null;
    btc: number | null;
  };

  if (liquidityRio !== null) {
    liquidityStable = convertRioToStable(liquidityRio, price);
  } else if (
    liquidityQuote !== null &&
    liquidityQuote > 0 &&
    tokenPriceRusd !== null &&
    isRioBase &&
    !isRioQuote
  ) {
    liquidityStable = {
      rusd: liquidityQuote * tokenPriceRusd,
      usd: tokenPriceUsd !== null ? liquidityQuote * tokenPriceUsd : null,
      usdt: tokenPriceUsdt !== null ? liquidityQuote * tokenPriceUsdt : null,
      btc: null,
    };
  } else {
    liquidityStable = {
      rusd: asFiniteNumber(out.liquidity_rusd ?? out.liquidityRusd),
      usd: null,
      usdt: null,
      btc: null,
    };
  }

  out.priceRio = priceRio;
  out.price_rio = priceRio;
  out.priceRusd = priceStable.rusd;
  out.price_rusd = priceStable.rusd;
  out.priceUsd = priceStable.usd;
  out.price_usd = priceStable.usd;
  out.priceUsdt = priceStable.usdt;
  out.price_usdt = priceStable.usdt;

  out.liquidityRio = liquidityRio;
  out.liquidity_rio = liquidityRio;
  out.liquidityRusd = liquidityStable.rusd;
  out.liquidity_rusd = liquidityStable.rusd;
  out.liquidityUsd = liquidityStable.usd;
  out.liquidity_usd = liquidityStable.usd;
  out.liquidityUsdt = liquidityStable.usdt;
  out.liquidity_usdt = liquidityStable.usdt;

  out.fdvRio = fdvRio;
  out.fdv_rio = fdvRio;
  out.fdvRusd = fdvStable.rusd;
  out.fdv_rusd = fdvStable.rusd;
  out.fdvUsd = fdvStable.usd;
  out.fdv_usd = fdvStable.usd;
  out.fdvUsdt = fdvStable.usdt;
  out.fdv_usdt = fdvStable.usdt;

  out.marketCapRio = marketCapRio;
  out.market_cap_rio = marketCapRio;
  out.marketCapRusd = marketCapStable.rusd;
  out.market_cap_rusd = marketCapStable.rusd;
  out.marketCapUsd = marketCapStable.usd;
  out.market_cap_usd = marketCapStable.usd;
  out.marketCapUsdt = marketCapStable.usdt;
  out.market_cap_usdt = marketCapStable.usdt;

  return out;
}

export function enrichEconomicObject<T extends Record<string, any>>(
  input: T,
  price: RioPriceContext,
): T {
  const out: Record<string, any> = { ...input };

  const mappings: Array<[string, string]> = [
    ["priceRio", "price"],
    ["effectivePriceRio", "effectivePrice"],
    ["marketCapRio", "marketCap"],
    ["fdvRio", "fdv"],
    ["liquidityRio", "liquidity"],
    ["volumeRio", "volume"],
    ["volume24hRio", "volume24h"],
    ["reserveRio", "reserve"],
    ["realRioReserve", "realReserve"],
    ["virtualRioReserve", "virtualReserve"],
    ["netRioSpent", "netSpent"],
    ["totalRioIn", "totalIn"],
    ["totalRioOut", "totalOut"],
    ["feesRio", "fees"],
    ["creationFeeRio", "creationFee"],
    ["creatorRewardRio", "creatorReward"],
    ["liquiditySeedRio", "liquiditySeed"],
    ["liquidityGradeRio", "liquidityGrade"],
    ["graduationTargetRio", "graduationTarget"],
  ];

  for (const [sourceKey, label] of mappings) {
    if (sourceKey in out) {
      const converted = convertRioAmount(out[sourceKey], price);

      out[`${label}Rio`] = converted.rio;
      out[`${label}Rusd`] = converted.rusd;
      out[`${label}Usd`] = converted.usd;
      out[`${label}Usdt`] = converted.usdt;
      out[`${label}Btc`] = converted.btc;
    }
  }

  // If a route only has effectivePrice and it is understood to be RIO-denominated,
  // add explicit priceRio/priceRusd without removing the original field.
  if (!("priceRio" in out) && "effectivePrice" in out) {
    const converted = convertRioAmount(out.effectivePrice, price);

    out.priceRio = converted.rio;
    out.priceRusd = converted.rusd;
    out.priceUsd = converted.usd;
    out.priceUsdt = converted.usdt;
    out.priceBtc = converted.btc;
  }

  // If a route has marketCapUsd as a legacy field but marketCapRio is absent,
  // do not overwrite it. Only add valuation metadata.
  enrichScreenerLikeRow(out, price);

  out.valuation = {
    ...(out.valuation ?? {}),
    rioRusd: price.rioRusd,
    rioUsd: price.rioUsd,
    rioUsdt: price.rioUsdt,
    rioBtc: price.rioBtc,
    source: price.source,
    authority: price.authority,
    updatedAt: price.updatedAt,
  };

  out.valuationStatus = price.rioRusd !== null ? "priced" : "unpriced";
  out.valuationSource = price.source;
  out.valuationAuthority = price.authority;

  return out as T;
}

export function enrichEconomicDeep<T>(input: T, price: RioPriceContext): T {
  if (Array.isArray(input)) {
    return input.map((item) => enrichEconomicDeep(item, price)) as T;
  }

  if (!input || typeof input !== "object") {
    return input;
  }

  const obj = input as Record<string, any>;
  const out: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    out[key] = enrichEconomicDeep(value, price);
  }

  return enrichEconomicObject(out, price) as T;
}

export function addLaunchEconomicsBlock<T extends Record<string, any>>(
  input: T,
  price: RioPriceContext,
): T {
  const creationFeeRusd = 10;
  const creationFeeRio =
    price.rioRusd && price.rioRusd > 0 ? creationFeeRusd / price.rioRusd : null;

  return {
    ...input,
    economics: {
      ...(input.economics ?? {}),
      rioPrice: {
        rioRusd: price.rioRusd,
        rioUsd: price.rioUsd,
        rioUsdt: price.rioUsdt,
        rioBtc: price.rioBtc,
        source: price.source,
        authority: price.authority,
        updatedAt: price.updatedAt,
      },
      primeStandardCreationFee: {
        rusd: creationFeeRusd,
        usd: null,
        usdt: null,
        rio: creationFeeRio,
        note: "Prime production-style project creation fee reference; USD and USDT values require independent pricing evidence.",
      },
      bridgeReadiness: {
        axelar: "planned",
        usdc: "planned",
        usdt: "planned",
        note: "RUSD/USDT/USDC bridge-aware valuation should remain pending until Axelar routes are live, indexed, and tested.",
      },
    },
  } as T;
}
