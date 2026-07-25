"use client";

import { useEffect, useMemo, useState } from "react";
import type { ValuedPortfolio } from "@/lib/rioValuation";

type Props = {
  address?: string | null;
};

function formatAmount(value: number | null | undefined, maximumFractionDigits = 6) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function shortAddress(address?: string | null) {
  if (!address) return "Not connected";
  return `${address.slice(0, 10)}…${address.slice(-6)}`;
}

function sourceLabel(source?: string | null) {
  switch (source) {
    case "rioex_valuation_rio":
      return "RIO/RUSD CPMM";
    case "spo20_riodex_cpmm":
      return "SPO-20/RIO CPMM";
    case "canonical_rusd_par":
      return "RUSD Par";
    case "embedded_asset_value":
      return "Embedded Value";
    case "embedded_rio_value":
      return "Embedded RIO";
    case "spo20_cpmm_unpriced":
      return "No CPMM Pair";
    case "spo20_cpmm_error":
      return "CPMM Error";
    default:
      return source || "Unpriced";
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

function MiniPager({
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
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/45">
      <span>
        Showing {start + 1}–{end} of {total}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 font-semibold text-white/65 disabled:opacity-35"
        >
          Prev
        </button>

        <span className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 font-semibold text-cyan-100">
          Page {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 font-semibold text-white/65 disabled:opacity-35"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function RioLightPortfolioValuePanel({ address }: Props) {
  const [data, setData] = useState<ValuedPortfolio | null>(null);
  const [loading, setLoading] = useState(Boolean(address));
  const [error, setError] = useState<string | null>(null);
  const [pricedPage, setPricedPage] = useState(1);
  const [unpricedPage, setUnpricedPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!address) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const walletAddress = address;

    let alive = true;

    async function load() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/riolight/portfolio/value?address=${encodeURIComponent(walletAddress)}`,
          { cache: "no-store" },
        );

        const json = await response.json();

        if (!alive) return;

        if (!response.ok || !json?.ok) {
          setError(json?.error ?? "Portfolio valuation unavailable");
          setData(null);
          return;
        }

        setData(json);
        setError(null);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Portfolio valuation failed");
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    const timer = setInterval(load, 20_000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [address]);

  const pricedAssets = useMemo(() => {
    return data?.assets?.filter((asset) => asset.valuation_status === "priced") ?? [];
  }, [data]);

  const unpricedAssets = useMemo(() => {
    return data?.assets?.filter((asset) => asset.valuation_status !== "priced") ?? [];
  }, [data]);

  const pricedPagination = paginate(pricedAssets, pricedPage, PAGE_SIZE);
  const unpricedPagination = paginate(unpricedAssets, unpricedPage, PAGE_SIZE);

  useEffect(() => {
    setPricedPage(1);
    setUnpricedPage(1);
  }, [address, pricedAssets.length, unpricedAssets.length]);

  const rioPriceRusd = data?.valuation?.price?.rio?.rusd ?? null;
  const valuationSource = data?.valuation?.source ?? null;
  const valuationAuthority = data?.valuation?.authority ?? null;

  if (!address) {
    return (
      <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.04] p-5 text-white/65 shadow-[0_0_40px_rgba(34,211,238,0.06)] backdrop-blur-xl">
        <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/60">
          Portfolio value layer
        </div>
        <div className="mt-2 text-lg font-semibold text-white">
          Connect RioLight to view live portfolio valuation.
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
          Native RIO, RUSD, and any SPO-20 asset with real RioDex CPMM liquidity will be priced.
          Assets without liquidity remain clearly marked as unpriced.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_32%),rgba(0,0,0,0.32)] p-5 text-white shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/60">
            RioLight portfolio value
          </div>

          <h3 className="mt-2 text-3xl font-semibold tracking-tight">
            {loading ? "Loading…" : `${formatAmount(data?.totals?.rusd, 2)} RUSD`}
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
            Connected wallet {shortAddress(address)} valued through RioDex CPMM truth. Native RIO
            and liquid SPO-20 assets are included; unpriced assets are excluded from totals.
            Total value is shown in RIO, RUSD, USD, and USDT. BTC remains pending until a real
            bridge/oracle source exists.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
            {data?.valuation?.ok ? "Live priced" : "Awaiting valuation"}
          </div>

          <div className="text-right text-[11px] uppercase tracking-[0.18em] text-white/35">
            {valuationAuthority || "RioDex CPMM"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">Total RIO</div>
          <div className="mt-2 text-xl font-semibold">{formatAmount(data?.totals?.rio, 6)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">Total RUSD</div>
          <div className="mt-2 text-xl font-semibold">{formatAmount(data?.totals?.rusd, 2)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">USD Eq.</div>
          <div className="mt-2 text-xl font-semibold">{formatAmount(data?.totals?.usd, 2)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">USDT Eq.</div>
          <div className="mt-2 text-xl font-semibold">{formatAmount(data?.totals?.usdt, 2)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/50">RIO price</div>
          <div className="mt-2 text-lg font-semibold">1 RIO = {formatAmount(rioPriceRusd, 6)} RUSD</div>
          <div className="mt-1 text-xs text-white/40">{sourceLabel(valuationSource)}</div>
        </div>

        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/50">Priced assets</div>
          <div className="mt-2 text-lg font-semibold">{pricedAssets.length}</div>
          <div className="mt-1 text-xs text-white/40">Included in totals</div>
        </div>

        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-amber-100/50">Unpriced assets</div>
          <div className="mt-2 text-lg font-semibold">{unpricedAssets.length}</div>
          <div className="mt-1 text-xs text-white/40">Excluded until CPMM-priced</div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
            Priced assets
          </div>

          <div className="space-y-2">
            {pricedAssets.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/50">
                No priced assets found yet.
              </div>
            ) : (
              pricedPagination.items.map((asset) => (
                <div
                  key={`priced-${asset.asset_id}-${asset.symbol}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                >
                  <div>
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-xs text-white/40">
                      {formatAmount(asset.amount, 6)} · {sourceLabel(asset.valuation_source)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">{formatAmount(asset.value_rusd, 6)} RUSD</div>
                    <div className="text-xs text-white/40">
                      {formatAmount(asset.value_rio, 6)} RIO
                    </div>
                  </div>
                </div>
              ))
            )}

            <MiniPager
              page={pricedPagination.page}
              totalPages={pricedPagination.totalPages}
              start={pricedPagination.start}
              end={pricedPagination.end}
              total={pricedAssets.length}
              onPrev={() => setPricedPage((page) => Math.max(1, page - 1))}
              onNext={() =>
                setPricedPage((page) =>
                  Math.min(pricedPagination.totalPages, page + 1),
                )
              }
            />
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
            Unpriced assets
          </div>

          <div className="space-y-2">
            {unpricedAssets.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/50">
                No unpriced assets found.
              </div>
            ) : (
              unpricedPagination.items.map((asset) => (
                <div
                  key={`unpriced-${asset.asset_id}-${asset.symbol}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div>
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-xs text-white/40">
                      {formatAmount(asset.amount, 6)} · {sourceLabel(asset.valuation_source)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs text-amber-200">
                    Unpriced
                  </div>
                </div>
              ))
            )}

            <MiniPager
              page={unpricedPagination.page}
              totalPages={unpricedPagination.totalPages}
              start={unpricedPagination.start}
              end={unpricedPagination.end}
              total={unpricedAssets.length}
              onPrev={() => setUnpricedPage((page) => Math.max(1, page - 1))}
              onNext={() =>
                setUnpricedPage((page) =>
                  Math.min(unpricedPagination.totalPages, page + 1),
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs leading-5 text-white/40">
        BTC remains null until Spherio has a trusted BTC valuation source or bridge/oracle route.
        RUSD/USDT/USDC bridge-aware valuation should be enabled later through Axelar once live,
        indexed, and tested.
      </div>
    </section>
  );
}
