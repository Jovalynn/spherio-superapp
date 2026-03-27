export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getRioDexPair, getRioDexPairs } from "@/lib/riodex";

type PairRow = {
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

type SwapRow = {
  tx_hash: string;
  pair_address: string;
  sender?: string | null;
  recipient?: string | null;
  offer_asset_id: string;
  ask_asset_id: string;
  offer_amount: string;
  return_amount: string;
  commission_amount: string;
  spread_amount: string;
  effective_price?: string | null;
  block_height: string | number;
  block_time: string;
};

type LiquiditySnapshot = {
  pair_address?: string;
  reserve_0: string;
  reserve_1: string;
  total_share: string;
  block_height: string | number;
  block_time: string;
};

type PairDetail = {
  pair: PairRow | null;
  last_swap: SwapRow | null;
  last_liquidity: LiquiditySnapshot | null;
  volume_24h?: {
    volume_offer?: string;
    volume_return?: string;
    trades?: number;
  } | null;
};

type EnrichedPair = {
  pair: PairRow;
  detail: PairDetail | null;
  symbol: string;
  lastTime: string | null;
  marketClass: "Canonical" | "Indexed";
  latestPrice: number | null;
  reserve0: number | null;
  reserve1: number | null;
  totalShare: number | null;
  trades24h: number;
};

type PlannedPair = {
  symbol: string;
  status: "Planned";
  note: string;
};

function formatNum(value: number, max = 6) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatInt(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function fromBaseUnits(baseAmount?: string | number | null, decimals = 6) {
  const n = Number(baseAmount ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n / 10 ** decimals;
}

function shortAddr(v?: string | null, left = 10, right = 8) {
  if (!v) return "—";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

function assetLabel(v?: string | null) {
  if (!v) return "—";
  if (v === "urio" || v === "RIO") return "RIO";
  if (v.startsWith("rio1")) return "RUSD";
  return v;
}

function pairPriority(symbol: string) {
  if (symbol === "RIO / RUSD" || symbol === "RUSD / RIO") return 0;
  return 100;
}

function cardClass(
  variant: "hero" | "market" | "liquidity" | "neutral" = "neutral"
) {
  if (variant === "hero") {
    return "rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,109,153,0.16),transparent_32%),linear-gradient(180deg,rgba(19,13,26,0.96),rgba(8,11,22,0.96))] p-6 shadow-[0_20px_80px_rgba(174,32,89,0.18)] backdrop-blur-2xl";
  }
  if (variant === "market") {
    return "rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(255,181,72,0.16),transparent_32%),linear-gradient(180deg,rgba(18,15,18,0.96),rgba(9,11,18,0.96))] p-6 shadow-[0_20px_70px_rgba(190,121,29,0.12)] backdrop-blur-2xl";
  }
  if (variant === "liquidity") {
    return "rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(72,201,255,0.16),transparent_32%),linear-gradient(180deg,rgba(8,19,28,0.96),rgba(7,11,23,0.96))] p-6 shadow-[0_20px_70px_rgba(29,121,190,0.14)] backdrop-blur-2xl";
  }
  return "rounded-[30px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl";
}

function pillClass(tone: "live" | "canonical" | "planned" | "indexed" = "live") {
  if (tone === "canonical") {
    return "rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200";
  }
  if (tone === "planned") {
    return "rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200";
  }
  if (tone === "indexed") {
    return "rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200";
  }
  return "rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200";
}

async function fetchPairs(): Promise<PairRow[]> {
  try {
    const j = await getRioDexPairs();
    return j?.pairs || [];
  } catch (error) {
    console.error("Failed to fetch RioDex pairs:", error);
    return [];
  }
}

async function fetchPairDetail(pairAddress: string): Promise<PairDetail | null> {
  try {
    const detail = await getRioDexPair(pairAddress);
if (!detail || detail.ok === false) return null;

// strip transport wrapper
const { ok, ...clean } = detail as any;

return clean as PairDetail;
  } catch (error) {
    console.error(`Failed to fetch RioDex pair detail for ${pairAddress}:`, error);
    return null;
  }
}

const PLANNED_MAJORS: PlannedPair[] = [
  {
    symbol: "RUSD/USDT",
    status: "Planned",
    note: "Awaiting external stablecoin asset rail and canonical route",
  },
  {
    symbol: "RUSD/USDC",
    status: "Planned",
    note: "Awaiting external stablecoin asset rail and canonical route",
  },
  {
    symbol: "RIO/USDT",
    status: "Planned",
    note: "Awaiting external stablecoin asset rail and canonical route",
  },
  {
    symbol: "RIO/USDC",
    status: "Planned",
    note: "Awaiting external stablecoin asset rail and canonical route",
  },
  {
    symbol: "RIO/BTC",
    status: "Planned",
    note: "Awaiting wrapped or bridged BTC route",
  },
  {
    symbol: "RIO/SOL",
    status: "Planned",
    note: "Awaiting wrapped or bridged SOL route",
  },
  {
    symbol: "RIO/ETH",
    status: "Planned",
    note: "Awaiting wrapped or bridged ETH route",
  },
];

export default async function RioDexMarketsPage() {
  const pairs = await fetchPairs();

  const enriched = await Promise.all(
    pairs.map(async (pair): Promise<EnrichedPair> => {
      const detail = await fetchPairDetail(pair.pair_address);
      const mergedPair = detail?.pair ? { ...pair, ...detail.pair } : pair;
      const symbol =
        assetLabel(mergedPair.asset_0_id) && assetLabel(mergedPair.asset_1_id)
          ? `${assetLabel(mergedPair.asset_0_id)} / ${assetLabel(mergedPair.asset_1_id)}`
          : mergedPair.display_symbol || "Unknown Pair";

      const latestPrice =
        detail?.last_swap?.effective_price !== null &&
        detail?.last_swap?.effective_price !== undefined
          ? Number(detail.last_swap.effective_price)
          : null;

      const reserve0 = detail?.last_liquidity
        ? fromBaseUnits(detail.last_liquidity.reserve_0)
        : null;
      const reserve1 = detail?.last_liquidity
        ? fromBaseUnits(detail.last_liquidity.reserve_1)
        : null;
      const totalShare = detail?.last_liquidity
        ? fromBaseUnits(detail.last_liquidity.total_share)
        : null;

      const lastTime =
        detail?.last_swap?.block_time ||
        detail?.last_liquidity?.block_time ||
        mergedPair.updated_at ||
        mergedPair.created_time ||
        null;

      return {
        pair: mergedPair,
        detail,
        symbol,
        lastTime,
        marketClass: mergedPair.is_canonical ? "Canonical" : "Indexed",
        latestPrice,
        reserve0,
        reserve1,
        totalShare,
        trades24h: Number(detail?.volume_24h?.trades ?? 0),
      };
    })
  );

  const normalizedPairs = [...enriched].sort((a, b) => {
    const pa = pairPriority(a.symbol);
    const pb = pairPriority(b.symbol);
    if (pa !== pb) return pa - pb;

    const ta = a.lastTime ? new Date(a.lastTime).getTime() : 0;
    const tb = b.lastTime ? new Date(b.lastTime).getTime() : 0;
    return tb - ta;
  });

  const livePairs = normalizedPairs.filter((p) => p.pair.is_live);
  const canonicalLivePairs = livePairs.filter((p) => p.pair.is_canonical);
  const otherIndexedPairs = livePairs.filter((p) => !p.pair.is_canonical);

  const totalLive = livePairs.length;
  const totalCanonical = canonicalLivePairs.length;
  const totalTrades24h = livePairs.reduce((sum, p) => sum + p.trades24h, 0);
  const primaryMarket = canonicalLivePairs[0] || null;

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[radial-gradient(circle_at_top,rgba(255,115,150,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,183,72,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(72,201,255,0.12),transparent_24%),linear-gradient(180deg,#060B16_0%,#070D18_52%,#060B16_100%)] text-white">
      <div className="mx-auto w-full max-w-7xl px-6 pb-14 pt-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={pillClass("canonical")}>RioDex</span>
              <span className={pillClass("live")}>Live Markets</span>
              <span className={pillClass("planned")}>Majors Pipeline</span>
            </div>

            <div className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
              Sovereign Market Directory
            </div>
            <div className="mt-2 text-4xl font-semibold tracking-tight text-white">
              Markets Terminal
            </div>
            <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Institutional market board for canonical RioDex venues: live pair identity,
              latest execution signal, reserve-backed liquidity state, terminal routing,
              and clearly separated planned majors.
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/riodex"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Back to RioDex
            </Link>
            <Link
              href="/riodex/swap"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Swap
            </Link>
            <Link
              href="/riodex/liquidity"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Liquidity
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className={cardClass("hero")}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Live Markets</div>
            <div className="mt-2 text-3xl font-semibold text-white">{totalLive}</div>
            <div className="mt-2 text-sm text-slate-300">Indexed live venues currently visible</div>
          </div>

          <div className={cardClass("market")}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Canonical Venues</div>
            <div className="mt-2 text-3xl font-semibold text-white">{totalCanonical}</div>
            <div className="mt-2 text-sm text-slate-300">Primary execution venues for RioDex routing</div>
          </div>

          <div className={cardClass("liquidity")}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">24h Trade Count</div>
            <div className="mt-2 text-3xl font-semibold text-white">{formatInt(totalTrades24h)}</div>
            <div className="mt-2 text-sm text-slate-300">Cross-market trade activity currently indexed</div>
          </div>

          <div className={cardClass("neutral")}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Primary Market</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {primaryMarket ? primaryMarket.symbol : "—"}
            </div>
            <div className="mt-2 text-sm text-slate-300">
              {primaryMarket?.lastTime ? formatDateTime(primaryMarket.lastTime) : "Awaiting market activity"}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Canonical Live Markets</div>
              <div className="mt-1 text-xs text-slate-400">
                Primary execution venues with live reserves, recent trade context, and terminal routing.
              </div>
            </div>
            <span className={pillClass("live")}>Live</span>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10">
            <div className="grid grid-cols-12 gap-3 border-b border-white/10 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-400">
              <div className="col-span-3">Pair</div>
              <div className="col-span-2">Latest Price</div>
              <div className="col-span-3">Pool State</div>
              <div className="col-span-2">Activity</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {canonicalLivePairs.length === 0 ? (
              <div className="px-4 py-10 text-sm text-slate-300">
                No canonical live market is indexed yet.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {canonicalLivePairs.map((m) => {
                  const p = m.pair;
                  const swapHref = `/riodex/swap?pair=${encodeURIComponent(p.pair_address)}`;
                  const liquidityHref = `/riodex/liquidity?pair=${encodeURIComponent(p.pair_address)}`;
                  const terminalHref = `/riodex/pool/${encodeURIComponent(p.pair_address)}`;

                  return (
                    <div
                      key={p.pair_address}
                      className="grid grid-cols-12 gap-3 px-4 py-4 text-sm"
                    >
                      <div className="col-span-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-white">{m.symbol}</div>
                          <span className={pillClass("canonical")}>Canonical</span>
                        </div>
                        <div className="mt-1 font-mono text-xs text-slate-400">
                          {shortAddr(p.pair_address, 14, 12)}
                        </div>
                        {p.lp_token_address ? (
                          <div className="mt-1 font-mono text-[11px] text-slate-500">
                            LP: {shortAddr(p.lp_token_address, 12, 10)}
                          </div>
                        ) : null}
                      </div>

                      <div className="col-span-2 text-slate-200">
                        <div className="font-semibold text-white">
                          {m.latestPrice !== null ? `${formatNum(m.latestPrice, 6)} RIO / RUSD` : "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Fee {p.fee_bps ?? 30} bps
                        </div>
                      </div>

                      <div className="col-span-3 text-slate-200">
                        {m.reserve0 !== null && m.reserve1 !== null ? (
                          <>
                            <div className="font-semibold text-white">
                              {formatNum(m.reserve0)} {assetLabel(p.asset_0_id)}
                            </div>
                            <div className="mt-1 font-semibold text-white">
                              {formatNum(m.reserve1)} {assetLabel(p.asset_1_id)}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              LP Supply {m.totalShare !== null ? formatNum(m.totalShare) : "—"}
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-400">No live pool snapshot</div>
                        )}
                      </div>

                      <div className="col-span-2 text-slate-200">
                        <div className="font-semibold text-white">{formatInt(m.trades24h)}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {m.lastTime ? formatDateTime(m.lastTime) : "No recent activity"}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={terminalHref}
                            className="inline-flex rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
                          >
                            Terminal
                          </Link>
                          <Link
                            href={swapHref}
                            className="inline-flex rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
                          >
                            Swap
                          </Link>
                          <Link
                            href={liquidityHref}
                            className="inline-flex rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
                          >
                            Liquidity
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {otherIndexedPairs.length > 0 ? (
          <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Other Indexed Markets</div>
                <div className="mt-1 text-xs text-slate-400">
                  Live indexed venues outside the canonical primary routing set.
                </div>
              </div>
              <span className={pillClass("indexed")}>Indexed</span>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10">
              <div className="grid grid-cols-12 gap-3 border-b border-white/10 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                <div className="col-span-3">Pair</div>
                <div className="col-span-2">Class</div>
                <div className="col-span-3">Latest Price</div>
                <div className="col-span-2">Activity</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y divide-white/10">
                {otherIndexedPairs.map((m) => {
                  const p = m.pair;
                  const swapHref = `/riodex/swap?pair=${encodeURIComponent(p.pair_address)}`;
                  const liquidityHref = `/riodex/liquidity?pair=${encodeURIComponent(p.pair_address)}`;
                  const terminalHref = `/riodex/pool/${encodeURIComponent(p.pair_address)}`;

                  return (
                    <div
                      key={p.pair_address}
                      className="grid grid-cols-12 gap-3 px-4 py-4 text-sm"
                    >
                      <div className="col-span-3">
                        <div className="font-semibold text-white">{m.symbol}</div>
                        <div className="mt-1 font-mono text-xs text-slate-400">
                          {shortAddr(p.pair_address, 14, 12)}
                        </div>
                      </div>

                      <div className="col-span-2 text-slate-300">{m.marketClass}</div>

                      <div className="col-span-3 text-slate-200">
                        <div className="font-semibold text-white">
                          {m.latestPrice !== null ? `${formatNum(m.latestPrice, 6)} RIO / RUSD` : "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Fee {p.fee_bps ?? 30} bps
                        </div>
                      </div>

                      <div className="col-span-2 text-slate-200">
                        <div className="font-semibold text-white">{formatInt(m.trades24h)}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {m.lastTime ? formatDateTime(m.lastTime) : "No recent activity"}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={terminalHref}
                            className="inline-flex rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
                          >
                            Terminal
                          </Link>
                          <Link
                            href={swapHref}
                            className="inline-flex rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
                          >
                            Swap
                          </Link>
                          <Link
                            href={liquidityHref}
                            className="inline-flex rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
                          >
                            Liquidity
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Majors / Planned Markets</div>
              <div className="mt-1 text-xs text-slate-400">
                Tracked now for product clarity, but intentionally inactive until the asset rails and routing infrastructure exist.
              </div>
            </div>
            <span className={pillClass("planned")}>Planned</span>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10">
            <div className="grid grid-cols-12 gap-3 border-b border-white/10 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-400">
              <div className="col-span-3">Pair</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-5">Route Note</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            <div className="divide-y divide-white/10">
              {PLANNED_MAJORS.map((pair) => (
                <div key={pair.symbol} className="grid grid-cols-12 gap-3 px-4 py-4 text-sm">
                  <div className="col-span-3 font-semibold text-white">{pair.symbol}</div>
                  <div className="col-span-2">
                    <span className={pillClass("planned")}>{pair.status}</span>
                  </div>
                  <div className="col-span-5 text-slate-300">{pair.note}</div>
                  <div className="col-span-2 text-right">
                    <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-400">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

