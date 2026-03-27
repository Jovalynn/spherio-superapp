"use client";

import { MacroCard } from "@/components/overview/MacroCard";
import { fmtPercent, fmtNumber } from "@/lib/format";

function toneFromStress(idx: number | null) {
  if (idx === null) return "neutral" as const;
  if (idx <= 25) return "good" as const;
  if (idx <= 50) return "neutral" as const;
  if (idx <= 75) return "warn" as const;
  return "bad" as const;
}

function toneFromReserve(r: number | null) {
  if (r === null) return "neutral" as const;
  if (r >= 1.25) return "good" as const;
  if (r >= 1.1) return "neutral" as const;
  if (r >= 1.0) return "warn" as const;
  return "bad" as const;
}

export function MacroStrip(props: {
  stressIndex: number | null;
  stakingRatio: number | null;      // 0..1
  reserveCoverage: number | null;   // 0..1 OR ratio (see note below)
  circulatingPct: number | null;    // 0..1
}) {
  const { stressIndex, stakingRatio, reserveCoverage, circulatingPct } = props;

  // NOTE: if your API returns reserve_coverage as 0..1 (coverage %), keep fmtPercent.
  // If it returns as a ratio (e.g. 1.18x), switch to fmtNumber(reserveCoverage, 2)+"x".
  const reserveTone =
    reserveCoverage !== null && reserveCoverage <= 1.0
      ? (reserveCoverage >= 0.9 ? "warn" : "bad")
      : toneFromReserve(reserveCoverage);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <MacroCard
        title="Monetary Risk Index"
        value={stressIndex === null ? "—" : fmtNumber(stressIndex, 0)}
        subtitle="0–100 sovereign stress signal"
        tone={toneFromStress(stressIndex)}
        footnote="Source: /api/stress/simulate"
      />

      <MacroCard
        title="RIO Staking Ratio"
        value={fmtPercent(stakingRatio, 1)}
        subtitle="Bonded / total supply"
        tone={stakingRatio !== null && stakingRatio >= 0.5 ? "good" : "neutral"}
        footnote="Source: /api/rio/state"
      />

      <MacroCard
        title="RUSD Reserve Coverage"
        value={fmtPercent(reserveCoverage, 1)}
        subtitle="Coverage of liabilities"
        tone={reserveTone}
        footnote="Source: /api/rusd/backing"
      />

      <MacroCard
        title="RIO Circulating Share"
        value={fmtPercent(circulatingPct, 1)}
        subtitle="Circulating / total supply"
        tone={circulatingPct !== null && circulatingPct <= 0.35 ? "good" : "neutral"}
        footnote="Source: /api/rio/state"
      />
    </div>
  );
}
