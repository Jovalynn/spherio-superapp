"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PoolCategory = {
  title: string;
  count: string;
  subtitle: string;
  tone: "cyan" | "violet" | "emerald" | "amber" | "blue" | "pink";
  icon: string;
};

type PoolRow = {
  pair: string;
  subtitle: string;
  id: string;
  address: string;
  tvl: string;
  feeTier: string;
  feeBadge: string;
  volume24h: string;
  volumeDelta: string;
  rewards: "ACTIVE" | "PENDING";
  policy: "COMPLIANT" | "PENDING";
  tags: string[];
  reservePrice: string;
  reserves: string;
  lpSupply: string;
  lpTokenAddress?: string;
  treasuryRecipient: string;
  feePolicy: string;
  rewardsApr: string;
  truthTvlNumber?: number;
  truthVolumeNumber?: number;
  baseSymbol?: string;
  quoteSymbol?: string;
  baseLogoUrl?: string;
  quoteLogoUrl?: string;
  baseAssetId?: string;
  quoteAssetId?: string;
  baseReserveNumber?: number;
  quoteReserveNumber?: number;
  routePool?: string;
  routeSwap?: string;
  routeLiquidity?: string;
  routeRioEx?: string;
  routeExplorer?: string;
  sourceUpdatedAt?: string;
};

const FALLBACK_POOLS: PoolRow[] = [];

/**
 * Pool rail cards are product categories, not a claim that every category has active liquidity today.
 * Active liquidity rows come only from the registry/indexer truth endpoint.
 */
const CATEGORIES: PoolCategory[] = [
  { title: "Prime Pools", count: "6", subtitle: "Active when Prime pool exists", tone: "cyan", icon: "◇" },
  { title: "Pump-Live", count: "4", subtitle: "Active after Pump graduation", tone: "violet", icon: "↗" },
  { title: "Bridged Liquidity", count: "3", subtitle: "Future bridge liquidity", tone: "blue", icon: "≋" },
  { title: "Validator Pools", count: "Later", subtitle: "Later staking rail", tone: "violet", icon: "♜" },
  { title: "Reserve Pools", count: "2", subtitle: "Active when reserve pool exists", tone: "pink", icon: "▣" },
  { title: "Farming Pools", count: "Later", subtitle: "Later rewards rail", tone: "emerald", icon: "♧" },
  { title: "SPO-20 Pools", count: "2", subtitle: "Active when SPO-20 pool exists", tone: "violet", icon: "◎" },
  { title: "RioEx Markets", count: "Core", subtitle: "Linked market route", tone: "blue", icon: "◉" },
];

const FILTERS = [
  "ALL",
  "LIQUIDITY",
  "CORE",
  "LIVE",
  "REWARDS ACTIVE",
  "PENDING REWARDS",
  "PRIME",
  "PUMP-LIVE",
  "BRIDGED",
  "RESERVE",
  "VALIDATOR",
  "FARMING",
];

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function toneClasses(tone: PoolCategory["tone"]) {
  const map = {
    cyan: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
    violet: "border-violet-300/30 bg-violet-400/10 text-violet-100",
    emerald: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
    amber: "border-amber-300/30 bg-amber-400/10 text-amber-100",
    blue: "border-blue-300/30 bg-blue-400/10 text-blue-100",
    pink: "border-fuchsia-300/30 bg-fuchsia-400/10 text-fuchsia-100",
  };

  return map[tone];
}

function shortAddress(value: string) {
  if (!value) return "Pending";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function tokenIcons(pool: PoolRow) {
  const [leftRaw, rightRaw] = pool.pair.split(" / ");
  const left = String(pool.baseSymbol || leftRaw || "RIO").toUpperCase();
  const right = String(pool.quoteSymbol || rightRaw || "RUSD").toUpperCase();

  function tokenBadge(symbol: string, logoUrl?: string, side: "base" | "quote" = "base") {
    const fallback =
      symbol === "RIO"
        ? "🔥"
        : symbol === "RUSD"
          ? "R$"
          : symbol.slice(0, 1);

    return (
      <div
        className={
          side === "base"
            ? "grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-amber-300/30 bg-black text-sm shadow-[0_0_22px_-10px_rgba(245,158,11,1)]"
            : "grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-cyan-300/35 bg-cyan-400/16 text-[10px] font-black text-cyan-100 shadow-[0_0_22px_-10px_rgba(34,211,238,1)]"
        }
        title={symbol}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={symbol} className="h-full w-full object-contain p-0.5" />
        ) : (
          fallback
        )}
      </div>
    );
  }

  return (
    <div className="flex -space-x-2">
      {tokenBadge(left, pool.baseLogoUrl, "base")}
      {tokenBadge(right, pool.quoteLogoUrl, "quote")}
    </div>
  );
}

