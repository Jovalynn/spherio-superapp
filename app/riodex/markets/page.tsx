"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronDown,
  ExternalLink,
  Flame,
  Layers3,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import {
  buildTokenRegistryMap,
  getRioDexTokenRegistryBatch,
  getRegistryLogoUrl,
  getRegistryPairLabel,
} from "@/lib/riodex/token-registry";
import {
  buildRioDexSurfaceHref,
  RIODEX_HOME_ROUTE,
  RIODEX_LIQUIDITY_ROUTE,
  RIODEX_SWAP_ROUTE,
} from "@/lib/riodex/routes";

const WATCHLIST_STORAGE_KEY = "riodex:screener:watchlist";

type TimeframeMode = "5m" | "1h" | "6h" | "24h";
type RankingMode = "volume" | "liquidity" | "txns" | "new" | "mcap";
type OriginFilter =
  | "all"
  | "pump"
  | "prime"
  | "spo20"
  | "native"
  | "stable"
  | "bridged"
  | "reference";
type ReadinessFilter =
  | "all"
  | "route_ready"
  | "trade_ready"
  | "awaiting_quote"
  | "reserves_indexed"
  | "awaiting_snapshots"
  | "no_liquidity";
type SideMode = "quick_swap" | "watchlist" | "alerts" | "new_markets" | null;
type TradeSide = "buy" | "sell";

type OperatorItem = {
  mode: Exclude<SideMode, null>;
  label: string;
  Icon: typeof BarChart3;
};

const OPERATOR_ITEMS: OperatorItem[] = [
  { mode: "quick_swap", label: "Quick Swap", Icon: BarChart3 },
  { mode: "watchlist", label: "Watchlist", Icon: Star },
  { mode: "alerts", label: "Alerts", Icon: Bell },
  { mode: "new_markets", label: "New Markets", Icon: Flame },
];

type ScreenerSummary = {
  live_pools?: number;
  canonical_pools?: number;
  total_volume_24h?: number | null;
  total_txns_24h?: number | null;
  candidate_count?: number;
  promoted_count?: number;
  livePools?: number;
  canonical?: number;
  volume24h?: number | null;
  txns24h?: number | null;
  candidates?: number;
  promoted?: number;
};

type ScreenerAuthorityRow = {
  rank?: number;
  pairAddress?: string;
  pair_address?: string;
  pairKey?: string;
  pair_key?: string;
  displaySymbol?: string;
  display_symbol?: string;
  canonicalSymbol?: string;
  canonical_symbol?: string;
  baseAssetId?: string;
  base_asset_id?: string;
  quoteAssetId?: string;
  quote_asset_id?: string;
  baseSymbol?: string | null;
  quoteSymbol?: string | null;
  baseDisplayName?: string | null;
  quoteDisplayName?: string | null;
  baseLogoUrl?: string | null;
  quoteLogoUrl?: string | null;
  baseAssetType?: string | null;
  quoteAssetType?: string | null;
  asset_0_type?: string | null;
  asset_1_type?: string | null;
  asset_class?: string | null;
  origin_chain?: string | null;
  execution_chain?: string | null;
  feeBps?: number | null;
  fee_bps?: number | null;
  feePolicy?: string | null;
  feeRecipientAddress?: string | null;
  isCanonical?: boolean;
  is_canonical?: boolean;
  isLive?: boolean;
  is_live?: boolean;
  liquidityUsd?: number | null;
  liquidity_usd?: number | null;
  liquidity_quote?: number | null;
  liquidityStatus?: string | null;
  liquidity_status?: string | null;
  liquidityLabel?: string | null;
  liquidity_label?: string | null;
  reserveLabel?: string | null;
  reserve_label?: string | null;
  reserve0Amount?: string | null;
  reserve_0_amount?: string | null;
  reserve1Amount?: string | null;
  reserve_1_amount?: string | null;
  liquidityHeight?: string | number | null;
  liquidity_height?: string | number | null;
  liquidityTime?: string | null;
  liquidity_time?: string | null;
  liquidityUpdatedAt?: string | null;
  liquiditySource?: string | null;
  volume24h?: number | null;
  volume_24h?: number | null;
  volumeStatus?: string | null;
  volume_status?: string | null;
  txns24h?: number | null;
  txns_24h?: number | null;
  txnsStatus?: string | null;
  txns_status?: string | null;
  price?: number | null;
  market_cap?: number | null;
  fully_diluted_value?: number | null;
  fdv_reference_value?: string | number | null;
  fdvReferenceValue?: string | number | null;
  fdv_reference_asset?: string | null;
  fdvReferenceAsset?: string | null;
  fdv_reference_source?: string | null;
  fdvReferenceSource?: string | null;
  price_change_5m?: string | number | null;
  priceChange5m?: string | number | null;
  price_change_1h?: string | number | null;
  priceChange1h?: string | number | null;
  price_change_6h?: string | number | null;
  priceChange6h?: string | number | null;
  price_change_24h?: string | number | null;
  priceChange24h?: string | number | null;
  price_change_source?: string | null;
  priceChangeSource?: string | null;
  trend_status?: string | null;
  trendStatus?: string | null;
  age_seconds?: number | null;
  createdHeight?: string | number | null;
  created_height?: string | number | null;
  lastSyncedHeight?: string | number | null;
  last_synced_height?: string | number | null;
  lastSwapTime?: string | null;
  last_trade_time?: string | null;
  lastSwapTxHash?: string | null;
  status?: string | null;
  class?: string | null;
  promotion_status?: string | null;
  source?: string | null;
  origin?: string | null;
  assetOrigin?: string | null;
  asset_origin?: string | null;
  launchSource?: string | null;
  launch_source?: string | null;
  launchRail?: string | null;
  launch_rail?: string | null;
  routeSource?: string | null;
  route_source?: string | null;
  routes?: {
    assetTerminal?: string;
    marketBoard?: string;
    hero?: string;
    trade?: string;
    pool?: string;
    swap?: string;
    liquidity?: string;
    explorer?: string;
  };
};

