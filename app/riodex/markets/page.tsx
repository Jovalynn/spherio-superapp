"use client";

import Link from "next/link";
import ExchangeSurfaceNav from "@/components/exchange/ExchangeSurfaceNav";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CandlestickChart,
  ChevronDown,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import {
  buildTokenRegistryMap,
  getRioDexTokenRegistryBatch,
  getRegistryLogoUrl,
  getRegistryPairLabel,
} from "@/lib/riodex/token-registry";
import { normalizePairLabel } from "@/lib/riodex/display";
import {
  buildRioDexSurfaceHref,
  RIODEX_HOME_ROUTE,
  RIODEX_LIQUIDITY_ROUTE,
  RIODEX_SWAP_ROUTE,
} from "@/lib/riodex/routes";

const WATCHLIST_STORAGE_KEY = "riodex:screener:watchlist";

type PairMeta = {
  pair_address: string;
  factory_address?: string | null;
  lp_token_address?: string | null;
  pair_key?: string | null;
  display_symbol?: string | null;
  fee_bps?: number | null;
  is_canonical?: boolean | null;
  is_live?: boolean | null;
  created_height?: string | number | null;
  created_time?: string | null;
  updated_at?: string | null;
  asset_0_id?: string | null;
  asset_1_id?: string | null;
  asset_0_type?: string | null;
  asset_1_type?: string | null;
};
type ScreenerSummary = {
  live_pools: number;
  canonical_pools: number;
  total_volume_24h: number;
  total_txns_24h: number;
  candidate_count: number;
  promoted_count: number;
};

type ScreenerAuthorityRow = {
  pairAddress?: string;
  displaySymbol?: string;
  canonicalSymbol?: string;
  baseAssetId?: string;
  quoteAssetId?: string;
  baseSymbol?: string | null;
  quoteSymbol?: string | null;
  baseDisplayName?: string | null;
  quoteDisplayName?: string | null;
  baseLogoUrl?: string | null;
  quoteLogoUrl?: string | null;
  baseAssetType?: string | null;
  quoteAssetType?: string | null;
  feeBps?: number | null;
  feePolicy?: string | null;
  feeRecipientAddress?: string | null;
  isCanonical?: boolean;
  isLive?: boolean;
  liquidityUsd?: number | null;
  liquidityHeight?: string | number | null;
  liquidityTime?: string | null;
  liquiditySource?: string | null;
  liquidityUpdatedAt?: string | null;
  lastSwapTime?: string | null;
  lastSwapTxHash?: string | null;
  quoteConvention?: "asset_1_per_asset_0";
  routes?: {
    assetTerminal: string;
    marketBoard?: string;
    hero?: string;
    pool: string;
    swap: string;
    liquidity: string;
  };
  source?: string;

  pair_address: string;
  display_symbol: string;
  base_asset_id: string;
  quote_asset_id: string;
  asset_class: string | null;
  origin_chain: string | null;
  execution_chain: string | null;
  is_executable_on_spherio: boolean | null;
  price: number | null;
  liquidity_quote: number | null;
  volume_24h: number | null;
  txns_24h: number | null;
  age_seconds: number | null;
  is_live: boolean;
  is_canonical: boolean;
  promotion_status: string | null;
  market_cap: number | null;
  fully_diluted_value: number | null;
  last_trade_time: string | null;
  last_liquidity_time: string | null;
  factory_address: string | null;
};

type ScreenerAuthorityResponse = {
  ok: boolean;
  summary?: ScreenerSummary;
  rows?: ScreenerAuthorityRow[];
  generated_at?: string;
  error?: string;
};


type DiscoveryFilter =
  | "trending"
  | "new_pairs"
  | "liquidity"
  | "volume"
  | "activity"
  | "candidates"
  | "promoted";

type ClassFilter =
  | "all_classes"
  | "canonical"
  | "spherio_live"
  | "multichain"
  | "bridged"
  | "reference";

type StatusFilter =
  | "all_statuses"
  | "live"
  | "canonical"
  | "candidate"
  | "review"
  | "promoted"
  | "rioex";

type SideMode =
  | "watchlist"
  | "alerts"
  | "multicharts"
  | "new_pairs"
  | "gainers_losers"
  | null;

type RankingMode = "volume" | "liquidity" | "mcap" | "txns" | "new";
type TimeframeMode = "24h" | "5m" | "1h" | "6h";

