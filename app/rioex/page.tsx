"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import TradeChart, { TradeCandle, TradeChartMode } from "@/components/rioex/TradeChart";

type PoolTruthRow = {
  pairAddress?: string;
  pairLabel?: string;
  baseAsset?: {
    symbol?: string;
    assetId?: string;
    logoUrl?: string;
    type?: string;
  };
  quoteAsset?: {
    symbol?: string;
    assetId?: string;
    logoUrl?: string;
    type?: string;
  };
  reserves?: {
    baseDisplay?: string | number;
    quoteDisplay?: string | number;
  };
  valuation?: {
    tvlRusd?: number;
    source?: string;
  };
  pool?: {
    feeBps?: number;
    lpTokenAddress?: string;
  };
  treasury?: {
    recipient?: string;
    feePolicy?: string;
    confirmedOnChain?: boolean;
  };
  routes?: {
    pool?: string;
    swap?: string;
    liquidityAction?: string;
    liquidity?: string;
    rioex?: string;
    explorer?: string;
  };
  source?: {
    updatedAt?: string;
  };
};

type TokenRegistryRow = {
  asset_id?: string;
  assetId?: string;
  symbol?: string;
  ticker?: string;
  name?: string;
  display_name?: string;
  displayName?: string;
  logo_url?: string;
  logoUrl?: string;
  spherio_contract_address?: string;
  spherio_denom?: string;
  type?: string;
  asset_type?: string;
  status?: string;
};

type IndexedSwapRow = {
  txHash?: string;
  tx_hash?: string;
  trader?: string;
  sender?: string;
  offerAmount?: string | number;
  offer_amount?: string | number;
  askAmount?: string | number;
  ask_amount?: string | number;
  returnAmount?: string | number;
  return_amount?: string | number;
  beliefPrice?: string | number;
  belief_price?: string | number;
  price?: string | number;
  createdAt?: string;
  created_at?: string;
  blockTime?: string;
  block_time?: string;
};

type IndexedCandleRow = {
  time?: string;
  timestamp?: string;
  bucket?: string;
  bucketTime?: string;
  bucket_time?: string;
  open?: string | number;
  high?: string | number;
  low?: string | number;
  close?: string | number;
  volume?: string | number;
  volumeUsd?: string | number;
  volume_usd?: string | number;
};

type RioExData = {
  pools: PoolTruthRow[];
  tokens: TokenRegistryRow[];
};

const pendingRails = [
  {
    label: "Spot",
    status: "Live",
    description: "Pool-routed spot execution through Swap + RioLight.",
  },
  {
    label: "Liquidity",
    status: "Live",
    description: "Add/remove liquidity through canonical Liquidity action.",
  },
  {
    label: "SPO-20",
    status: "Registry",
    description: "Assets resolve from token registry and RioExplorer proof.",
  },
  {
    label: "IBC",
    status: "Pending",
    description: "Cosmos IBC onboarding rail for external Cosmos assets.",
  },
  {
    label: "Axelar",
    status: "Pending",
    description: "Future cross-chain asset route.",
  },
  {
    label: "Hyperlane",
    status: "Pending",
    description: "Future interchain messaging and asset rail.",
  },
  {
    label: "EVM",
    status: "Pending",
    description: "Bridge registry ready. EVM / WalletConnect execution locked.",
  },
  {
    label: "P2P",
    status: "Locked",
    description: "Requires dedicated escrow, compliance, and indexer rails.",
  },
  {
    label: "Farming",
    status: "Locked",
    description: "Requires reward contracts and farming indexer.",
  },
  {
    label: "Staking",
    status: "Locked",
    description: "Requires staking/reward truth source integration.",
  },
];

