"use client";

import CirculationChart from "./CirculationChart";
import RiskGauge from "./RiskGauge";

interface Props {
  circulating: number;
  locked: number;
  risk: number;
}

export default function OverviewClient({ circulating, locked, risk }: Props) {
  return (
    <div className="space-y-8">
      {/* Circulation vs Locked */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-medium text-slate-200">
            Circulation vs Locked
          </h3>
          <span className="text-xs text-slate-500">Liquidity posture</span>
        </div>

        <div className="mt-4 h-[260px] w-full">
          <CirculationChart circulating={circulating} locked={locked} />
        </div>
      </div>

      {/* Risk Gauge */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-medium text-slate-200">
            Monetary Risk Indicator
          </h3>
          <span className="text-xs text-slate-500">Macro signal</span>
        </div>

        <div className="mt-4">
          <RiskGauge value={risk} />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Next: bind to /api/stress/simulate for the live sovereign risk index.
        </p>
      </div>
    </div>
  );
}
