type AnyRecord = Record<string, any>;

export const MARKET_NORMALIZATION_GUARANTEES = [
  "displaySymbol_prefers_base_quote_symbols",
  "liquidity_has_truth_label",
  "valuation_is_non_fabricated",
  "routes_include_rioex_and_rioexplorer",
];

export function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function asString(value: unknown): string {
  return String(value || "").trim();
}

export function cleanSymbol(value: unknown): string {
  const raw = asString(value);
  if (!raw) return "";
  if (raw.toLowerCase() === "urio") return "RIO";
  return raw;
}

export function normalizePairSymbols(row: AnyRecord) {
  const baseSymbol = cleanSymbol(row.baseSymbol || row.base_symbol);
  const quoteSymbol = cleanSymbol(row.quoteSymbol || row.quote_symbol);

  if (baseSymbol && quoteSymbol) {
    return {
      displaySymbol: `${baseSymbol} / ${quoteSymbol}`,
      canonicalSymbol: `${baseSymbol}/${quoteSymbol}`,
      baseSymbol,
      quoteSymbol,
    };
  }

  const rawDisplay = asString(
    row.displaySymbol ||
      row.display_symbol ||
      row.canonicalSymbol ||
      row.canonical_symbol
  );

  const fallback = rawDisplay
    .replace(/\burio\b/gi, "RIO")
    .replace(/\s+\/\s+/g, " / ");

  return {
    displaySymbol: fallback || "UNKNOWN / UNKNOWN",
    canonicalSymbol: fallback
      ? fallback.replace(/\s+\/\s+/g, "/")
      : "UNKNOWN/UNKNOWN",
    baseSymbol,
    quoteSymbol,
  };
}

