"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ExchangeSurfaceNav from "@/components/exchange/ExchangeSurfaceNav";

type RioExMarketBoardResponse = {
  ok: boolean;
  source?: {
    type: string;
    database: string;
    tables: string[];
    registryMode?: string;
  };
  filters?: {
    liveOnly: boolean;
    canonicalOnly: boolean;
    sort: "canonical" | "liquidity" | "recent" | "alphabetical";
    q: string;
  };
  count?: number;
  markets?: Array<{
    pairAddress: string;
    displaySymbol: string;
    canonicalSymbol: string;
    baseAssetId: string;
    quoteAssetId: string;
    baseSymbol: string;
    quoteSymbol: string;
    baseDisplayName: string;
    quoteDisplayName: string;
    baseLogoUrl: string | null;
    quoteLogoUrl: string | null;
    baseExplorerRoute?: string | null;
    quoteExplorerRoute?: string | null;
    baseCoingeckoId?: string | null;
    quoteCoingeckoId?: string | null;
    baseCoinmarketcapId?: string | null;
    quoteCoinmarketcapId?: string | null;
    baseDexscreenerChainId?: string | null;
    quoteDexscreenerChainId?: string | null;
    baseDexscreenerTokenAddress?: string | null;
    quoteDexscreenerTokenAddress?: string | null;
    feeBps: number;
    isCanonical: boolean;
    isLive: boolean;
    liquidityUsd: number;
    liquidityHeight: string | number | null;
    liquidityTime: string | null;
    liquiditySource: string | null;
    liquidityUpdatedAt: string | null;
    lastSwapTime: string | null;
    lastSwapTxHash: string | null;
    feeRecipientAddress: string | null;
    feePolicy: string | null;
    quoteConvention: "asset_1_per_asset_0";
    routes: {
      assetTerminal: string;
      marketBoard: string;
      hero: string;
      pool: string;
      swap: string;
      liquidity: string;
    };
    source: string;
  }>;
  error?: string;
};

type SortMode =
  | "canonical"
  | "liquidity"
  | "recent"
  | "alphabetical";

function cardClass() {
  return "rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5 backdrop-blur-xl";
}

function shellClass() {
  return "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
}

function buttonClass(active = false) {
  return active
    ? "rounded-2xl border border-fuchsia-400/28 bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(157,23,77,0.18))] px-4 py-2 text-sm font-semibold text-white"
    : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/90";
}

function badgeClass(kind: "canonical" | "live" | "fee" | "neutral") {
  if (kind === "canonical") {
    return "rounded-full border border-fuchsia-400/25 bg-fuchsia-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200";
  }

  if (kind === "live") {
    return "rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200";
  }

  if (kind === "fee") {
    return "rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200";
  }

  return "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75";
}

function formatMoney(value: number) {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)}`;
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

function shortHash(value?: string | null, left = 12, right = 10) {
  if (!value) return "—";
  if (value.length <= left + right) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

function externalHref(kind: "coingecko" | "coinmarketcap" | "dexscreener", value?: string | null, chainId?: string | null, token?: string | null) {
  if (kind === "coingecko" && value) return `https://www.coingecko.com/en/coins/${value}`;
  if (kind === "coinmarketcap" && value) return `https://coinmarketcap.com/currencies/${value}`;
  if (kind === "dexscreener" && chainId && token) return `https://dexscreener.com/${chainId}/${token}`;
  return null;
}

function intelPillClass(enabled = false) {
  return enabled
    ? "inline-flex h-8 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.045] px-3 text-[11px] font-medium text-white/86"
    : "inline-flex h-8 items-center justify-center rounded-[10px] border border-white/8 bg-black/20 px-3 text-[11px] font-medium text-white/40";
}

function PairMarks({
  leftLogo,
  rightLogo,
  leftFallback,
  rightFallback,
}: {
  leftLogo: string | null;
  rightLogo: string | null;
  leftFallback: string;
  rightFallback: string;
}) {
  return (
    <div className="flex -space-x-3">
      {leftLogo ? (
        <img
          src={leftLogo}
          alt={leftFallback}
          className="h-12 w-12 rounded-full border border-white/10 bg-black/20 object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white">
          {leftFallback.slice(0, 1)}
        </div>
      )}

      {rightLogo ? (
        <img
          src={rightLogo}
          alt={rightFallback}
          className="h-12 w-12 rounded-full border border-white/10 bg-black/20 object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white">
          {rightFallback.slice(0, 1)}
        </div>
      )}
    </div>
  );
}