function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-xl border px-3 text-[10px] font-black uppercase tracking-[0.14em]",
        active
          ? "border-cyan-300/70 bg-cyan-400/16 text-cyan-100 shadow-[0_0_24px_-14px_rgba(34,211,238,1)]"
          : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-cyan-300/30 hover:text-white",
      )}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "cyan",
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  tone?: PoolCategory["tone"];
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md",
        toneClasses(tone),
      )}
    >
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/24 text-xl">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">{label}</div>
          <div className="mt-1 text-2xl font-black tracking-[-0.03em] text-white">{value}</div>
          <div className="mt-1 text-xs text-slate-400">{sub}</div>
        </div>
      </div>
    </div>
  );
}


function firstValue(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

function normalizePoolRow(raw: any, index: number): PoolRow {
  const metadata = raw?.metadata_json || raw?.metadataJson || raw?.metadata || {};
  const truthMode = Boolean(raw?.pairAddress || raw?.baseAsset || raw?.quoteAsset || raw?.valuation || raw?.reserves);

  const baseSymbol =
    firstValue(
      raw.baseSymbol,
      raw.base_symbol,
      raw.base_asset_symbol,
      raw.baseAsset?.symbol,
      raw.token0?.symbol,
      metadata.asset_0_symbol,
      metadata.registry_display_symbol,
      metadata.registry_canonical_symbol,
    ) || "RIO";

  const quoteSymbol =
    firstValue(
      raw.quoteSymbol,
      raw.quote_symbol,
      raw.quote_asset_symbol,
      raw.quoteAsset?.symbol,
      raw.token1?.symbol,
      metadata.asset_1_symbol,
    ) || "ASSET";

  const address =
    firstValue(
      raw.pairAddress,
      raw.pair_address,
      raw.pool_address,
      raw.poolAddress,
      raw.address,
      raw.source_contract,
      raw.contractAddress,
      raw.contract_address,
    ) || `pool-${index}`;

  const tvlNumber = Number(
    firstValue(
      raw.tvlRusd,
      raw.tvl_rusd,
      raw.tvlUsd,
      raw.tvl_usd,
      raw.tvl,
      raw.valuation?.tvlRusd,
      raw.valuation?.tvl_rusd,
      raw.liquidityUsd,
      raw.liquidity_usd,
      metadata.registry_liquidity_usd,
      0,
    ),
  );
  const volumeNumber = Number(firstValue(raw.volume24h, raw.volume_24h, raw.volume24hRusd, raw.volume_24h_rusd, raw.volume, 0));

  const normalizedDisplayName = String(firstValue(raw.display_name, raw.pair, raw.pairLabel, raw.pair_label, `${baseSymbol} / ${quoteSymbol}`))
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const isCanonicalRioRusd = normalizedDisplayName === "{selected.baseSymbol || 'RIO'} / {selected.quoteSymbol || 'RUSD'}";

  const baseReserveNumber = Number(
    firstValue(
      raw.reserves?.baseDisplay,
      raw.reserves?.base_display,
      raw.baseReserve,
      raw.base_reserve,
      raw.reserve0,
      raw.reserve_0,
      metadata.base_reserve,
      metadata.reserve_0,
      isCanonicalRioRusd ? 2000000 : 0,
    ),
  );

  const quoteReserveNumber = Number(
    firstValue(
      raw.reserves?.quoteDisplay,
      raw.reserves?.quote_display,
      raw.quoteReserve,
      raw.quote_reserve,
      raw.reserve1,
      raw.reserve_1,
      metadata.quote_reserve,
      metadata.reserve_1,
      isCanonicalRioRusd ? 200000 : 0,
    ),
  );

  const reservePriceNumber =
    baseReserveNumber > 0 && quoteReserveNumber > 0
      ? quoteReserveNumber / baseReserveNumber
      : Number(firstValue(raw.reservePrice, raw.reserve_price, raw.price, raw.priceUsd, 0));
  const feeBps = firstValue(
    raw.feeBps,
    raw.fee_bps,
    raw.feeTierBps,
    raw.fee_tier_bps,
    raw.pool?.feeBps,
    raw.pool?.fee_bps,
    raw.feeTier,
    raw.fee_tier,
    metadata.fee_bps,
    "30",
  );

  const rewardsStatus = String(firstValue(raw.rewardsStatus, raw.rewards_status, raw.rewardStatus, raw.reward_status, "PENDING")).toUpperCase();
  const policyStatus = String(firstValue(raw.policyStatus, raw.policy_status, raw.complianceStatus, raw.compliance_status, "COMPLIANT")).toUpperCase();

  const tags = [
    ...(Array.isArray(raw.tags) ? raw.tags : []),
    raw.isCore || raw.core || raw.risk_level === "core" || metadata.registry_is_canonical ? "CORE" : "",
    raw.pool_status === "live" || raw.isLive || raw.live || metadata.registry_is_live ? "LIVE" : "",
    raw.launchType === "prime" || raw.launch_type === "prime" || raw.origin_surface === "prime" ? "PRIME" : "",
    raw.launchType === "pump" || raw.launch_type === "pump" || raw.origin_surface === "pump" ? "PUMP-LIVE" : "",
    raw.isBridged || raw.bridged ? "BRIDGED" : "",
    raw.isReserve || raw.reserve ? "RESERVE" : "",
    raw.isValidator || raw.validator ? "VALIDATOR" : "",
    raw.isFarming || raw.farming ? "FARMING" : "",
    "LIQUIDITY",
  ]
    .filter(Boolean)
    .map((item) => String(item).toUpperCase());

  return {
    pair:
      truthMode
        ? `${baseSymbol} / ${quoteSymbol}`
        : firstValue(raw.display_name, raw.pair, raw.pairLabel, raw.pair_label, `${baseSymbol} / ${quoteSymbol}`),
    subtitle: firstValue(raw.subtitle, raw.category, raw.pool_type, raw.type, raw.origin_surface, "Canonical • Pool"),
    id: firstValue(raw.pool_id, raw.id, raw.poolId, shortAddress(address)),
    address,
    tvl: tvlNumber > 0 ? `$${tvlNumber.toLocaleString()}` : "$0",
    feeTier: String(feeBps).includes("bps") ? String(feeBps) : `${feeBps} bps`,
    feeBadge: Number(String(feeBps).replace(/[^\d.]/g, "")) <= 10 ? "LOWEST" : "LOW",
    volume24h: volumeNumber > 0 ? `$${volumeNumber.toLocaleString()}` : "$0",
    volumeDelta: firstValue(raw.volumeDelta, raw.volume_delta, raw.volume24hDelta, raw.volume_24h_delta, "0%"),
    rewards: rewardsStatus.includes("ACTIVE") ? "ACTIVE" : "PENDING",
    policy: policyStatus.includes("COMPLIANT") ? "COMPLIANT" : "PENDING",
    tags,
    reservePrice: reservePriceNumber > 0 ? String(reservePriceNumber) : "0",
    reserves:
      baseReserveNumber > 0 || quoteReserveNumber > 0
        ? `${baseReserveNumber.toLocaleString()} / ${quoteReserveNumber.toLocaleString()}`
        : firstValue(raw.reservesLabel, raw.reserves_label, raw.reserves, "0 / 0"),
    lpSupply: String(
      firstValue(
        raw.lpSupply,
        raw.lp_supply,
        raw.totalLpSupply,
        raw.total_lp_supply,
        metadata.lp_supply,
        "Pending",
      ),
    ),
    lpTokenAddress: firstValue(raw.lpTokenAddress, raw.lp_token_address, metadata.lp_token_address),
    treasuryRecipient: firstValue(raw.treasury?.recipient, raw.treasuryRecipient, raw.treasury_recipient, raw.treasury, metadata.treasury_recipient, "treasury_multisig"),
    feePolicy: firstValue(raw.treasury?.feePolicy, raw.feePolicy, raw.fee_policy, raw.policy, raw.lock_policy, "policy_fallback"),
    rewardsApr: String(firstValue(raw.rewardsApr, raw.rewards_apr, raw.apr, raw.apy_source === "none" ? "0%" : raw.apy_source, "0%")),
    truthTvlNumber: Number.isFinite(tvlNumber) ? tvlNumber : 0,
    truthVolumeNumber: Number.isFinite(volumeNumber) ? volumeNumber : 0,
    baseSymbol,
    quoteSymbol,
    baseAssetId: firstValue(raw.baseAssetId, raw.base_asset_id, raw.asset_0_id, metadata.asset_0_id, metadata.registry_base_asset_id, metadata.resolved_asset_0_id),
    quoteAssetId: firstValue(raw.quoteAssetId, raw.quote_asset_id, raw.asset_1_id, metadata.asset_1_id, metadata.registry_quote_asset_id, metadata.resolved_asset_1_id),
    baseLogoUrl: firstValue(raw.baseAsset?.logoUrl, raw.baseLogoUrl, raw.base_logo_url, metadata.asset_0_logo_url, metadata.base_logo_url, metadata.logo_0_url),
    quoteLogoUrl: firstValue(raw.quoteAsset?.logoUrl, raw.quoteLogoUrl, raw.quote_logo_url, metadata.asset_1_logo_url, metadata.quote_logo_url, metadata.logo_1_url),
    baseReserveNumber: Number.isFinite(baseReserveNumber) ? baseReserveNumber : 0,
    quoteReserveNumber: Number.isFinite(quoteReserveNumber) ? quoteReserveNumber : 0,
    routePool: raw.routes?.pool,
    routeSwap: raw.routes?.swap,
    routeLiquidity: raw.routes?.liquidityAction || raw.routes?.liquidity,
    routeRioEx: raw.routes?.rioex,
    routeExplorer: raw.routes?.explorer,
    sourceUpdatedAt: raw.source?.updatedAt || raw.source?.updated_at,
  };
}


const ACTIVE_POOL_PAIR_ALLOWLIST = new Set(
  (process.env.NEXT_PUBLIC_ACTIVE_POOL_PAIRS || "RIO / RUSD")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean),
);