export function inferOrigin(row: AnyRecord): string {
  const symbols = normalizePairSymbols(row);

  const baseSymbol = cleanSymbol(symbols.baseSymbol || row.baseSymbol || row.base_symbol);
  const quoteSymbol = cleanSymbol(symbols.quoteSymbol || row.quoteSymbol || row.quote_symbol);

  const baseAssetType = asString(row.baseAssetType || row.base_asset_type).toLowerCase();
  const quoteAssetType = asString(row.quoteAssetType || row.quote_asset_type).toLowerCase();

  const explicitRailValues = [
    row.launchSource,
    row.launch_source,
    row.launchRail,
    row.launch_rail,
    row.assetOrigin,
    row.asset_origin,
    row.metadata_json?.launch_source,
    row.metadata_json?.launch_rail,
    row.metadata_json?.rail,
    row.metadata_json?.family,
  ]
    .filter(Boolean)
    .map((value) => asString(value).toLowerCase());

  const haystack = [
    row.origin,
    row.assetOrigin,
    row.asset_origin,
    row.launchSource,
    row.launch_source,
    row.launchRail,
    row.launch_rail,
    baseAssetType,
    quoteAssetType,
    row.metadata_json?.rail,
    row.metadata_json?.family,
    row.metadata_json?.indexed_via,
    row.bridge_provider,
    row.origin_type,
    row.origin_chain,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const hasExactPrimeRail = explicitRailValues.some((value) =>
    ["prime", "prime_launch", "prime-launch", "prime.launch"].includes(value)
  );

  const hasExactPumpRail = explicitRailValues.some((value) =>
    ["pump", "pump.live", "pump_live", "pump-live"].includes(value)
  );

  const isPumpOrPrimeAmbiguous = explicitRailValues.includes("pump-or-prime");

  if (hasExactPrimeRail) return "Prime";
  if (hasExactPumpRail) return "Pump.live";

  if (haystack.includes("bridged") || haystack.includes("bridge")) return "Bridged";
  if (haystack.includes("ibc")) return "IBC";
  if (haystack.includes("evm")) return "EVM";
  if (haystack.includes("external") || haystack.includes("off-chain")) return "External";

  const pairHasRio = baseSymbol === "RIO" || quoteSymbol === "RIO";
  const pairHasRusd = baseSymbol === "RUSD" || quoteSymbol === "RUSD";

  if (pairHasRio && pairHasRusd) {
    return "Native";
  }

  const nonRioAssetType =
    baseSymbol === "RIO"
      ? quoteAssetType
      : quoteSymbol === "RIO"
        ? baseAssetType
        : baseAssetType || quoteAssetType;

  if (
    nonRioAssetType === "spo20" ||
    nonRioAssetType === "spo-20" ||
    haystack.includes("spo20") ||
    haystack.includes("spo-20") ||
    isPumpOrPrimeAmbiguous
  ) {
    return "SPO-20";
  }

  if (pairHasRusd || haystack.includes("stable")) return "Stable";
  if (pairHasRio || baseAssetType === "native" || quoteAssetType === "native") return "Native";

  return "Registry";
}

export function normalizeLiquidity(row: AnyRecord) {
  const liquidityUsd = asNumber(row.liquidityUsd ?? row.liquidity_usd);
  const liquidityQuote = asNumber(row.liquidity_quote ?? row.liquidityQuote);
  const reserve0 = asNumber(row.reserve_0 ?? row.reserve0);
  const reserve1 = asNumber(row.reserve_1 ?? row.reserve1);

  const symbols = normalizePairSymbols(row);
  const quoteSymbol = symbols.quoteSymbol || cleanSymbol(row.quoteSymbol || row.quote_symbol);

  const hasLiquidity =
    (liquidityUsd !== null && liquidityUsd > 0) ||
    (liquidityQuote !== null && liquidityQuote > 0) ||
    (reserve0 !== null && reserve0 > 0) ||
    (reserve1 !== null && reserve1 > 0);

  let label = "Pending";
  let referenceAsset: string | null = null;

  if (!hasLiquidity) {
    label = "No liquidity";
  } else if (quoteSymbol === "RUSD") {
    label = "RUSD liquidity";
    referenceAsset = "RUSD";
  } else if (liquidityUsd !== null && liquidityUsd > 0) {
    label = "USD-equivalent liquidity";
    referenceAsset = "USD";
  } else if (liquidityQuote !== null && liquidityQuote > 0) {
    label = "Quote liquidity";
    referenceAsset = quoteSymbol || null;
  } else {
    label = "Unpriced reserves";
  }

  return {
    hasLiquidity,
    label,
    referenceAsset,
    liquidityUsd,
    liquidityQuote,
    source: row.liquiditySource || row.liquidity_source || row.source || null,
    height: row.liquidityHeight || row.liquidity_height || null,
    time: row.liquidityTime || row.liquidity_time || null,
    updatedAt: row.liquidityUpdatedAt || row.liquidity_updated_at || null,
  };
}

export function normalizeValuation(row: AnyRecord) {
  const marketCap = asNumber(row.market_cap ?? row.marketCap);
  const fdv = asNumber(
    row.fully_diluted_value ?? row.fullyDilutedValue ?? row.fdv
  );

  return {
    marketCap,
    fdv,
    status:
      marketCap !== null
        ? "market_cap_indexed"
        : fdv !== null
          ? "fdv_indexed"
          : "pending",
    source: row.valuation_source || row.valuationSource || null,
  };
}

export function normalizeRoutes(row: AnyRecord) {
  const routes = (row.routes || {}) as Record<string, string | undefined>;
  const pairAddress = asString(row.pairAddress || row.pair_address);
  const lastSwapTxHash = asString(row.lastSwapTxHash || row.last_swap_tx_hash);

  return {
    ...routes,
    swap:
      routes.swap ||
      (pairAddress ? `/riodex/swap?pair=${encodeURIComponent(pairAddress)}` : null),
    pool:
      routes.pool ||
      (pairAddress ? `/riodex/pool/${encodeURIComponent(pairAddress)}` : null),
    liquidity:
      routes.liquidity ||
      (pairAddress
        ? `/riodex/liquidity?pool=${encodeURIComponent(pairAddress)}`
        : null),
    rioex:
      routes.rioex ||
      routes.assetTerminal ||
      (pairAddress
        ? `/rioex/markets/${encodeURIComponent(pairAddress)}`
        : "/rioex"),
    rioExplorer:
      routes.rioExplorer ||
      routes.explorer ||
      (lastSwapTxHash
        ? `/rioexplorer/tx/${encodeURIComponent(lastSwapTxHash)}`
        : "/rioexplorer"),
  };
}

export function normalizeMarketRow(row: AnyRecord) {
  const symbols = normalizePairSymbols(row);
  const liquidity = normalizeLiquidity(row);
  const valuation = normalizeValuation(row);
  const origin = inferOrigin(row);

  const promotion = asString(
    row.promotion_status ||
      row.promotionStatus ||
      row.launch_status ||
      row.launchStatus
  ).toLowerCase();

  const symbolsForBadges = normalizePairSymbols(row);
  const baseSymbolForBadges = cleanSymbol(symbolsForBadges.baseSymbol || row.baseSymbol || row.base_symbol);
  const quoteSymbolForBadges = cleanSymbol(symbolsForBadges.quoteSymbol || row.quoteSymbol || row.quote_symbol);

  const hasStableAsset =
    baseSymbolForBadges === "RUSD" ||
    quoteSymbolForBadges === "RUSD" ||
    baseSymbolForBadges === "USDC" ||
    quoteSymbolForBadges === "USDC" ||
    baseSymbolForBadges === "USDT" ||
    quoteSymbolForBadges === "USDT";

  const metadataMissing = !baseSymbolForBadges || !quoteSymbolForBadges;

  const isGraduated =
    promotion.includes("graduated") ||
    Boolean(row.metadata_json?.graduated) ||
    Boolean(row.metadata_json?.graduation_tx_hash) ||
    Boolean(row.metadata_json?.liquidity_seed_tx_hash);

  const badges = [
    origin,
    hasStableAsset ? "Stable" : null,
    row.isCanonical || row.is_canonical ? "Canonical" : null,
    row.isVerified || row.is_verified ? "Verified" : null,
    isGraduated ? "Graduated" : null,
    liquidity.hasLiquidity ? "Liquidity Seeded" : "No Liquidity",
    !liquidity.hasLiquidity ? "Awaiting Liquidity" : null,
    origin === "Pump.live" && !isGraduated ? "Awaiting Graduation" : null,
    metadataMissing ? "Pending Metadata" : null,
  ].filter(Boolean);

  return {
    ...row,

    displaySymbol: symbols.displaySymbol,
    canonicalSymbol: symbols.canonicalSymbol,
    baseSymbol: symbols.baseSymbol || row.baseSymbol || row.base_symbol || null,
    quoteSymbol: symbols.quoteSymbol || row.quoteSymbol || row.quote_symbol || null,

    base: {
      assetId: row.baseAssetId || row.base_asset_id || null,
      symbol: symbols.baseSymbol || row.baseSymbol || row.base_symbol || null,
      displayName: row.baseDisplayName || row.base_display_name || null,
      assetType: row.baseAssetType || row.base_asset_type || null,
      logoUrl: row.baseLogoUrl || row.base_logo_url || null,
      registryStatus: row.baseRegistryStatus || row.base_registry_status || null,
    },

    quote: {
      assetId: row.quoteAssetId || row.quote_asset_id || null,
      symbol: symbols.quoteSymbol || row.quoteSymbol || row.quote_symbol || null,
      displayName: row.quoteDisplayName || row.quote_display_name || null,
      assetType: row.quoteAssetType || row.quote_asset_type || null,
      logoUrl: row.quoteLogoUrl || row.quote_logo_url || null,
      registryStatus: row.quoteRegistryStatus || row.quote_registry_status || null,
    },

    liquidity,
    valuation,
    lifecycle: {
      origin,
      promotionStatus: row.promotion_status || row.promotionStatus || null,
      badges,
    },
    routes: normalizeRoutes(row),
  };
}

export function normalizeScreenerPayload(payload: AnyRecord) {
  const rows = Array.isArray(payload?.markets)
    ? payload.markets
    : Array.isArray(payload?.rows)
      ? payload.rows
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.pairs)
          ? payload.pairs
          : [];

  const normalized = rows.map(normalizeMarketRow);

  const result: AnyRecord = {
    ...payload,
    markets: normalized,
    normalized: {
      version: "screener.v1",
      rowCount: normalized.length,
      guarantees: MARKET_NORMALIZATION_GUARANTEES,
    },
  };

  if (Array.isArray(payload?.rows)) result.rows = normalized;
  if (Array.isArray(payload?.items)) result.items = normalized;
  if (Array.isArray(payload?.pairs)) result.pairs = normalized;

  return result;
}

