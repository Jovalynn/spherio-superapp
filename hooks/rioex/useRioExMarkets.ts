"use client";

import { useMemo } from "react";
import { useRioDexPairs } from "@/hooks/riodex/useRioDexPairs";
import type { RioExMarketItem } from "@/lib/rioex/types";

const RIO_DECIMALS = 6;
const RUSD_DECIMALS = 6;

function fromBaseUnits(value?: string, decimals = 6) {
  const n = Number(value || "0");
  if (!Number.isFinite(n)) return 0;
  return n / 10 ** decimals;
}

function asDisplayString(value: number, max = 6) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
    minimumFractionDigits: 0,
  }).format(value);
}

function asRawString(value?: string) {
  return value || "0";
}

export function useRioExMarkets() {
  const { items, loading, error, refresh } = useRioDexPairs();

  const markets = useMemo<RioExMarketItem[]>(() => {
    return items
      .filter((item) => item.pairKey && item.label)
      .map((item): RioExMarketItem => {
        const rawAsset0 = item.pool?.assets?.[0]?.amount || "0";
        const rawAsset1 = item.pool?.assets?.[1]?.amount || "0";
        const rawTotalShare = item.pool?.total_share || "0";

        const asset0Display = fromBaseUnits(rawAsset0, RIO_DECIMALS);
        const asset1Display = fromBaseUnits(rawAsset1, RUSD_DECIMALS);

        return {
          pairKey: item.pairKey,
          pairAddress: item.pairAddress,
          label: item.label,
          assetLabels: item.assetLabels,
          liquidityToken: item.liquidityToken ?? null,
          createdAtHeight: item.createdAtHeight ?? null,
          createdAtTime: item.createdAtTime ?? null,

          asset0Amount: asDisplayString(asset0Display, 6),
          asset1Amount: asDisplayString(asset1Display, 6),
          totalShare: asRawString(rawTotalShare),

          status: item.pairAddress ? "live" : "pending",
        };
      })
      .sort((a, b) => {
        const aLive = a.status === "live" ? 1 : 0;
        const bLive = b.status === "live" ? 1 : 0;

        if (aLive !== bLive) return bLive - aLive;

        const aHeight = a.createdAtHeight ?? 0;
        const bHeight = b.createdAtHeight ?? 0;
        return bHeight - aHeight;
      });
  }, [items]);

  const summary = useMemo(() => {
    const liveMarkets = markets.filter((m) => m.status === "live").length;
    const pendingMarkets = markets.filter((m) => m.status === "pending").length;

    const totalVisibleAsset0 = markets.reduce(
      (sum, market) => sum + Number(market.asset0Amount || "0"),
      0
    );

    const totalVisibleAsset1 = markets.reduce(
      (sum, market) => sum + Number(market.asset1Amount || "0"),
      0
    );

    const totalVisibleShare = markets.reduce(
      (sum, market) => sum + Number(market.totalShare || "0"),
      0
    );

    const canonicalMarket = markets.find((m) => m.label === "RIO / RUSD") || markets[0] || null;

    const canonicalPrice =
      canonicalMarket && Number(canonicalMarket.asset0Amount || "0") > 0
        ? Number(canonicalMarket.asset1Amount || "0") / Number(canonicalMarket.asset0Amount || "0")
        : 0;

    return {
      totalMarkets: markets.length,
      liveMarkets,
      pendingMarkets,
      totalVisibleAsset0,
      totalVisibleAsset1,
      totalVisibleShare,
      canonicalPrice,
    };
  }, [markets]);

  return {
    markets,
    summary,
    loading,
    error,
    refresh,
  };
}
