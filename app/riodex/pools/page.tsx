"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRioDexPairs } from "@/hooks/riodex/useRioDexPairs";
import { buildRioDexSurfaceHref } from "@/lib/riodex/routes";

const RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";

type RegistryMarket = {
  pairAddress: string;
  displaySymbol?: string;
  canonicalSymbol?: string;
  baseAssetId?: string;
  quoteAssetId?: string;
  baseSymbol?: string;
  quoteSymbol?: string;
  baseDisplayName?: string;
  quoteDisplayName?: string;
  baseLogoUrl?: string | null;
  quoteLogoUrl?: string | null;
  feeBps?: number;
  isCanonical?: boolean;
  isLive?: boolean;
  liquidityUsd?: number;
  liquidityHeight?: string | number | null;
  liquidityTime?: string | null;
  liquiditySource?: string | null;
  liquidityUpdatedAt?: string | null;
  lastSwapTime?: string | null;
  lastSwapTxHash?: string | null;
  feeRecipientAddress?: string | null;
  feePolicy?: string | null;
  quoteConvention?: string;
  routes?: {
    assetTerminal?: string;
    marketBoard?: string;
    hero?: string;
    pool?: string;
    swap?: string;
    liquidity?: string;
  };
  source?: string;
};

type RegistryMarketsResponse = {
  ok?: boolean;
  count?: number;
  markets?: RegistryMarket[];
};

function fromBaseUnits(value?: string, decimals = 6) {
  const num = Number(value || "0");
  if (!Number.isFinite(num)) return 0;
  return num / 10 ** decimals;
}

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

function formatUsd(value: string | number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function shortAddr(v?: string | null, left = 10, right = 8) {
  if (!v) return "—";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

function prettyAssetLabel(label?: string) {
  if (!label) return "—";
  if (label === "urio") return "RIO";
  if (label === RUSD_CONTRACT) return "RUSD";
  if (label === "RIO" || label === "RUSD") return label;
  if (label.startsWith("rio1")) return "RUSD";
  return shortAddr(label, 10, 8);
}

function canonicalPoolLabel(
  displaySymbol?: string | null,
  canonicalSymbol?: string | null,
  baseSymbol?: string | null,
  quoteSymbol?: string | null,
  fallbackLeft?: string,
  fallbackRight?: string
) {
  const raw = String(displaySymbol || "").trim();
  if (raw && raw.toLowerCase() !== "urio") return raw;

  const base = String(baseSymbol || "").trim() || fallbackLeft || "RIO";
  let quote = String(quoteSymbol || "").trim() || fallbackRight || "RUSD";

  if (quote.toLowerCase().startsWith("rio14nur")) quote = "RUSD";

  if (base && quote) return `${base} / ${quote}`;

  if (canonicalSymbol?.trim()) {
    return canonicalSymbol.replace("/", " / ");
  }

  return `${fallbackLeft || "RIO"} / ${fallbackRight || "RUSD"}`;
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
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${cls}`}
    >
      {label}
    </span>
  );
}

async function fetchRegistryMarkets(): Promise<RegistryMarket[]> {
  const response = await fetch(
    "/api/rioex/markets?canonicalOnly=false&sort=liquidity",
    { cache: "no-store" }
  );

  const raw = await response.text();

  let json: RegistryMarketsResponse | null = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Registry route returned non-JSON (${response.status})`);
  }

  if (!response.ok || json?.ok === false) {
    throw new Error(
      (json as any)?.error || `Failed to load registry markets (${response.status})`
    );
  }

  return json?.markets || [];
}