type ScreenerAuthorityResponse = {
  ok: boolean;
  warning?: string;
  source?: string;
  summary?: ScreenerSummary;
  stats?: ScreenerSummary;
  rows?: ScreenerAuthorityRow[];
  items?: ScreenerAuthorityRow[];
  pairs?: ScreenerAuthorityRow[];
  markets?: ScreenerAuthorityRow[];
  generated_at?: string;
  error?: string;
};

type MarketOrigin =
  | "PUMP.live"
  | "Prime"
  | "SPO-20"
  | "Native"
  | "Stable"
  | "Bridged"
  | "Reference";

type MarketReadiness =
  | "Route Ready"
  | "Trade Ready"
  | "Awaiting Quote"
  | "Reserves Indexed"
  | "Awaiting Snapshots"
  | "No Liquidity"
  | "Pair Indexed";

type MarketRow = {
  rank: number;
  pairAddress: string;
  pairKey: string | null;
  displaySymbol: string;
  canonicalSymbol: string;
  baseAssetId: string;
  quoteAssetId: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseLogoUrl: string | null;
  quoteLogoUrl: string | null;
  baseAssetType: string | null;
  quoteAssetType: string | null;
  origin: MarketOrigin;
  readiness: MarketReadiness;
  readinessDetail: string;
  sourceDetail: string;
  price: number | null;
  priceLabel: string;
  marketCap: number | null;
  marketCapLabel: string;
  fullyDilutedValue: number | null;
  fdvLabel: string;
  fdvReferenceValue: number | null;
  fdvReferenceAsset: string | null;
  fdvReferenceLabel: string;
  priceMoveLabel: string;
  priceMoveSource: string | null;
  trendStatus: string | null;
  trendLabel: string;
  liquidityUsd: number | null;
  liquidityLabel: string;
  reserveLabel: string | null;
  volume24h: number | null;
  volumeLabel: string;
  txns24h: number | null;
  txnsLabel: string;
  ageLabel: string;
  isLive: boolean;
  isCanonical: boolean;
  feeBps: number | null;
  alertFlags: string[];
  routes: {
    assetTerminal: string;
    marketBoard: string;
    hero: string;
    trade: string;
    pool: string;
    swap: string;
    liquidity: string;
    explorer: string;
  };
  canQuickSwap: boolean;
  truthSource: string;
  raw: ScreenerAuthorityRow;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function panel(extra = "") {
  return `rounded-[22px] border border-white/10 bg-[#11131b]/92 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl ${extra}`;
}

function softPanel(extra = "") {
  return `rounded-[18px] border border-white/10 bg-white/[0.045] ${extra}`;
}

function compactNumber(value: number | null | undefined, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`;
  return value.toFixed(abs >= 1 ? decimals : 6).replace(/\.0+$/, "");
}

function money(value: number | null | undefined, decimals = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `$${compactNumber(value, decimals)}`;
}

function priceLabel(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return "Awaiting quote";
  }
  if (value < 0.000001) return value.toExponential(3);
  return `$${compactNumber(value, value >= 1 ? 4 : 8)}`;
}

function fdvReferenceLabel(value: number | null, asset: string | null) {
  if (value === null || !asset) return "Pending";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${asset}`;
}

function trendLabel(status: string | null) {
  if (status === "active_24h") return "Active 24h";
  if (status === "dormant") return "Dormant";
  if (status === "liquidity_seeded_untraded") return "Seeded / Untraded";
  if (status === "unpriced") return "Unpriced";
  return "Trend pending";
}

function priceMoveLabelFromSource(source: string | null) {
  if (source === "insufficient_recent_swap_history") return "Pending";
  if (source === "active_recent_window_pending_price_baseline") return "Baseline pending";
  return "Pending";
}

function shortAddr(value?: string | null, left = 8, right = 6) {
  if (!value) return "—";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const v = text(value);
    if (v) return v;
  }
  return "";
}