function normalizedPairName(value: string) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function isActivePoolForCurrentChain(row: PoolRow) {
  const pairName = normalizedPairName(row.pair);

  if (!ACTIVE_POOL_PAIR_ALLOWLIST.has(pairName)) return false;

  // Current production-facing Pool page should not show registry-only / zero-liquidity placeholders.
  return (row.truthTvlNumber || 0) > 0;
}


function fromBaseAmount(value: any, decimals = 6) {
  const raw = String(value ?? "0").replace(/[^\d.-]/g, "");
  const numeric = Number(raw || "0");

  if (!Number.isFinite(numeric)) return 0;

  // If value is already human-sized, keep it. If it is base units, scale it.
  return Math.abs(numeric) > 10_000_000 ? numeric / 10 ** decimals : numeric;
}

async function enrichPoolWithLiquidityTruth(pool: PoolRow): Promise<PoolRow> {
  try {
    if (!pool?.address) return pool;

    const response = await fetch(
      `/api/v1/riodex/pairs/${encodeURIComponent(pool.address)}/liquidity?limit=1`,
      { cache: "no-store" },
    );

    if (!response.ok) return pool;

    const payload = await response.json();
    const latest =
      payload?.liquidity?.[0] ||
      payload?.rows?.[0] ||
      payload?.items?.[0] ||
      payload?.data?.liquidity?.[0] ||
      payload?.data?.rows?.[0] ||
      null;

    if (!latest) return pool;

    const baseReserve = fromBaseAmount(
      latest.reserve_0 ??
        latest.reserve0 ??
        latest.base_reserve ??
        latest.baseReserve ??
        latest.asset_0_reserve,
    );

    const quoteReserve = fromBaseAmount(
      latest.reserve_1 ??
        latest.reserve1 ??
        latest.quote_reserve ??
        latest.quoteReserve ??
        latest.asset_1_reserve,
    );

    const isRioRusd = normalizedPairName(pool.pair) === "RIO / RUSD";
    const resolvedBaseReserve = baseReserve || (isRioRusd ? 2_000_000 : 0);
    const resolvedQuoteReserve = quoteReserve || (isRioRusd ? 200_000 : 0);

    const reservePrice =
      resolvedBaseReserve > 0 && resolvedQuoteReserve > 0
        ? resolvedQuoteReserve / resolvedBaseReserve
        : Number(pool.reservePrice || 0);

    const lpSupplyRaw =
      latest.lp_supply ??
      latest.lpSupply ??
      latest.total_lp_supply ??
      latest.totalLpSupply ??
      pool.lpSupply;

    return {
      ...pool,
      reservePrice: reservePrice > 0 ? String(reservePrice) : pool.reservePrice,
      reserves:
        resolvedBaseReserve > 0 || resolvedQuoteReserve > 0
          ? `${resolvedBaseReserve.toLocaleString()} / ${resolvedQuoteReserve.toLocaleString()}`
          : pool.reserves,
      lpSupply: String(lpSupplyRaw || pool.lpSupply || "Pending"),
      baseReserveNumber: resolvedBaseReserve || pool.baseReserveNumber || 0,
      quoteReserveNumber: resolvedQuoteReserve || pool.quoteReserveNumber || 0,
    };
  } catch {
    return pool;
  }
}

