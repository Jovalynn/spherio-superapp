"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRightLeft,
  BarChart3,
  DatabaseZap,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";

type Mode = "swap" | "liquidity";

type ScreenerRow = {
  pairAddress?: string;
  pair_address?: string;
  displaySymbol?: string;
  display_symbol?: string;
  canonicalSymbol?: string;
  canonical_symbol?: string;
  baseSymbol?: string | null;
  quoteSymbol?: string | null;
  baseAssetId?: string;
  quoteAssetId?: string;
  base_asset_id?: string;
  quote_asset_id?: string;
  price?: number | string | null;
  priceRio?: number | null;
  price_rio?: number | null;
  priceRusd?: number | null;
  price_rusd?: number | null;
  liquidityRio?: number | null;
  liquidity_rio?: number | null;
  liquidityRusd?: number | null;
  liquidity_rusd?: number | null;
  liquidityUsd?: number | null;
  liquidity_usd?: number | null;
  liquidity_quote?: number | string | null;
  liquidityQuote?: number | string | null;
  fdvRio?: number | null;
  fdv_rio?: number | null;
  fdvRusd?: number | null;
  fdv_rusd?: number | null;
  fdvReferenceValue?: number | string | null;
  fdv_reference_value?: number | string | null;
  volume24h?: number | null;
  volume_24h?: number | null;
  txns24h?: number | null;
  txns_24h?: number | null;
  trendStatus?: string | null;
  trend_status?: string | null;
  isLive?: boolean;
  is_live?: boolean;
  launchRail?: string | null;
  launch_rail?: string | null;
  originFamily?: string | null;
  origin_family?: string | null;
  routes?: {
    assetTerminal?: string;
    marketBoard?: string;
    hero?: string;
    pool?: string;
    swap?: string;
    liquidity?: string;
    rioex?: string;
    rioExplorer?: string;
    explorer?: string;
  };
  valuationSource?: string;
  valuationAuthority?: string;
};

type ScreenerResponse = {
  ok?: boolean;
  rows?: ScreenerRow[];
  items?: ScreenerRow[];
  markets?: ScreenerRow[];
  valuation?: {
    rioRusd?: number | null;
    rioUsd?: number | null;
    rioUsdt?: number | null;
    source?: string;
    authority?: string;
    updatedAt?: string | null;
  };
  source?: string;
  error?: string;
};

function n(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function compact(value: unknown, decimals = 6) {
  const parsed = n(value);
  if (parsed === null) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals }).format(parsed);
}

function money(value: unknown, decimals = 6) {
  const parsed = n(value);
  if (parsed === null) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals }).format(parsed);
}

function getPairAddress(row?: ScreenerRow | null) {
  return String(row?.pairAddress ?? row?.pair_address ?? "");
}

function getDisplaySymbol(row?: ScreenerRow | null) {
  if (!row) return "No market selected";
  return String(
    row.displaySymbol ??
      row.display_symbol ??
      row.canonicalSymbol ??
      row.canonical_symbol ??
      `${row.baseSymbol ?? "BASE"} / ${row.quoteSymbol ?? "QUOTE"}`,
  );
}

function getBase(row?: ScreenerRow | null) {
  return String(row?.baseSymbol ?? "BASE");
}

function getQuote(row?: ScreenerRow | null) {
  return String(row?.quoteSymbol ?? "QUOTE");
}

function getPriceRio(row?: ScreenerRow | null) {
  return n(row?.priceRio ?? row?.price_rio);
}

function getPriceRusd(row?: ScreenerRow | null) {
  return n(row?.priceRusd ?? row?.price_rusd);
}

function getLiquidityRusd(row?: ScreenerRow | null) {
  return n(row?.liquidityRusd ?? row?.liquidity_rusd ?? row?.liquidityUsd ?? row?.liquidity_usd);
}

function getFdvRusd(row?: ScreenerRow | null) {
  return n(row?.fdvRusd ?? row?.fdv_rusd);
}

function getFdvRio(row?: ScreenerRow | null) {
  return n(row?.fdvRio ?? row?.fdv_rio ?? row?.fdvReferenceValue ?? row?.fdv_reference_value);
}

function getRoute(row: ScreenerRow | null, key: keyof NonNullable<ScreenerRow["routes"]>, fallback: string) {
  return row?.routes?.[key] || fallback;
}

