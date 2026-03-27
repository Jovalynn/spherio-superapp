"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/api";

type RioState = {
  total_supply: number;        // 300000000
  circulating: number;         // units in RIO
  bonded: number;
  forever_lock: number;
  treasury: number;
  staking_ratio: number;       // 0..1
};

type RusdSupply = {
  total_supply: number;        // 6000000
};

type RusdBacking = {
  collateral_value: number;    // e.g. USD
  liability_value: number;     // e.g. USD
  overcollateral_ratio: number;// 0..?
  reserve_coverage: number;    // 0..1 (if you have it)
};

type StressSim = {
  stress_index: number;        // 0..100
};

type OverviewData = {
  rio?: RioState;
  rusdSupply?: RusdSupply;
  rusdBacking?: RusdBacking;
  stress?: StressSim;
  updatedAt?: number;
};

export function useOverviewData(refreshMs = 8000) {
  const [data, setData] = useState<OverviewData>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [rio, rusdSupply, rusdBacking, stress] = await Promise.all([
          fetchJSON<RioState>("/api/rio/state"),
          fetchJSON<RusdSupply>("/api/rusd/supply"),
          fetchJSON<RusdBacking>("/api/rusd/backing"),
          fetchJSON<StressSim>("/api/stress/simulate"),
        ]);

        if (!alive) return;
        setData({ rio, rusdSupply, rusdBacking, stress, updatedAt: Date.now() });
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load overview data");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    const t = setInterval(load, refreshMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [refreshMs]);

  const derived = useMemo(() => {
    const rio = data.rio;
    const rusdBacking = data.rusdBacking;

    const circulatingPct =
      rio && rio.total_supply > 0 ? rio.circulating / rio.total_supply : null;

    // Primary institutional signals (safe defaults)
    const stakingRatio = rio?.staking_ratio ?? null;
    const reserveCoverage = rusdBacking?.reserve_coverage ?? null;
    const stressIndex = data.stress?.stress_index ?? null;

    return { circulatingPct, stakingRatio, reserveCoverage, stressIndex };
  }, [data]);

  return { data, derived, loading, error };
}