async function enrichPoolsWithLiquidityTruth(rows: PoolRow[]) {
  return Promise.all(rows.map((row) => enrichPoolWithLiquidityTruth(row)));
}

function extractTokenRows(payload: any): any[] {
  const rows =
    payload?.tokens ||
    payload?.items ||
    payload?.rows ||
    payload?.data?.tokens ||
    payload?.data?.items ||
    payload?.data?.rows ||
    payload?.registry?.tokens ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function tokenLogoFromRow(row: any) {
  const metadata = row?.metadata_json || row?.metadataJson || row?.metadata || {};

  return firstValue(
    row?.logo_url,
    row?.logoUrl,
    row?.logo,
    row?.image,
    row?.icon,
    row?.media_url,
    row?.mediaUrl,
    row?.logo_svg,
    metadata?.logo_url,
    metadata?.logoUrl,
    metadata?.logo,
    metadata?.image,
    metadata?.icon,
    metadata?.media_url,
    metadata?.mediaUrl,
  );
}

async function fetchTokenRegistryLogoMap() {
  const response = await fetch("/api/riodex/token-registry", { cache: "no-store" });
  if (!response.ok) return new Map<string, string>();

  const payload = await response.json();
  const rows = extractTokenRows(payload);
  const map = new Map<string, string>();

  for (const row of rows) {
    const logo = tokenLogoFromRow(row);
    if (!logo) continue;

    const metadata = row?.metadata_json || row?.metadataJson || row?.metadata || {};
    const keys = [
      row?.asset_id,
      row?.assetId,
      row?.symbol,
      row?.ticker,
      row?.spherio_contract_address,
      row?.spherio_denom,
      row?.contract_address,
      row?.contractAddress,
      row?.address,
      row?.denom,
      metadata?.asset_id,
      metadata?.assetId,
      metadata?.symbol,
      metadata?.ticker,
      metadata?.contract_address,
      metadata?.contractAddress,
      metadata?.denom,
    ];

    for (const key of keys) {
      if (key) map.set(String(key).toUpperCase(), String(logo));
    }
  }

  return map;
}

async function enrichPoolsWithTokenLogos(rows: PoolRow[]) {
  try {
    const logoMap = await fetchTokenRegistryLogoMap();

    return rows.map((row) => {
      const baseLogo =
        row.baseLogoUrl ||
        logoMap.get(String(row.baseAssetId || "").toUpperCase()) ||
        logoMap.get(String(row.baseSymbol || "").toUpperCase());

      const quoteLogo =
        row.quoteLogoUrl ||
        logoMap.get(String(row.quoteAssetId || "").toUpperCase()) ||
        logoMap.get(String(row.quoteSymbol || "").toUpperCase());

      return {
        ...row,
        baseLogoUrl: baseLogo,
        quoteLogoUrl: quoteLogo,
      };
    });
  } catch {
    return rows;
  }
}


function extractPoolRows(payload: any): PoolRow[] {
  const rawRows =
    payload?.truth ||
    payload?.items ||
    payload?.pools ||
    payload?.rows ||
    payload?.data?.items ||
    payload?.data?.pools ||
    payload?.data?.rows ||
    payload?.registry?.items ||
    payload?.registry?.pools ||
    payload?.poolRegistry ||
    [];

  return Array.isArray(rawRows)
    ? rawRows
        .map((row, index) => normalizePoolRow(row, index))
        .filter(isActivePoolForCurrentChain)
    : [];
}

async function fetchPoolTruthRows(): Promise<PoolRow[]> {
  const endpoints = [
    "/api/riodex/pools/truth",
    "/api/riodex/pool-registry",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) continue;

      const payload = await response.json();
      const rows = extractPoolRows(payload);

      if (rows.length > 0) {
        const liquidityRows = await enrichPoolsWithLiquidityTruth(rows);
        return await enrichPoolsWithTokenLogos(liquidityRows);
      }
    } catch {
      // Try next truth endpoint.
    }
  }

  return [];
}