async function fetchScreener(): Promise<ScreenerResponse | null> {
  try {
    const response = await fetch("/api/riodex/screener", { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as ScreenerResponse;
  } catch {
    return null;
  }
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
  if (total <= 10) return null;

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

export default function RioExTradePage() {
  const searchParams = useSearchParams();
  const requestedPair = String(searchParams.get("pair") ?? "").trim();

  const [payload, setPayload] = useState<ScreenerResponse | null>(null);
  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [selectedPair, setSelectedPair] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("swap");
  const [loading, setLoading] = useState(true);
  const [marketPage, setMarketPage] = useState(1);

  const PAGE_SIZE = 10;

  async function load() {
    setLoading(true);
    const data = await fetchScreener();
    const nextRows = (data?.rows ?? data?.items ?? data?.markets ?? []).filter(Boolean);

    setPayload(data);
    setRows(nextRows);
    setSelectedPair((current) => {
      if (requestedPair && nextRows.some((row) => getPairAddress(row) === requestedPair)) {
        return requestedPair;
      }

      if (current && nextRows.some((row) => getPairAddress(row) === current)) return current;

      return getPairAddress(nextRows[0] ?? {});
    });
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 20_000);
    return () => clearInterval(timer);
  }, [requestedPair]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) =>
      [
        getDisplaySymbol(row),
        row.baseSymbol,
        row.quoteSymbol,
        row.baseAssetId,
        row.quoteAssetId,
        row.base_asset_id,
        row.quote_asset_id,
        getPairAddress(row),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [rows, query]);

  useEffect(() => {
    setMarketPage(1);
  }, [query, filteredRows.length]);

  const marketPagination = paginate(filteredRows, marketPage, PAGE_SIZE);

  const selected = useMemo(
    () => rows.find((row) => getPairAddress(row) === selectedPair) ?? rows[0] ?? null,
    [rows, selectedPair],
  );

  const selectedPairAddress = getPairAddress(selected);
  const selectedSymbol = getDisplaySymbol(selected);
  const base = getBase(selected);
  const quote = getQuote(selected);

  const swapHref = selected
    ? getRoute(selected, "swap", `/riodex/swap?pair=${selectedPairAddress}`)
    : "/riodex/swap";

  const liquidityHref = selected
    ? getRoute(selected, "liquidity", `/riodex/liquidity/action?pool=${selectedPairAddress}`)
    : "/riodex/liquidity/action";

  const poolHref = selected
    ? getRoute(selected, "pool", `/riodex/pool/${selectedPairAddress}`)
    : "/riodex";

  return (
    <main className="min-h-screen bg-[#05070d] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/60">
              RioEx Trade
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
              Screener + Trading Execution
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">
              Search liquid CPMM markets, select a pair, inspect RIO/RUSD value, then move into
              RioDex Swap or Liquidity with the selected route. Prices stay source-of-truth driven.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/rioex" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/70 hover:bg-white/[0.08]">
              Markets
            </Link>
            <Link href="/rioex/assets" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/70 hover:bg-white/[0.08]">
              Assets
            </Link>
            <Link href="/rioex/trade" className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">
              Trade
            </Link>
            <Link href="/riodex/swap" className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-400/15">
              Swap
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">RIO price</div>
            <div className="mt-2 text-xl font-black">{compact(payload?.valuation?.rioRusd, 6)} RUSD</div>
            <div className="mt-1 text-xs text-white/38">{payload?.valuation?.source ?? "RioDex CPMM"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/38">Liquid markets</div>
            <div className="mt-2 text-xl font-black">{rows.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/38">Selected</div>
            <div className="mt-2 truncate text-xl font-black">{selectedSymbol}</div>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:bg-white/[0.08]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/38">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </div>
            <div className="mt-2 text-xl font-black">{loading ? "Loading…" : "Live"}</div>
          </button>
        </div>

        <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-white/40">Screener</div>
                <h2 className="mt-1 text-xl font-black">Liquid CPMM Markets</h2>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search token, pair, symbol, address..."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/40"
                />
              </div>
            </div>

            <div className="space-y-3">
              {marketPagination.items.map((row) => {
                const pairAddress = getPairAddress(row);
                const active = pairAddress === selectedPair;
                return (
                  <button
                    key={pairAddress || getDisplaySymbol(row)}
                    type="button"
                    onClick={() => setSelectedPair(pairAddress)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-cyan-300/45 bg-cyan-300/[0.08]"
                        : "border-white/10 bg-black/22 hover:border-white/20 hover:bg-white/[0.045]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-black">{getDisplaySymbol(row)}</span>
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                            Live
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-white/38">
                          {row.launchRail ?? row.launch_rail ?? row.originFamily ?? row.origin_family ?? "market"} · {row.valuationSource ?? "RioDex CPMM"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-right text-xs sm:grid-cols-4">
                        <div>
                          <div className="text-white/35">Price RIO</div>
                          <div className="mt-1 font-bold text-white">{compact(getPriceRio(row), 9)}</div>
                        </div>
                        <div>
                          <div className="text-white/35">Price RUSD</div>
                          <div className="mt-1 font-bold text-white">{money(getPriceRusd(row), 9)}</div>
                        </div>
                        <div>
                          <div className="text-white/35">FDV RUSD</div>
                          <div className="mt-1 font-bold text-white">{money(getFdvRusd(row), 2)}</div>
                        </div>
                        <div>
                          <div className="text-white/35">Liq. RUSD</div>
                          <div className="mt-1 font-bold text-white">{money(getLiquidityRusd(row), 2)}</div>
                        </div>
                      </div>
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
              total={filteredRows.length}
              onPrev={() => setMarketPage((page) => Math.max(1, page - 1))}
              onNext={() => setMarketPage((page) => Math.min(marketPagination.totalPages, page + 1))}
            />
          </div>

          <aside className="space-y-5">
            <div className="rounded-[28px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_35%),rgba(0,0,0,0.35)] p-5 shadow-[0_0_55px_rgba(34,211,238,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-100/55">Selected Market</div>
                  <h2 className="mt-2 text-3xl font-black">{selectedSymbol}</h2>
                  <div className="mt-1 break-all text-xs text-white/40">{selectedPairAddress || "No pair selected"}</div>
                </div>
                <BarChart3 className="h-8 w-8 text-cyan-200/70" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/35">Price</div>
                  <div className="mt-2 text-xl font-black">{money(getPriceRusd(selected), 9)} RUSD</div>
                  <div className="mt-1 text-xs text-white/38">{compact(getPriceRio(selected), 9)} RIO</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/35">FDV</div>
                  <div className="mt-2 text-xl font-black">{money(getFdvRusd(selected), 2)} RUSD</div>
                  <div className="mt-1 text-xs text-white/38">{compact(getFdvRio(selected), 6)} RIO</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/35">Liquidity</div>
                  <div className="mt-2 text-xl font-black">{money(getLiquidityRusd(selected), 2)} RUSD</div>
                  <div className="mt-1 text-xs text-white/38">CPMM pool route</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/35">Assets</div>
                  <div className="mt-2 text-sm font-black">{base} → {quote}</div>
                  <div className="mt-1 text-xs text-white/38">Base / Quote</div>
                </div>
              </div>

              <div className="mt-5 flex rounded-2xl border border-white/10 bg-black/25 p-1">
                <button
                  type="button"
                  onClick={() => setMode("swap")}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-black ${mode === "swap" ? "bg-cyan-300 text-slate-950" : "text-white/60 hover:bg-white/[0.06]"}`}
                >
                  Swap
                </button>
                <button
                  type="button"
                  onClick={() => setMode("liquidity")}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-black ${mode === "liquidity" ? "bg-emerald-300 text-slate-950" : "text-white/60 hover:bg-white/[0.06]"}`}
                >
                  Liquidity
                </button>
              </div>

              {mode === "swap" ? (
                <div className="mt-4 rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/50">Swap Route</div>
                      <div className="mt-1 text-xl font-black">{base} / {quote}</div>
                    </div>
                    <ArrowDownUp className="h-6 w-6 text-cyan-200/70" />
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/35">From</div>
                      <div className="mt-2 text-2xl font-black">{base}</div>
                      <div className="mt-1 text-xs text-white/38">Connected wallet signs in RioLight</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/35">To</div>
                      <div className="mt-2 text-2xl font-black">{quote}</div>
                      <div className="mt-1 text-xs text-white/38">Quote validated by RioDex Swap</div>
                    </div>
                  </div>

                  <Link href={swapHref} className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200">
                    <ArrowRightLeft className="h-4 w-4" />
                    Open Swap Execution
                  </Link>
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-emerald-100/50">Liquidity Route</div>
                      <div className="mt-1 text-xl font-black">{base} / {quote}</div>
                    </div>
                    <DatabaseZap className="h-6 w-6 text-emerald-200/70" />
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/35">Pool Liquidity</div>
                      <div className="mt-2 text-2xl font-black">{money(getLiquidityRusd(selected), 2)} RUSD</div>
                      <div className="mt-1 text-xs text-white/38">Computed from CPMM reserves/value</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/35">LP Action</div>
                      <div className="mt-2 text-2xl font-black">Add / Manage</div>
                      <div className="mt-1 text-xs text-white/38">RioLight approval required</div>
                    </div>
                  </div>

                  <Link href={liquidityHref} className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-emerald-200">
                    <TrendingUp className="h-4 w-4" />
                    Open Liquidity Execution
                  </Link>
                </div>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link href={poolHref} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/[0.08]">
                  <ShieldCheck className="h-4 w-4" />
                  Pool Proof
                </Link>
                <Link
                  href={
                    selectedPairAddress
                      ? `/rioexplorer/address/${encodeURIComponent(selectedPairAddress)}`
                      : "/rioexplorer"
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/[0.08]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Explorer Proof
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/40">
                <Wallet className="h-4 w-4" />
                RioLight Execution
              </div>
              <p className="mt-3 text-sm leading-6 text-white/55">
                This surface is the discovery and execution handoff layer. Final quotes, slippage,
                fees, and signing remain inside RioDex Swap/Liquidity and RioLight approval flows.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