type MarketRow = {
  pair: PairMeta;
  pairAddress: string;
  symbol: string;
  logo0: string | null;
  logo1: string | null;
  classLabel: "Canonical" | "Spherio Live" | "Multichain" | "Bridged" | "Reference";
  price: number;
  liquidityUsd: number;
  windowVolume: number;
  windowTxns: number;
  ageDays: number | null;
  lastActivity: string | null;
  mcap: number | null;
  changePct: number | null;
  statuses: Array<"Live" | "Canonical" | "Candidate" | "Review" | "Promoted" | "RioEx">;
  alertFlags: string[];
  feeBps: number | null;
  feePolicy: string | null;
  routes: {
    assetTerminal: string;
    marketBoard?: string;
    hero?: string;
    pool: string;
    swap: string;
    liquidity: string;
  };
  truthSource: "authoritative_registry" | "authoritative_screener";
  lastSwapRef: string | null;
};

function shell(
  tone: "hero" | "panel" | "subtle" | "magenta" | "amber" | "cyan" = "panel"
) {
  const tones = {
    hero:
      "border-white/10 bg-[linear-gradient(180deg,rgba(19,21,36,0.92),rgba(7,10,21,0.97))] shadow-[0_22px_80px_rgba(0,0,0,0.40)]",
    panel:
      "border-white/10 bg-white/[0.05] shadow-[0_16px_50px_rgba(0,0,0,0.32)]",
    subtle:
      "border-white/8 bg-white/[0.04] shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
    magenta:
      "border-fuchsia-400/15 bg-[linear-gradient(180deg,rgba(90,24,65,0.18),rgba(8,12,24,0.96))]",
    amber:
      "border-amber-400/15 bg-[linear-gradient(180deg,rgba(120,53,15,0.14),rgba(8,12,24,0.96))]",
    cyan:
      "border-cyan-400/15 bg-[linear-gradient(180deg,rgba(8,65,82,0.18),rgba(8,12,24,0.96))]",
  };

  return `rounded-[28px] border backdrop-blur-xl ${tones[tone]}`;
}

function formatNumber(n: number, d = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: d,
  }).format(Number.isFinite(n) ? n : 0);
}

function formatMoney(n: number, d = 0) {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: d,
  }).format(Number.isFinite(n) ? n : 0)}`;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 6,
  }).format(Number.isFinite(n) ? n : 0);
}

function shortAddr(v?: string | null, left = 10, right = 8) {
  if (!v) return "—";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}...${v.slice(-right)}`;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function fromBaseUnits(baseAmount?: string | number | null, decimals = 6) {
  const n = Number(baseAmount ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n / 10 ** decimals;
}

function ageDays(value?: string | null) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
}

function formatActivityTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function pairDisplayLabel(pair?: PairMeta | null) {
  if (!pair) return "—";
  return normalizePairLabel({
    displaySymbol: pair.display_symbol,
    asset0Id: pair.asset_0_id,
    asset1Id: pair.asset_1_id,
  });
}


function buildAuthoritativeSurfaceRoutes(
  pairAddress: string
): MarketRow["routes"] {
  const fallback = buildRioDexSurfaceHref(pairAddress);
  const encoded = encodeURIComponent(pairAddress);
  return {
    assetTerminal: `/rioex/markets/${encoded}`,
    marketBoard: "/rioex/markets",
    hero: "/rioex",
    pool: fallback.pool,
    swap: fallback.swap,
    liquidity: fallback.liquidity,
  };
}

function timeframeMs(mode: TimeframeMode) {
  if (mode === "5m") return 5 * 60 * 1000;
  if (mode === "1h") return 60 * 60 * 1000;
  if (mode === "6h") return 6 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const raw = await response.text();

  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Route returned non-JSON (${response.status})`);
  }

  if (!response.ok || (json && json.ok === false)) {
    throw new Error(json?.error || `Request failed: ${response.status}`);
  }

  return json as T;
}

function DropdownFilter<T extends string>({
  label,
  value,
  displayLabel,
  options,
  onChange,
}: {
  label: string;
  value: T;
  displayLabel?: string;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <details className="group relative z-40">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.10]">
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          {label}
        </span>
        {displayLabel ? <span className="text-white">{displayLabel}</span> : null}
        <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
      </summary>

      <div className="absolute left-0 top-[calc(100%+10px)] z-[90] min-w-[220px] rounded-2xl border border-white/10 bg-[#0d1220] p-2 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
              option.value === value
                ? "bg-white/[0.10] text-white"
                : "text-slate-300 hover:bg-white/[0.06]"
            }`}
          >
            <span>{option.label}</span>
            {option.value === value ? (
              <span className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">
                Active
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </details>
  );
}

