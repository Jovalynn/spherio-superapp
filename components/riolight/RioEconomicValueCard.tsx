"use client";

import { useRioValuation } from "@/hooks/useRioValuation";
import {
  formatEconomicValue,
  valueMarketCapRio,
  valueRioAmount,
} from "@/lib/rioEconomics";

type Props = {
  label: string;
  rioAmount?: number | string | null;
  marketCapRio?: number | string | null;
  description?: string;
};

export function RioEconomicValueCard({
  label,
  rioAmount,
  marketCapRio,
  description,
}: Props) {
  const valuation = useRioValuation(15_000);

  const economic =
    marketCapRio !== undefined
      ? valueMarketCapRio(marketCapRio, valuation.valuation)
      : valueRioAmount(rioAmount, valuation.valuation);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white shadow-[0_0_30px_rgba(255,255,255,0.04)] backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
        {label}
      </div>

      <div className="mt-2 text-xl font-semibold">
        {formatEconomicValue(economic.rusd, 2)} RUSD
      </div>

      <div className="mt-1 text-sm text-white/50">
        {formatEconomicValue(economic.rio, 6)} RIO · USD {formatEconomicValue(economic.usd, 2)} · USDT{" "}
        {formatEconomicValue(economic.usdt, 2)}
      </div>

      {description ? (
        <div className="mt-2 text-xs text-white/40">{description}</div>
      ) : null}

      <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">
        {economic.status === "priced" ? "RioDex CPMM priced" : "Unpriced"}
      </div>
    </div>
  );
}
