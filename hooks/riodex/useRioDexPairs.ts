"use client";

import { useCallback, useEffect, useState } from "react";
import type { RioDexPoolResponse } from "@/lib/riodex/types";

export type RioDexPoolListItem = {
  pairKey: string;
  pairAddress: string;
  liquidityToken?: string | null;
  createdAtHeight?: number | null;
  createdAtTime?: number | null;
  label: string;
  assetLabels: [string, string];
  pool?: RioDexPoolResponse | null;
  isCanonical?: boolean;
};

type RioDexPairsApiResponse = {
  ok?: boolean;
  error?: string;
  items?: RioDexPoolListItem[];
};

type UseRioDexPairsState = {
  items: RioDexPoolListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useRioDexPairs(): UseRioDexPairsState {
  const [items, setItems] = useState<RioDexPoolListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/riodex/pairs", {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const body = await response.text();
        throw new Error(
          `RioDex pairs API returned non-JSON (${response.status}). ${body.slice(0, 180)}`
        );
      }

      const data = (await response.json()) as RioDexPairsApiResponse;

      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `Failed to load RioDex pairs (${response.status})`);
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load RioDex pairs.";
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    loading,
    error,
    refresh,
  };
}