function asArray(payload: any): any[] {
  const rows =
    payload?.truth ||
    payload?.pools ||
    payload?.items ||
    payload?.rows ||
    payload?.data?.truth ||
    payload?.data?.pools ||
    payload?.data?.items ||
    payload?.data?.rows ||
    payload?.tokens ||
    payload?.data?.tokens ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function formatMoney(value: unknown, digits = 0) {
  const n = Number(value || 0);
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n) ? n : 0)}`;
}

function formatNumber(value: unknown, digits = 6) {
  const n = Number(String(value ?? "0").replace(/[^\d.-]/g, ""));
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n) ? n : 0);
}

function short(value?: string | null, left = 10, right = 6) {
  const raw = String(value || "");
  if (!raw) return "—";
  if (raw.length <= left + right + 3) return raw;
  return `${raw.slice(0, left)}...${raw.slice(-right)}`;
}

function statusClass(status: string) {
  const s = status.toLowerCase();

  if (s === "live") {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-200";
  }

  if (s === "registry") {
    return "border-cyan-300/30 bg-cyan-400/10 text-cyan-200";
  }

  if (s === "pending") {
    return "border-amber-300/30 bg-amber-400/10 text-amber-200";
  }

  return "border-slate-400/20 bg-slate-400/10 text-slate-300";
}

function shellClass() {
  return "rounded-[28px] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(8,18,40,0.92),rgba(6,9,22,0.96))] shadow-[0_30px_110px_-60px_rgba(34,211,238,0.55)]";
}

function cardClass() {
  return "rounded-[22px] border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]";
}

function tokenLogo(row: TokenRegistryRow) {
  return row.logo_url || row.logoUrl || "";
}

function tokenSymbol(row: TokenRegistryRow) {
  return String(row.symbol || row.ticker || row.asset_id || row.assetId || "ASSET").toUpperCase();
}


function normalizedAssetKey(asset?: { symbol?: string; assetId?: string; type?: string }) {
  const id = String(asset?.assetId || "").trim().toLowerCase();
  const symbol = String(asset?.symbol || "").trim().toUpperCase();

  if (id === "urio" || symbol === "RIO") return "RIO";
  if (symbol === "RUSD") return "RUSD";

  return id || symbol || "UNKNOWN";
}

function canonicalPairKey(pool: PoolTruthRow) {
  const a = normalizedAssetKey(pool.baseAsset);
  const b = normalizedAssetKey(pool.quoteAsset);
  return [a, b].sort().join(":");
}

function canonicalizeRioPair(pool: PoolTruthRow): PoolTruthRow {
  const base = String(pool.baseAsset?.symbol || "").toUpperCase();
  const quote = String(pool.quoteAsset?.symbol || "").toUpperCase();

  // Keep RIO as the base display side for Spherio-native market readability.
  if (quote === "RIO" && base !== "RIO") {
    return {
      ...pool,
      baseAsset: pool.quoteAsset,
      quoteAsset: pool.baseAsset,
      reserves: {
        baseDisplay: pool.reserves?.quoteDisplay,
        quoteDisplay: pool.reserves?.baseDisplay,
      },
    };
  }

  return pool;
}

function canonicalPreference(pool: PoolTruthRow) {
  const base = String(pool.baseAsset?.symbol || "").toUpperCase();
  const quote = String(pool.quoteAsset?.symbol || "").toUpperCase();

  if (base === "RIO" && quote === "RUSD") return 100;
  if (base === "RIO") return 50;
  return 0;
}

function dedupePools(rows: PoolTruthRow[]) {
  const map = new Map<string, PoolTruthRow>();

  for (const row of rows) {
    const normalized = canonicalizeRioPair(row);
    const key = canonicalPairKey(normalized);
    const existing = map.get(key);

    const existingScore = existing
      ? canonicalPreference(existing) + Number(existing.valuation?.tvlRusd || 0) / 1_000_000_000
      : -1;
    const nextScore = canonicalPreference(normalized) + Number(normalized.valuation?.tvlRusd || 0) / 1_000_000_000;

    if (!existing || nextScore >= existingScore) {
      map.set(key, normalized);
    }
  }

  return Array.from(map.values());
}

function pairTitle(pool: PoolTruthRow) {
  const base = pool.baseAsset?.symbol || "RIO";
  const quote = pool.quoteAsset?.symbol || "RUSD";
  return `${base} / ${quote}`;
}

function reservePrice(pool: PoolTruthRow) {
  const base = Number(String(pool.reserves?.baseDisplay ?? "0").replace(/[^\d.-]/g, ""));
  const quote = Number(String(pool.reserves?.quoteDisplay ?? "0").replace(/[^\d.-]/g, ""));

  if (base > 0 && quote > 0) return quote / base;
  return 0;
}

function poolBaseReserve(pool: PoolTruthRow | null) {
  return Number(pool?.reserves?.baseDisplay || 0);
}

function poolQuoteReserve(pool: PoolTruthRow | null) {
  return Number(pool?.reserves?.quoteDisplay || 0);
}

function poolHasLiquidity(pool: PoolTruthRow | null) {
  return poolBaseReserve(pool) > 0 && poolQuoteReserve(pool) > 0;
}

function poolMarketState(pool: PoolTruthRow | null) {
  return poolHasLiquidity(pool) ? "Live Pool" : "Registry";
}

function poolMarketStateBadgeClass(pool: PoolTruthRow | null) {
  return poolHasLiquidity(pool)
    ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
    : "border-amber-300/30 bg-amber-400/10 text-amber-200";
}

function poolAddress(pool: PoolTruthRow) {
  return String(pool.pairAddress || "");
}

function poolRoute(pool: PoolTruthRow) {
  const address = poolAddress(pool);
  return `/riodex/pools?pool=${encodeURIComponent(address)}`;
}

function poolBaseAssetId(pool: PoolTruthRow | null) {
  return String(pool?.baseAsset?.assetId || "");
}

function poolQuoteAssetId(pool: PoolTruthRow | null) {
  return String(pool?.quoteAsset?.assetId || "");
}

function poolBaseSymbol(pool: PoolTruthRow | null) {
  return String(pool?.baseAsset?.symbol || "");
}

function poolQuoteSymbol(pool: PoolTruthRow | null) {
  return String(pool?.quoteAsset?.symbol || "");
}

function swapRoute(pool: PoolTruthRow, _direction: "buy" | "sell" = "sell") {
  const address = poolAddress(pool);
  return `/riodex/swap?pair=${encodeURIComponent(address)}&source=rioex`;
}

function liquidityRoute(pool: PoolTruthRow) {
  const address = poolAddress(pool);
  const baseAssetId = poolBaseAssetId(pool);
  const quoteAssetId = poolQuoteAssetId(pool);
  const baseSymbol = poolBaseSymbol(pool);
  const quoteSymbol = poolQuoteSymbol(pool);

  const params = new URLSearchParams({
    pool: address,
    pair: address,
    mode: "add",
    source: "rioex",
    asset0: baseAssetId,
    asset1: quoteAssetId,
    baseAsset: baseAssetId,
    quoteAsset: quoteAssetId,
    base: baseSymbol,
    quote: quoteSymbol,
  });

  return `/riodex/liquidity/action?${params.toString()}`;
}

function proofRoute(pool: PoolTruthRow) {
  const address = poolAddress(pool);
  return pool.routes?.explorer || `/rioexplorer/address/${encodeURIComponent(address)}`;
}


function timeAgo(value?: string | null) {
  if (!value) return "—";

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return value;

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "now";
}


function candleRowsFromPayload(payload: any): IndexedCandleRow[] {
  const rows =
    payload?.candles ||
    payload?.items ||
    payload?.rows ||
    payload?.data?.candles ||
    payload?.data?.items ||
    payload?.data?.rows ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function candleClose(row: IndexedCandleRow) {
  const n = Number(row.close);
  return Number.isFinite(n) ? n : 0;
}

function tradeCandlesFromIndexedRows(rows: IndexedCandleRow[]): TradeCandle[] {
  return rows
    .map((row) => {
      const time = candleTime(row);
      const open = Number(row.open);
      const high = Number(row.high);
      const low = Number(row.low);
      const close = Number(row.close);
      const volume = Number(row.volume ?? row.volumeUsd ?? row.volume_usd ?? 0);

      if (!time || !Number.isFinite(close) || close <= 0) {
        return null;
      }

      return {
        time,
        open: Number.isFinite(open) && open > 0 ? open : close,
        high: Number.isFinite(high) && high > 0 ? high : close,
        low: Number.isFinite(low) && low > 0 ? low : close,
        close,
        volumeOfferDisplay: Number.isFinite(volume) ? volume : 0,
        volumeReturnDisplay: Number.isFinite(volume) ? volume : 0,
        volume: Number.isFinite(volume) ? volume : 0,
        trades: Number((row as any).trades || 1),
      };
    })
    .filter(Boolean) as TradeCandle[];
}

function candleHigh(row: IndexedCandleRow) {
  const n = Number(row.high);
  return Number.isFinite(n) ? n : candleClose(row);
}

function candleLow(row: IndexedCandleRow) {
  const n = Number(row.low);
  return Number.isFinite(n) ? n : candleClose(row);
}

function candleTime(row: IndexedCandleRow) {
  return row.time || row.timestamp || row.bucket || row.bucketTime || row.bucket_time || "";
}

function candlePath(rows: IndexedCandleRow[], width = 640, height = 240) {
  const values = rows.map(candleClose).filter((value) => Number.isFinite(value) && value > 0);
  if (values.length < 2) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function swapRowsFromPayload(payload: any): IndexedSwapRow[] {
  const rows =
    payload?.swaps ||
    payload?.trades ||
    payload?.items ||
    payload?.rows ||
    payload?.data?.swaps ||
    payload?.data?.trades ||
    payload?.data?.items ||
    payload?.data?.rows ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function txHashOf(row: IndexedSwapRow) {
  return row.txHash || row.tx_hash || "";
}

function swapTimeOf(row: IndexedSwapRow) {
  return row.createdAt || row.created_at || row.blockTime || row.block_time || "";
}

function swapAmountOf(row: IndexedSwapRow) {
  return row.returnAmount || row.return_amount || row.askAmount || row.ask_amount || row.offerAmount || row.offer_amount || "0";
}

function swapPriceOf(row: IndexedSwapRow, fallbackPrice: number) {
  const raw = row.price ?? row.beliefPrice ?? row.belief_price;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallbackPrice;
}

function tradeIdentity(row: IndexedSwapRow) {
  return String(
    (row as any).txHash ||
      (row as any).tx_hash ||
      (row as any).transactionHash ||
      (row as any).transaction_hash ||
      (row as any).hash ||
      swapTimeOf(row) ||
      JSON.stringify(row)
  );
}


function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    start,
    end: Math.min(start + pageSize, items.length),
    items: items.slice(start, start + pageSize),
  };
}

function Pager({
  page,
  totalPages,
  start,
  end,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  start: number;
  end: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (total <= 0) return null;


  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/55">
      <span>
        Showing {start + 1}–{end} of {total}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 font-bold text-white/70 disabled:opacity-35"
        >
          Prev
        </button>

        <span className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 font-bold text-cyan-100">
          Page {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 font-bold text-white/70 disabled:opacity-35"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function PairLogos({ pool }: { pool: PoolTruthRow }) {
  const base = pool.baseAsset;
  const quote = pool.quoteAsset;

  return (
    <div className="flex -space-x-3">
      {base?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={base.logoUrl} alt={base.symbol || "base"} className="h-10 w-10 rounded-full border border-amber-300/30 bg-black object-contain p-0.5" />
      ) : (
        <div className="grid h-10 w-10 place-items-center rounded-full border border-amber-300/30 bg-black text-sm">🔥</div>
      )}

      {quote?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={quote.logoUrl} alt={quote.symbol || "quote"} className="h-10 w-10 rounded-full border border-cyan-300/30 bg-cyan-400/10 object-contain p-0.5" />
      ) : (
        <div className="grid h-10 w-10 place-items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 text-[10px] font-black text-cyan-100">
          {quote?.symbol === "RUSD" ? "R$" : (quote?.symbol || "$").slice(0, 1)}
        </div>
      )}
    </div>
  );
}

function RioExSubNavigation({ selectedPool }: { selectedPool: PoolTruthRow | null }) {
  const selectedAddress = selectedPool ? poolAddress(selectedPool) : "";
  const tradeHref = selectedAddress
    ? `/rioex/trade?pair=${encodeURIComponent(selectedAddress)}`
    : "/rioex/trade";

  const items = [
    { label: "Markets", href: "/rioex", status: "live" },
    { label: "Assets", href: "/rioex/assets", status: "live" },
    { label: "Trade", href: tradeHref, status: "live" },
    { label: "P2P", href: "/rioex/p2p", status: "locked" },
    { label: "Earn", href: "/rioex/earn", status: "locked" },
    { label: "Bridge", href: "/rioex/bridge", status: "foundation" },
  ];

  return (
    <nav className="mt-5 rounded-3xl border border-cyan-300/15 bg-white/[0.025] p-2 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          const locked = item.status !== "live";

          if (locked) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-slate-400 hover:border-amber-300/35 hover:bg-amber-400/10 hover:text-amber-100"
                title={`${item.label} surface is ${item.status}`}
              >
                <span>{item.label}</span>
                <span className="rounded-lg border border-amber-300/25 bg-amber-400/10 px-2 py-1 text-[9px] uppercase text-amber-200">
                  {item.status}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-100 hover:border-cyan-300/55 hover:bg-cyan-400/15"
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


function chartTruthStatus(candleCount: number, recentTradeCount: number, hasSelectedPool: boolean) {
  if (!hasSelectedPool) {
    return {
      label: "No market selected",
      detail: "Select a CPMM pair to activate chart context.",
      tone: "muted",
    };
  }

  if (candleCount <= 0 && recentTradeCount <= 0) {
    return {
      label: "Awaiting swaps",
      detail: "Chart activates after indexed RioDex swaps are available.",
      tone: "pending",
    };
  }

  if (candleCount < 8 || recentTradeCount < 8) {
    return {
      label: "Thin market",
      detail: `${candleCount} candles indexed · ${recentTradeCount} recent trades indexed. Candle depth will expand as swaps accumulate.`,
      tone: "thin",
    };
  }

  return {
    label: "Chart live",
    detail: `${candleCount} candles indexed · ${recentTradeCount} recent trades indexed. Market history is building from RioDex CPMM truth.`,
    tone: "live",
  };
}

function chartTruthStatusClass(tone: string) {
  if (tone === "live") {
    return "border-emerald-300/25 bg-emerald-400/10 text-emerald-100";
  }

  if (tone === "thin") {
    return "border-amber-300/25 bg-amber-400/10 text-amber-100";
  }

  if (tone === "pending") {
    return "border-cyan-300/25 bg-cyan-400/10 text-cyan-100";
  }

  return "border-white/10 bg-white/[0.04] text-white/60";
}

export default function RioExExchangeGatewayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPair = searchParams.get("pair") || searchParams.get("pool") || "";
  const [marketPage, setMarketPage] = useState(1);
  const PAGE_SIZE = 10;
  const [data, setData] = useState<RioExData>({ pools: [], tokens: [] });
  const [selected, setSelected] = useState<string>("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "live" | "native" | "spo20" | "bridged" | "pending">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentSwaps, setRecentSwaps] = useState<IndexedSwapRow[]>([]);
  const [recentSwapsLoading, setRecentSwapsLoading] = useState(false);
  const [candles, setCandles] = useState<IndexedCandleRow[]>([]);
  const [candlesLoading, setCandlesLoading] = useState(false);
  const [chartMode, setChartMode] = useState<TradeChartMode>("candle");
  const [timeframe, setTimeframe] = useState("1h");
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("sell");
  const latestTradeKeyRef = useRef<string>("");
  const [liveTradeNotice, setLiveTradeNotice] = useState<string | null>(null);


  async function loadRioExTruth() {
    try {
      setLoading(true);
      setError(null);

      const [poolResponse, tokenResponse] = await Promise.all([
        fetch("/api/riodex/pools/truth", { cache: "no-store" }),
        fetch("/api/riodex/token-registry", { cache: "no-store" }),
      ]);

      const poolJson = await poolResponse.json().catch(() => null);
      const tokenJson = await tokenResponse.json().catch(() => null);

      if (!poolResponse.ok) {
        throw new Error(poolJson?.error || "Failed to load pool truth.");
      }

      const rawPools =
        (Array.isArray(poolJson?.truth) && poolJson.truth) ||
        (Array.isArray(poolJson?.pools) && poolJson.pools) ||
        (Array.isArray(poolJson?.items) && poolJson.items) ||
        (Array.isArray(poolJson?.rows) && poolJson.rows) ||
        (Array.isArray(poolJson?.data) && poolJson.data) ||
        (Array.isArray(poolJson) && poolJson) ||
        [];

      const pools = dedupePools(rawPools as PoolTruthRow[]);
      const tokens = asArray(tokenJson) as TokenRegistryRow[];

      setData({ pools, tokens });

      const requested = String(requestedPair || "").trim();
      const requestedMatch = requested
        ? pools.find((pool) => poolAddress(pool) === requested)
        : null;

      setSelected((current) => current || poolAddress(requestedMatch || pools[0]) || "");
    } catch (e: any) {
      setData({ pools: [], tokens: [] });
      setError(e?.message || "Failed to load RioEx truth.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRioExTruth();
  }, [requestedPair]);

  const livePools = data.pools.filter((pool) => {
    const address = poolAddress(pool);
    const status = String(
      (pool as any).status ||
      (pool as any).poolStatus ||
      (pool as any).pool_status ||
      ""
    ).toLowerCase();

    // Generic RioEx rule:
    // Any registry-backed pool with a pair address is selectable unless the source
    // explicitly marks it inactive/disabled/archived. Do NOT require TVL > 0,
    // because valid new/future pairs can have zero valuation while still having
    // reserves, indexed swaps, candles, or CPMM quote readiness.
    return Boolean(address) && !["inactive", "disabled", "archived"].includes(status);
  });

  const selectedPool =
    livePools.find((pool) => poolAddress(pool) === selected) ||
    data.pools.find((pool) => poolAddress(pool) === selected) ||
    livePools[0] ||
    data.pools[0] ||
    null;

  const tradeCandles = useMemo(() => tradeCandlesFromIndexedRows(candles), [candles]);

  const chartTruth = chartTruthStatus(
    candles.length,
    recentSwapsLoading ? 0 : recentSwaps.length,
    Boolean(selectedPool),
  );

  const totalTvl = livePools.reduce((sum, pool) => sum + Number(pool.valuation?.tvlRusd || 0), 0);
  const listedAssets = data.tokens.length;
  const liveMarkets = livePools.length;

  const visiblePools = useMemo(() => {
    const q = query.trim().toLowerCase();

    return livePools.filter((pool) => {
      const blob = [
        pairTitle(pool),
        pool.pairAddress,
        pool.baseAsset?.symbol,
        pool.quoteAsset?.symbol,
        pool.baseAsset?.assetId,
        pool.quoteAsset?.assetId,
        pool.valuation?.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !blob.includes(q)) return false;
      if (mode === "live") return Number(pool.valuation?.tvlRusd || 0) > 0;
      if (mode === "native") return pool.baseAsset?.type === "native" || pool.baseAsset?.assetId === "urio";
      if (mode === "spo20") return pool.baseAsset?.type === "spo20" || pool.quoteAsset?.type === "spo20";
      if (mode === "bridged") return pool.baseAsset?.type === "bridged" || pool.quoteAsset?.type === "bridged";
      if (mode === "pending") return false;

      return true;
    });
  }, [livePools, mode, query]);

  const marketPagination = paginate(visiblePools, marketPage, PAGE_SIZE);

  useEffect(() => {
    setMarketPage(1);
  }, [visiblePools.length, query, requestedPair]);


  async function loadMarketDataForPool(pool: PoolTruthRow | null) {
    const address = pool ? poolAddress(pool) : "";

    if (!address) {
      setRecentSwaps([]);
      setCandles([]);
      return;
    }

    try {
      setRecentSwapsLoading(true);
      setCandlesLoading(true);

      const [tradesResponse, candlesResponse] = await Promise.all([
        fetch(`/api/rioex/markets/${encodeURIComponent(address)}/trades?limit=20`, {
          cache: "no-store",
        }),
        fetch(`/api/rioex/markets/${encodeURIComponent(address)}/candles?interval=${encodeURIComponent(timeframe)}&limit=80`, {
          cache: "no-store",
        }),
      ]);

      if (tradesResponse.ok) {
        const tradesJson = await tradesResponse.json().catch(() => null);
        setRecentSwaps(swapRowsFromPayload(tradesJson?.recentTrades ? { trades: tradesJson.recentTrades } : tradesJson));
      } else {
        setRecentSwaps([]);
      }

      if (candlesResponse.ok) {
        const candlesJson = await candlesResponse.json().catch(() => null);
        setCandles(candleRowsFromPayload(candlesJson));
      } else {
        setCandles([]);
      }
    } catch {
      setRecentSwaps([]);
      setCandles([]);
    } finally {
      setRecentSwapsLoading(false);
      setCandlesLoading(false);
    }
  }

  useEffect(() => {
    void loadMarketDataForPool(selectedPool);
  }, [selectedPool ? poolAddress(selectedPool) : "", timeframe]);

  // Live trade polling: truth-only. No synthetic trades are shown.
  useEffect(() => {
    const address = selectedPool ? poolAddress(selectedPool) : "";

    latestTradeKeyRef.current = "";
    setLiveTradeNotice(null);

    if (!address) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const tradesResponse = await fetch(`/api/rioex/markets/${encodeURIComponent(address)}/trades?limit=20`, {
          cache: "no-store",
        });

        if (!tradesResponse.ok) return;

        const tradesJson = await tradesResponse.json().catch(() => null);
        const rows = swapRowsFromPayload(tradesJson?.recentTrades ? { trades: tradesJson.recentTrades } : tradesJson);
        const newestKey = rows[0] ? tradeIdentity(rows[0]) : "";

        if (!newestKey) {
          return;
        }

        const previousKey = latestTradeKeyRef.current;
        latestTradeKeyRef.current = newestKey;

        if (!previousKey || previousKey === newestKey || cancelled) {
          return;
        }

        setRecentSwaps(rows);
        setLiveTradeNotice("Live trade indexed");

        window.setTimeout(() => {
          if (!cancelled) setLiveTradeNotice(null);
        }, 4500);

        const candlesResponse = await fetch(
          `/api/rioex/markets/${encodeURIComponent(address)}/candles?interval=${encodeURIComponent(timeframe)}&limit=80`,
          { cache: "no-store" }
        );

        if (candlesResponse.ok && !cancelled) {
          const candlesJson = await candlesResponse.json().catch(() => null);
          setCandles(candleRowsFromPayload(candlesJson));
        }
      } catch {
        // Silent by design: polling must never disrupt the terminal.
      }
    };

    void poll();

    const interval = window.setInterval(() => {
      void poll();
    }, 12_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [selectedPool ? poolAddress(selectedPool) : "", timeframe]);

  function selectRioExPair(address: string) {
    if (!address) return;
    setSelected(address);
    router.replace(`/rioex?pair=${encodeURIComponent(address)}`, { scroll: false });
  }

  const assetUniverse = useMemo(() => {
    const q = query.trim().toLowerCase();

    return data.tokens.filter((token) => {
      const blob = [
        token.asset_id,
        token.assetId,
        token.symbol,
        token.ticker,
        token.name,
        token.display_name,
        token.displayName,
        token.spherio_contract_address,
        token.spherio_denom,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !q || blob.includes(q);
    });
  }, [data.tokens, query]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_90%_4%,rgba(245,158,11,0.10),transparent_22%),linear-gradient(180deg,#06090f_0%,#060914_42%,#03050b_100%)] px-4 py-7 text-white sm:px-6">
      <div className="mx-auto max-w-[1540px] space-y-4">
        <section className={`${shellClass()} p-5 sm:p-6`}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">
                RioEx Exchange
              </div>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                Multi-chain Asset Exchange
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
                Spherio-native exchange infrastructure for multi-chain assets. Live markets resolve through authoritative Spherio truth:
                token registry, pool truth, route truth, RioExplorer proof, and RioLight execution.
              </p>
            </div>

            <div className="grid min-w-[280px] grid-cols-3 gap-2">
              {[
                ["TVL", formatMoney(totalTvl)],
                ["Markets", liveMarkets],
                ["Assets", listedAssets],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.055] p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">{label}</div>
                  <div className="mt-1 text-lg font-black text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {[
              ["SOT", "Pool Truth + Token Registry"],
              ["Execution", "RioLight one-popup"],
              ["Proof", "RioExplorer"],
              ["Bridge", "IBC / Axelar / Hyperlane registry ready"],
              ["EVM", "WalletConnect/EVM pending"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
                <div className="mt-1 text-sm font-bold text-slate-100">{value}</div>
              </div>
            ))}
          </div>
        </section>

          <RioExSubNavigation selectedPool={selectedPool} />

        <section className="grid items-start gap-5 xl:grid-cols-[1.35fr_0.75fr]">
          <div className={`${shellClass()} self-start h-fit self-start overflow-hidden`}>
            <div className="border-b border-white/10 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "All"],
                    ["live", "Live"],
                    ["native", "Native"],
                    ["spo20", "SPO-20"],
                    ["bridged", "Bridged"],
                    ["pending", "Pending"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMode(key as typeof mode)}
                      className={
                        mode === key
                          ? "rounded-xl border border-cyan-300/60 bg-cyan-400/12 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-cyan-100"
                          : "rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-300 hover:bg-white/[0.07]"
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search markets, assets, routes..."
                    className="h-10 min-w-[280px] rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
                  />
                  <button
                    type="button"
                    onClick={() => void loadRioExTruth()}
                    className="h-10 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 text-sm font-bold text-cyan-100"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="m-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="m-4 rounded-2xl border border-white/10 bg-black/20 p-8 text-sm text-slate-300">
                Loading RioEx source-of-truth...
              </div>
            ) : visiblePools.length === 0 ? (
              <div className="m-4 rounded-2xl border border-white/10 bg-black/20 p-8 text-sm text-slate-300">
                No live markets match this filter. Pending rails are visible, but not listed as live until backed by indexer and contract truth.
              </div>
            ) : (
                <div className="max-h-[360px] overflow-y-auto overflow-x-hidden p-3 pr-2 [scrollbar-color:rgba(34,211,238,0.35)_rgba(15,23,42,0.35)] [scrollbar-width:thin]">
                  <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">Live registry markets</div>
                      <div className="mt-1 text-xs text-slate-400">All source-of-truth pool pairs are listed vertically. Select any pair to update the terminal.</div>
                    </div>
                    <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100">
                      {visiblePools.length} pairs
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {marketPagination.items.map((pool) => {
                      const address = poolAddress(pool);
                      const active = selectedPool && poolAddress(selectedPool) === address;
                      const baseReserve = Number(pool.reserves?.baseDisplay || 0);
                      const quoteReserve = Number(pool.reserves?.quoteDisplay || 0);

                      return (
                        <button
                          key={address || pairTitle(pool)}
                          type="button"
                          onClick={() => selectRioExPair(address)}
                          className={
                            active
                              ? "w-full rounded-2xl border border-cyan-300/45 bg-cyan-400/[0.10] p-3 text-left shadow-[0_0_24px_rgba(34,211,238,0.10)]"
                              : "w-full rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-left hover:border-cyan-300/25 hover:bg-white/[0.045]"
                          }
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <PairLogos pool={pool} />
                              <div className="min-w-0">
                                <div className="truncate text-base font-black text-white">{pairTitle(pool)}</div>
                                <div className="mt-1 truncate text-xs text-slate-400">{short(address, 18, 8)}</div>
                              </div>
                            </div>

                            <div className="shrink-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Price</div>
                              <div className="mt-1 text-sm font-black text-white">{formatNumber(reservePrice(pool), 6)}</div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-4">
                            <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">TVL RUSD</div>
                              <div className="mt-1 text-xs font-black text-white">{formatMoney(pool.valuation?.tvlRusd || 0)}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">Fee</div>
                              <div className="mt-1 text-xs font-black text-white">{pool.pool?.feeBps || 30} bps</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">Base reserve</div>
                              <div className="mt-1 truncate text-xs font-black text-white">{formatNumber(baseReserve, 2)} {pool.baseAsset?.symbol || ""}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">Quote reserve</div>
                              <div className="mt-1 truncate text-xs font-black text-white">{formatNumber(quoteReserve, 2)} {pool.quoteAsset?.symbol || ""}</div>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase ${poolMarketStateBadgeClass(pool)}`}>
                              {poolMarketState(pool)}
                            </span>
                            {active ? (
                              <span className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase text-cyan-100">Selected</span>
                            ) : null}
                            <span className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] font-bold uppercase text-slate-400">RioLight-ready</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Pager
                    page={marketPagination.page}
                    totalPages={marketPagination.totalPages}
                    start={marketPagination.start}
                    end={marketPagination.end}
                    total={visiblePools.length}
                    onPrev={() => setMarketPage((page) => Math.max(1, page - 1))}
                    onNext={() =>
                      setMarketPage((page) =>
                        Math.min(marketPagination.totalPages, page + 1),
                      )
                    }
                  />
                </div>

              )}
            </div>

          <aside className={`${shellClass()} p-4`}>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
              Selected Market
            </div>

            {selectedPool ? (
              <div className="mt-3 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PairLogos pool={selectedPool} />
                    <div>
                      <h2 className="text-2xl font-black tracking-[-0.04em] text-white">{pairTitle(selectedPool)}</h2>
                      <div className="text-xs text-slate-400">{short(poolAddress(selectedPool), 16, 8)}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Price", `${formatNumber(reservePrice(selectedPool), 6)} ${selectedPool.quoteAsset?.symbol || "RUSD"}`],
                    ["TVL", formatMoney(selectedPool.valuation?.tvlRusd || 0)],
                    ["Base Reserve", `${formatNumber(selectedPool.reserves?.baseDisplay, 2)} ${selectedPool.baseAsset?.symbol || ""}`],
                    ["Quote Reserve", `${formatNumber(selectedPool.reserves?.quoteDisplay, 2)} ${selectedPool.quoteAsset?.symbol || ""}`],
                    ["Fee", `${selectedPool.pool?.feeBps || 30} bps`],
                    ["Treasury", short(selectedPool.treasury?.recipient)],
                  ].map(([label, value]) => (
                    <div key={label} className={cardClass()}>
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
                      <div className="mt-1 break-words text-sm font-black text-white">{value}</div>
                    </div>
                  ))}
                </div>

                  {!poolHasLiquidity(selectedPool) ? (
                    <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3 text-xs font-bold leading-5 text-amber-100">
                      This market is registry-visible but has no executable pool liquidity yet. Add liquidity before trading is enabled.
                    </div>
                  ) : null}

                <div className="grid grid-cols-2 gap-2">
                    {poolHasLiquidity(selectedPool) ? (
                  <Link href={swapRoute(selectedPool, tradeSide)} className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-center text-sm font-black text-emerald-100">
                    Trade
                    </Link>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-center text-sm font-black text-slate-500">
                        Trade Locked
                      </div>
                    )}
                  <Link href={liquidityRoute(selectedPool)} className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-center text-sm font-black text-cyan-100">
                    Add Liquidity
                  </Link>
                  <Link href={poolRoute(selectedPool)} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-center text-sm font-bold text-white">
                    Pool
                  </Link>
                  <Link href={proofRoute(selectedPool)} className="rounded-2xl border border-violet-300/25 bg-violet-400/10 px-4 py-3 text-center text-sm font-bold text-violet-100">
                    RioExplorer
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-slate-400">
                No live market selected.
              </div>
            )}

              <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
                  Exchange Rails · {pendingRails.filter((rail) => rail.status === "live").length} live / {pendingRails.length} total
                </summary>

                <div className="mt-3 grid max-h-[220px] gap-2 overflow-y-auto pr-1 [scrollbar-color:rgba(34,211,238,0.35)_rgba(15,23,42,0.35)] [scrollbar-width:thin]">
                  {pendingRails.map((rail) => (
                    <div key={rail.label} className="rounded-xl border border-white/10 bg-black/20 p-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-black text-white">{rail.label}</div>
                        <span className={`rounded-lg border px-2 py-1 text-[9px] font-black uppercase ${statusClass(rail.status)}`}>
                          {rail.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-4 text-slate-400">{rail.description}</p>
                    </div>
                  ))}
                </div>
              </details>
          </aside>
        </section>

        {liveTradeNotice ? (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-300/35 bg-emerald-400/15 px-4 py-3 text-sm font-black text-emerald-100 shadow-[0_18px_60px_rgba(16,185,129,0.20)] backdrop-blur-xl">
            <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/75">RioEx live feed</div>
            <div className="mt-1">{liveTradeNotice}</div>
          </div>
        ) : null}

        {selectedPool ? (
          <section className={`${shellClass()} overflow-hidden`}>
            <div className="border-b border-white/10 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <PairLogos pool={selectedPool} />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
                      RioEx Trade Terminal
                    </div>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
                      {pairTitle(selectedPool)}
                    </h2>
                    <div className="text-xs text-slate-400">
                      Pool-routed spot execution · SOT price {formatNumber(reservePrice(selectedPool), 6)} {selectedPool.quoteAsset?.symbol || "RUSD"} / {selectedPool.baseAsset?.symbol || "RIO"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {[
                    ["Price", `${formatNumber(reservePrice(selectedPool), 6)}`],
                    ["TVL", formatMoney(selectedPool.valuation?.tvlRusd || 0)],
                    ["Fee", `${selectedPool.pool?.feeBps || 30} bps`],
                    ["Status", poolMarketState(selectedPool)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
                      <div className="mt-1 text-sm font-black text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid min-h-[420px] gap-0 xl:grid-cols-[1.1fr_0.55fr_0.55fr]">
              <div className="border-b border-white/10 p-4 xl:border-b-0 xl:border-r">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">Chart</div>
                    <div className="mt-1 text-sm text-slate-400">Indexed candles render from RioDex CPMM swap history and candle aggregation.</div>

                    <div className={`mt-3 rounded-2xl border px-4 py-3 text-xs leading-5 ${chartTruthStatusClass(chartTruth.tone)}`}>
                      <div className="font-black uppercase tracking-[0.18em]">
                        {chartTruth.label}
                      </div>
                      <div className="mt-1 opacity-80">
                        {chartTruth.detail}
                      </div>
                    </div>
                  </div>
                  <span className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-[10px] font-black uppercase text-amber-200">
                    Pending
                  </span>
                </div>

                <div className="mt-4 h-[280px] rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.6),rgba(2,6,23,0.8))] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {["1m", "5m", "15m", "1h", "1d"].map((frame) => (
                        <button
                          key={frame}
                          type="button"
                          onClick={() => setTimeframe(frame)}
                          className={
                            timeframe === frame
                              ? "rounded-lg border border-cyan-300/40 bg-cyan-400/12 px-2 py-1 text-[10px] font-black uppercase text-cyan-100"
                              : "rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] font-black uppercase text-slate-400"
                          }
                        >
                          {frame}
                        </button>
                      ))}

                        {(["candle", "line", "area"] as TradeChartMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setChartMode(mode)}
                            className={
                              chartMode === mode
                                ? "rounded-lg border border-amber-300/40 bg-amber-400/12 px-2 py-1 text-[10px] font-black uppercase text-amber-100"
                                : "rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] font-black uppercase text-slate-400"
                            }
                          >
                            {mode}
                          </button>
                        ))}
                    </div>

                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {candlesLoading ? "Loading candles" : candles.length ? `${candles.length} candles` : "No candles"}
                    </span>
                  </div>

                    {tradeCandles.length >= 2 ? (
                      <div className="overflow-hidden rounded-xl border border-cyan-300/10 bg-black/20">
                        <TradeChart
                          candles={tradeCandles}
                          mode={chartMode}
                          lastPrice={candleClose(candles[candles.length - 1]) || reservePrice(selectedPool)}
                          tradeMarkers={[]}
                          eventMarkers={[]}
                          rangeLabel="all"
                        />
                      </div>
                    ) : (
                      <div className="flex h-[220px] items-center justify-center rounded-xl border border-white/10 bg-black/20">
                        <div className="text-center">
                          <div className="text-5xl font-black tracking-[-0.08em] text-white">
                            {formatNumber(reservePrice(selectedPool), 6)}
                          </div>
                          <div className="mt-2 text-sm text-slate-400">
                            {selectedPool.quoteAsset?.symbol || "RUSD"} per {selectedPool.baseAsset?.symbol || "RIO"}
                          </div>
                          <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-100">
                            Pool reference shown until indexed candles are available
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="border-b border-white/10 p-4 xl:border-b-0 xl:border-r">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">Order Book</div>
                    <div className="mt-1 text-sm text-slate-400">AMM pool reserves are live. CLOB order book is pending.</div>
                  </div>
                  <span className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-[10px] font-black uppercase text-amber-200">
                    Pending
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    ["Ask liquidity", selectedPool.reserves?.baseDisplay, selectedPool.baseAsset?.symbol || "RIO"],
                    ["Bid liquidity", selectedPool.reserves?.quoteDisplay, selectedPool.quoteAsset?.symbol || "RUSD"],
                    ["Pool TVL", selectedPool.valuation?.tvlRusd || 0, "RUSD"],
                    ["Fee tier", selectedPool.pool?.feeBps || 30, "bps"],
                  ].map(([label, value, suffix]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
                      <div className="mt-1 text-sm font-black text-white">
                        {typeof value === "number" && suffix === "RUSD" ? formatMoney(value) : formatNumber(value, 2)} {suffix}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-slate-400">
                  This panel is intentionally reserve-based for now. When Spherio adds an order-book or deeper indexed trade depth, RioEx can activate a professional order-book surface without faking data.
                </div>
              </div>

              <div className="p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">Trade Box</div>
                <div className="mt-1 text-sm text-slate-400">Execution hands off to Swap and confirms through one RioLight popup.</div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex rounded-xl border border-white/10 bg-black/25 p-1">
                    <button className="h-9 flex-1 rounded-lg bg-emerald-400/15 text-sm font-black text-emerald-200" type="button">
                      Buy
                    </button>
                    <button className="h-9 flex-1 rounded-lg text-sm font-black text-slate-400" type="button">
                      Sell
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Route</div>
                      <div className="mt-1 text-sm font-black text-white">RioDex Swap · RioLight</div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Selected Pair</div>
                      <div className="mt-1 text-sm font-black text-white">{pairTitle(selectedPool)} · {tradeSide.toUpperCase()}</div>
                    </div>

                    <Link href={swapRoute(selectedPool)} className="rounded-2xl border border-emerald-300/35 bg-emerald-400/12 px-4 py-3 text-center text-sm font-black text-emerald-100">
                      Open Swap
                    </Link>
                    <Link href={liquidityRoute(selectedPool)} className="rounded-2xl border border-cyan-300/35 bg-cyan-400/10 px-4 py-3 text-center text-sm font-black text-cyan-100">
                      Add Liquidity
                    </Link>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">Recent Trades</div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {recentSwapsLoading ? "Loading" : `${recentSwaps.length} indexed`}
                    </span>
                  </div>

                  <div className="mt-3 max-h-[188px] overflow-auto rounded-2xl border border-white/10 bg-black/20 [scrollbar-width:thin]">
                    {recentSwapsLoading ? (
                      <div className="p-4 text-sm text-slate-400">Loading indexed swaps…</div>
                    ) : recentSwaps.length === 0 ? (
                      <div className="p-4 text-sm leading-5 text-slate-400">
                        No indexed trades yet. Live trade feed activates after the first confirmed swap. After a successful Swap broadcast through RioLight, the indexer will populate riodex_swaps and RioEx will activate recent trades and candles.
                      </div>
                    ) : (
                      recentSwaps.slice(0, 8).map((swap) => (
                        <div key={txHashOf(swap) || `${swapTimeOf(swap)}-${swapAmountOf(swap)}`} className="flex items-center justify-between border-b border-white/8 px-3 py-2 last:border-b-0">
                          <div>
                            <div className="text-xs font-black text-white">{formatNumber(swapPriceOf(swap, reservePrice(selectedPool)), 6)}</div>
                            <div className="text-[10px] text-slate-500">{timeAgo(swapTimeOf(swap))}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-black text-emerald-200">{formatNumber(swapAmountOf(swap), 4)}</div>
                            <div className="text-[10px] text-slate-500">{short(txHashOf(swap), 8, 4)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}


      </div>
    </main>
  );

}
