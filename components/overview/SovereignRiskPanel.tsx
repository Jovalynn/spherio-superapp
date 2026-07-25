"use client";

import { fmtNumber } from "@/lib/format";

export function SovereignRiskPanel({
  stressIndex,
  updatedAt,
}: {
  stressIndex: number | null;
  updatedAt?: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/60 shadow-sm backdrop-blur-md p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs tracking-wide text-slate-600 uppercase">
            Sovereign Risk Engine
          </div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            Stress Index{" "}
            <span className="tabular-nums">{stressIndex === null ? "—" : fmtNumber(stressIndex, 0)}</span>
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Live macro risk signal derived from reserve and liquidity stress scenarios.
          </div>
        </div>

        <div className="text-xs text-slate-500">
          {updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : ""}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/70 p-6">
        <div className="text-sm text-slate-700">
          Mount <span className="font-mono">components/RiskGauge.tsx</span> here.
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Bands: 0–25 Stable · 26–50 Guarded · 51–75 Elevated · 76–100 Critical
        </div>
      </div>
    </div>
  );
}
