"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ExchangeSurfaceNav from "@/components/exchange/ExchangeSurfaceNav";

type BoardResponse = {
  ok: boolean;
  source?: {
    type: string;
    database: string;
    tables: string[];
    registryMode?: string;
  };
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
    baseAssetType?: string | null;
    quoteAssetType?: string | null;
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
      trade?: string;
      pool: string;
      swap: string;
      liquidity: string;
    };
    source: string;
  }>;
  error?: string;
};

type AssetRoutes = {
  profile: string;
  market: string;
  trade: string;
  swap: string;
  pool: string;
  liquidity: string;
};

type AssetSurface = {
  assetId: string;
  symbol: string;
  displayName: string;
  logoUrl: string | null;
  assetType: string;
  explorerRoute: string | null;
  coingeckoId: string | null;
  coinmarketcapId: string | null;
  dexscreenerChainId: string | null;
  dexscreenerTokenAddress: string | null;
  liquidityUsd: number;
  marketCount: number;
  canonicalCount: number;
  liveCount: number;
  liquiditySource: string | null;
  feePolicy: string | null;
  treasuryRecipient: string | null;
  updatedAt: string | null;
  routes: AssetRoutes;
  primaryLiquidity: number;
};

function cardClass() {
  return "rounded-[20px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 backdrop-blur-xl";
}

function heroCardClass() {
  return "rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,28,60,0.92),rgba(10,15,36,0.96))] p-5";
}

function shellClass() {
  return "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(37,10,24,0.82),rgba(10,9,18,0.94))] p-5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-6";
}

function buttonClass(active = false) {
  return active
    ? "rounded-2xl border border-fuchsia-400/28 bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(157,23,77,0.18))] px-4 py-2 text-sm font-semibold text-white"
    : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/90";
}

function pillClass(kind: "canonical" | "live" | "neutral" = "neutral") {
  if (kind === "canonical") {
    return "rounded-full border border-fuchsia-400/25 bg-fuchsia-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200";
  }
  if (kind === "live") {
    return "rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200";
  }
  return "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75";
}

function miniActionClass(primary = false) {
  return primary
    ? "inline-flex h-9 items-center justify-center rounded-[12px] border border-cyan-400 bg-cyan-400/8 px-3 text-[12px] font-semibold text-cyan-200 hover:bg-cyan-400/12"
    : "inline-flex h-9 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.04] px-3 text-[12px] font-medium text-white/90 hover:bg-white/[0.08]";
}

function intelPillClass(enabled = false) {
  return enabled
    ? "inline-flex h-8 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.045] px-3 text-[11px] font-medium text-white/86"
    : "inline-flex h-8 items-center justify-center rounded-[10px] border border-white/8 bg-black/20 px-3 text-[11px] font-medium text-white/40";
}