function StatusPill({ label }: { label: string }) {
  const tone =
    label === "Live"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : label === "Canonical"
      ? "border-violet-400/20 bg-violet-500/10 text-violet-200"
      : label === "Promoted"
      ? "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200"
      : label === "Candidate"
      ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
      : label === "RioEx"
      ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
      : "border-white/10 bg-white/[0.06] text-slate-200";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.20em] ${tone}`}
    >
      {label}
    </span>
  );
}

function PairMarks({
  logo0,
  logo1,
  fallback0,
  fallback1,
}: {
  logo0: string | null;
  logo1: string | null;
  fallback0: string;
  fallback1: string;
}) {
  return (
    <div className="flex -space-x-2">
      {logo0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo0}
          alt={fallback0}
          className="h-8 w-8 rounded-full border border-white/10 bg-black/20 object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-semibold text-white">
          {fallback0.slice(0, 1)}
        </div>
      )}

      {logo1 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo1}
          alt={fallback1}
          className="h-8 w-8 rounded-full border border-white/10 bg-black/20 object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-semibold text-white">
          {fallback1.slice(0, 1)}
        </div>
      )}
    </div>
  );
}

function CompactStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.20em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default function RioDexMarketsPage() {
  const [screenerRows, setScreenerRows] = useState<ScreenerAuthorityRow[]>([]);
  const [screenerSummary, setScreenerSummary] = useState<ScreenerSummary | null>(null);
  const [registryMap, setRegistryMap] = useState(() => buildTokenRegistryMap([]));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [discovery, setDiscovery] = useState<DiscoveryFilter>("trending");
  const [classFilter, setClassFilter] = useState<ClassFilter>("all_classes");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all_statuses");
  const [sideMode, setSideMode] = useState<SideMode>(null);
  const [ranking, setRanking] = useState<RankingMode>("liquidity");
  const [timeframe, setTimeframe] = useState<TimeframeMode>("24h");
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setWatchlist(parsed.filter(Boolean));
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const screenerUrl = `/api/riodex/screener?timeframe=${encodeURIComponent(
          timeframe
        )}&rankBy=${encodeURIComponent(ranking)}&limit=500`;

        const screenerRes = await fetchJson<ScreenerAuthorityResponse>(screenerUrl);

        if (!active) return;

        const nextRows = screenerRes?.rows || [];
        setScreenerRows(nextRows);
        setScreenerSummary(screenerRes?.summary || null);

        const assetIds = Array.from(
          new Set(
            nextRows
              .flatMap((row) => [
                row.baseAssetId || row.base_asset_id || "",
                row.quoteAssetId || row.quote_asset_id || "",
              ])
              .filter(Boolean)
          )
        );

        const registryItems = assetIds.length
          ? await getRioDexTokenRegistryBatch(assetIds)
          : [];

        if (!active) return;

        setRegistryMap(buildTokenRegistryMap(registryItems));
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || "Failed to load screener state");
        setScreenerRows([]);
        setScreenerSummary(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [timeframe, ranking]);

  const rows = useMemo<MarketRow[]>(() => {
    return screenerRows.map((row) => {
      const pairAddress = row.pairAddress || row.pair_address;
      const displaySymbol = row.displaySymbol || row.display_symbol;
      const baseAssetId = row.baseAssetId || row.base_asset_id;
      const quoteAssetId = row.quoteAssetId || row.quote_asset_id;
      const isCanonical = row.isCanonical ?? row.is_canonical;
      const isLive = row.isLive ?? row.is_live;

      const pair: PairMeta = {
        pair_address: pairAddress,
        factory_address: row.factory_address ?? null,
        pair_key: pairAddress,
        display_symbol: displaySymbol,
        fee_bps: row.feeBps ?? null,
        is_canonical: isCanonical,
        is_live: isLive,
        created_time:
          row.age_seconds !== null && row.age_seconds !== undefined
            ? new Date(Date.now() - row.age_seconds * 1000).toISOString()
            : null,
        asset_0_id: baseAssetId,
        asset_1_id: quoteAssetId,
      };

      const pairLabel =
        displaySymbol ||
        (baseAssetId && quoteAssetId
          ? getRegistryPairLabel(registryMap, baseAssetId, quoteAssetId)
          : pairDisplayLabel(pair));

      const price = toNumber(row.price);
      const liquidityUsd = toNumber(row.liquidityUsd ?? row.liquidity_quote);
      const windowVolume = toNumber(row.volume_24h);
      const windowTxns = Math.max(0, Math.floor(toNumber(row.txns_24h)));
      const ageDays =
        row.age_seconds !== null && row.age_seconds !== undefined
          ? Math.max(0, Math.floor(Number(row.age_seconds) / 86400))
          : null;

      const classLabel: MarketRow["classLabel"] = isCanonical
        ? "Canonical"
        : "Spherio Live";

      const statuses: MarketRow["statuses"] = [];
      if (isLive) statuses.push("Live");
      if (isCanonical) statuses.push("Canonical");
      if (!isLive || liquidityUsd <= 0) statuses.push("Review");
      if ((row.promotion_status || "").toLowerCase() === "candidate") statuses.push("Candidate");
      if (["promoted", "rioex_listed"].includes((row.promotion_status || "").toLowerCase())) statuses.push("Promoted");
      if (statuses.includes("Candidate") || statuses.includes("Promoted") || isCanonical) {
        statuses.push("RioEx");
      }
      const uniqueStatuses = Array.from(new Set(statuses)) as MarketRow["statuses"];

      const alertFlags: string[] = [];
      if (!isLive) alertFlags.push("Not live");
      if (liquidityUsd <= 0) alertFlags.push("No indexed liquidity");
      if (windowVolume <= 0) alertFlags.push(`No ${timeframe} volume`);
      if (windowTxns <= 0) alertFlags.push(`No ${timeframe} activity`);
      if (ageDays !== null && ageDays <= 7) alertFlags.push("New pair");

      return {
        pair,
        pairAddress,
        symbol: pairLabel,
        logo0:
          row.baseLogoUrl ||
          (baseAssetId ? getRegistryLogoUrl(registryMap, baseAssetId) || null : null),
        logo1:
          row.quoteLogoUrl ||
          (quoteAssetId ? getRegistryLogoUrl(registryMap, quoteAssetId) || null : null),
        classLabel,
        price,
        liquidityUsd,
        windowVolume,
        windowTxns,
        ageDays,
        lastActivity:
          row.lastSwapTime ||
          row.last_trade_time ||
          row.last_liquidity_time ||
          null,
        mcap: row.market_cap !== null && row.market_cap !== undefined ? toNumber(row.market_cap) : null,
        changePct: null,
        statuses: uniqueStatuses,
        alertFlags,
        feeBps: row.feeBps ?? null,
        feePolicy: row.feePolicy ?? null,
        routes: row.routes ?? buildAuthoritativeSurfaceRoutes(pairAddress),
        truthSource: row.source === "rioex_pairs_registry_table" ? "authoritative_registry" : "authoritative_screener",
        lastSwapRef: row.lastSwapTxHash ?? null,
      };
    });
  }, [screenerRows, registryMap, timeframe]);

  const livePools =
    screenerSummary?.live_pools ??
    rows.filter((row) => row.statuses.includes("Live")).length;
  const canonicalCount =
    screenerSummary?.canonical_pools ??
    rows.filter((row) => row.statuses.includes("Canonical")).length;
  const volumeTotal =
    screenerSummary?.total_volume_24h ??
    rows.reduce((sum, row) => sum + row.windowVolume, 0);
  const txnsTotal =
    screenerSummary?.total_txns_24h ??
    rows.reduce((sum, row) => sum + row.windowTxns, 0);
  const candidateCount =
    screenerSummary?.candidate_count ??
    rows.filter((row) => row.statuses.includes("Candidate")).length;
  const promotedCount =
    screenerSummary?.promoted_count ??
    rows.filter((row) => row.statuses.includes("Promoted")).length;

  const filteredRows = useMemo(() => {
    let next = [...rows];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      next = next.filter((row) => {
        return (
          row.symbol.toLowerCase().includes(q) ||
          row.pairAddress.toLowerCase().includes(q) ||
          (row.pair.asset_0_id || "").toLowerCase().includes(q) ||
          (row.pair.asset_1_id || "").toLowerCase().includes(q)
        );
      });
    }

    if (classFilter !== "all_classes") {
      next = next.filter((row) => {
        if (classFilter === "canonical") return row.classLabel === "Canonical";
        if (classFilter === "spherio_live") return row.classLabel === "Spherio Live";
        if (classFilter === "reference") return row.classLabel === "Reference";
        if (classFilter === "multichain") return row.classLabel === "Multichain";
        if (classFilter === "bridged") return row.classLabel === "Bridged";
        return true;
      });
    }

    if (statusFilter !== "all_statuses") {
      next = next.filter((row) => {
        if (statusFilter === "live") return row.statuses.includes("Live");
        if (statusFilter === "canonical") return row.statuses.includes("Canonical");
        if (statusFilter === "candidate") return row.statuses.includes("Candidate");
        if (statusFilter === "review") return row.statuses.includes("Review");
        if (statusFilter === "promoted") return row.statuses.includes("Promoted");
        if (statusFilter === "rioex") return row.statuses.includes("RioEx");
        return true;
      });
    }

    if (discovery === "candidates") {
      next = next.filter((row) => row.statuses.includes("Candidate"));
    } else if (discovery === "promoted") {
      next = next.filter((row) => row.statuses.includes("Promoted"));
    } else if (discovery === "new_pairs") {
      next = next.filter((row) => row.ageDays !== null && row.ageDays <= 7);
    }

    if (sideMode === "watchlist") {
      next = next.filter((row) => watchlist.includes(row.pairAddress));
    }

    if (sideMode === "alerts") {
      next = next.filter((row) => row.alertFlags.length > 0);
    }

    if (sideMode === "new_pairs") {
      next = next.filter((row) => row.ageDays !== null && row.ageDays <= 7);
    }

    const sortMode =
      sideMode === "new_pairs"
        ? "new"
        : sideMode === "gainers_losers"
        ? "mcap"
        : sideMode === "multicharts"
        ? "volume"
        : discovery === "new_pairs"
        ? "new"
        : discovery === "liquidity"
        ? "liquidity"
        : discovery === "volume"
        ? "volume"
        : discovery === "activity"
        ? "txns"
        : discovery === "trending"
        ? "liquidity"
        : ranking;

    next.sort((a, b) => {
      if (sideMode === "gainers_losers") {
        return Math.abs(b.changePct || 0) - Math.abs(a.changePct || 0);
      }
      if (sortMode === "liquidity") return b.liquidityUsd - a.liquidityUsd;
      if (sortMode === "volume") return b.windowVolume - a.windowVolume;
      if (sortMode === "txns") return b.windowTxns - a.windowTxns;
      if (sortMode === "mcap") return (b.mcap || 0) - (a.mcap || 0);
      if (sortMode === "new") {
        return (a.ageDays ?? Number.MAX_SAFE_INTEGER) - (b.ageDays ?? Number.MAX_SAFE_INTEGER);
      }
      return 0;
    });

    return next;
  }, [rows, query, classFilter, statusFilter, discovery, sideMode, ranking, watchlist]);

  function toggleWatchlist(pairAddress: string) {
    setWatchlist((current) =>
      current.includes(pairAddress)
        ? current.filter((item) => item !== pairAddress)
        : [...current, pairAddress]
    );
  }

  const discoveryLabelMap: Record<DiscoveryFilter, string> = {
    trending: "Trending",
    new_pairs: "New Pairs",
    liquidity: "Liquidity",
    volume: "Volume",
    activity: "Activity",
    candidates: "Candidates",
    promoted: "Promoted",
  };

  const featured = filteredRows[0]
    ? {
        displaySymbol: filteredRows[0].symbol,
        liquidityUsd: filteredRows[0].liquidityUsd,
        feeBps: filteredRows[0].feeBps,
        isCanonical: filteredRows[0].statuses.includes("Canonical"),
        isLive: filteredRows[0].statuses.includes("Live"),
        routes: filteredRows[0].routes,
      }
    : null;

  const screenerFootnote =
    "RioDex Screener now consumes the canonical market fields directly from /api/riodex/screener. Compatibility fields remain in the backend only to avoid breaking the larger UI migration while every surface moves to the same authoritative market language.";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_15%_10%,rgba(164,114,255,0.22),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(255,205,127,0.10),transparent_18%),linear-gradient(180deg,#06070E_0%,#090B12_44%,#05070D_100%)] text-white">
      <div className="mx-auto max-w-[1540px] px-6 pb-12 pt-8">
        <ExchangeSurfaceNav
          product="riodex"
          activeKey="screener"
          featured={featured}
          title="RioDex Screener"
          subtitle="Execution discovery surface for Spherio market objects. Screener belongs to RioDex and now consumes canonical pair identity, liquidity, fee policy, live status, and routes directly from the authoritative Screener contract."
        />

        <div className="grid gap-6 xl:grid-cols-[0.32fr_1fr]">
          <aside className={`${shell("panel")} p-4`}>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.30em] text-slate-400">
              Operator Rail
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setSideMode(sideMode === "watchlist" ? null : "watchlist")}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  sideMode === "watchlist"
                    ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
                }`}
              >
                <Star className="h-4 w-4" />
                <span>Watchlist</span>
              </button>

              <button
                type="button"
                onClick={() => setSideMode(sideMode === "alerts" ? null : "alerts")}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  sideMode === "alerts"
                    ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
                    : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
                }`}
              >
                <Bell className="h-4 w-4" />
                <span>Alerts</span>
              </button>

              <button
                type="button"
                onClick={() => setSideMode(sideMode === "multicharts" ? null : "multicharts")}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  sideMode === "multicharts"
                    ? "border-violet-400/20 bg-violet-400/10 text-violet-100"
                    : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
                }`}
              >
                <CandlestickChart className="h-4 w-4" />
                <span>Multicharts</span>
              </button>

              <button
                type="button"
                onClick={() => setSideMode(sideMode === "new_pairs" ? null : "new_pairs")}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  sideMode === "new_pairs"
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>New Pairs</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSideMode(sideMode === "gainers_losers" ? null : "gainers_losers")
                }
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  sideMode === "gainers_losers"
                    ? "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100"
                    : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Gainers &amp; Losers</span>
              </button>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="text-[11px] uppercase tracking-[0.20em] text-slate-500">
                Watchlist
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                {watchlist.length
                  ? `${watchlist.length} tracked pool${watchlist.length === 1 ? "" : "s"} saved on this device.`
                  : "No tracked pools yet. Star any row below to populate your watchlist."}
              </div>
            </div>
          </aside>

          <main>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[12px] font-extrabold uppercase tracking-[0.34em] text-slate-300">
                  RioDex Screener
                </div>
                <h1 className="mt-2 text-5xl font-semibold tracking-tight text-white">
                  Discovery &amp; Qualification Terminal
                </h1>
                <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-300">
                  Institutional discovery surface for Spherio market objects.
                  Identity, liquidity, activity, and routing resolve from indexer
                  truth and token-registry truth.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={RIODEX_HOME_ROUTE}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.10]"
                >
                  Back to RioDex
                </Link>
                <Link
                  href={RIODEX_SWAP_ROUTE}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.10]"
                >
                  Swap
                </Link>
                <Link
                  href={RIODEX_LIQUIDITY_ROUTE}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.10]"
                >
                  Liquidity
                </Link>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                {error}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.45fr_0.7fr]">
              <div className={`${shell("hero")} relative z-30 overflow-visible p-4`}>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                  Search &amp; Filters
                </div>

                <div className="mt-4 relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search pool, asset, address"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-4 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <DropdownFilter
                    label="DISCOVERY"
                    value={discovery}
                    displayLabel={discoveryLabelMap[discovery]}
                    options={[
                      { value: "trending", label: "Trending" },
                      { value: "new_pairs", label: "New Pairs" },
                      { value: "liquidity", label: "Liquidity" },
                      { value: "volume", label: "Volume" },
                      { value: "activity", label: "Activity" },
                      { value: "candidates", label: "Candidates" },
                      { value: "promoted", label: "Promoted" },
                    ]}
                    onChange={setDiscovery}
                  />

                  <DropdownFilter
                    label="CLASS"
                    value={classFilter}
                    options={[
                      { value: "all_classes", label: "All Classes" },
                      { value: "canonical", label: "Canonical" },
                      { value: "spherio_live", label: "Spherio Live" },
                      { value: "multichain", label: "Multichain" },
                      { value: "bridged", label: "Bridged" },
                      { value: "reference", label: "Reference" },
                    ]}
                    onChange={setClassFilter}
                  />

                  <DropdownFilter
                    label="STATUS"
                    value={statusFilter}
                    options={[
                      { value: "all_statuses", label: "All Statuses" },
                      { value: "live", label: "Live" },
                      { value: "canonical", label: "Canonical" },
                      { value: "candidate", label: "Candidate" },
                      { value: "review", label: "Review" },
                      { value: "promoted", label: "Promoted" },
                      { value: "rioex", label: "RioEx" },
                    ]}
                    onChange={setStatusFilter}
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  <CompactStat label="Live Pools" value={String(livePools)} />
                  <CompactStat label="Canonical" value={String(canonicalCount)} />
                  <CompactStat
                    label={`${timeframe.toUpperCase()} Volume`}
                    value={volumeTotal > 0 ? formatMoney(volumeTotal) : "—"}
                  />
                  <CompactStat label={`${timeframe.toUpperCase()} Txns`} value={String(txnsTotal)} />
                  <CompactStat label="Candidates" value={String(candidateCount)} />
                  <CompactStat label="Promoted" value={String(promotedCount)} />
                </div>
              </div>

              <div className={`${shell("amber")} p-4`}>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                  Institutional Routing
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-200">
                    Live Spherio pools route into{" "}
                    <span className="font-semibold text-white">Swap</span>,{" "}
                    <span className="font-semibold text-white">Liquidity</span>, and{" "}
                    <span className="font-semibold text-white">Pool</span>.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-200">
                    Candidate and promoted assets from the qualification handshake route
                    into <span className="font-semibold text-white">RioEx</span>.
                  </div>
                </div>
              </div>
            </div>

            <section className={`${shell("panel")} mt-5 p-4`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {(["24h", "5m", "1h", "6h"] as TimeframeMode[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTimeframe(option)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        timeframe === option
                          ? "border-white/20 bg-white text-black"
                          : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.10]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {([
                    ["volume", "Rank by Volume"],
                    ["liquidity", "Rank by Liquidity"],
                    ["mcap", "Rank by MCap"],
                    ["txns", "Rank by TXNS"],
                    ["new", "Rank by New"],
                  ] as Array<[RankingMode, string]>).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setRanking(mode)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        ranking === mode
                          ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                          : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.10]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-2xl font-semibold text-white">Market Objects</div>
                <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-300">
                  {filteredRows.length} rows
                </div>
              </div>

              {loading ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-slate-300">
                  Loading screener rows...
                </div>
              ) : !filteredRows.length ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-slate-300">
                  No market objects match the active filters.
                </div>
              ) : (
                <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20">
                  <div className="hidden grid-cols-[2.3fr_1fr_1fr_0.85fr_1fr_0.85fr_0.75fr_1.05fr_1.05fr] gap-4 border-b border-white/10 px-5 py-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400 lg:grid">
                    <div>Token</div>
                    <div>Class</div>
                    <div>MCap</div>
                    <div>Price</div>
                    <div>Liquidity</div>
                    <div>Volume</div>
                    <div>Txns</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>

                  <div className="divide-y divide-white/8">
                    {filteredRows.map((row) => {
                      const [left = "A", right = "B"] = row.symbol
                        .split("/")
                        .map((v) => v.trim());
                      const isWatched = watchlist.includes(row.pairAddress);
                      const poolHref = row.routes.pool;
                      const swapHref = row.routes.swap;
                      const liquidityHref = row.routes.liquidity;

                      return (
                        <div key={row.pairAddress} className="px-5 py-5">
                          <div className="hidden items-center gap-3 lg:grid lg:grid-cols-[2.3fr_1fr_1fr_0.85fr_1fr_0.85fr_0.75fr_1.05fr_1.05fr]">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => toggleWatchlist(row.pairAddress)}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                                  isWatched
                                    ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
                                    : "border-white/10 bg-white/[0.05] text-slate-400 hover:bg-white/[0.10]"
                                }`}
                              >
                                <Star className="h-4 w-4" />
                              </button>

                              <Link href={poolHref} className="flex items-center gap-3 min-w-0">
                                <PairMarks
                                  logo0={row.logo0}
                                  logo1={row.logo1}
                                  fallback0={left}
                                  fallback1={right}
                                />

                                <div className="min-w-0">
                                  <div className="truncate text-lg font-semibold text-white">
                                    {row.symbol}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400">
                                    {shortAddr(row.pairAddress, 12, 8)}
                                  </div>
                                  <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-cyan-200/80">
                                    {row.truthSource === "authoritative_registry"
                                      ? "Authoritative Registry"
                                      : "Authoritative Screener"}
                                  </div>
                                </div>
                              </Link>
                            </div>

                            <div>
                              <StatusPill label={row.classLabel} />
                            </div>

                            <div className="text-sm text-white">
                              {row.mcap !== null ? formatMoney(row.mcap, 0) : "—"}
                            </div>

                            <div className="text-sm text-white">{formatPrice(row.price)}</div>

                            <div className="text-sm text-white">
                              {formatMoney(row.liquidityUsd, 0)}
                            </div>

                            <div className="text-sm text-white">
                              {row.windowVolume > 0 ? formatMoney(row.windowVolume, 0) : "$0"}
                            </div>

                            <div className="text-sm text-white">{row.windowTxns}</div>

                            <div>
                              <details className="group relative z-40">
                                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.10]">
                                  <span>Status</span>
                                  <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
                                </summary>
                                <div className="absolute right-0 top-[calc(100%+10px)] z-[95] min-w-[220px] rounded-2xl border border-white/10 bg-[#0d1220] p-3 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                  <div className="flex flex-wrap gap-2">
                                    {row.statuses.map((status) => (
                                      <StatusPill key={status} label={status} />
                                    ))}
                                  </div>
                                  {row.alertFlags.length ? (
                                    <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100">
                                      {row.alertFlags.join(" • ")}
                                    </div>
                                  ) : null}
                                </div>
                              </details>
                            </div>

                            <div>
                              <details className="group relative z-40">
                                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.10]">
                                  <span>Actions</span>
                                  <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
                                </summary>
                                <div className="absolute right-0 top-[calc(100%+10px)] z-[95] min-w-[220px] rounded-2xl border border-white/10 bg-[#0d1220] p-2 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                  <Link
                                    href={swapHref}
                                    className="block rounded-xl px-3 py-2 text-sm text-white transition hover:bg-white/[0.06]"
                                  >
                                    Swap
                                  </Link>
                                  <Link
                                    href={liquidityHref}
                                    className="block rounded-xl px-3 py-2 text-sm text-white transition hover:bg-white/[0.06]"
                                  >
                                    Liquidity
                                  </Link>
                                  <Link
                                    href={poolHref}
                                    className="block rounded-xl px-3 py-2 text-sm text-white transition hover:bg-white/[0.06]"
                                  >
                                    Pool
                                  </Link>
                                  <Link
                                    href="/rioex"
                                    className="block rounded-xl px-3 py-2 text-sm text-white transition hover:bg-white/[0.06]"
                                  >
                                    RioEx
                                  </Link>
                                </div>
                              </details>
                            </div>
                          </div>

                          <div className="space-y-4 lg:hidden">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => toggleWatchlist(row.pairAddress)}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                                  isWatched
                                    ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
                                    : "border-white/10 bg-white/[0.05] text-slate-400 hover:bg-white/[0.10]"
                                }`}
                              >
                                <Star className="h-4 w-4" />
                              </button>

                              <Link href={poolHref} className="flex items-center gap-3 min-w-0">
                                <PairMarks
                                  logo0={row.logo0}
                                  logo1={row.logo1}
                                  fallback0={left}
                                  fallback1={right}
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-xl font-semibold text-white">
                                    {row.symbol}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400">
                                    {shortAddr(row.pairAddress, 12, 8)}
                                  </div>
                                </div>
                              </Link>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className={`${shell("subtle")} p-4`}>
                                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                  Price
                                </div>
                                <div className="mt-2 text-lg font-semibold text-white">
                                  {formatPrice(row.price)}
                                </div>
                              </div>
                              <div className={`${shell("subtle")} p-4`}>
                                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                  Liquidity
                                </div>
                                <div className="mt-2 text-lg font-semibold text-white">
                                  {formatMoney(row.liquidityUsd, 0)}
                                </div>
                              </div>
                              <div className={`${shell("subtle")} p-4`}>
                                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                  Volume
                                </div>
                                <div className="mt-2 text-lg font-semibold text-white">
                                  {row.windowVolume > 0 ? formatMoney(row.windowVolume, 0) : "$0"}
                                </div>
                              </div>
                              <div className={`${shell("subtle")} p-4`}>
                                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                  Txns
                                </div>
                                <div className="mt-2 text-lg font-semibold text-white">
                                  {row.windowTxns}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {row.statuses.map((status) => (
                                <StatusPill key={status} label={status} />
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={swapHref}
                                className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/12 px-3 py-1.5 text-xs font-semibold text-fuchsia-100"
                              >
                                Swap
                              </Link>
                              <Link
                                href={liquidityHref}
                                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"
                              >
                                Liquidity
                              </Link>
                              <Link
                                href={poolHref}
                                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Pool
                              </Link>
                            </div>
                          </div>

                          {sideMode === "multicharts" ? (
                            <div className="mt-4 grid gap-3 md:grid-cols-4">
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                  Age
                                </div>
                                <div className="mt-2 text-sm font-semibold text-white">
                                  {row.ageDays !== null ? `${row.ageDays}d` : "—"}
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                  Last Activity
                                </div>
                                <div className="mt-2 text-sm font-semibold text-white">
                                  {formatActivityTime(row.lastActivity)}
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                  Alerts
                                </div>
                                <div className="mt-2 text-sm font-semibold text-white">
                                  {row.alertFlags.length || 0}
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                  Move
                                </div>
                                <div className="mt-2 text-sm font-semibold text-white">
                                  {row.changePct !== null ? `${formatNumber(row.changePct, 2)}%` : "—"}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-white/8 px-5 py-4 text-sm text-slate-400">
                    {screenerFootnote}
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