function ageLabelFromSeconds(seconds?: number | null) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "—";
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / (86400 * 30))}mo`;
}

function isRioSymbol(symbol?: string | null) {
  return ["RIO", "URIO"].includes(text(symbol).toUpperCase());
}

function isStableSymbol(symbol?: string | null) {
  return ["RUSD", "USDT", "USDC", "DAI"].includes(text(symbol).toUpperCase());
}

function isPricingSymbol(symbol?: string | null) {
  return isRioSymbol(symbol) || isStableSymbol(symbol);
}

function preferredPairLabel(baseSymbol: string, quoteSymbol: string, fallback: string) {
  const base = text(baseSymbol) || "BASE";
  const quote = text(quoteSymbol) || "QUOTE";

  // Keep the chain reference market familiar and monetary: RIO / RUSD.
  if (isRioSymbol(base) && isStableSymbol(quote)) return `${base} / ${quote}`;
  if (isRioSymbol(quote) && isStableSymbol(base)) return `${quote} / ${base}`;

  // For launched/asset markets, show the discovered asset first and the pricing asset second.
  if (isPricingSymbol(base) && !isPricingSymbol(quote)) return `${quote} / ${base}`;
  if (!isPricingSymbol(base) && isPricingSymbol(quote)) return `${base} / ${quote}`;

  return fallback || `${base} / ${quote}`;
}



function parsePairSymbols(label?: string | null): { left: string; right: string } | null {
  const raw = text(label).replace(/\s+/g, " ");
  const parts = raw.includes("/") ? raw.split("/").map((v) => v.trim()).filter(Boolean) : [];
  if (parts.length >= 2) return { left: parts[0], right: parts[1] };
  return null;
}

function fallbackSymbolFromAssetId(assetId: string, parsed?: string) {
  if (assetId === "urio") return "RIO";
  if (parsed) return parsed;
  if (!assetId) return "ASSET";
  // Contract addresses are not symbols. Keep them short and visibly address-like only as a last resort.
  return `${assetId.slice(0, 6).toUpperCase()}…`;
}

function marketAssetSymbol(row?: MarketRow | null) {
  if (!row) return "TOKEN";
  if (isPricingSymbol(row.baseSymbol) && !isPricingSymbol(row.quoteSymbol)) return row.quoteSymbol;
  if (!isPricingSymbol(row.baseSymbol) && isPricingSymbol(row.quoteSymbol)) return row.baseSymbol;
  if (isRioSymbol(row.baseSymbol) && isStableSymbol(row.quoteSymbol)) return row.baseSymbol;
  return row.baseSymbol || row.quoteSymbol || "TOKEN";
}

function pricingAssetSymbol(row?: MarketRow | null) {
  if (!row) return "RIO";
  if (isPricingSymbol(row.baseSymbol) && !isPricingSymbol(row.quoteSymbol)) return row.baseSymbol;
  if (!isPricingSymbol(row.baseSymbol) && isPricingSymbol(row.quoteSymbol)) return row.quoteSymbol;
  if (isRioSymbol(row.baseSymbol) && isStableSymbol(row.quoteSymbol)) return row.quoteSymbol;
  return row.quoteSymbol || row.baseSymbol || "RIO";
}

function buildRoutes(row: ScreenerAuthorityRow, pairAddress: string): MarketRow["routes"] {
  const fallback = buildRioDexSurfaceHref(pairAddress);
  const encoded = encodeURIComponent(pairAddress);
  return {
    assetTerminal: row.routes?.assetTerminal || `/rioex/markets/${encoded}`,
    marketBoard: row.routes?.marketBoard || "/rioex",
    hero: row.routes?.hero || "/rioex",
    trade: row.routes?.trade || row.routes?.swap || fallback.swap,
    pool: row.routes?.pool || fallback.pool,
    swap: row.routes?.swap || fallback.swap,
    liquidity: row.routes?.liquidity || fallback.liquidity,
    explorer: row.routes?.explorer || `/rioexplorer/markets/${encoded}`,
  };
}

function inferOrigin(row: ScreenerAuthorityRow, baseSymbol: string, quoteSymbol: string): MarketOrigin {
  const explicitOrigin = firstText(
    row.launchSource,
    row.launch_source,
    row.launchRail,
    row.launch_rail,
    row.assetOrigin,
    row.asset_origin,
    row.origin,
    row.routeSource,
    row.route_source,
    row.asset_class,
  ).toLowerCase();

  if (explicitOrigin.includes("pump")) return "PUMP.live";
  if (explicitOrigin.includes("prime")) return "Prime";
  if (explicitOrigin.includes("bridge") || explicitOrigin.includes("ibc") || explicitOrigin.includes("axelar") || explicitOrigin.includes("hyperlane")) return "Bridged";
  if (explicitOrigin.includes("oracle") || explicitOrigin.includes("reference") || explicitOrigin.includes("offchain") || explicitOrigin.includes("off-chain") || explicitOrigin.includes("rwa")) return "Reference";
  if (explicitOrigin.includes("native")) return "Native";
  if (explicitOrigin.includes("stable")) return "Stable";
  if (explicitOrigin.includes("spo") || explicitOrigin.includes("token")) return "SPO-20";

  const haystack = [
    row.source,
    row.class,
    row.promotion_status,
    row.displaySymbol,
    row.display_symbol,
    row.canonicalSymbol,
    row.canonical_symbol,
    row.baseAssetType,
    row.quoteAssetType,
    row.asset_0_type,
    row.asset_1_type,
    row.origin_chain,
    row.execution_chain,
    baseSymbol,
    quoteSymbol,
  ]
    .map((v) => text(v).toLowerCase())
    .join(" ");

  if (haystack.includes("pump")) return "PUMP.live";
  if (haystack.includes("prime")) return "Prime";
  if (haystack.includes("bridge") || haystack.includes("ibc") || haystack.includes("axelar") || haystack.includes("hyperlane")) return "Bridged";
  if (haystack.includes("oracle") || haystack.includes("reference") || haystack.includes("offchain") || haystack.includes("off-chain") || haystack.includes("rwa")) return "Reference";
  if ([baseSymbol, quoteSymbol].some((s) => isStableSymbol(s))) return "Stable";
  if ([baseSymbol, quoteSymbol].some((s) => isRioSymbol(s))) {
    const other = [baseSymbol, quoteSymbol].find((s) => !isRioSymbol(s)) || "";
    if (!other || isStableSymbol(other)) return "Native";
  }
  if (haystack.includes("spo") || haystack.includes("token")) return "SPO-20";
  if (haystack.includes("native")) return "Native";
  return "SPO-20";
}

function inferReadiness(row: ScreenerAuthorityRow, price: number | null, volume: number | null, txns: number | null): {
  readiness: MarketReadiness;
  detail: string;
  canQuickSwap: boolean;
} {
  const liquidityStatus = firstText(row.liquidityStatus, row.liquidity_status).toLowerCase();
  const volumeStatus = firstText(row.volumeStatus, row.volume_status).toLowerCase();
  const txnsStatus = firstText(row.txnsStatus, row.txns_status).toLowerCase();
  const reserveLabel = firstText(row.reserveLabel, row.reserve_label);
  const reserve0 = toNumber(row.reserve0Amount ?? row.reserve_0_amount);
  const reserve1 = toNumber(row.reserve1Amount ?? row.reserve_1_amount);
  const isLive = Boolean(row.isLive ?? row.is_live);

  const hasIndexedReserves =
    reserveLabel.length > 0 ||
    liquidityStatus === "seeded_unpriced" ||
    liquidityStatus.includes("reserve") ||
    (
      reserve0 !== null &&
      reserve1 !== null &&
      reserve0 > 0 &&
      reserve1 > 0
    );

  if (!isLive) {
    return {
      readiness: "Pair Indexed",
      detail: "Pair exists but is not marked live",
      canQuickSwap: false,
    };
  }

  if (liquidityStatus === "no_indexed_liquidity") {
    return {
      readiness: "No Liquidity",
      detail: "No indexed reserves",
      canQuickSwap: false,
    };
  }

  /*
    Source-of-truth product rule:
    Pair live + indexed reserves = Route Ready.
    Snapshots/candles/24h analytics are not required for swap routing.
  */
  if (hasIndexedReserves) {
    if (price && price > 0 && ((volume && volume > 0) || (txns && txns > 0))) {
      return {
        readiness: "Trade Ready",
        detail: "Quote and market activity indexed",
        canQuickSwap: true,
      };
    }

    if (volumeStatus === "pending_snapshots" || txnsStatus === "pending_snapshots") {
      return {
        readiness: "Route Ready",
        detail: "Seeded reserves indexed; analytics snapshots pending",
        canQuickSwap: true,
      };
    }

    return {
      readiness: "Route Ready",
      detail: "Seeded reserves indexed; quote route available",
      canQuickSwap: true,
    };
  }

  if (price && price > 0) {
    return {
      readiness: "Trade Ready",
      detail: "Quote available",
      canQuickSwap: true,
    };
  }

  return {
    readiness: "Awaiting Quote",
    detail: "Pair indexed; quote unavailable",
    canQuickSwap: false,
  };
}

function originBadgeClass(origin: MarketOrigin) {
  if (origin === "PUMP.live") return "border-fuchsia-400/25 bg-fuchsia-500/12 text-fuchsia-100";
  if (origin === "Prime") return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
  if (origin === "SPO-20") return "border-violet-400/25 bg-violet-500/12 text-violet-100";
  if (origin === "Native") return "border-amber-400/25 bg-amber-500/12 text-amber-100";
  if (origin === "Stable") return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100";
  if (origin === "Bridged") return "border-teal-400/25 bg-teal-500/12 text-teal-100";
  return "border-slate-400/25 bg-slate-500/12 text-slate-100";
}

function readinessClass(readiness: MarketReadiness) {
  if (readiness === "Trade Ready") return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100";
  if (readiness === "Route Ready") return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
  if (readiness === "Awaiting Quote") return "border-amber-400/25 bg-amber-500/12 text-amber-100";
  if (readiness === "Awaiting Snapshots") return "border-yellow-400/25 bg-yellow-500/12 text-yellow-100";
  if (readiness === "No Liquidity") return "border-rose-400/25 bg-rose-500/12 text-rose-100";
  return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]", className)}>
      {children}
    </span>
  );
}

function PairLogos({ row }: { row: MarketRow }) {
  const left = row.baseSymbol || row.displaySymbol.slice(0, 1);
  const right = row.quoteSymbol || row.displaySymbol.slice(0, 1);
  return (
    <div className="flex -space-x-2">
      {row.baseLogoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.baseLogoUrl} alt={left} className="h-9 w-9 rounded-full border border-white/10 bg-black object-cover" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#242733] text-xs font-black text-white">
          {left.slice(0, 1)}
        </div>
      )}
      {row.quoteLogoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.quoteLogoUrl} alt={right} className="h-9 w-9 rounded-full border border-white/10 bg-black object-cover" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#171a24] text-xs font-black text-white">
          {right.slice(0, 1)}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
    </div>
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const raw = await response.text();
  let json: any;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Route returned non-JSON (${response.status})`);
  }
  if (!response.ok || json?.ok === false) {
    throw new Error(json?.error || `Request failed: ${response.status}`);
  }
  return json as T;
}

