"use client";

import { useRioValuation } from "@/hooks/useRioValuation";

function formatPrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(value);
}

export function RioValuationBadge() {
  const valuation = useRioValuation(15_000);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white shadow-[0_0_30px_rgba(255,255,255,0.04)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
            RIO live valuation
          </div>
          <div className="mt-1 text-lg font-semibold text-white">
            1 RIO = {formatPrice(valuation.rioRusd)} RUSD
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
            Authority
          </div>
          <div className="mt-1 text-xs font-medium text-emerald-300">
            {valuation.isPriced ? "RioDex CPMM" : "Unavailable"}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
        <span>USD {formatPrice(valuation.rioUsd)}</span>
        <span>·</span>
        <span>USDT {formatPrice(valuation.rioUsdt)}</span>
        <span>·</span>
        <span>BTC {formatPrice(valuation.rioBtc)}</span>
      </div>

      {valuation.error ? (
        <div className="mt-2 text-xs text-amber-300">{valuation.error}</div>
      ) : null}
    </div>
  );
}
