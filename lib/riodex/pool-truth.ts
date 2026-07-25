import {
  SPHERIO_FEE_POLICY,
  SPHERIO_TREASURY_MULTISIG,
  resolveTreasuryRecipient,
} from "@/lib/protocol/treasury";

export type PoolTruthCapabilityState = "live" | "pending" | "hidden";

export type PoolTruthAssetOrigin =
  | "native_rio"
  | "rusd"
  | "spo20"
  | "pump_graduated"
  | "prime_token"
  | "ibc_asset"
  | "axelar_asset"
  | "hyperlane_asset"
  | "evm_wrapped"
  | "external_cosmos_asset"
  | "unknown_or_unverified";

export type PoolTruthSource =
  | "pool_reserves"
  | "rioex_registry"
  | "riodex_indexer"
  | "fallback";

export type PoolTruthAsset = {
  assetId: string;
  symbol: string;
  displayName: string;
  decimals: number;
  logoUrl: string | null;
  type: "native" | "cw20" | "ibc" | "evm" | "external" | "unknown";
  origin: PoolTruthAssetOrigin;
  verified: boolean;
};

export type PoolTruthCapabilities = {
  swap: PoolTruthCapabilityState;
  pool: PoolTruthCapabilityState;
  liquidity: PoolTruthCapabilityState;
  liquidityAction: PoolTruthCapabilityState;
  bridge: PoolTruthCapabilityState;
  ibc: PoolTruthCapabilityState;
  axelar: PoolTruthCapabilityState;
  hyperlane: PoolTruthCapabilityState;
  evm: PoolTruthCapabilityState;
  walletConnect: PoolTruthCapabilityState;
  rioLightBroadcast: PoolTruthCapabilityState;
  rewards: PoolTruthCapabilityState;
};

export type PoolTruthLaunchContext = {
  source: "manual" | "prime" | "pumplive" | "createtoken" | "unknown";
  graduationSeedRusdEquivalent: number | null;
  status: "pending" | "ready" | "seeded" | "confirmed" | "hidden";
  note: string | null;
};

export type PoolTruthRecord = {
  pairAddress: string;
  pairKey: string;
  pairLabel: string;
  displaySymbol: string;
  canonicalSymbol: string;
  baseAsset: PoolTruthAsset;
  quoteAsset: PoolTruthAsset;
  pool: {
    isLive: boolean;
    isCanonical: boolean;
    feeBps: number;
    lpTokenAddress: string | null;
    totalShareRaw: string | null;
    totalShareDisplay: number | null;
  };
  reserves: {
    baseRaw: string | null;
    quoteRaw: string | null;
    baseDisplay: number;
    quoteDisplay: number;
  };
  valuation: {
    tvlRusd: number;
    source: PoolTruthSource;
    note: string;
  };
  treasury: {
    recipient: string;
    label: string;
    feePolicy: string;
    confirmedOnChain: boolean;
    source: string;
  };
  capabilities: PoolTruthCapabilities;
  launchContext: PoolTruthLaunchContext;
  routes: {
    screener: string;
    pool: string;
    swap: string;
    liquidityAction: string;
    rioex: string;
    explorer: string | null;
  };
  visibility: {
    showInScreener: boolean;
    showInPool: boolean;
    showLiquidityAction: boolean;
    hideUnsupportedFeatures: boolean;
  };
  source: {
    marketSource: string | null;
    liquiditySource: string | null;
    registrySource: string | null;
    updatedAt: string | null;
  };
};

export type RegistryMarketLike = {
  pairAddress?: string | null;
  displaySymbol?: string | null;
  canonicalSymbol?: string | null;
  baseAssetId?: string | null;
  quoteAssetId?: string | null;
  baseSymbol?: string | null;
  quoteSymbol?: string | null;
  baseDisplayName?: string | null;
  quoteDisplayName?: string | null;
  baseLogoUrl?: string | null;
  quoteLogoUrl?: string | null;
  feeBps?: number | null;
  isCanonical?: boolean | null;
  isLive?: boolean | null;
  liquidityUsd?: number | string | null;
  liquidityHeight?: string | number | null;
  liquidityTime?: string | null;
  liquiditySource?: string | null;
  liquidityUpdatedAt?: string | null;
  lastSwapTime?: string | null;
  lastSwapTxHash?: string | null;
  feeRecipientAddress?: string | null;
  feePolicy?: string | null;
  source?: string | null;
  routes?: Partial<PoolTruthRecord["routes"]> & Record<string, string | undefined>;
};

