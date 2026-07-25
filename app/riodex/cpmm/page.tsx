"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PoolTruthAsset = {
  symbol?: string;
  assetId?: string;
  logoUrl?: string;
  type?: string;
};

type PoolTruthRow = {
  pairAddress?: string;
  pairLabel?: string;
  baseAsset?: PoolTruthAsset;
  quoteAsset?: PoolTruthAsset;
  reserves?: {
    baseDisplay?: number;
    quoteDisplay?: number;
  };
  valuation?: {
    tvlRusd?: number;
    source?: string;
  };
  pool?: {
    feeBps?: number;
    lpTokenAddress?: string;
  };
  routes?: Record<string, string | undefined>;
};

type CpmmQuote = {
  ok?: boolean;
  error?: string;
  source?: string;
  invariant?: string;
  pair?: string;
  direction?: string;
  fromAsset?: PoolTruthAsset;
  toAsset?: PoolTruthAsset;
  amountIn?: number;
  amountOut?: number;
  minimumOut?: number;
  slippagePct?: number;
  feeAmount?: number;
  feeBps?: number;
  spotPrice?: number;
  executionPrice?: number;
  priceImpactPct?: number;
  reserves?: {
    before?: { in?: number; out?: number };
    after?: { in?: number; out?: number };
  };
  k?: {
    before?: number;
    after?: number;
  };
  proof?: {
    poolTruth?: string;
    rioExplorer?: string;
  };
};

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
    [];

  return Array.isArray(rows) ? rows : [];
}

function fmt(value: unknown, digits = 6) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n) ? n : 0);
}