function formatMoney(value: number) {
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function shortValue(value?: string | null, left = 12, right = 10) {
  if (!value) return "—";
  if (value.length <= left + right) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

function inferAssetType(assetId: string) {
  if (assetId === "urio") return "native";
  if (assetId.startsWith("rio1")) return "spo20";
  return "asset";
}

function AssetMarks({ logo, fallback }: { logo: string | null; fallback: string }) {
  return logo ? (
    <img src={logo} alt={fallback} className="h-12 w-12 rounded-full border border-white/10 bg-black/20 object-cover" />
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white">
      {fallback.slice(0, 1)}
    </div>
  );
}

function AssetOpenMenu({ routes }: { routes: AssetRoutes }) {
  return (
    <details className="group relative">
      <summary className="list-none">
        <span className={miniActionClass(true)}>Open</span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-[16px] border border-white/10 bg-[#0b122f] shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
        <Link href={routes.profile} className="block border-b border-white/8 px-4 py-3 text-sm text-cyan-200 hover:bg-white/[0.06]">
          Asset Profile
        </Link>
        <Link href={routes.market} className="block border-b border-white/8 px-4 py-3 text-sm text-white/88 hover:bg-white/[0.06]">
          Market
        </Link>
        <Link href={routes.trade} className="block border-b border-white/8 px-4 py-3 text-sm text-white/88 hover:bg-white/[0.06]">
          Trade
        </Link>
        <Link href={routes.swap} className="block border-b border-white/8 px-4 py-3 text-sm text-white/88 hover:bg-white/[0.06]">
          Swap
        </Link>
        <Link href={routes.pool} className="block border-b border-white/8 px-4 py-3 text-sm text-white/88 hover:bg-white/[0.06]">
          Pool
        </Link>
        <Link href={routes.liquidity} className="block px-4 py-3 text-sm text-white/88 hover:bg-white/[0.06]">
          Liquidity
        </Link>
      </div>
    </details>
  );
}

function externalHref(kind: "coingecko" | "coinmarketcap" | "dexscreener", asset: AssetSurface) {
  if (kind === "coingecko" && asset.coingeckoId) return `https://www.coingecko.com/en/coins/${asset.coingeckoId}`;
  if (kind === "coinmarketcap" && asset.coinmarketcapId) return `https://coinmarketcap.com/currencies/${asset.coinmarketcapId}`;
  if (kind === "dexscreener" && asset.dexscreenerChainId && asset.dexscreenerTokenAddress) {
    return `https://dexscreener.com/${asset.dexscreenerChainId}/${asset.dexscreenerTokenAddress}`;
  }
  return null;
}

export default function RioExAssetsPage() {
  const [data, setData] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAssets() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/rioex/markets?canonicalOnly=false&sort=liquidity", { cache: "no-store" });
      const raw = await response.text();
      const json: BoardResponse | null = raw ? JSON.parse(raw) : null;

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to load RioEx assets.");
      }

      setData(json);
    } catch (e: any) {
      setData(null);
      setError(e?.message || "Failed to load RioEx assets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssets();
  }, []);

  const markets = data?.markets || [];

  const featured = useMemo(() => {
    return markets[0]
      ? {
          displaySymbol: markets[0].displaySymbol,
          liquidityUsd: markets[0].liquidityUsd,
          feeBps: markets[0].feeBps,
          isCanonical: markets[0].isCanonical,
          isLive: markets[0].isLive,
          routes: {
            ...markets[0].routes,
            trade: markets[0].routes.trade || `${markets[0].routes.assetTerminal}/trades`,
          },
        }
      : null;
  }, [markets]);

  const assets = useMemo<AssetSurface[]>(() => {
    const byAsset = new Map<string, AssetSurface>();

    for (const market of markets) {
      const sides = [
        {
          assetId: market.baseAssetId,
          symbol: market.baseSymbol,
          displayName: market.baseDisplayName,
          logoUrl: market.baseLogoUrl,
          assetType: market.baseAssetType || null,
          explorerRoute: market.baseExplorerRoute || null,
          coingeckoId: market.baseCoingeckoId || null,
          coinmarketcapId: market.baseCoinmarketcapId || null,
          dexscreenerChainId: market.baseDexscreenerChainId || null,
          dexscreenerTokenAddress: market.baseDexscreenerTokenAddress || null,
        },
        {
          assetId: market.quoteAssetId,
          symbol: market.quoteSymbol,
          displayName: market.quoteDisplayName,
          logoUrl: market.quoteLogoUrl,
          assetType: market.quoteAssetType || null,
          explorerRoute: market.quoteExplorerRoute || null,
          coingeckoId: market.quoteCoingeckoId || null,
          coinmarketcapId: market.quoteCoinmarketcapId || null,
          dexscreenerChainId: market.quoteDexscreenerChainId || null,
          dexscreenerTokenAddress: market.quoteDexscreenerTokenAddress || null,
        },
      ];

      for (const side of sides) {
        const marketRoute = market.routes.assetTerminal || `/rioex/markets/${encodeURIComponent(market.pairAddress)}`;
        const tradeRoute = market.routes.trade || `${marketRoute}/trades`;

      const routes: AssetRoutes = {
          profile: `/rioex/assets/${encodeURIComponent(side.assetId)}?projectName=${encodeURIComponent(
            side.displayName || side.symbol,
          )}&symbol=${encodeURIComponent(side.symbol)}&templateId=registry_asset&templateName=Registry%20Asset&screenerLabel=${encodeURIComponent(
            side.symbol,
          )}`,
          market: marketRoute,
          trade: tradeRoute,
          swap: market.routes.swap,
          pool: market.routes.pool,
          liquidity: market.routes.liquidity,
        };
        const current = byAsset.get(side.assetId);

        if (!current) {
          byAsset.set(side.assetId, {
            assetId: side.assetId,
            symbol: side.symbol,
            displayName: side.displayName,
            logoUrl: side.logoUrl,
            assetType: side.assetType || inferAssetType(side.assetId),
            explorerRoute: side.explorerRoute,
            coingeckoId: side.coingeckoId,
            coinmarketcapId: side.coinmarketcapId,
            dexscreenerChainId: side.dexscreenerChainId,
            dexscreenerTokenAddress: side.dexscreenerTokenAddress,
            liquidityUsd: market.liquidityUsd,
            marketCount: 1,
            canonicalCount: market.isCanonical ? 1 : 0,
            liveCount: market.isLive ? 1 : 0,
            liquiditySource: market.liquiditySource || null,
            feePolicy: market.feePolicy || null,
            treasuryRecipient: market.feeRecipientAddress || null,
            updatedAt: market.liquidityUpdatedAt || market.lastSwapTime || null,
            routes,
            primaryLiquidity: market.liquidityUsd,
          });
        } else {
          current.liquidityUsd += market.liquidityUsd;
          current.marketCount += 1;
          current.canonicalCount += market.isCanonical ? 1 : 0;
          current.liveCount += market.isLive ? 1 : 0;

          if (market.liquidityUsd > current.primaryLiquidity) {
            current.primaryLiquidity = market.liquidityUsd;
            current.routes = routes;
            current.liquiditySource = market.liquiditySource || null;
            current.feePolicy = market.feePolicy || null;
            current.treasuryRecipient = market.feeRecipientAddress || null;
          }

          if (!current.updatedAt || (market.liquidityUpdatedAt && new Date(market.liquidityUpdatedAt) > new Date(current.updatedAt))) {
            current.updatedAt = market.liquidityUpdatedAt || market.lastSwapTime || current.updatedAt;
          }

          if (!current.explorerRoute && side.explorerRoute) current.explorerRoute = side.explorerRoute;
          if (!current.coingeckoId && side.coingeckoId) current.coingeckoId = side.coingeckoId;
          if (!current.coinmarketcapId && side.coinmarketcapId) current.coinmarketcapId = side.coinmarketcapId;
          if (!current.dexscreenerChainId && side.dexscreenerChainId) current.dexscreenerChainId = side.dexscreenerChainId;
          if (!current.dexscreenerTokenAddress && side.dexscreenerTokenAddress) current.dexscreenerTokenAddress = side.dexscreenerTokenAddress;
        }
      }
    }

    return Array.from(byAsset.values()).sort((a, b) => b.liquidityUsd - a.liquidityUsd);
  }, [markets]);

  const featuredAsset = assets[0] || null;
  const totalLiquidity = assets.reduce((sum, asset) => sum + asset.liquidityUsd, 0);
  const totalMarkets = assets.reduce((sum, asset) => sum + asset.marketCount, 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(157,23,77,0.12),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <ExchangeSurfaceNav
          product="rioex"
          activeKey="assets"
          featured={featured}
          title="RioEx Asset Surfaces"
          subtitle="Registry-backed asset discovery surface derived from authoritative RioEx market rows, with lightweight external-intelligence surfacing and the same exchange-family language."
        />

        {featuredAsset ? (
          <div className="-mt-3 rounded-[22px] border border-cyan-400/16 bg-cyan-500/6 px-5 py-4 text-sm text-white/85">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Integrity Truth</span>
              {featuredAsset.canonicalCount > 0 ? <span className={pillClass("canonical")}>Canonical</span> : null}
              {featuredAsset.liveCount > 0 ? <span className={pillClass("live")}>Live</span> : null}
            </div>

            <div className="mt-3 grid gap-2 text-sm text-white/75 sm:grid-cols-2 xl:grid-cols-4">
              <div>Registry TVL: <span className="font-semibold text-white">{formatMoney(featuredAsset.liquidityUsd)}</span></div>
              <div>Liquidity Source: <span className="font-semibold text-white">{featuredAsset.liquiditySource || "unresolved"}</span></div>
              <div>Fee Policy: <span className="font-semibold text-white">{featuredAsset.feePolicy || "—"}</span></div>
              <div>Treasury Recipient: <span className="font-semibold text-white">{shortValue(featuredAsset.treasuryRecipient, 12, 10)}</span></div>
            </div>

            <div className="mt-2 text-xs text-white/50">Last registry update: {formatDateTime(featuredAsset.updatedAt)}</div>
          </div>
        ) : null}

        <section className={shellClass()}>
          <div className="grid gap-4 xl:grid-cols-[0.94fr_0.66fr]">
            <div className={heroCardClass()}>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">RioEx • Assets</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Asset Intelligence</h1>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className={cardClass()}>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Est. Total Value</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{formatMoney(totalLiquidity)}</div>
                </div>
                <div className={cardClass()}>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Listed Assets</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{assets.length}</div>
                </div>
                <div className={cardClass()}>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Linked Markets</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{totalMarkets}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/rioex/markets" className={buttonClass(true)}>Open Markets Board</Link>
                <button type="button" onClick={() => void loadAssets()} className={buttonClass(false)}>Refresh Assets</button>
              </div>
            </div>

            <div className={heroCardClass()}>
              {featuredAsset ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <AssetMarks logo={featuredAsset.logoUrl} fallback={featuredAsset.symbol} />
                    <div>
                      <div className="text-2xl font-semibold tracking-tight text-white">{featuredAsset.symbol}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{featuredAsset.assetType}</div>
                      <div className="mt-1 text-sm text-white/60">{featuredAsset.displayName}</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={cardClass()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Asset Liquidity</div>
                      <div className="mt-2 text-xl font-semibold text-white">{formatMoney(featuredAsset.liquidityUsd)}</div>
                    </div>
                    <div className={cardClass()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Related Markets</div>
                      <div className="mt-2 text-xl font-semibold text-white">{featuredAsset.marketCount}</div>
                    </div>
                  </div>

                  <div className={cardClass()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">External Intelligence</div>
                        <div className="mt-2">
                            <Link href={featuredAsset.routes.profile} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                              Open Asset Profile
                            </Link>
                          </div>
                     
                      <div className="mt-3 flex flex-wrap gap-2">
                      {featuredAsset.explorerRoute ? <Link href={featuredAsset.explorerRoute} className={miniActionClass(false)}>Explorer</Link> : <span className={intelPillClass(false)}>Explorer</span>}
                      {externalHref("coingecko", featuredAsset) ? <a href={externalHref("coingecko", featuredAsset)!} target="_blank" rel="noreferrer" className={miniActionClass(false)}>CoinGecko</a> : <span className={intelPillClass(false)}>CoinGecko</span>}
                      {externalHref("coinmarketcap", featuredAsset) ? <a href={externalHref("coinmarketcap", featuredAsset)!} target="_blank" rel="noreferrer" className={miniActionClass(false)}>CoinMarketCap</a> : <span className={intelPillClass(false)}>CoinMarketCap</span>}
                      {externalHref("dexscreener", featuredAsset) ? <a href={externalHref("dexscreener", featuredAsset)!} target="_blank" rel="noreferrer" className={miniActionClass(false)}>DexScreener</a> : <span className={intelPillClass(false)}>DexScreener</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={featuredAsset.routes.market} className={miniActionClass(true)}>Market</Link>
                    <Link href={featuredAsset.routes.trade} className={miniActionClass(false)}>Trade</Link>
                    <Link href={featuredAsset.routes.swap} className={miniActionClass(false)}>Swap</Link>
                    <Link href={featuredAsset.routes.pool} className={miniActionClass(false)}>Pool</Link>
                    <Link href={featuredAsset.routes.liquidity} className={miniActionClass(false)}>Liquidity</Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/70">No featured RioEx asset is available yet.</div>
              )}
            </div>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">{error}</div> : null}

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/70">Loading authoritative RioEx assets…</div>
          ) : assets.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/70">No RioEx assets are available yet.</div>
          ) : (
            <div className="mt-6 overflow-visible rounded-[24px] border border-white/10 bg-black/15">
              <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr_1.1fr_0.9fr] gap-4 border-b border-white/8 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
                <div>Asset</div>
                <div>Liquidity</div>
                <div>Markets</div>
                <div>Intel</div>
                <div>Last Update</div>
                <div>Action</div>
              </div>

              <div className="divide-y divide-white/8">
                {assets.map((asset) => (
                  <div key={asset.assetId} className="grid grid-cols-[2fr_1fr_0.8fr_1fr_1.1fr_0.9fr] gap-4 px-6 py-5">
                    <div className="min-w-0">
                      <div className="flex items-start gap-4">
                        <AssetMarks logo={asset.logoUrl} fallback={asset.symbol} />
                        <div className="min-w-0">
                          <div className="truncate text-[20px] font-semibold text-white">{asset.symbol}</div>
                          <div className="mt-1 text-sm text-white/65">{asset.displayName}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {asset.canonicalCount > 0 ? <span className={pillClass("canonical")}>Canonical</span> : null}
                            {asset.liveCount > 0 ? <span className={pillClass("live")}>Live</span> : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-[18px] font-semibold text-white">{formatMoney(asset.liquidityUsd)}</div>
                    <div className="flex items-center text-[18px] font-semibold text-white">{asset.marketCount}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={intelPillClass(!!asset.coingeckoId)}>CG</span>
                      <span className={intelPillClass(!!asset.coinmarketcapId)}>CMC</span>
                      <span className={intelPillClass(!!asset.dexscreenerTokenAddress)}>DS</span>
                    </div>
                    <div className="flex items-center text-sm font-medium text-white/82">{formatDateTime(asset.updatedAt)}</div>
                    <div className="relative flex items-center justify-start overflow-visible">
                      <AssetOpenMenu routes={asset.routes} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