export type LiquiditySnapshotLike = {
  reserve_0?: string | number | null;
  reserve_1?: string | number | null;
  total_share?: string | number | null;
  block_time?: string | null;
};

export const CANONICAL_RUSD_ASSET_ID =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";

function lower(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function numberValue(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function fromBaseUnits(value?: string | number | null, decimals = 6) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n / 10 ** decimals;
}

function shortAddr(value?: string | null, left = 8, right = 6) {
  const v = String(value || "").trim();
  if (!v) return "";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

export function isRioAsset(assetId?: string | null, symbol?: string | null) {
  const id = lower(assetId);
  const s = lower(symbol);
  return id === "urio" || id === "rio" || s === "rio";
}

export function isRusdAsset(assetId?: string | null, symbol?: string | null) {
  const id = lower(assetId);
  const s = lower(symbol);
  return id === "rusd" || id === lower(CANONICAL_RUSD_ASSET_ID) || s === "rusd";
}

function classifyOrigin(assetId?: string | null, symbol?: string | null): PoolTruthAssetOrigin {
  const id = lower(assetId);
  const s = lower(symbol);

  if (isRioAsset(id, s)) return "native_rio";
  if (isRusdAsset(id, s)) return "rusd";
  if (id.startsWith("ibc/")) return "ibc_asset";
  if (id.includes("axelar") || s.includes("axl")) return "axelar_asset";
  if (id.includes("hyperlane") || s.includes("hyp")) return "hyperlane_asset";
  if (id.startsWith("0x")) return "evm_wrapped";
  if (id.startsWith("rio1")) return "spo20";

  return "unknown_or_unverified";
}

function assetType(assetId?: string | null): PoolTruthAsset["type"] {
  const id = lower(assetId);
  if (id === "urio" || id === "rio") return "native";
  if (id.startsWith("rio1")) return "cw20";
  if (id.startsWith("ibc/")) return "ibc";
  if (id.startsWith("0x")) return "evm";
  if (id) return "external";
  return "unknown";
}

function normalizeAsset(input: {
  assetId?: string | null;
  symbol?: string | null;
  displayName?: string | null;
  logoUrl?: string | null;
}): PoolTruthAsset {
  const assetId = String(input.assetId || "").trim();
  const origin = classifyOrigin(assetId, input.symbol);

  const symbol =
    origin === "native_rio"
      ? "RIO"
      : origin === "rusd"
        ? "RUSD"
        : String(input.symbol || "").trim() ||
          (assetId ? shortAddr(assetId, 6, 4) : "UNKNOWN");

  return {
    assetId,
    symbol,
    displayName: String(input.displayName || symbol).trim(),
    decimals: 6,
    logoUrl: input.logoUrl || null,
    type: assetType(assetId),
    origin,
    verified: origin !== "unknown_or_unverified",
  };
}

function isStableAsset(asset: PoolTruthAsset) {
  const s = lower(asset.symbol);
  return asset.origin === "rusd" || s === "usdc" || s === "usdt" || s === "dai";
}

function pairLabel(base: PoolTruthAsset, quote: PoolTruthAsset, raw?: string | null) {
  const cleanRaw = String(raw || "").trim();
  if (
    cleanRaw &&
    cleanRaw !== "—" &&
    !cleanRaw.includes("—") &&
    !cleanRaw.toLowerCase().includes("undefined")
  ) {
    return cleanRaw
      .replaceAll(CANONICAL_RUSD_ASSET_ID, "RUSD")
      .replace(/urio/gi, "RIO");
  }

  return `${base.symbol} / ${quote.symbol}`;
}

function defaultCapabilities(base: PoolTruthAsset, quote: PoolTruthAsset, isLive: boolean): PoolTruthCapabilities {
  const bridgeRelevant =
    base.origin === "ibc_asset" ||
    quote.origin === "ibc_asset" ||
    base.origin === "axelar_asset" ||
    quote.origin === "axelar_asset" ||
    base.origin === "hyperlane_asset" ||
    quote.origin === "hyperlane_asset" ||
    base.origin === "evm_wrapped" ||
    quote.origin === "evm_wrapped";

  return {
    swap: isLive ? "live" : "pending",
    pool: "live",
    liquidity: isLive ? "live" : "pending",
    liquidityAction: isLive ? "live" : "pending",
    bridge: bridgeRelevant ? "pending" : "hidden",
    ibc: base.origin === "ibc_asset" || quote.origin === "ibc_asset" ? "pending" : "hidden",
    axelar: base.origin === "axelar_asset" || quote.origin === "axelar_asset" ? "pending" : "hidden",
    hyperlane: base.origin === "hyperlane_asset" || quote.origin === "hyperlane_asset" ? "pending" : "hidden",
    evm: base.origin === "evm_wrapped" || quote.origin === "evm_wrapped" ? "pending" : "hidden",
    walletConnect: "pending",
    rioLightBroadcast: "pending",
    rewards: "pending",
  };
}

function launchContext(base: PoolTruthAsset, quote: PoolTruthAsset): PoolTruthLaunchContext {
  const origins = [base.origin, quote.origin];

  if (origins.includes("pump_graduated")) {
    return {
      source: "pumplive",
      graduationSeedRusdEquivalent: 15000,
      status: "pending",
      note: "Pump.live graduated markets require a 15,000 RUSD-equivalent liquidity seed before full market activation.",
    };
  }

  if (origins.includes("prime_token")) {
    return {
      source: "prime",
      graduationSeedRusdEquivalent: null,
      status: "pending",
      note: "Prime token creators open liquidity through Liquidity Action after launch.",
    };
  }

  return {
    source: "manual",
    graduationSeedRusdEquivalent: null,
    status: "hidden",
    note: null,
  };
}

function valuationFromReserves(base: PoolTruthAsset, quote: PoolTruthAsset, reserve0: number, reserve1: number, registryLiquidityUsd: number) {
  if (reserve0 > 0 && reserve1 > 0) {
    const hasRioRusd =
      (base.origin === "native_rio" && quote.origin === "rusd") ||
      (base.origin === "rusd" && quote.origin === "native_rio");

    if (hasRioRusd) {
      return {
        tvlRusd: Math.min(reserve0, reserve1) * 2,
        source: "pool_reserves" as PoolTruthSource,
        note: "Reserve-derived RIO/RUSD TVL; stable side doubled to avoid stale registry valuation.",
      };
    }

    if (isStableAsset(base)) {
      return {
        tvlRusd: reserve0 * 2,
        source: "pool_reserves" as PoolTruthSource,
        note: "Reserve-derived TVL from stable base asset.",
      };
    }

    if (isStableAsset(quote)) {
      return {
        tvlRusd: reserve1 * 2,
        source: "pool_reserves" as PoolTruthSource,
        note: "Reserve-derived TVL from stable quote asset.",
      };
    }
  }

  if (registryLiquidityUsd > 0) {
    return {
      tvlRusd: registryLiquidityUsd,
      source: "rioex_registry" as PoolTruthSource,
      note: "Registry valuation used because reserve valuation was unavailable.",
    };
  }

  return {
    tvlRusd: 0,
    source: "fallback" as PoolTruthSource,
    note: "No reliable reserve or registry valuation available.",
  };
}

export function buildPoolTruthRecord(input: {
  market: RegistryMarketLike;
  latestLiquidity?: LiquiditySnapshotLike | null;
}): PoolTruthRecord {
  const market = input.market;
  const pairAddress = String(market.pairAddress || "").trim();

  const baseAsset = normalizeAsset({
    assetId: market.baseAssetId,
    symbol: market.baseSymbol,
    displayName: market.baseDisplayName,
    logoUrl: market.baseLogoUrl,
  });

  const quoteAsset = normalizeAsset({
    assetId: market.quoteAssetId,
    symbol: market.quoteSymbol,
    displayName: market.quoteDisplayName,
    logoUrl: market.quoteLogoUrl,
  });

  const reserve0 = fromBaseUnits(input.latestLiquidity?.reserve_0);
  const reserve1 = fromBaseUnits(input.latestLiquidity?.reserve_1);
  const registryLiquidityUsd = numberValue(market.liquidityUsd);

  const valuation = valuationFromReserves(baseAsset, quoteAsset, reserve0, reserve1, registryLiquidityUsd);
  const isLive = Boolean(market.isLive);
  const recipient = resolveTreasuryRecipient(market.feeRecipientAddress);

  const label = pairLabel(baseAsset, quoteAsset, market.displaySymbol || market.canonicalSymbol);

  return {
    pairAddress,
    pairKey: pairAddress,
    pairLabel: label,
    displaySymbol: label,
    canonicalSymbol: String(market.canonicalSymbol || label).replace("/", " / "),
    baseAsset,
    quoteAsset,
    pool: {
      isLive,
      isCanonical: Boolean(market.isCanonical),
      feeBps: numberValue(market.feeBps, 30),
      lpTokenAddress: null,
      totalShareRaw: input.latestLiquidity?.total_share ? String(input.latestLiquidity.total_share) : null,
      totalShareDisplay: input.latestLiquidity?.total_share
        ? fromBaseUnits(input.latestLiquidity.total_share)
        : null,
    },
    reserves: {
      baseRaw: input.latestLiquidity?.reserve_0 ? String(input.latestLiquidity.reserve_0) : null,
      quoteRaw: input.latestLiquidity?.reserve_1 ? String(input.latestLiquidity.reserve_1) : null,
      baseDisplay: reserve0,
      quoteDisplay: reserve1,
    },
    valuation,
    treasury: {
      recipient,
      label: SPHERIO_FEE_POLICY.label,
      feePolicy: market.feePolicy || SPHERIO_FEE_POLICY.policy,
      confirmedOnChain: Boolean(market.feeRecipientAddress && market.feeRecipientAddress === SPHERIO_TREASURY_MULTISIG),
      source: market.feeRecipientAddress ? "rioex_registry" : SPHERIO_FEE_POLICY.source,
    },
    capabilities: defaultCapabilities(baseAsset, quoteAsset, isLive),
    launchContext: launchContext(baseAsset, quoteAsset),
    routes: {
      screener: market.routes?.marketBoard || "/riodex/screener",
      pool: market.routes?.pool || `/riodex/pool/${encodeURIComponent(pairAddress)}`,
      swap: market.routes?.swap || `/riodex/swap?pair=${encodeURIComponent(pairAddress)}`,
      liquidityAction:
        market.routes?.liquidity ||
        `/riodex/liquidity?pool=${encodeURIComponent(pairAddress)}&mode=add`,
      rioex: market.routes?.hero || `/rioex?pair=${encodeURIComponent(pairAddress)}`,
      explorer: pairAddress ? `/rioexplorer/address/${encodeURIComponent(pairAddress)}` : null,
    },
    visibility: {
      showInScreener: Boolean(pairAddress && baseAsset.assetId && quoteAsset.assetId),
      showInPool: Boolean(pairAddress),
      showLiquidityAction: Boolean(pairAddress && baseAsset.assetId && quoteAsset.assetId),
      hideUnsupportedFeatures: true,
    },
    source: {
      marketSource: market.source || null,
      liquiditySource: market.liquiditySource || null,
      registrySource: "rioex_pairs_registry",
      updatedAt:
        market.liquidityUpdatedAt ||
        market.lastSwapTime ||
        input.latestLiquidity?.block_time ||
        null,
    },
  };
}