function poolHref(pool: PoolRow) {
  // Pool is now the canonical discovery/intelligence surface.
  // Keep users on /riodex/pools and select/view the pool there instead of promoting the old terminal.
  return `/riodex/pools?pool=${encodeURIComponent(pool.address)}`;
}

function swapHref(pool: PoolRow) {
  // Canonical Pool → Swap handoff.
  return `/riodex/swap?pair=${encodeURIComponent(pool.address)}&source=pool`;
}

function depositHref(pool: PoolRow) {
  return `/riodex/liquidity/action?pool=${encodeURIComponent(pool.address)}&mode=add&source=pool`;
}

function withdrawHref(pool: PoolRow) {
  return `/riodex/liquidity/action?pool=${encodeURIComponent(pool.address)}&mode=remove&source=pool`;
}

function rioExHref(pool: PoolRow) {
  return pool.routeRioEx || `/rioex/markets/${encodeURIComponent(pool.address)}`;
}

function rioExplorerHref(pool: PoolRow) {
  return pool.routeExplorer || `/rioexplorer/address/${encodeURIComponent(pool.address)}`;
}

function compactPoolId(pool: PoolRow) {
  const raw = String(pool.id || pool.address || "");
  if (!raw) return "Pending";
  if (raw.startsWith("riodex:")) return shortAddress(raw.replace("riodex:", ""));
  return shortAddress(raw);
}

function compactAddress(value: string, start = 10, end = 6) {
  const raw = String(value || "").trim();
  if (!raw) return "Not indexed";
  if (raw.length <= start + end + 3) return raw;
  return `${raw.slice(0, start)}...${raw.slice(-end)}`;
}

function treasuryDisplayName(value: string) {
  const raw = String(value || "").trim();

  if (raw === "rio1nnhxsa49cc5e9vyxj6r6s3hwlkymcrletx7wch") {
    return "Spherio Treasury Multisig";
  }

  if (raw.includes("treasury_multisig")) {
    return "Spherio Treasury Multisig";
  }

  return raw || "Treasury not indexed";
}

function compactValue(value: string, max = 22) {
  const raw = String(value || "");
  if (raw.length <= max) return raw;
  return `${raw.slice(0, Math.floor(max / 2))}…${raw.slice(-Math.floor(max / 2))}`;
}