export function normalizePairDetail(pair: AnyRecord) {
  const rowLike = {
    pairAddress: pair.pairAddress,
    displaySymbol: pair.displaySymbol,
    canonicalSymbol: pair.canonicalSymbol,
    baseAssetId: pair.baseAssetId,
    quoteAssetId: pair.quoteAssetId,
    baseSymbol: pair.baseAsset?.symbol,
    quoteSymbol: pair.quoteAsset?.symbol,
    baseDisplayName: pair.baseAsset?.displayName,
    quoteDisplayName: pair.quoteAsset?.displayName,
    baseLogoUrl: pair.baseAsset?.logoUrl,
    quoteLogoUrl: pair.quoteAsset?.logoUrl,
    baseAssetType: pair.baseAsset?.assetType,
    quoteAssetType: pair.quoteAsset?.assetType,
    liquidityUsd: pair.liquidityUsd,
    liquidityHeight: pair.liquidityHeight,
    liquidityTime: pair.liquidityTime,
    liquiditySource: pair.liquiditySource,
    liquidityUpdatedAt: pair.liquidityUpdatedAt,
    lastSwapTxHash: pair.lastSwapTxHash,
    routes: pair.routes,
    isCanonical: pair.isCanonical,
    isLive: pair.isLive,
    source: pair.source,
    promotionStatus: "watch",
  };

  const normalized = normalizeMarketRow(rowLike);

  return {
    pairAddress: pair.pairAddress,
    displaySymbol: normalized.displaySymbol,
    canonicalSymbol: normalized.canonicalSymbol,
    baseAssetId: pair.baseAssetId,
    quoteAssetId: pair.quoteAssetId,
    baseSymbol: normalized.baseSymbol,
    quoteSymbol: normalized.quoteSymbol,
    baseDisplayName: pair.baseAsset?.displayName,
    quoteDisplayName: pair.quoteAsset?.displayName,
    baseLogoUrl: pair.baseAsset?.logoUrl,
    quoteLogoUrl: pair.quoteAsset?.logoUrl,
    feeBps: pair.feeBps,
    isCanonical: pair.isCanonical,
    isLive: pair.isLive,
    liquidityUsd: pair.liquidityUsd,
    liquidityHeight: pair.liquidityHeight,
    liquidityTime: pair.liquidityTime,
    liquiditySource: pair.liquiditySource,
    liquidityUpdatedAt: pair.liquidityUpdatedAt,
    lastSwapTime: pair.lastSwapTime,
    lastSwapTxHash: pair.lastSwapTxHash,
    feeRecipientAddress: pair.feeRecipientAddress,
    feePolicy: pair.feePolicy,
    quoteConvention: pair.quoteConvention,
    routes: normalized.routes,
    source: pair.source,
    base: normalized.base,
    quote: normalized.quote,
    liquidity: normalized.liquidity,
    valuation: normalized.valuation,
    lifecycle: normalized.lifecycle,
  };
}
