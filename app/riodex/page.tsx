export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

type Ticker = {
  pair_address: string;
  symbol?: string;
  price?: number | string;
  reserve0?: number | string;
  reserve1?: number | string;
  total_share?: number | string;
  last_trade_time?: string | null;
  is_canonical?: boolean;
};

async function fetchTickers(): Promise<Ticker[]> {
  try {
    const r = await fetch("http://127.0.0.1:3000/api/v1/riodex/tickers", {
      cache: "no-store",
    });

    if (!r.ok) {
      return [];
    }

    const j = await r.json();
    return Array.isArray(j?.tickers) ? j.tickers : [];
  } catch {
    return [];
  }
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatNumber(n: number, d = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: d,
  }).format(n || 0);
}

function formatCompact(n: number, d = 2) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: d,
  }).format(n || 0);
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(n || 0);
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shell(
  tone:
    | "hero"
    | "panel"
    | "amber"
    | "magenta"
    | "cyan"
    | "slate"
    | "subtle"
) {
  const tones = {
    hero:
      "border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(5,10,22,0.96))] shadow-[0_20px_80px_rgba(0,0,0,0.45)]",
    panel:
      "border-white/10 bg-white/[0.05] shadow-[0_16px_50px_rgba(0,0,0,0.35)]",
    amber:
      "border-amber-400/15 bg-[linear-gradient(180deg,rgba(120,53,15,0.14),rgba(8,12,24,0.96))] shadow-[0_16px_50px_rgba(120,53,15,0.12)]",
    magenta:
      "border-fuchsia-400/15 bg-[linear-gradient(180deg,rgba(90,24,65,0.18),rgba(8,12,24,0.96))] shadow-[0_16px_50px_rgba(168,85,247,0.10)]",
    cyan:
      "border-cyan-400/15 bg-[linear-gradient(180deg,rgba(8,65,82,0.18),rgba(8,12,24,0.96))] shadow-[0_16px_50px_rgba(34,211,238,0.10)]",
    slate:
      "border-slate-400/15 bg-[linear-gradient(180deg,rgba(51,65,85,0.18),rgba(8,12,24,0.96))] shadow-[0_16px_50px_rgba(15,23,42,0.28)]",
    subtle:
      "border-white/8 bg-white/[0.04] shadow-[0_12px_34px_rgba(0,0,0,0.28)]",
  };

  return `rounded-[28px] border backdrop-blur-xl ${tones[tone]}`;
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className={`${shell("subtle")} p-5`}>
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
        {label}
      </div>
      <div className={`mt-3 text-2xl font-semibold ${accent || "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function NavPill({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.10]"
    >
      {label}
    </Link>
  );
}

export default async function RioDexHome() {
  const tickers = await fetchTickers();

  const canonical =
    tickers.find((t) => t.is_canonical) ||
    tickers[0] ||
    null;

  const canonicalPrice = toNumber(canonical?.price);
  const canonicalReserve0 = toNumber(canonical?.reserve0);
  const canonicalReserve1 = toNumber(canonical?.reserve1);
  const canonicalShare = toNumber(canonical?.total_share);

  const totalPairs = tickers.length;
  const canonicalPairs = tickers.filter((t) => t.is_canonical).length;
  const totalReserve0 = tickers.reduce((sum, t) => sum + toNumber(t.reserve0), 0);
  const totalReserve1 = tickers.reduce((sum, t) => sum + toNumber(t.reserve1), 0);

  const latestActivity = tickers
    .map((t) => t.last_trade_time)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(110,38,90,0.12),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(245,158,11,0.08),transparent_24%),linear-gradient(180deg,#050914_0%,#08111f_45%,#050914_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">
              RioDex • Institutional Terminal
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Sovereign AMM Market Surface
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Public market intelligence derived from canonical liquidity,
              indexed swaps, and truthful reserve state. No synthetic orderbook,
              no planning placeholders, no custody drift.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <NavPill href="/riodex/markets" label="Markets Board" />
            <NavPill href="/riodex/swap" label="Execution Shell" />
            <NavPill href="/riodex/liquidity" label="Reserve Console" />
          </div>
        </div>

        <section className={`${shell("hero")} overflow-hidden p-6 sm:p-8`}>
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-200">
                  Canonical Market Contract
                </div>

                {canonical?.is_canonical && (
                  <div className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-fuchsia-200">
                    Verified Truth Path
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.22em] text-slate-400">
                    Primary Market
                  </div>
                  <div className="mt-2 text-3xl font-semibold sm:text-4xl">
                    {canonical?.symbol || "No Active Market"}
                  </div>
                </div>

                {canonical?.pair_address && (
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                    {canonical.pair_address.slice(0, 16)}...
                    {canonical.pair_address.slice(-10)}
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    Reference Price
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {formatPrice(canonicalPrice)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Derived from indexed pool state
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    Canonical Reserves
                  </div>
                  <div className="mt-2 text-xl font-semibold text-cyan-200">
                    {formatCompact(canonicalReserve0)} RIO
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    {formatCompact(canonicalReserve1)} RUSD
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    LP Share Supply
                  </div>
                  <div className="mt-2 text-xl font-semibold text-fuchsia-200">
                    {formatCompact(canonicalShare)}
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    Outstanding liquidity share units
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={
                    canonical?.pair_address
                      ? `/riodex/swap?pair=${canonical.pair_address}`
                      : "/riodex/swap"
                  }
                  className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/12 px-5 py-3 text-sm font-medium text-fuchsia-100 transition hover:bg-fuchsia-400/18"
                >
                  Open Execution Shell
                </Link>

                <Link
                  href="/riodex/markets"
                  className="rounded-full border border-amber-400/20 bg-amber-400/10 px-5 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/16"
                >
                  Open Market Board
                </Link>

                <Link
                  href={
                    canonical?.pair_address
                      ? `/riodex/liquidity?pair=${canonical.pair_address}`
                      : "/riodex/liquidity"
                  }
                  className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/16"
                >
                  Open Reserve Console
                </Link>
              </div>
            </div>

            <div className={`${shell("panel")} p-5 sm:p-6`}>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                Market Integrity Snapshot
              </div>

              <div className="mt-5 grid gap-4">
                <StatTile
                  label="Indexed Pairs"
                  value={formatNumber(totalPairs, 0)}
                  accent="text-white"
                />
                <StatTile
                  label="Canonical Pairs"
                  value={formatNumber(canonicalPairs, 0)}
                  accent="text-cyan-200"
                />
                <StatTile
                  label="Latest Observed Trade"
                  value={latestActivity ? formatTime(latestActivity) : "—"}
                  accent="text-amber-100 text-base sm:text-lg"
                />
              </div>

              <div className="mt-5 rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  Public Contract Truth
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <div className="flex items-start justify-between gap-4">
                    <span>Total Indexed RIO Reserve</span>
                    <span className="font-medium text-slate-100">
                      {formatCompact(totalReserve0)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span>Total Indexed RUSD Reserve</span>
                    <span className="font-medium text-slate-100">
                      {formatCompact(totalReserve1)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span>Execution Model</span>
                    <span className="font-medium text-slate-100">
                      Self-custody AMM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className={`${shell("magenta")} p-6`}>
            <div className="text-[11px] uppercase tracking-[0.24em] text-fuchsia-200/80">
              Execution Shell
            </div>
            <div className="mt-3 text-2xl font-semibold">
              Swap against canonical liquidity
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Direct self-custody execution against indexed AMM state with public
              pair visibility and reserve-aware market framing.
            </p>
            <div className="mt-6">
              <Link
                href="/riodex/swap"
                className="inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-400/12 px-4 py-2.5 text-sm text-fuchsia-100 transition hover:bg-fuchsia-400/18"
              >
                Enter Swap Terminal
              </Link>
            </div>
          </div>

          <div className={`${shell("amber")} p-6`}>
            <div className="text-[11px] uppercase tracking-[0.24em] text-amber-200/80">
              Market Board
            </div>
            <div className="mt-3 text-2xl font-semibold">
              Observe indexed pair state
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Institutional market directory for canonical pairs, pricing,
              reserve composition, and pair-level activity without synthetic
              exchange theater.
            </p>
            <div className="mt-6">
              <Link
                href="/riodex/markets"
                className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-100 transition hover:bg-amber-400/16"
              >
                Enter Markets Board
              </Link>
            </div>
          </div>

          <div className={`${shell("cyan")} p-6`}>
            <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/80">
              Reserve Console
            </div>
            <div className="mt-3 text-2xl font-semibold">
              Monitor pool depth and liquidity state
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Reserve-side observability for pair liquidity, pool composition,
              and indexed state history aligned to the authoritative truth layer.
            </p>
            <div className="mt-6">
              <Link
                href="/riodex/liquidity"
                className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-400/16"
              >
                Enter Reserve Console
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                Market Surface
              </div>
              <div className="mt-1 text-2xl font-semibold">
                Indexed ticker board
              </div>
            </div>

            <Link
              href="/riodex/markets"
              className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.10]"
            >
              Full markets view
            </Link>
          </div>

          {tickers.length === 0 ? (
            <div className={`${shell("panel")} p-10 text-center`}>
              <div className="text-lg font-medium text-white">
                No indexed market rows available
              </div>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                The RioDex public façade is reachable, but no ticker rows were
                returned by <span className="text-slate-200">/api/v1/riodex/tickers</span>.
                Verify the façade route payload and confirm canonical pair state is
                being surfaced into the home terminal.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tickers.map((t) => {
                const price = toNumber(t.price);
                const reserve0 = toNumber(t.reserve0);
                const reserve1 = toNumber(t.reserve1);
                const totalShare = toNumber(t.total_share);

                return (
                  <div
                    key={t.pair_address}
                    className={`${shell("panel")} p-5 sm:p-6`}
                  >
                    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-xl font-semibold">
                            {t.symbol || "Unnamed Pair"}
                          </div>

                          {t.is_canonical && (
                            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.20em] text-cyan-200">
                              Canonical
                            </div>
                          )}
                        </div>

                        <div className="mt-3 text-xs text-slate-400">
                          Pair Address
                        </div>
                        <div className="mt-1 break-all text-sm text-slate-300">
                          {t.pair_address}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.20em] text-slate-400">
                            Price
                          </div>
                          <div className="mt-1 text-lg font-semibold">
                            {formatPrice(price)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] uppercase tracking-[0.20em] text-slate-400">
                            Reserve RIO
                          </div>
                          <div className="mt-1 text-lg font-semibold text-cyan-200">
                            {formatCompact(reserve0)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] uppercase tracking-[0.20em] text-slate-400">
                            Reserve RUSD
                          </div>
                          <div className="mt-1 text-lg font-semibold text-amber-100">
                            {formatCompact(reserve1)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] uppercase tracking-[0.20em] text-slate-400">
                            LP Share
                          </div>
                          <div className="mt-1 text-lg font-semibold text-fuchsia-200">
                            {formatCompact(totalShare)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Link
                          href={`/riodex/swap?pair=${t.pair_address}`}
                          className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/12 px-4 py-2 text-sm text-fuchsia-100 transition hover:bg-fuchsia-400/18"
                        >
                          Swap
                        </Link>

                        <Link
                          href={`/riodex/liquidity?pair=${t.pair_address}`}
                          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/16"
                        >
                          Liquidity
                        </Link>

                        <Link
                          href="/riodex/markets"
                          className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-400/16"
                        >
                          Markets
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/8 pt-4 text-sm text-slate-400">
                      Last activity:{" "}
                      <span className="text-slate-200">
                        {formatTime(t.last_trade_time)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
