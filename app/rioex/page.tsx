"use client";

import Link from "next/link";
import { useRioExMarkets } from "@/hooks/rioex/useRioExMarkets";
import { RIOEX_FEE_COLLECTOR } from "@/lib/rioex/config";
import ExchangeSurfaceRail from "@/components/exchange/ExchangeSurfaceRail";

function formatAmount(value: string | number, max = 6) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
    minimumFractionDigits: 0,
  }).format(num);
}

function formatInteger(value: string | number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(num);
}

function shortAddr(v?: string | null, left = 10, right = 8) {
  if (!v) return "—";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

function formatTimestamp(value?: number | null) {
  if (!value) return "Live index active";
  try {
    const ms = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(ms).toLocaleString();
  } catch {
    return "Live index active";
  }
}

function marketStatusTone(status: string) {
  return status === "live"
    ? "rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-200"
    : "rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-200";
}

function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "primary";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : tone === "primary"
      ? "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200"
      : "border-white/10 bg-white/5 text-white/75";

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${cls}`}>
      {label}
    </span>
  );
}

export default function RioExPage() {
  const { markets, summary, loading, error, refresh } = useRioExMarkets();

  const hasMarkets = markets.length > 0;
  const canonicalMarket = markets.find((m) => m.label === "RIO / RUSD") || markets[0] || null;

  const canonicalBase = Number(canonicalMarket?.asset0Amount || "0");
  const canonicalQuote = Number(canonicalMarket?.asset1Amount || "0");
  const canonicalPrice = canonicalBase > 0 ? canonicalQuote / canonicalBase : 0;

  const canonicalLiquidityLabel = canonicalMarket
    ? `${formatAmount(canonicalMarket.asset0Amount)} RIO / ${formatAmount(canonicalMarket.asset1Amount)} RUSD`
    : "Unavailable";

  const canonicalLpShare = canonicalMarket
    ? formatInteger(canonicalMarket.totalShare)
    : "Unavailable";

  const canonicalPoolAddress = canonicalMarket?.pairAddress || null;
  const canonicalUpdatedAt = formatTimestamp(canonicalMarket?.createdAtTime);

  return (
    <main className="min-h-screen bg-[#05070a] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <ExchangeSurfaceRail />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-white/50">RioEx</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Exchange, Discovery, Market Intelligence
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/65">
            RioEx is the market intelligence and discovery layer above RioDex — the surface where
            canonical markets are identified, verified, monitored, and eventually distributed across
            the broader market ecosystem.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Markets
              </div>
              <div className="mt-2 text-2xl font-semibold">{summary.totalMarkets}</div>
              <div className="mt-1 text-xs text-white/45">Factory-discovered pairs</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Live Markets
              </div>
              <div className="mt-2 text-2xl font-semibold">{summary.liveMarkets}</div>
              <div className="mt-1 text-xs text-white/45">Canonical execution venues resolved</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Canonical Price
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {summary.canonicalPrice > 0 ? formatAmount(summary.canonicalPrice, 6) : "—"}
              </div>
              <div className="mt-1 text-xs text-white/45">RUSD per RIO</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Visible Liquidity
              </div>
              <div className="mt-2 text-lg font-semibold">{canonicalLiquidityLabel}</div>
              <div className="mt-1 text-xs text-white/45">Canonical displayed liquidity</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Treasury
              </div>
              <div className="mt-2 text-sm font-medium text-white">
                {shortAddr(RIOEX_FEE_COLLECTOR, 12, 10)}
              </div>
              <div className="mt-1 text-xs text-white/45">Unified exchange fee collector</div>
            </div>
          </div>

          {canonicalMarket ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(92,14,38,0.22),rgba(18,10,14,0.84))] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                    Canonical Market
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    RIO / RUSD
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
                    The verified primary market for RIO against RUSD — the canonical execution venue
                    surfaced by RioEx and settled through RioDex.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge label="Canonical" tone="primary" />
                  <Badge label="Verified" tone="good" />
                  <Badge label="Live" tone="good" />
                  <Badge label="Indexed" tone="neutral" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-5">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Price</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {canonicalPrice > 0 ? `${formatAmount(canonicalPrice, 6)} RUSD` : "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Liquidity</div>
                  <div className="mt-2 text-lg font-semibold text-white">{canonicalLiquidityLabel}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">LP Share</div>
                  <div className="mt-2 text-xl font-semibold text-white">{canonicalLpShare}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Pool</div>
                  <div className="mt-2 break-all font-mono text-xs text-white/80">
                    {canonicalPoolAddress || "Unavailable"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Last Update</div>
                  <div className="mt-2 text-sm font-medium text-white">{canonicalUpdatedAt}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => void refresh()}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Refresh Markets
            </button>

            <Link
              href="/riodex"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-black/30"
            >
              Open RioDex
            </Link>

            <Link
              href="/riodex/pools"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-black/30"
            >
              Open Pools
            </Link>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
            Loading RioEx markets...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
            {error}
          </div>
        ) : null}

        {!hasMarkets && !loading ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Market bootstrap
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                RioEx is live structurally, awaiting market feed expansion
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/65">
                The discovery surface is now active. As additional canonical markets are deployed,
                RioEx will evolve into the market-facing registry, analytics, and distribution layer
                above RioDex.
              </p>
            </div>
          </section>
        ) : null}

        {hasMarkets ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                  Visible liquidity
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {formatAmount(summary.totalVisibleAsset0)} RIO
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Aggregate displayed first-side liquidity across resolved markets.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                  Visible quote-side
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {formatAmount(summary.totalVisibleAsset1)} RUSD
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Aggregate displayed second-side liquidity across resolved markets.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                  Market readiness
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {summary.liveMarkets} / {summary.totalMarkets}
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Live markets relative to total discovered registry entries.
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
              <div className="grid grid-cols-12 gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-white/45">
                <div className="col-span-4">Market</div>
                <div className="col-span-2">Liquidity</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">LP Share</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Open</div>
              </div>

              {markets.map((market) => {
                const base = Number(market.asset0Amount || "0");
                const quote = Number(market.asset1Amount || "0");
                const price = base > 0 ? quote / base : 0;
                const isCanonical = market.pairAddress === canonicalPoolAddress;

                return (
                  <div
                    key={market.pairKey}
                    className="grid grid-cols-12 gap-4 border-b border-white/5 px-6 py-5 last:border-b-0"
                  >
                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-white">{market.label}</div>
                        {isCanonical ? <Badge label="Canonical" tone="primary" /> : null}
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        {market.pairAddress ? shortAddr(market.pairAddress, 16, 12) : market.pairKey}
                      </div>
                      <div className="mt-2 text-[11px] text-white/35">
                        {isCanonical
                          ? "Verified canonical execution venue"
                          : market.createdAtHeight
                          ? `Created at height ${market.createdAtHeight}`
                          : "Market metadata active"}
                      </div>
                    </div>

                    <div className="col-span-2 text-sm text-white/75">
                      {formatAmount(market.asset0Amount)} RIO / {formatAmount(market.asset1Amount)} RUSD
                    </div>

                    <div className="col-span-2 text-sm text-white/75">
                      {price > 0 ? `${formatAmount(price, 6)} RUSD` : "—"}
                    </div>

                    <div className="col-span-2 text-sm text-white/75">
                      {formatInteger(market.totalShare)}
                    </div>

                    <div className="col-span-1">
                      <span className={marketStatusTone(market.status)}>{market.status}</span>
                    </div>

                    <div className="col-span-1">
                      {market.pairAddress ? (
                        <Link
                          href={`/riodex/pool/${market.pairAddress}`}
                          className="inline-flex rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="text-xs text-white/35">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
