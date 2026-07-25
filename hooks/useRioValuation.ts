"use client";

import { useEffect, useMemo, useState } from "react";
import type { RioValuationResponse } from "@/lib/rioValuation";

type State = {
  loading: boolean;
  error: string | null;
  valuation: RioValuationResponse | null;
};

export function useRioValuation(refreshMs = 15_000) {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    valuation: null,
  });

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
        const response = await fetch("/api/rioex/valuation/rio", {
          cache: "no-store",
        });

        const json = await response.json();

        if (!alive) return;

        if (!response.ok || !json?.ok) {
          setState({
            loading: false,
            error: json?.error ?? json?.diagnostics?.reason ?? "RIO valuation unavailable",
            valuation: json,
          });
          return;
        }

        setState({
          loading: false,
          error: null,
          valuation: json,
        });
      } catch (error) {
        if (!alive) return;

        setState({
          loading: false,
          error: error instanceof Error ? error.message : "RIO valuation failed",
          valuation: null,
        });
      }
    }

    load();

    if (refreshMs > 0) {
      timer = setInterval(load, refreshMs);
    }

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [refreshMs]);

  return useMemo(() => {
    const rioRusd = state.valuation?.price?.rio?.rusd ?? null;
    const rioUsd = state.valuation?.price?.rio?.usd ?? rioRusd;
    const rioUsdt = state.valuation?.price?.rio?.usdt ?? rioRusd;
    const rioBtc = state.valuation?.price?.rio?.btc ?? null;

    return {
      ...state,
      rioRusd,
      rioUsd,
      rioUsdt,
      rioBtc,
      isPriced: Boolean(state.valuation?.ok && rioRusd !== null),
      source: state.valuation?.source ?? null,
      authority: state.valuation?.authority ?? null,
      updatedAt: state.valuation?.updated_at ?? null,
    };
  }, [state]);
}