function normalizeRows(response: ScreenerAuthorityResponse): ScreenerAuthorityRow[] {
  const rows = response.markets || response.rows || response.items || response.pairs || [];
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = firstText(row.pairAddress, row.pair_address, row.pairKey, row.pair_key);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function RioDexMarketsPage() {
  const [rawRows, setRawRows] = useState<ScreenerAuthorityRow[]>([]);
  const [summary, setSummary] = useState<ScreenerSummary | null>(null);
  const [source, setSource] = useState<string>("");
  const [warning, setWarning] = useState<string>("");
  const [registryMap, setRegistryMap] = useState(() => buildTokenRegistryMap([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [quickSwapQuery, setQuickSwapQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("all");
  const [timeframe, setTimeframe] = useState<TimeframeMode>("24h");
  const [ranking, setRanking] = useState<RankingMode>("liquidity");
  const [sideMode, setSideMode] = useState<SideMode>("quick_swap");
  const [tradeSide, setTradeSide] = useState<TradeSide>("buy");
  const [amount, setAmount] = useState("100");
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setWatchlist(parsed.filter(Boolean));
    } catch {
      // local-only preference; ignore malformed storage
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
        const payload = await fetchJson<ScreenerAuthorityResponse>(
          `/api/riodex/screener?timeframe=${encodeURIComponent(timeframe)}&rankBy=${encodeURIComponent(ranking)}&limit=500`,
        );
        if (!active) return;

        const nextRows = normalizeRows(payload);
        setRawRows(nextRows);
        setSummary(payload.summary || payload.stats || null);
        setSource(
          typeof payload.source === "string"
            ? payload.source
            : payload.source
              ? JSON.stringify(payload.source)
              : ""
        );
        setWarning(payload.warning || "");

        const assetIds = Array.from(
          new Set(
            nextRows
              .flatMap((row) => [
                firstText(row.baseAssetId, row.base_asset_id),
                firstText(row.quoteAssetId, row.quote_asset_id),
              ])
              .filter(Boolean),
          ),
        );

        const registryItems = assetIds.length ? await getRioDexTokenRegistryBatch(assetIds) : [];
        if (!active) return;
        setRegistryMap(buildTokenRegistryMap(registryItems));
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load Spherio Screener.");
        setRawRows([]);
        setSummary(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [timeframe, ranking]);

  const rows = useMemo<MarketRow[]>(() => {
    return rawRows.map((row, index) => {
      const pairAddress = firstText(row.pairAddress, row.pair_address);
      const pairKey = firstText(row.pairKey, row.pair_key) || null;
      const baseAssetId = firstText(row.baseAssetId, row.base_asset_id);
      const quoteAssetId = firstText(row.quoteAssetId, row.quote_asset_id);
      const registryPairLabel = baseAssetId && quoteAssetId ? getRegistryPairLabel(registryMap, baseAssetId, quoteAssetId) : "";
      const rawDisplaySymbol = firstText(row.displaySymbol, row.display_symbol, row.canonicalSymbol, row.canonical_symbol, registryPairLabel);
      const parsedSymbols = parsePairSymbols(rawDisplaySymbol);
      const baseSymbol = firstText(row.baseSymbol, row.baseDisplayName) || fallbackSymbolFromAssetId(baseAssetId, parsedSymbols?.left);
      const quoteSymbol = firstText(row.quoteSymbol, row.quoteDisplayName) || fallbackSymbolFromAssetId(quoteAssetId, parsedSymbols?.right);
      const displaySymbol =
        baseSymbol && quoteSymbol
          ? `${baseSymbol} / ${quoteSymbol}`
          : preferredPairLabel(baseSymbol, quoteSymbol, rawDisplaySymbol || `${baseSymbol} / ${quoteSymbol}`);
      const canonicalSymbol = firstText(row.canonicalSymbol, row.canonical_symbol) || displaySymbol.replace(/\s+/g, "");
      const rawPrice = toNumber(row.price);
      const marketCap = toNumber(row.market_cap);
      const fullyDilutedValue = toNumber(row.fully_diluted_value);
      const fdvReferenceValue = toNumber(row.fdvReferenceValue ?? row.fdv_reference_value);
      const fdvReferenceAsset = firstText(row.fdvReferenceAsset, row.fdv_reference_asset) || null;
      const priceMoveSource = firstText(row.priceChangeSource, row.price_change_source) || null;
      const trendStatus = firstText(row.trendStatus, row.trend_status) || null;
      const liquidityUsd = toNumber(row.liquidityUsd ?? row.liquidity_usd ?? row.liquidity_quote);
      const volume24h = toNumber(row.volume24h ?? row.volume_24h);
      const txns24h = toNumber(row.txns24h ?? row.txns_24h);
      const reserveLabel = firstText(row.reserveLabel, row.reserve_label) || null;
      const liquidityStatus = firstText(row.liquidityStatus, row.liquidity_status);
      const liquidityLabel = firstText(row.liquidityLabel, row.liquidity_label) || (reserveLabel ? "Seeded / Reserves indexed" : liquidityUsd !== null ? money(liquidityUsd) : "USD pending");
      const isLive = Boolean(row.isLive ?? row.is_live);
      const isCanonical = Boolean(row.isCanonical ?? row.is_canonical);
      const origin = inferOrigin(row, baseSymbol, quoteSymbol);
      const readiness = inferReadiness(row, rawPrice, volume24h, txns24h);
      const routes = buildRoutes(row, pairAddress);
      const ageSeconds = toNumber(row.age_seconds);
      const alertFlags: string[] = [];
      if (warning) alertFlags.push(warning.replaceAll("_", " "));
      if (!isLive) alertFlags.push("Pair not marked live");
      if (liquidityStatus === "seeded_unpriced") alertFlags.push("Seeded; USD valuation pending");
      if (firstText(row.volumeStatus, row.volume_status) === "pending_snapshots") alertFlags.push("Volume snapshots pending");
      if (firstText(row.txnsStatus, row.txns_status) === "pending_snapshots") alertFlags.push("TXN snapshots pending");

      return {
        rank: Number(row.rank || index + 1),
        pairAddress,
        pairKey,
        displaySymbol,
        canonicalSymbol,
        baseAssetId,
        quoteAssetId,
        baseSymbol,
        quoteSymbol,
        baseLogoUrl: row.baseLogoUrl || (baseAssetId ? getRegistryLogoUrl(registryMap, baseAssetId) || null : null),
        quoteLogoUrl: row.quoteLogoUrl || (quoteAssetId ? getRegistryLogoUrl(registryMap, quoteAssetId) || null : null),
        baseAssetType: row.baseAssetType || row.asset_0_type || null,
        quoteAssetType: row.quoteAssetType || row.asset_1_type || null,
        origin,
        readiness: readiness.readiness,
        readinessDetail: readiness.detail,
        sourceDetail: firstText(row.source, source, "indexer"),
        price: rawPrice,
        priceLabel: priceLabel(rawPrice),
        marketCap,
        marketCapLabel: marketCap !== null ? money(marketCap) : "Pending",
        fullyDilutedValue,
        fdvLabel: fullyDilutedValue !== null ? money(fullyDilutedValue) : "Pending",
        fdvReferenceValue,
        fdvReferenceAsset,
        fdvReferenceLabel: fdvReferenceLabel(fdvReferenceValue, fdvReferenceAsset),
        priceMoveLabel: priceMoveLabelFromSource(priceMoveSource),
        priceMoveSource,
        trendStatus,
        trendLabel: trendLabel(trendStatus),
        liquidityUsd,
        liquidityLabel,
        reserveLabel,
        volume24h,
        volumeLabel: firstText(row.volumeStatus, row.volume_status) === "pending_snapshots" || !volume24h ? "Snapshots pending" : money(volume24h),
        txns24h,
        txnsLabel: firstText(row.txnsStatus, row.txns_status) === "pending_snapshots" || !txns24h ? "Snapshots pending" : String(Math.floor(txns24h)),
        ageLabel: ageLabelFromSeconds(ageSeconds),
        isLive,
        isCanonical,
        feeBps: toNumber(row.feeBps ?? row.fee_bps),
        alertFlags,
        routes,
        canQuickSwap: readiness.canQuickSwap,
        truthSource: firstText(row.source, source, "indexer"),
        raw: row,
      };
    });
  }, [rawRows, registryMap, source, warning]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = rows.filter((row) => {
      const matchesQuery = !q || [
        row.displaySymbol,
        row.canonicalSymbol,
        row.baseSymbol,
        row.quoteSymbol,
        row.baseAssetId,
        row.quoteAssetId,
        row.pairAddress,
        row.pairKey || "",
        row.origin,
      ].some((field) => field.toLowerCase().includes(q));

      const matchesOrigin =
        originFilter === "all" ||
        (originFilter === "pump" && row.origin === "PUMP.live") ||
        (originFilter === "prime" && row.origin === "Prime") ||
        (originFilter === "spo20" && row.origin === "SPO-20") ||
        (originFilter === "native" && row.origin === "Native") ||
        (originFilter === "stable" && row.origin === "Stable") ||
        (originFilter === "bridged" && row.origin === "Bridged") ||
        (originFilter === "reference" && row.origin === "Reference");

      const matchesReadiness =
        readinessFilter === "all" ||
        (readinessFilter === "route_ready" && ["Route Ready", "Trade Ready"].includes(row.readiness)) ||
        (readinessFilter === "trade_ready" && row.readiness === "Trade Ready") ||
        (readinessFilter === "awaiting_quote" && row.readiness === "Awaiting Quote") ||
        (readinessFilter === "reserves_indexed" && ["Route Ready", "Reserves Indexed", "Awaiting Snapshots", "Trade Ready"].includes(row.readiness)) ||
        (readinessFilter === "awaiting_snapshots" && row.readiness === "Awaiting Snapshots") ||
        (readinessFilter === "no_liquidity" && row.readiness === "No Liquidity");

      const matchesSide =
        sideMode !== "watchlist" || watchlist.includes(row.pairAddress);

      return matchesQuery && matchesOrigin && matchesReadiness && matchesSide;
    });

    next = [...next].sort((a, b) => {
      if (ranking === "liquidity") return (b.liquidityUsd ?? -1) - (a.liquidityUsd ?? -1);
      if (ranking === "volume") return (b.volume24h ?? -1) - (a.volume24h ?? -1);
      if (ranking === "txns") return (b.txns24h ?? -1) - (a.txns24h ?? -1);
      if (ranking === "mcap") return (toNumber(b.raw.market_cap) ?? -1) - (toNumber(a.raw.market_cap) ?? -1);
      if (ranking === "new") return a.rank - b.rank;
      return 0;
    });

    return next;
  }, [rows, query, originFilter, readinessFilter, sideMode, watchlist, ranking]);

  const quickSwapRows = useMemo(() => {
    const q = quickSwapQuery.trim().toLowerCase();
    if (!q) return rows.slice(0, 8);
    return rows
      .filter((row) => [row.displaySymbol, row.canonicalSymbol, row.baseSymbol, row.quoteSymbol, row.pairAddress, row.baseAssetId, row.quoteAssetId, row.origin].some((field) => field.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [rows, quickSwapQuery]);

  const selected = useMemo(() => {
    return rows.find((row) => row.pairAddress === selectedPair) || filteredRows[0] || rows[0] || null;
  }, [rows, filteredRows, selectedPair]);

  useEffect(() => {
    if (!selectedPair && rows[0]) setSelectedPair(rows[0].pairAddress);
  }, [rows, selectedPair]);

  const liveMarkets = summary?.live_pools ?? summary?.livePools ?? rows.filter((row) => row.isLive).length;
  const tradeReady = rows.filter((row) => row.readiness === "Trade Ready").length;
  const reservesIndexed = rows.filter((row) => ["Route Ready", "Reserves Indexed", "Awaiting Snapshots", "Trade Ready"].includes(row.readiness)).length;
  const awaitingSnapshots = rows.filter((row) => row.readiness === "Awaiting Snapshots").length;
  const totalVolume = summary?.total_volume_24h ?? summary?.volume24h ?? rows.reduce((sum, row) => sum + (row.volume24h || 0), 0);
  const totalTxns = summary?.total_txns_24h ?? summary?.txns24h ?? rows.reduce((sum, row) => sum + (row.txns24h || 0), 0);

  function toggleWatchlist(pairAddress: string) {
    setWatchlist((current) =>
      current.includes(pairAddress)
        ? current.filter((item) => item !== pairAddress)
        : [...current, pairAddress],
    );
  }

  const featured = selected
    ? {
        displaySymbol: selected.displaySymbol,
        liquidityUsd: selected.liquidityUsd,
        feeBps: selected.feeBps,
        isCanonical: selected.isCanonical,
        isLive: selected.isLive,
        routes: selected.routes,
      }
    : null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#07080d] text-white">
      <div className="mx-auto max-w-[1760px] px-4 pb-10 pt-6">
        <div className="grid gap-4">
          <main className="min-w-0">
            <section className={panel("overflow-hidden")}> 
              <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(24,29,44,0.95),rgba(13,15,24,0.95))] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-200">RioDex</div>
                    <h1 className="mt-2 text-5xl font-black tracking-tight text-white">Screener</h1>
                    <p className="mt-2 text-xl font-black text-slate-100">Market discovery</p>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
                      Source-of-truth market discovery for every Spherio asset class: PUMP.live, Prime, SPO-20, native, stable, bridged, and reference assets.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-3 lg:max-w-xl">
                    <div className="flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-black/25 px-4 py-3">
                      <Search className="h-4 w-4 shrink-0 text-cyan-200" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search token, pair, contract, symbol"
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
                        Registry-backed truth
                      </span>
                      <Link href={RIODEX_HOME_ROUTE} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white hover:bg-white/[0.1]">
                        RioDex
                      </Link>
                      <Link href={RIODEX_SWAP_ROUTE} className="rounded-xl border border-emerald-400/25 bg-emerald-500/12 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-500/18">
                        Swap
                      </Link>
                      <Link href="/riodex/pools" className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white hover:bg-white/[0.1]">
                        Liquidity
                      </Link>
                      <Link href="/riodex/pools" className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white hover:bg-white/[0.1]">
                        Pools
                      </Link>
                      <Link href="/createtoken/pump/board" className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/12 px-4 py-2 text-sm font-bold text-fuchsia-100 hover:bg-fuchsia-500/18">
                        Pump.live
                      </Link>
                      <Link href="/createtoken/prime" className="rounded-xl border border-amber-400/25 bg-amber-500/12 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-500/18">
                        Prime
                      </Link>
                      <Link href="/rioex" className="rounded-xl border border-cyan-400/25 bg-cyan-500/12 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/18">
                        RioEx
                      </Link>
                      <Link href="/rioexplorer" className="rounded-xl border border-violet-400/25 bg-violet-500/12 px-4 py-2 text-sm font-bold text-violet-100 hover:bg-violet-500/18">
                        RioExplorer
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {([
                    ["all", "All"],
                    ["pump", "PUMP.live"],
                    ["prime", "Prime"],
                    ["spo20", "SPO-20"],
                    ["native", "Native"],
                    ["stable", "Stable"],
                    ["bridged", "Bridged"],
                    ["reference", "Reference"],
                  ] as Array<[OriginFilter, string]>).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOriginFilter(value)}
                      className={cx(
                        "rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition",
                        originFilter === value
                          ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-100"
                          : "border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/[0.08]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {([
                    ["all", "All markets"],
                    ["trade_ready", "Trade ready"],
                    ["reserves_indexed", "Liquidity seeded"],
                    ["graduated", "Graduated"],
                    ["awaiting_graduation", "Awaiting graduation"],
                    ["awaiting_liquidity", "Awaiting liquidity"],
                    ["awaiting_quote", "Awaiting quote"],
                    ["awaiting_snapshots", "Awaiting snapshots"],
                    ["no_liquidity", "No liquidity"],
                  ] as Array<[ReadinessFilter, string]>).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReadinessFilter(value)}
                      className={cx(
                        "rounded-full border px-3 py-2 text-xs font-bold transition",
                        readinessFilter === value
                          ? "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100"
                          : "border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/[0.08]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  <StatTile label="Live markets" value={String(liveMarkets)} />
                  <StatTile label="Trade ready" value={String(tradeReady)} />
                  <StatTile label="Reserves" value={String(reservesIndexed)} />
                  <StatTile label="24h volume" value={totalVolume && totalVolume > 0 ? money(totalVolume) : "Pending"} />
                  <StatTile label="24h txns" value={totalTxns && totalTxns > 0 ? String(totalTxns) : "Pending"} />
                  <StatTile label="Snapshots" value={awaitingSnapshots ? "Pending" : "Online"} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#11141d] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimeframe("24h")}
                    className="rounded-xl border border-blue-400/25 bg-blue-500/18 px-4 py-2 text-sm font-black text-blue-100 hover:bg-blue-500/24"
                  >
                    Last 24 hours
                  </button>

                  <button
                    type="button"
                    onClick={() => setRanking("volume")}
                    className={cx(
                      "rounded-xl border px-4 py-2 text-sm font-black transition",
                      ranking === "volume"
                        ? "border-blue-300/40 bg-blue-500/24 text-white"
                        : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]",
                    )}
                  >
                    Trending
                  </button>

                  {(["5m", "1h", "6h", "24h"] as TimeframeMode[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTimeframe(option)}
                      className={cx(
                        "rounded-lg px-3 py-2 text-sm font-black transition",
                        timeframe === option ? "bg-white text-[#243068]" : "bg-blue-500/18 text-blue-100 hover:bg-blue-500/24",
                      )}
                    >
                      {option.toUpperCase()}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setRanking("liquidity")}
                    className={cx(
                      "rounded-xl border px-4 py-2 text-sm font-black transition",
                      ranking === "liquidity"
                        ? "border-white/25 bg-white text-black"
                        : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
                    )}
                  >
                    Top
                  </button>

                  <button
                    type="button"
                    onClick={() => setRanking("new")}
                    className={cx(
                      "rounded-xl border px-4 py-2 text-sm font-black transition",
                      ranking === "new"
                        ? "border-emerald-300/35 bg-emerald-500/20 text-emerald-100"
                        : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
                    )}
                  >
                    New Pairs
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Rank by:</span>
                  {([
                    ["liquidity", "Liquidity"],
                    ["volume", "Volume"],
                    ["txns", "TXNS"],
                    ["new", "New"],
                  ] as Array<[RankingMode, string]>).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRanking(value)}
                      className={cx(
                        "rounded-lg border px-3 py-2 text-xs font-black transition",
                        ranking === value ? "border-white/20 bg-white text-black" : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error ? <div className="m-4 rounded-xl border border-rose-400/25 bg-rose-500/12 p-4 text-sm text-rose-100">{error}</div> : null}

              <div className="overflow-x-auto">
                <div className="min-w-[1500px]">
                  <div className="grid grid-cols-[64px_2.25fr_0.85fr_1.05fr_1.05fr_0.9fr_0.85fr_0.95fr_0.8fr_0.95fr_1.15fr] border-b border-white/10 bg-[#303139] px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-white">
                    <div>#</div>
                    <div>Token</div>
                    <div>Source</div>
                    <div>M.Cap / Ref</div>
                    <div>FDV / Move</div>
                    <div>Age / Trend</div>
                    <div>Txns</div>
                    <div>Volume</div>
                    <div>Price</div>
                    <div>Liquidity</div>
                    <div>Actions</div>
                  </div>

                  {loading ? (
                    <div className="p-8 text-sm text-slate-300">Loading source-of-truth market rows…</div>
                  ) : filteredRows.length ? (
                    <div className="divide-y divide-white/[0.06]">
                      {filteredRows.map((row, index) => {
                        const watched = watchlist.includes(row.pairAddress);
                        return (
                          <div
                            key={row.pairAddress}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedPair(row.pairAddress);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedPair(row.pairAddress);
                              }
                            }}
                            className={cx(
                              "grid w-full grid-cols-[64px_2.25fr_0.85fr_1.05fr_1.05fr_0.9fr_0.85fr_0.95fr_0.8fr_0.95fr_1.15fr] items-center px-4 py-[18px] text-left text-sm transition hover:bg-white/[0.045]",
                              selected?.pairAddress === row.pairAddress ? "bg-cyan-500/[0.055]" : "bg-[#11131b]",
                            )}
                          >
                            <div className="text-slate-400">#{index + 1}</div>
                            <div className="flex min-w-0 items-center gap-3">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleWatchlist(row.pairAddress);
                                }}
                                className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", watched ? "border-amber-400/30 bg-amber-500/15 text-amber-100" : "border-white/10 bg-white/[0.04] text-slate-500")}
                              >
                                <Star className="h-4 w-4" />
                              </button>
                              <PairLogos row={row} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-base font-black text-white">{row.displaySymbol}</span>
                                  {row.isCanonical ? <Badge className="border-violet-400/25 bg-violet-500/12 text-violet-100">Canonical</Badge> : null}
                                </div>
                                <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-slate-500">
                                  <span className="truncate">{row.baseSymbol}</span>
                                  <span>/</span>
                                  <span className="truncate">{row.quoteSymbol}</span>
                                  <span>•</span>
                                  <span>{shortAddr(row.pairAddress)}</span>
                                </div>
                              </div>
                            </div>
                            <div><Badge className={originBadgeClass(row.origin)}>{row.origin}</Badge></div>
                            <div className="text-[11px] leading-5">
                              <div className="font-black text-white">{row.marketCapLabel}</div>
                              <div className="truncate text-cyan-100/60">Ref {row.fdvReferenceLabel}</div>
                            </div>
                            <div className="text-[11px] leading-5">
                              <div className="font-black text-slate-100">FDV {row.fdvLabel}</div>
                              <div className="truncate text-slate-400">Move {row.priceMoveLabel}</div>
                            </div>
                            <div className="text-[11px] leading-5">
                              <div className="font-black text-emerald-300">{row.ageLabel}</div>
                              <div className="truncate text-slate-400">{row.trendLabel}</div>
                            </div>
                            <div className="font-bold text-white">{row.txnsLabel}</div>
                            <div className="font-bold text-white">{row.volumeLabel}</div>
                            <div className="font-bold text-white">{row.priceLabel}</div>
                            <div className="text-xs font-bold text-cyan-100">
                              <div>{row.liquidityUsd !== null ? money(row.liquidityUsd) : row.liquidityLabel}</div>
                              {row.reserveLabel ? <div className="mt-1 truncate text-cyan-100/55">{row.reserveLabel}</div> : null}
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/riodex/swap?pair=${encodeURIComponent(row.pairAddress)}`}
                                onClick={(event) => event.stopPropagation()}
                                className="rounded-lg border border-emerald-400/25 bg-emerald-500/12 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-500/18"
                              >
                                Trade
                              </Link>
                              <details onClick={(event) => event.stopPropagation()} className="relative">
                                <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white hover:bg-white/[0.1]">
                                  More <ChevronDown className="h-3 w-3" />
                                </summary>
                                <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[180px] rounded-xl border border-white/10 bg-[#11131b] p-2 shadow-2xl">
                                  <Link href={row.routes.assetTerminal} className="block rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/[0.08]">RioEx</Link>
                                  <Link href={row.routes.pool} className="block rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/[0.08]">Pool</Link>
                                  <Link href={row.routes.liquidity} className="block rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/[0.08]">Liquidity</Link>
                                  <Link href={row.routes.explorer} className="block rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/[0.08]">RioExplorer</Link>
                                </div>
                              </details>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-sm text-slate-300">No market rows match the active filters.</div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 px-5 py-4 text-xs leading-6 text-slate-400">
                Markets are rendered only from indexed source-of-truth rows. Pending fields stay blank until verified price feeds, swap windows, or market snapshots exist.
              </div>
            </section>
          </main>

        </div>
      </div>
    </div>
  );
}