export default function RioDexPoolsPage() {
  const { items, loading, error, refresh } = useRioDexPairs();

  const [registryMarkets, setRegistryMarkets] = useState<RegistryMarket[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRegistry() {
      try {
        setRegistryLoading(true);
        setRegistryError(null);
        const markets = await fetchRegistryMarkets();
        if (!active) return;
        setRegistryMarkets(markets);
      } catch (e: any) {
        if (!active) return;
        setRegistryMarkets([]);
        setRegistryError(e?.message || "Failed to load registry markets");
      } finally {
        if (active) setRegistryLoading(false);
      }
    }

    void loadRegistry();

    return () => {
      active = false;
    };
  }, []);

  const registryMap = useMemo(() => {
    const map = new Map<string, RegistryMarket>();
    for (const market of registryMarkets) {
      if (market?.pairAddress) {
        map.set(market.pairAddress, market);
      }
    }
    return map;
  }, [registryMarkets]);

  const normalizedItems = items.map((item) => {
    const raw0 = item.pool?.assets?.[0]?.amount || "0";
    const raw1 = item.pool?.assets?.[1]?.amount || "0";
    const lpShare = item.pool?.total_share || "0";

    const asset0 = fromBaseUnits(raw0, 6);
    const asset1 = fromBaseUnits(raw1, 6);
    const price = asset0 > 0 ? asset1 / asset0 : 0;

    const left = prettyAssetLabel(item.assetLabels?.[0]);
    const right = prettyAssetLabel(item.assetLabels?.[1]);

    const registry = item.pairAddress ? registryMap.get(item.pairAddress) || null : null;

    const displayLabel = canonicalPoolLabel(
      registry?.displaySymbol,
      registry?.canonicalSymbol,
      registry?.baseSymbol,
      registry?.quoteSymbol,
      left,
      right
    );

    const isCanonical =
      registry?.isCanonical ?? displayLabel === "RIO / RUSD";

    return {
      ...item,
      registry,
      displayLabel,
      asset0,
      asset1,
      price,
      lpShare,
      isCanonical,
      liquidityUsd: registry?.liquidityUsd ?? 0,
      marketSource: registry?.source || null,
      feeBps: registry?.feeBps ?? null,
      poolHref:
        registry?.routes?.pool ||
        (item.pairAddress ? buildRioDexSurfaceHref(item.pairAddress).pool : null),
    };
  });

  const canonicalPool =
    normalizedItems.find((item) => item.isCanonical) || normalizedItems[0] || null;

  const hardRefresh = async () => {
    await refresh();
    try {
      setRegistryLoading(true);
      setRegistryError(null);
      const markets = await fetchRegistryMarkets();
      setRegistryMarkets(markets);
    } catch (e: any) {
      setRegistryError(e?.message || "Failed to load registry markets");
    } finally {
      setRegistryLoading(false);
    }
  };

  const globalError =
    error || registryError
      ? [error, registryError].filter(Boolean).join(" • ")
      : null;

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">RioDex</p>
              <h1 className="text-3xl font-semibold tracking-tight">Pools</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/60">
                Factory-registered liquidity pools resolved from the current RioDex contract layer.
                Registry truth now hydrates canonical identity so this surface stays aligned with
                RioEx Markets and Pool detail terminals.
              </p>
            </div>

            <button
              onClick={() => void hardRefresh()}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Refresh
            </button>
          </div>

          {loading || registryLoading ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              Loading authoritative pool state...
            </div>
          ) : null}

          {globalError ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              {globalError}
            </div>
          ) : null}

          {canonicalPool ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Canonical Pool</div>
                <div className="mt-2 text-xl font-semibold text-white">{canonicalPool.displayLabel}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {canonicalPool.isCanonical ? <Badge label="Canonical" tone="primary" /> : null}
                  {canonicalPool.pairAddress ? <Badge label="Live" tone="good" /> : null}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Liquidity</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  {formatAmount(canonicalPool.asset0)} RIO / {formatAmount(canonicalPool.asset1)} RUSD
                </div>
                <div className="mt-2 text-xs text-white/45">
                  Registry TVL: {formatUsd(canonicalPool.liquidityUsd)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Price</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  {canonicalPool.price > 0 ? `${formatAmount(canonicalPool.price, 6)} RUSD` : "—"}
                </div>
                <div className="mt-2 text-xs text-white/45">
                  Fee: {canonicalPool.feeBps ?? 30} bps
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">LP Share</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  {formatInteger(canonicalPool.lpShare)}
                </div>
                <div className="mt-2 text-xs text-white/45">
                  Source: {canonicalPool.marketSource || "contract-layer"}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
          <div className="grid grid-cols-12 gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-white/45">
            <div className="col-span-4">Pool</div>
            <div className="col-span-3">Liquidity</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">LP Share</div>
            <div className="col-span-1">Open</div>
          </div>

          {normalizedItems.length === 0 ? (
            <div className="px-6 py-10 text-sm text-white/55">
              No pools available yet.
            </div>
          ) : (
            normalizedItems.map((item) => (
              <div
                key={item.pairKey}
                className="grid grid-cols-12 gap-4 border-b border-white/5 px-6 py-5 last:border-b-0"
              >
                <div className="col-span-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-white">{item.displayLabel}</div>
                    {item.isCanonical ? <Badge label="Canonical" tone="primary" /> : null}
                    {item.pairAddress ? <Badge label="Live" tone="good" /> : null}
                  </div>

                  <div className="mt-1 text-xs text-white/45">
                    {item.pairAddress || "Pending pair address"}
                  </div>

                  <div className="mt-2 text-[11px] text-white/35">
                    {item.isCanonical
                      ? "Verified canonical pool"
                      : item.createdAtHeight
                      ? `Created at height ${item.createdAtHeight}`
                      : "Creation metadata unavailable"}
                  </div>
                </div>

                <div className="col-span-3 text-sm text-white/75">
                  {formatAmount(item.asset0)} RIO / {formatAmount(item.asset1)} RUSD
                  <div className="mt-1 text-xs text-white/40">
                    Registry TVL: {formatUsd(item.liquidityUsd)}
                  </div>
                </div>

                <div className="col-span-2 text-sm text-white/75">
                  {item.price > 0 ? `${formatAmount(item.price, 6)} RUSD` : "—"}
                </div>

                <div className="col-span-2 text-sm text-white/75">
                  {formatInteger(item.lpShare)}
                </div>

                <div className="col-span-1">
                  {item.poolHref ? (
                    <Link
                      href={item.poolHref}
                      className="inline-flex rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                    >
                      View
                    </Link>
                  ) : (
                    <span className="text-xs text-white/35">—</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