function money(value: unknown) {
  const n = Number(value ?? 0);
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0)}`;
}

function short(value?: string | null, left = 10, right = 6) {
  const raw = String(value || "");
  if (!raw) return "—";
  if (raw.length <= left + right + 3) return raw;
  return `${raw.slice(0, left)}...${raw.slice(-right)}`;
}

function poolAddress(pool: PoolTruthRow | null) {
  return String(pool?.pairAddress || "");
}

function pairLabel(pool: PoolTruthRow | null) {
  const base = pool?.baseAsset?.symbol || "RIO";
  const quote = pool?.quoteAsset?.symbol || "RUSD";
  return `${base} / ${quote}`;
}

function spotPrice(pool: PoolTruthRow | null) {
  const base = Number(pool?.reserves?.baseDisplay || 0);
  const quote = Number(pool?.reserves?.quoteDisplay || 0);
  return base > 0 && quote > 0 ? quote / base : 0;
}

function shellClass() {
  return "rounded-[28px] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(8,18,40,0.92),rgba(6,9,22,0.96))] shadow-[0_30px_110px_-60px_rgba(34,211,238,0.55)]";
}

function cardClass() {
  return "rounded-[22px] border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]";
}

function TokenLogo({ asset, fallback }: { asset?: PoolTruthAsset; fallback: string }) {
  return asset?.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset.logoUrl}
      alt={asset.symbol || fallback}
      className="h-10 w-10 rounded-full border border-white/10 bg-black object-contain p-0.5"
    />
  ) : (
    <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-black">
      {(asset?.symbol || fallback).slice(0, 1)}
    </div>
  );
}

export default function RioDexCpmmPage() {
  const [pools, setPools] = useState<PoolTruthRow[]>([]);
  const [selectedPair, setSelectedPair] = useState("");
  const [fromSymbol, setFromSymbol] = useState("RIO");
  const [amount, setAmount] = useState("1");
  const [slippagePct, setSlippagePct] = useState("1");
  const [quote, setQuote] = useState<CpmmQuote | null>(null);
  const [loadingPools, setLoadingPools] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPool = useMemo(
    () => pools.find((pool) => poolAddress(pool) === selectedPair) || pools[0] || null,
    [pools, selectedPair],
  );

  const oppositeSymbol =
    fromSymbol.toUpperCase() === String(selectedPool?.baseAsset?.symbol || "RIO").toUpperCase()
      ? selectedPool?.quoteAsset?.symbol || "RUSD"
      : selectedPool?.baseAsset?.symbol || "RIO";

  async function loadPools() {
    try {
      setLoadingPools(true);
      setError(null);

      const response = await fetch("/api/riodex/pools/truth", { cache: "no-store" });
      const json = await response.json().catch(() => null);

      if (!response.ok || json?.ok === false) {
        throw new Error(json?.error || "Failed to load CPMM pool truth.");
      }

      const rows = asArray(json)
        .filter((pool: PoolTruthRow) => {
          return Number(pool?.reserves?.baseDisplay || 0) > 0 && Number(pool?.reserves?.quoteDisplay || 0) > 0;
        })
        .sort((a: PoolTruthRow, b: PoolTruthRow) => {
          const aLabel = pairLabel(a).replace(/\s+/g, "").toUpperCase();
          const bLabel = pairLabel(b).replace(/\s+/g, "").toUpperCase();

          if (aLabel === "RIO/RUSD") return -1;
          if (bLabel === "RIO/RUSD") return 1;
          if (aLabel === "RUSD/RIO") return 1;
          if (bLabel === "RUSD/RIO") return -1;

          return 0;
        });

      const canonicalPool =
        rows.find((pool: PoolTruthRow) => pairLabel(pool).replace(/\s+/g, "").toUpperCase() === "RIO/RUSD") ||
        rows[0] ||
        null;

      setPools(rows);
      setSelectedPair((current) => current || poolAddress(canonicalPool) || "");
      setFromSymbol(canonicalPool?.baseAsset?.symbol || "RIO");
    } catch (err: any) {
      setPools([]);
      setError(err?.message || "Failed to load CPMM pools.");
    } finally {
      setLoadingPools(false);
    }
  }

  async function loadQuote(pool = selectedPool) {
    const pair = poolAddress(pool);
    const from = fromSymbol;
    const amountIn = String(amount || "").trim();
    const slip = String(slippagePct || "1").trim();

    if (!pair || !from || !amountIn) {
      setQuote(null);
      return;
    }

    try {
      setQuoteLoading(true);

      const url = `/api/riodex/cpmm/quote?pair=${encodeURIComponent(pair)}&from=${encodeURIComponent(from)}&amount=${encodeURIComponent(amountIn)}&slippagePct=${encodeURIComponent(slip)}`;
      const response = await fetch(url, { cache: "no-store" });
      const json = await response.json().catch(() => null);

      setQuote(json);

      if (!response.ok || json?.ok === false) {
        setError(json?.error || "CPMM quote failed.");
      } else {
        setError(null);
      }
    } catch (err: any) {
      setQuote(null);
      setError(err?.message || "Failed to compute CPMM quote.");
    } finally {
      setQuoteLoading(false);
    }
  }

  useEffect(() => {
    void loadPools();
  }, []);

  useEffect(() => {
    if (selectedPool) void loadQuote(selectedPool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPair, fromSymbol, amount, slippagePct]);

  const pair = poolAddress(selectedPool);
  const baseSymbol = selectedPool?.baseAsset?.symbol || "RIO";
  const quoteSymbol = selectedPool?.quoteAsset?.symbol || "RUSD";
  const swapHref = pair
    ? `/riodex/swap?pair=${encodeURIComponent(pair)}&source=cpmm`
    : "/riodex/swap";
  const liquidityHref = pair
    ? `/riodex/liquidity/action?pool=${encodeURIComponent(pair)}&mode=add&source=cpmm`
    : "/riodex/liquidity/action";
  const poolHref = pair
    ? `/riodex/pools?pool=${encodeURIComponent(pair)}`
    : "/riodex/pools";
  const explorerHref = quote?.proof?.rioExplorer || (pair ? `/rioexplorer/address/${encodeURIComponent(pair)}` : "/rioexplorer");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_90%_4%,rgba(245,158,11,0.10),transparent_22%),linear-gradient(180deg,#06090f_0%,#060914_42%,#03050b_100%)] px-4 py-7 text-white sm:px-6">
      <div className="mx-auto max-w-[1460px] space-y-5">
        <section className={`${shellClass()} p-5 sm:p-6`}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">
                RioDex CPMM
              </div>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                Constant Product Market Maker
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
                Spherio-native AMM quote intelligence powered by Pool Truth. Quotes use the invariant <span className="font-black text-white">x*y=k</span>, live reserves, fee policy, token registry identities, and RioExplorer proof.
              </p>
            </div>

            <div className="grid min-w-[300px] grid-cols-3 gap-2">
              {[
                ["Pools", pools.length],
                ["Invariant", "x*y=k"],
                ["Status", loadingPools ? "Loading" : "Live"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.055] p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">{label}</div>
                  <div className="mt-1 text-lg font-black text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr_0.75fr]">
          <div className={`${shellClass()} p-4`}>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
              Pool Selector
            </div>

            <div className="mt-4 space-y-2">
              {loadingPools ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                  Loading Pool Truth…
                </div>
              ) : pools.length === 0 ? (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                  No live CPMM pools found from Pool Truth.
                </div>
              ) : (
                pools.map((pool) => {
                  const active = poolAddress(pool) === pair;

                  return (
                    <button
                      key={poolAddress(pool)}
                      type="button"
                      onClick={() => {
                        setSelectedPair(poolAddress(pool));
                        setFromSymbol(pool.baseAsset?.symbol || "RIO");
                      }}
                      className={
                        active
                          ? "w-full rounded-2xl border border-cyan-300/40 bg-cyan-400/12 p-4 text-left"
                          : "w-full rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left hover:bg-white/[0.06]"
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          <TokenLogo asset={pool.baseAsset} fallback="RIO" />
                          <TokenLogo asset={pool.quoteAsset} fallback="RUSD" />
                        </div>
                        <div>
                          <div className="font-black text-white">{pairLabel(pool)}</div>
                          <div className="text-xs text-slate-400">{short(poolAddress(pool), 12, 8)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
                {error}
              </div>
            ) : null}
          </div>

          <div className={`${shellClass()} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
                  Quote Simulator
                </div>
                <h2 className="mt-1 text-2xl font-black text-white">{pairLabel(selectedPool)}</h2>
              </div>

              <span className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs font-black uppercase text-emerald-200">
                Pool Truth
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              <div className={cardClass()}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">You pay</div>
                    <input
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className="mt-2 w-full bg-transparent text-4xl font-black tracking-[-0.05em] text-white outline-none"
                      placeholder="0.00"
                    />
                  </div>

                  <select
                    value={fromSymbol}
                    onChange={(event) => setFromSymbol(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-black text-white outline-none"
                  >
                    <option value={baseSymbol}>{baseSymbol}</option>
                    <option value={quoteSymbol}>{quoteSymbol}</option>
                  </select>
                </div>
              </div>

              <div className={cardClass()}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Estimated receive</div>
                    <div className="mt-2 text-4xl font-black tracking-[-0.05em] text-white">
                      {quoteLoading ? "…" : quote?.ok ? fmt(quote.amountOut, 8) : "0"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-black text-white">
                    {quote?.toAsset?.symbol || oppositeSymbol}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className={cardClass()}>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Minimum out</div>
                  <div className="mt-1 text-lg font-black text-white">{quote?.ok ? fmt(quote.minimumOut, 8) : "—"}</div>
                </div>

                <div className={cardClass()}>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Price impact</div>
                  <div className="mt-1 text-lg font-black text-white">{quote?.ok ? `${fmt(quote.priceImpactPct, 4)}%` : "—"}</div>
                </div>

                <div className={cardClass()}>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Slippage</div>
                  <input
                    value={slippagePct}
                    onChange={(event) => setSlippagePct(event.target.value)}
                    className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-4">
                <Link href={swapHref} className="rounded-2xl border border-emerald-300/35 bg-emerald-400/12 px-4 py-3 text-center text-sm font-black text-emerald-100">
                  Open Swap
                </Link>
                <Link href={liquidityHref} className="rounded-2xl border border-cyan-300/35 bg-cyan-400/10 px-4 py-3 text-center text-sm font-black text-cyan-100">
                  Add Liquidity
                </Link>
                <Link href={poolHref} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-center text-sm font-bold text-white">
                  Pool
                </Link>
                <Link href={explorerHref} className="rounded-2xl border border-violet-300/25 bg-violet-400/10 px-4 py-3 text-center text-sm font-bold text-violet-100">
                  RioExplorer
                </Link>
              </div>
            </div>
          </div>

          <aside className={`${shellClass()} p-4`}>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
              CPMM Truth
            </div>

            <div className="mt-4 grid gap-3">
              {[
                ["Spot price", `${fmt(quote?.spotPrice ?? spotPrice(selectedPool), 8)} ${quote?.toAsset?.symbol || quoteSymbol}/${quote?.fromAsset?.symbol || fromSymbol}`],
                ["Execution price", quote?.ok ? fmt(quote.executionPrice, 8) : "—"],
                ["Fee", quote?.ok ? `${fmt(quote.feeAmount, 8)} ${fromSymbol} · ${quote.feeBps} bps` : `${selectedPool?.pool?.feeBps || 30} bps`],
                ["k before", quote?.ok ? fmt(quote.k?.before, 2) : "—"],
                ["k after", quote?.ok ? fmt(quote.k?.after, 2) : "—"],
                ["TVL", money(selectedPool?.valuation?.tvlRusd || 0)],
              ].map(([label, value]) => (
                <div key={label} className={cardClass()}>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
                  <div className="mt-1 break-words text-sm font-black text-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Reserve movement</div>

              <div className="mt-3 grid gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="text-xs text-slate-400">Reserve in</div>
                  <div className="text-sm font-black text-white">
                    {quote?.ok ? `${fmt(quote.reserves?.before?.in, 4)} → ${fmt(quote.reserves?.after?.in, 4)}` : "—"}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="text-xs text-slate-400">Reserve out</div>
                  <div className="text-sm font-black text-white">
                    {quote?.ok ? `${fmt(quote.reserves?.before?.out, 4)} → ${fmt(quote.reserves?.after?.out, 4)}` : "—"}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