export default function RioExMarketsBoardPage() {
  const [data, setData] = useState<RioExMarketBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState<SortMode>("canonical");
  const [liveOnly, setLiveOnly] = useState(false);
  const [canonicalOnly, setCanonicalOnly] = useState(false);
  const [query, setQuery] = useState("");

  async function loadBoard() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        sort,
        liveOnly: String(liveOnly),
        canonicalOnly: String(canonicalOnly),
      });

      if (query.trim()) {
        params.set("q", query.trim());
      }

      const response = await fetch(`/api/rioex/markets?${params.toString()}`, {
        cache: "no-store",
      });

      const raw = await response.text();
      const json: RioExMarketBoardResponse | null = raw ? JSON.parse(raw) : null;

      if (!response.ok || !json?.ok) {
        throw new Error(
          json?.error || `RioEx market board failed: ${response.status}`
        );
      }

      setData(json);
    } catch (e: any) {
      setData(null);
      setError(e?.message || "Failed to load RioEx market board.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBoard();
  }, [sort, liveOnly, canonicalOnly]);

  const markets = data?.markets || [];
  const singleMarketMode = markets.length === 1;

  const sourceSummary = useMemo(() => {
    const source = data?.source;
    if (!source) return "—";
    return `${source.type} • ${source.registryMode || "registry"}`;
  }, [data]);

  const featuredMarket = markets[0] || null;
  const integrityUpdatedAt =
    featuredMarket?.liquidityUpdatedAt || featuredMarket?.lastSwapTime || null;

  const featured = featuredMarket
    ? {
        displaySymbol: featuredMarket.displaySymbol,
        liquidityUsd: featuredMarket.liquidityUsd,
        feeBps: featuredMarket.feeBps,
        isCanonical: featuredMarket.isCanonical,
        isLive: featuredMarket.isLive,
        routes: featuredMarket.routes,
      }
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(157,23,77,0.12),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <ExchangeSurfaceNav
          product="rioex"
          activeKey="markets"
          featured={featured}
          title="RioEx Markets Board"
          subtitle="Registry-backed intelligence board for canonical market identity, liquidity truth, fee policy, treasury routing, and market-entry handoff. This surface now follows the same family rhythm as RioDex core pages while Screener remains a distinct RioDex discovery surface."
        />

        {featuredMarket ? (
          <div className="rounded-[22px] border border-cyan-400/16 bg-cyan-500/6 px-5 py-4 text-sm text-white/85">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Integrity Truth
              </span>
              {featuredMarket.isCanonical ? (
                <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200">
                  Canonical
                </span>
              ) : null}
              {featuredMarket.isLive ? (
                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Live
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid gap-2 text-sm text-white/75 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                Registry TVL:{" "}
                <span className="font-semibold text-white">
                  {formatMoney(featuredMarket.liquidityUsd)}
                </span>
              </div>
              <div>
                Liquidity Source:{" "}
                <span className="font-semibold text-white">
                  {featuredMarket.liquiditySource || "unresolved"}
                </span>
              </div>
              <div>
                Fee Policy:{" "}
                <span className="font-semibold text-white">
                  {featuredMarket.feePolicy || "—"}
                </span>
              </div>
              <div>
                Treasury Recipient:{" "}
                <span className="font-semibold text-white">
                  {shortHash(featuredMarket.feeRecipientAddress, 12, 10)}
                </span>
              </div>
            </div>

            <div className="mt-2 text-xs text-white/50">
              Last registry update: {formatDateTime(integrityUpdatedAt)}
            </div>
          </div>
        ) : null}

        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(37,10,24,0.82),rgba(10,9,18,0.94))] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                RioEx • Markets Board
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Registry-backed Markets
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">
                Every market tile, label, logo, route, fee policy, and liquidity
                valuation is resolved from the authoritative RioEx registry layer.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadBoard()}
                className={buttonClass(false)}
              >
                Refresh Board
              </button>
            </div>
          </div>

          <div className={`${shellClass()} mt-6 p-5 sm:p-6`}>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr_1fr]">
              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Registry Source
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {sourceSummary}
                </div>
              </div>

              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Market Count
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {data?.count ?? 0}
                </div>
              </div>

              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Live Filter
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setLiveOnly((v) => !v)}
                    className={buttonClass(liveOnly)}
                  >
                    {liveOnly ? "Live Only On" : "Live Only Off"}
                  </button>
                </div>
              </div>

              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Canonical Filter
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setCanonicalOnly((v) => !v)}
                    className={buttonClass(canonicalOnly)}
                  >
                    {canonicalOnly ? "Canonical Only On" : "Canonical Only Off"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`${shellClass()} mt-6 p-5 sm:p-6`}>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Search Markets
                </div>
                <div className="mt-3 flex gap-3">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search symbol, asset id, display name"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  />
                  <button
                    type="button"
                    onClick={() => void loadBoard()}
                    className={buttonClass(true)}
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Sort
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      ["canonical", "Canonical"],
                      ["liquidity", "Liquidity"],
                      ["recent", "Recent"],
                      ["alphabetical", "A–Z"],
                    ] as Array<[SortMode, string]>
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSort(mode)}
                      className={buttonClass(sort === mode)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/70">
              Loading authoritative RioEx markets board…
            </div>
          ) : (
            <div
              className={`mt-6 ${
                singleMarketMode
                  ? "mx-auto max-w-[1180px]"
                  : "grid gap-5 lg:grid-cols-2 2xl:grid-cols-3"
              }`}
            >
              {markets.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/70">
                  No markets matched the current authoritative filters.
                </div>
              ) : singleMarketMode ? (
                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <article className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
                    {markets.map((market) => (
                      <div key={market.pairAddress}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <PairMarks
                              leftLogo={market.baseLogoUrl}
                              rightLogo={market.quoteLogoUrl}
                              leftFallback={market.baseSymbol}
                              rightFallback={market.quoteSymbol}
                            />
                            <div>
                              <div className="text-3xl font-semibold tracking-tight text-white">
                                {market.displaySymbol}
                              </div>
                              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                                {market.canonicalSymbol}
                              </div>
                              <div className="mt-2 text-sm text-white/60">
                                {market.baseDisplayName} / {market.quoteDisplayName}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {market.isCanonical ? (
                              <span className={badgeClass("canonical")}>
                                Canonical
                              </span>
                            ) : null}
                            {market.isLive ? (
                              <span className={badgeClass("live")}>Live</span>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3 md:grid-cols-4">
                          <div className={cardClass()}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                              Liquidity
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-white">
                              {formatMoney(market.liquidityUsd)}
                            </div>
                            <div className="mt-2 text-[11px] text-white/50">
                              {market.liquiditySource || "unresolved"}
                            </div>
                          </div>

                          <div className={cardClass()}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                              Fee
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-white">
                              {market.feeBps} bps
                            </div>
                            <div className="mt-2 text-[11px] text-white/50">
                              {market.feePolicy || "—"}
                            </div>
                          </div>

                          <div className={cardClass()}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                              Last Swap
                            </div>
                            <div className="mt-2 text-sm font-semibold text-white">
                              {formatDateTime(market.lastSwapTime)}
                            </div>
                          </div>

                          <div className={cardClass()}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                              Liquidity Refresh
                            </div>
                            <div className="mt-2 text-sm font-semibold text-white">
                              {formatDateTime(market.liquidityUpdatedAt)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className={badgeClass("fee")}>
                            Fee Routing • {market.feePolicy || "—"}
                          </span>
                          <span className={badgeClass("neutral")}>
                            {shortHash(market.feeRecipientAddress, 12, 10)}
                          </span>
                        </div>

                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                          <Link
                            href={market.routes.assetTerminal}
                            className={buttonClass(true)}
                          >
                            Open Market
                          </Link>
                          <Link
                            href={market.routes.swap}
                            className={buttonClass(false)}
                          >
                            Swap
                          </Link>
                          <Link
                            href={market.routes.pool}
                            className={buttonClass(false)}
                          >
                            Pool
                          </Link>
                        </div>
                      </div>
                    ))}
                  </article>

                  <aside className="space-y-5">
                    {markets.map((market) => (
                      <div key={`${market.pairAddress}-aside`} className={cardClass()}>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                          Registry Truth
                        </div>
                        <div className="mt-4 grid gap-2 text-xs text-white/65">
                          <div>Base Asset ID: {market.baseAssetId}</div>
                          <div>Quote Asset ID: {market.quoteAssetId}</div>
                          <div>Pair Address: {market.pairAddress}</div>
                          <div>Liquidity Source: {market.liquiditySource || "unresolved"}</div>
                          <div>Last Swap Ref: {shortHash(market.lastSwapTxHash, 12, 8)}</div>
                          <div>Liquidity Height: {market.liquidityHeight ?? "—"}</div>
                          <div>Source: {market.source}</div>
                        </div>
                      </div>
                    ))}

                    {markets.map((market) => (
                      <div key={`${market.pairAddress}-actions`} className={cardClass()}>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                          Featured Market Intelligence
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-white/70">
                          <p>
                            Single-market mode centers the canonical pair and
                            uses a dedicated intelligence rail instead of leaving
                            a large empty right-hand void.
                          </p>
                          <p>
                            This keeps the board balanced until more RioEx
                            markets are live.
                          </p>
                        </div>
                      </div>
                    ))}
                  </aside>
                </div>
              ) : (
                markets.map((market) => (
                  <article
                    key={market.pairAddress}
                    className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <PairMarks
                          leftLogo={market.baseLogoUrl}
                          rightLogo={market.quoteLogoUrl}
                          leftFallback={market.baseSymbol}
                          rightFallback={market.quoteSymbol}
                        />

                        <div>
                          <div className="text-2xl font-semibold tracking-tight text-white">
                            {market.displaySymbol}
                          </div>
                          <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                            {market.canonicalSymbol}
                          </div>
                          <div className="mt-2 text-sm text-white/60">
                            {market.baseDisplayName} / {market.quoteDisplayName}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {market.isCanonical ? (
                          <span className={badgeClass("canonical")}>
                            Canonical
                          </span>
                        ) : null}
                        {market.isLive ? (
                          <span className={badgeClass("live")}>Live</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className={cardClass()}>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                          Liquidity
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">
                          {formatMoney(market.liquidityUsd)}
                        </div>
                        <div className="mt-2 text-[11px] text-white/50">
                          {market.liquiditySource || "unresolved"}
                        </div>
                      </div>

                      <div className={cardClass()}>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                          Fee
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">
                          {market.feeBps} bps
                        </div>
                        <div className="mt-2 text-[11px] text-white/50">
                          {market.feePolicy || "—"}
                        </div>
                      </div>

                      <div className={cardClass()}>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                          Last Swap
                        </div>
                        <div className="mt-2 text-sm font-semibold text-white">
                          {formatDateTime(market.lastSwapTime)}
                        </div>
                      </div>

                      <div className={cardClass()}>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                          Liquidity Refresh
                        </div>
                        <div className="mt-2 text-sm font-semibold text-white">
                          {formatDateTime(market.liquidityUpdatedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className={badgeClass("fee")}>
                        Fee Routing • {market.feePolicy || "—"}
                      </span>
                      <span className={badgeClass("neutral")}>
                        {shortHash(market.feeRecipientAddress, 12, 10)}
                      </span>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                        Registry Truth
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-white/65">
                        <div>Base Asset ID: {market.baseAssetId}</div>
                        <div>Quote Asset ID: {market.quoteAssetId}</div>
                        <div>Pair Address: {market.pairAddress}</div>
                        <div>Liquidity Source: {market.liquiditySource || "unresolved"}</div>
                        <div>Last Swap Ref: {shortHash(market.lastSwapTxHash, 12, 8)}</div>
                        <div>Liquidity Height: {market.liquidityHeight ?? "—"}</div>
                        <div>Source: {market.source}</div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={market.routes.assetTerminal}
                        className={buttonClass(true)}
                      >
                        Open Market
                      </Link>
                      <Link
                        href={market.routes.swap}
                        className={buttonClass(false)}
                      >
                        Swap
                      </Link>
                      <Link
                        href={market.routes.pool}
                        className={buttonClass(false)}
                      >
                        Pool
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
