"use client";

import { useEffect, useMemo, useState } from "react";
import type { ValuedPortfolio } from "@/lib/rioValuation";

type Props = {
  address?: string | null;
  compact?: boolean;
};

function formatAmount(value: number | null | undefined, maximumFractionDigits = 6) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function shortAddress(address?: string | null) {
  if (!address) return "Not connected";
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function sourceLabel(source?: string | null) {
  switch (source) {
    case "rioex_valuation_rio":
      return "RIO/RUSD CPMM";
    case "spo20_riodex_cpmm":
      return "SPO-20 CPMM";
    case "canonical_rusd_par":
      return "RUSD Par";
    default:
      return source || "Unpriced";
  }
}

export function RioLightWalletValueMini({ address, compact = false }: Props) {
  const [data, setData] = useState<ValuedPortfolio | null>(null);
  const [loading, setLoading] = useState(Boolean(address));
  const [error, setError] = useState<string | null>(null);

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
          setError(json?.error ?? "Wallet valuation unavailable");
          setData(null);
          return;
        }

        setData(json);
        setError(null);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Wallet valuation failed");
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

  const unpricedCount = useMemo(() => {
    return data?.assets?.filter((asset) => asset.valuation_status !== "priced").length ?? 0;
  }, [data]);

  if (!address) {
    return (
      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4 text-sm text-white/60">
        Connect RioLight to view wallet value.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_35%),rgba(0,0,0,0.38)] p-4 text-white shadow-[0_0_36px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-100/55">
            RioLight wallet value
          </div>

          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {loading ? "Loading…" : `${formatAmount(data?.totals?.rusd, 2)} RUSD`}
          </div>

          <div className="mt-1 text-xs text-white/45">
            {shortAddress(address)} · {formatAmount(data?.totals?.rio, 6)} RIO
          </div>
        </div>

        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
          {data?.valuation?.ok ? "Live" : "Pending"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">RIO</div>
          <div className="mt-1 text-sm font-semibold">{formatAmount(data?.totals?.rio, 6)}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">RUSD</div>
          <div className="mt-1 text-sm font-semibold">{formatAmount(data?.totals?.rusd, 2)}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">USD</div>
          <div className="mt-1 text-sm font-semibold">{formatAmount(data?.totals?.usd, 2)}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">USDT</div>
          <div className="mt-1 text-sm font-semibold">{formatAmount(data?.totals?.usdt, 2)}</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] px-3 py-2 text-xs text-cyan-100/80">
        1 RIO = {formatAmount(data?.valuation?.price?.rio?.rusd, 6)} RUSD ·{" "}
        {pricedAssets.length}/{data?.assets?.length ?? 0} assets priced
      </div>

      <div className="mt-4 space-y-2">
        {pricedAssets.slice(0, compact ? 3 : 5).map((asset) => (
          <div
            key={`${asset.asset_id}-${asset.symbol}`}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2"
          >
            <div>
              <div className="text-sm font-semibold">{asset.symbol}</div>
              <div className="text-[11px] text-white/38">
                {sourceLabel(asset.valuation_source)}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold">
                {formatAmount(asset.value_rusd, 6)} RUSD
              </div>
              <div className="text-[11px] text-white/38">
                {formatAmount(asset.value_rio, 6)} RIO
              </div>
            </div>
          </div>
        ))}
      </div>

      {unpricedCount > 0 ? (
        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          {unpricedCount} asset{unpricedCount === 1 ? "" : "s"} unpriced until CPMM liquidity exists.
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      ) : null}

      <div className="mt-3 text-[11px] leading-5 text-white/35">
        RIO value is sourced from RioDex CPMM. RUSD/USDT/USDC bridge-aware valuation will be added
        after Axelar routes are live and indexed.
      </div>
    </section>
  );
}