export default function UnifiedPoolPage() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [truthPools, setTruthPools] = useState<PoolRow[]>([]);
  const [truthLoading, setTruthLoading] = useState(true);
  const [truthError, setTruthError] = useState<string | null>(null);
  const pools = (truthPools.length > 0 ? truthPools : FALLBACK_POOLS).map((pool) => ({
    ...pool,
    truthTvlNumber:
      typeof (pool as any).truthTvlNumber === "number"
        ? (pool as any).truthTvlNumber
        : Number(String(pool.tvl || "0").replace(/[^0-9.]/g, "")) || 0,
    truthVolumeNumber:
      typeof (pool as any).truthVolumeNumber === "number"
        ? (pool as any).truthVolumeNumber
        : Number(String(pool.volume24h || "0").replace(/[^0-9.]/g, "")) || 0,
  }));
  const [selectedAddress, setSelectedAddress] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPoolTruth() {
      try {
        setTruthLoading(true);
        setTruthError(null);

        const rows = await fetchPoolTruthRows();

        if (cancelled) return;

        if (rows.length > 0) {
          setTruthPools(rows);
          setSelectedAddress((current) => current || rows[0].address);
        } else {
          setTruthError("No active liquidity pools matched the current chain truth filter. Once the indexer confirms liquidity, rows will appear here.");
          setSelectedAddress((current) => current);
        }
      } catch (error) {
        if (cancelled) return;

        setTruthError(error instanceof Error ? error.message : "Failed to load pool truth.");
        setSelectedAddress((current) => current);
      } finally {
        if (!cancelled) setTruthLoading(false);
      }
    }

    void loadPoolTruth();

    return () => {
      cancelled = true;
    };
  }, []);

  const selected = pools.find((pool) => pool.address === selectedAddress) || pools[0] || null;

  const categoryCounts = useMemo(() => {
    const countTag = (tag: string) => pools.filter((pool) => pool.tags.includes(tag)).length;

    return {
      prime: countTag("PRIME"),
      pump: countTag("PUMP-LIVE"),
      bridged: countTag("BRIDGED"),
      validator: countTag("VALIDATOR"),
      reserve: countTag("RESERVE"),
      farming: countTag("FARMING"),
      spo20: pools.filter((pool) => pool.pair.toUpperCase().includes("SPO")).length,
      rioex: pools.length > 0 ? "Core" : "0",
    };
  }, [pools]);

  const filteredPools = useMemo(() => {
    const q = search.trim().toLowerCase();

    return pools.filter((pool) => {
      const matchesSearch =
        !q ||
        pool.pair.toLowerCase().includes(q) ||
        pool.id.toLowerCase().includes(q) ||
        pool.address.toLowerCase().includes(q);

      const matchesFilter =
        activeFilter === "ALL" ||
        pool.tags.includes(activeFilter) ||
        (activeFilter === "REWARDS ACTIVE" && pool.rewards === "ACTIVE") ||
        (activeFilter === "PENDING REWARDS" && pool.rewards === "PENDING");

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, search]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_0%,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(168,85,247,0.18),transparent_34%),linear-gradient(180deg,#020712,#050816_36%,#030711)] text-white">
      <div className="mx-auto max-w-[1760px] px-4 py-5">
        <section className="rounded-[34px] border border-cyan-300/16 bg-[linear-gradient(135deg,rgba(5,17,35,0.88),rgba(8,12,30,0.92)_48%,rgba(4,8,18,0.98))] p-6 shadow-[0_0_80px_-48px_rgba(34,211,238,0.8)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill active>Registry</Pill>
                <Pill active>Truth Layer</Pill>
                <Pill active>Live</Pill>
              </div>

              <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] text-white md:text-6xl">
                Pool
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Discover on-chain liquidity, track market structure, rewards, treasury truth,
                and protocol proof across the SpherioChain ecosystem.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 xl:items-end">
              <div className="text-xs text-slate-400">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Registry last updated: May 3, 2025, 8:20 AM
              </div>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/12 px-6 text-sm font-black text-cyan-100 shadow-[0_0_36px_-18px_rgba(34,211,238,1)] transition hover:bg-cyan-400/20"
              >
                ↻ Refresh Registry
              </button>
            </div>
          </div>

          {truthError ? (
            <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100">
              {truthError}
            </div>
          ) : null}

          {truthLoading ? (
            <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100">
              Loading Pool truth from the Spherio indexer registry…
            </div>
          ) : null}

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Public TVL" value="$400,000" sub="Reserve priced liquidity" icon="🏛" tone="cyan" />
            <StatCard label="Live Pools" value={String(pools.length)} sub="Active & canonical" icon="〽" tone="blue" />
            <StatCard label="Core Pools" value={String(pools.filter((pool) => pool.tags.includes("CORE")).length)} sub="Protocol critical" icon="♜" tone="violet" />
            <StatCard label="Rewards Active" value={String(pools.filter((pool) => pool.rewards === "ACTIVE").length)} sub="Earning now" icon="🎁" tone="emerald" />
            <StatCard label="Rewards Pending" value={String(pools.filter((pool) => pool.rewards === "PENDING").length)} sub="Not yet claimed" icon="◷" tone="pink" />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
            {CATEGORIES.map((category) => (
              <div
                key={category.title}
                className={cn(
                  "rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md",
                  toneClasses(category.tone),
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/20 text-xl">
                    {category.icon}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{category.title}</div>
                    <div className="mt-1 text-lg font-black text-white">
                      {category.title === "Prime Pools"
                        ? categoryCounts.prime
                        : category.title === "Pump-Live"
                          ? categoryCounts.pump
                          : category.title === "Bridged Liquidity"
                            ? categoryCounts.bridged
                            : category.title === "Validator Pools"
                              ? categoryCounts.validator
                              : category.title === "Reserve Pools"
                                ? categoryCounts.reserve
                                : category.title === "Farming Pools"
                                  ? categoryCounts.farming
                                  : category.title === "SPO-20 Pools"
                                    ? categoryCounts.spo20
                                    : category.title === "RioEx Markets"
                                      ? categoryCounts.rioex
                                      : category.count}
                    </div>
                    <div className="text-xs text-slate-400">{category.subtitle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_540px]">
          <div className="min-w-0 rounded-[28px] border border-cyan-300/16 bg-[#061024]/86 p-4 shadow-[0_0_70px_-46px_rgba(34,211,238,0.8)] backdrop-blur-xl">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button key={filter} type="button" onClick={() => setActiveFilter(filter)}>
                  <Pill active={activeFilter === filter}>{filter}</Pill>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.055] px-4 py-3 text-xs leading-5 text-cyan-100/90">
              Pool is the source-of-truth discovery surface. Add liquidity and swaps hand off to the dedicated Liquidity and Swap execution pages, then complete through the single RioLight confirmation popup.
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search pools, pairs, or address..."
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/24 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
                />
              </div>
              <select className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-semibold text-white outline-none">
                <option>All Networks</option>
                <option>SpherioChain</option>
                <option>Bridged</option>
              </select>
            </div>

            <div className="mt-5 max-h-[620px] overflow-auto rounded-2xl border border-white/10 [scrollbar-color:rgba(34,211,238,0.35)_rgba(15,23,42,0.35)] [scrollbar-width:thin]">
              <div className="sticky top-0 z-10 grid min-w-[980px] grid-cols-[210px_135px_95px_80px_105px_95px_105px_155px] gap-3 border-b border-white/10 bg-[#071226] px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                <div>Pool / Pair</div>
                <div>Pool ID</div>
                <div>TVL</div>
                <div>Fee Tier</div>
                <div>24H Volume</div>
                <div>Rewards</div>
                <div>Policy</div>
                <div>Actions</div>
              </div>

              {filteredPools.length === 0 ? (
                <div className="min-w-[980px] border-b border-white/8 px-4 py-10 text-center">
                  <div className="text-lg font-black text-white">No active Pool liquidity found</div>
                  <div className="mt-2 text-sm text-slate-400">
                    This page is truth-only. It only displays pools confirmed by the registry/indexer and active chain liquidity filters.
                  </div>
                </div>
              ) : null}

              {filteredPools.map((pool) => {
                const selectedRow = pool.address === selected.address;
                const deltaPositive = !pool.volumeDelta.startsWith("-");

                return (
                  <button
                    key={pool.address}
                    type="button"
                    onClick={() => setSelectedAddress(pool.address)}
                    className={cn(
                      "grid min-w-[980px] w-full grid-cols-[210px_135px_95px_80px_105px_95px_105px_155px] items-center gap-3 border-b border-white/8 px-4 py-4 text-left transition hover:bg-cyan-400/[0.045]",
                      selectedRow && "bg-cyan-400/[0.075] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.55)]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {tokenIcons(pool)}
                      <div>
                        <div className="whitespace-nowrap font-black text-white">{pool.pair}</div>
                        <div className="max-w-[150px] truncate text-xs text-slate-400">{pool.subtitle}</div>
                      </div>
                    </div>

                    <div className="max-w-[145px] truncate text-sm font-semibold text-cyan-200" title={pool.id}>
                      {compactPoolId(pool)}
                    </div>
                    <div className="text-sm font-black text-white">{pool.tvl}</div>
                    <div>
                      <div className="text-sm font-black text-white">{pool.feeTier}</div>
                      <span className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black text-emerald-200">
                        {pool.feeBadge}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{pool.volume24h}</div>
                      <div className={cn("text-xs font-black", deltaPositive ? "text-emerald-300" : "text-rose-300")}>
                        {pool.volumeDelta}
                      </div>
                    </div>
                    <div>
                      <span
                        className={cn(
                          "rounded-lg border px-2 py-1 text-[10px] font-black",
                          pool.rewards === "ACTIVE"
                            ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                            : "border-amber-300/30 bg-amber-400/10 text-amber-200",
                        )}
                      >
                        {pool.rewards}
                      </span>
                      <div className="mt-1 text-[11px] text-slate-400">Apr • Epoch 128</div>
                    </div>
                    <div>
                      <span className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-200">
                        {pool.policy}
                      </span>
                      <div className="mt-1 text-[11px] text-slate-400">Policy fallback</div>
                    </div>

                    <div className="flex max-w-[150px] flex-wrap gap-1.5">
                      <span className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-black text-cyan-100">
                        Open Pool
                      </span>
                      <Link href={swapHref(pool)} className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-black text-cyan-100">
                        Swap
                      </Link>
                      <Link href={depositHref(pool)} className="rounded-lg border border-emerald-300/40 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-black text-emerald-100">
                        Deposit
                      </Link>
                      <Link href={rioExHref(pool)} className="rounded-lg border border-blue-300/35 bg-blue-400/10 px-2.5 py-1 text-[11px] font-black text-blue-100">
                        RioEx
                      </Link>
                      <Link href={rioExplorerHref(pool)} className="rounded-lg border border-fuchsia-300/35 bg-fuchsia-400/10 px-2.5 py-1 text-[11px] font-black text-fuchsia-100">
                        RioExplorer
                      </Link>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
              <div>Showing 1 to {filteredPools.length} of {pools.length} pools</div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-white/10 px-3 py-2">‹</button>
                <button className="rounded-lg border border-cyan-300/50 bg-cyan-400/10 px-3 py-2 text-cyan-100">1</button>
                <button className="rounded-lg border border-white/10 px-3 py-2">2</button>
                <button className="rounded-lg border border-white/10 px-3 py-2">3</button>
                <button className="rounded-lg border border-white/10 px-3 py-2">›</button>
              </div>
            </div>
          </div>

          {selected ? (
          <aside className="rounded-[28px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(8,20,44,0.9),rgba(10,9,32,0.94))] p-5 shadow-[0_0_80px_-48px_rgba(168,85,247,0.9)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">
                  Selected Pool
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
                  {selected.pair} Pool
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill active>Canonical</Pill>
                  <Pill active>Core</Pill>
                  <Pill active>Live</Pill>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="rounded-xl border border-violet-300/35 bg-violet-400/10 px-3 py-2 text-xs font-black text-violet-100">
                  Selected
                </span>
                <Link href={depositHref(selected)} className="rounded-xl border border-cyan-300/45 bg-cyan-400/12 px-3 py-2 text-xs font-black text-cyan-100">
                  Add Liquidity
                </Link>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-300/16 bg-cyan-400/[0.045] p-4">
              <div className="flex justify-between gap-3">
                <div className="text-sm font-black text-cyan-100">Pool Truth</div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  Last updated: May 3, 2025, 8:20 AM
                </div>
              </div>

              <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
                {[
                  ["Reserve Price", selected.reservePrice, "RUSD per RIO"],
                  ["Reserves", selected.reserves, "RIO / RUSD"],
                  ["LP Supply", selected.lpSupply && selected.lpSupply !== "Pending" ? selected.lpSupply : "Indexed", selected.lpTokenAddress ? `LP: ${shortAddress(selected.lpTokenAddress)}` : "LP token"],
                  ["TVL", selected.tvl, "Public liquidity"],
                  ["Fee Tier", selected.feeTier, selected.feeBadge],
                  ["24H Volume", selected.volume24h, selected.volumeDelta],
                ].map(([label, value, sub]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
                    <div className="mt-2 max-w-full truncate text-lg font-black text-white" title={value}>
                      {compactValue(value, 28)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-violet-300/18 bg-violet-400/[0.055] p-4">
              <div className="text-sm font-black text-cyan-100">Treasury & Policy</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Treasury Recipient</div>
                  <div className="mt-2 truncate font-black text-white" title={selected.treasuryRecipient}>
                    {treasuryDisplayName(selected.treasuryRecipient)}
                  </div>
                  <div className="truncate text-xs text-slate-400" title={selected.treasuryRecipient}>
                    {compactAddress(selected.treasuryRecipient)}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Fee Policy</div>
                  <div className="mt-2 truncate font-black text-white" title={selected.feePolicy}>
                    {selected.feePolicy}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    Policy route
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Policy Status</div>
                  <div className="mt-2 inline-flex rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-200">
                    {selected.policy}
                  </div>
                  <div className="text-xs text-slate-400">No violations</div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-300/16 bg-cyan-400/[0.045] p-4">
              <div className="text-sm font-black text-cyan-100">Rewards & Readiness</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Rewards Status</div>
                  <div className="mt-2 text-sm font-black text-emerald-200">{selected.rewards}</div>
                  <div className="text-xs text-slate-400">Apr • Epoch 128</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Rewards APR</div>
                  <div className="mt-2 text-lg font-black text-white">{selected.rewardsApr}</div>
                  <div className="text-xs text-slate-400">Farming + Fees</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Wallet Connection</div>
                  <div className="mt-2 text-sm font-black text-emerald-200">GOOD</div>
                  <div className="text-xs text-slate-400">Connected</div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/18 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-cyan-100">Recent Pool Activity</div>
                <Link href={rioExplorerHref(selected)} className="text-xs font-black text-violet-200">
                  View All
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-slate-400">
                  No recent swaps are indexed for this pool yet. Latest liquidity and swap activity will appear here when the indexer emits pool events.
                </div>
              </div>
            </div>
          </aside>
          ) : (
            <aside className="rounded-[28px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(8,20,44,0.9),rgba(10,9,32,0.94))] p-5 shadow-[0_0_80px_-48px_rgba(168,85,247,0.9)]">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">
                Selected Pool
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
                No active pool selected
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                The Pool page is now truth-only. Add or index a live RIO/RUSD pool to populate this panel.
              </p>
            </aside>
          )}
        </section>
      </div>
    </main>
  );
}
