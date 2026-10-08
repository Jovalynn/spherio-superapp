"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ValuedPortfolio, NormalizedPortfolioAsset } from "@/lib/rioValuation";

const WALLET_KEYS = [
  "spherio_wallet_address",
  "riolight.activeAddress",
  "spherio.activeAddress",
  "spherio.connectedAddress",
  "wallet.activeAddress",
];

function readWalletAddress() {
  if (typeof window === "undefined") return "";

  for (const key of WALLET_KEYS) {
    const value = String(window.localStorage.getItem(key) || "").trim();
    if (value) return value;
  }

  return "";
}

function short(value?: string | null) {
  const raw = String(value || "");
  if (!raw) return "—";
  if (raw.length <= 18) return raw;
  return `${raw.slice(0, 10)}…${raw.slice(-8)}`;
}

function compact(value: number | null | undefined, decimals = 6) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(n);
}

function money(value: number | null | undefined, decimals = 2) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(n);
}

function sourceLabel(source?: string | null) {
  switch (source) {
    case "rioex_valuation_rio":
      return "RIO/RUSD CPMM";
    case "spo20_riodex_cpmm":
      return "SPO-20/RIO CPMM";
    case "rusd_nominal_balance":
      return "RUSD balance";
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

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
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

export default function RioExAssetsPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [portfolio, setPortfolio] = useState<ValuedPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [valuationCurrency, setValuationCurrency] = useState<"RIO" | "RUSD" | "USDT" | "BTC">("RUSD");
  const [pricedPage, setPricedPage] = useState(1);
  const [unpricedPage, setUnpricedPage] = useState(1);

  const PAGE_SIZE = 10;

  useEffect(() => {
    const update = () => setWalletAddress(readWalletAddress());

    update();

    window.addEventListener("storage", update);
    window.addEventListener("spherio:wallet-changed", update as EventListener);

    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("spherio:wallet-changed", update as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (!walletAddress) {
        setPortfolio(null);
        setLoading(false);
        return;
      }

      const payload = await fetchJson<ValuedPortfolio>(
        `/api/riolight/portfolio/value?address=${encodeURIComponent(walletAddress)}`
      );

      if (!cancelled) {
        setPortfolio(payload);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const assets = portfolio?.assets ?? [];

  const pricedAssets = useMemo(
    () => assets.filter((asset) => asset.valuation_status === "priced"),
    [assets],
  );

  const unpricedAssets = useMemo(
    () => assets.filter((asset) => asset.valuation_status !== "priced"),
    [assets],
  );

  useEffect(() => {
    setPricedPage(1);
  }, [pricedAssets.length]);

  useEffect(() => {
    setUnpricedPage(1);
  }, [unpricedAssets.length]);

  const pricedPagination = paginate(pricedAssets, pricedPage, PAGE_SIZE);
  const unpricedPagination = paginate(unpricedAssets, unpricedPage, PAGE_SIZE);

  const totals = useMemo(() => {
    return {
      totalRio: portfolio?.totals?.rio ?? null,
      totalRusd: portfolio?.totals?.rusd ?? null,
      totalUsd: portfolio?.totals?.usd ?? null,
      totalUsdt: portfolio?.totals?.usdt ?? null,
      totalBtc: portfolio?.totals?.btc ?? null,
      ownedAssets: assets.length,
      pricedCount: pricedAssets.length,
      unpricedCount: unpricedAssets.length,
      spo20Count: assets.filter((asset) => asset.asset_id?.startsWith("rio1")).length,
    };
  }, [portfolio, assets, pricedAssets, unpricedAssets]);

  const totalDisplay =
    valuationCurrency === "RIO"
      ? `${compact(totals.totalRio, 6)} RIO`
      : valuationCurrency === "RUSD"
        ? `${money(totals.totalRusd, 2)} RUSD`
        : valuationCurrency === "USDT"
          ? `${money(totals.totalUsdt, 2)} USDT`
          : `${compact(totals.totalBtc, 8)} BTC`;

  function assetValue(asset: NormalizedPortfolioAsset) {
    if (valuationCurrency === "RIO") return `${compact(asset.value_rio, 6)} RIO`;
    if (valuationCurrency === "RUSD") return `${money(asset.value_rusd, 6)} RUSD`;
    if (valuationCurrency === "USDT") return `${money(asset.value_usdt, 6)} USDT`;
    return "BTC pending";
  }

  return (
    <main className="min-h-screen bg-[#05070d] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/60">
              RioEx Asset
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
              Owner Assets & Total Value
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">
              Portfolio truth is sourced from RioLight and valued through RioDex CPMM. Native RIO,
              RUSD, and liquid SPO-20 assets are included. Assets without CPMM liquidity remain
              visible but unpriced.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/rioex"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/[0.08]"
            >
              Market
            </Link>
            <Link
              href="/rioex/trade"
              className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/15"
            >
              Trade
            </Link>
            <Link
              href="/riodex/swap"
              className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/15"
            >
              Swap
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),rgba(0,0,0,0.35)] p-5 shadow-[0_0_55px_rgba(34,211,238,0.08)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/55">
                Connected owner
              </div>
              <div className="mt-2 break-all text-sm font-semibold text-white/80">
                {walletAddress ? short(walletAddress) : "No RioLight wallet detected"}
              </div>
              <div className="mt-4 text-4xl font-black tracking-tight">
                {loading ? "Loading…" : totalDisplay}
              </div>
              <div className="mt-2 text-sm text-white/45">
                {portfolio?.valuation?.price?.rio?.rusd !== null &&
                portfolio?.valuation?.price?.rio?.rusd !== undefined
                  ? `1 RIO = ${compact(portfolio.valuation.price.rio.rusd, 6)} RUSD`
                  : "RIO valuation pending"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["RIO", "RUSD", "USDT", "BTC"] as const).map((currency) => (
                <button
                  key={currency}
                  type="button"
                  onClick={() => setValuationCurrency(currency)}
                  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
                    valuationCurrency === currency
                      ? "bg-cyan-300 text-slate-950"
                      : "border border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08]"
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/35">Total RIO</div>
              <div className="mt-2 text-xl font-bold">{compact(totals.totalRio, 6)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/35">Total RUSD</div>
              <div className="mt-2 text-xl font-bold">{money(totals.totalRusd, 2)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/35">Priced</div>
              <div className="mt-2 text-xl font-bold">{totals.pricedCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/35">Unpriced</div>
              <div className="mt-2 text-xl font-bold">{totals.unpricedCount}</div>
            </div>
          </div>
        </div>

        {!walletAddress ? (
          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100/85">
            Connect RioLight from the wallet modal first. Asset values will appear once a valid
            owner wallet address is available.
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-white/40">
                  Priced Assets
                </div>
                <h2 className="mt-1 text-xl font-bold">Included in total value</h2>
              </div>
              <div className="text-sm text-white/45">{pricedAssets.length} assets</div>
            </div>

            <div className="space-y-3">
              {pricedAssets.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">
                  No priced assets yet.
                </div>
              ) : (
                pricedPagination.items.map((asset) => (
                  <div
                    key={`priced-${asset.asset_id}-${asset.symbol}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black">{asset.symbol}</span>
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                          Priced
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white/42">{asset.name || asset.asset_id}</div>
                      <div className="mt-1 text-xs text-white/36">{sourceLabel(asset.valuation_source)}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-white/45">{compact(asset.amount, 6)} {asset.symbol}</div>
                      <div className="mt-1 text-lg font-bold">{assetValue(asset)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Pager
              page={pricedPagination.page}
              totalPages={pricedPagination.totalPages}
              start={pricedPagination.start}
              end={pricedPagination.end}
              total={pricedAssets.length}
              onPrev={() => setPricedPage((page) => Math.max(1, page - 1))}
              onNext={() => setPricedPage((page) => Math.min(pricedPagination.totalPages, page + 1))}
            />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.22em] text-white/40">
                Unpriced Assets
              </div>
              <h2 className="mt-1 text-xl font-bold">Awaiting CPMM liquidity</h2>
            </div>

            <div className="space-y-3">
              {unpricedAssets.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">
                  No unpriced assets.
                </div>
              ) : (
                unpricedPagination.items.map((asset) => (
                  <div
                    key={`unpriced-${asset.asset_id}-${asset.symbol}`}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold">{asset.symbol}</div>
                        <div className="mt-1 text-xs text-white/38">{compact(asset.amount, 6)} units</div>
                      </div>
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">
                        Unpriced
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-white/35">{sourceLabel(asset.valuation_source)}</div>
                  </div>
                ))
              )}
            </div>

            <Pager
              page={unpricedPagination.page}
              totalPages={unpricedPagination.totalPages}
              start={unpricedPagination.start}
              end={unpricedPagination.end}
              total={unpricedAssets.length}
              onPrev={() => setUnpricedPage((page) => Math.max(1, page - 1))}
              onNext={() => setUnpricedPage((page) => Math.min(unpricedPagination.totalPages, page + 1))}
            />
          </div>
        </section>
      </section>
    </main>
  );
}
