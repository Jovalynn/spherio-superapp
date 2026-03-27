"use client";

import ClientOnly from "@/components/ClientOnly";
import { fmtNumber, fmtPercent } from "@/lib/format";
import { PieChart, Pie, ResponsiveContainer, Tooltip, Cell } from "recharts";

type RusdSupply = { total_supply: number };

type RusdBacking = {
  collateral_value: number;
  liability_value: number;
  overcollateral_ratio: number;
  reserve_coverage: number;
};

export function RusdBackingPanel({
  supply,
  backing,
}: {
  supply?: RusdSupply;
  backing?: RusdBacking;
}) {
  const collateral = backing?.collateral_value ?? 0;
  const liability = backing?.liability_value ?? 0;
  const buffer = Math.max(0, collateral - liability);

  const donut = backing
    ? [
        { k: "Liabilities", v: liability },
        { k: "Excess Buffer", v: buffer },
      ]
    : [];

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/60 shadow-sm backdrop-blur-md p-8">
      <div>
        <div className="text-xs tracking-wide text-slate-600 uppercase">
          RUSD Backing Structure
        </div>
        <div className="mt-2 text-xl font-semibold text-slate-900">
          Total Supply{" "}
          <span className="tabular-nums">{fmtNumber(supply?.total_supply, 0)}</span>
        </div>
        <div className="mt-1 text-sm text-slate-600">
          Coverage and overcollateralization signals.
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Deterministic chart box */}
        <div className="w-full">
          <div className="h-[240px] w-full min-h-[240px]">
            <ClientOnly
              fallback={
                <div className="h-full w-full rounded-xl border border-slate-200/70 bg-white/50" />
              }
            >
              <div className="h-full w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <PieChart>
                    <Tooltip formatter={(v: any) => fmtNumber(Number(v), 0)} />
                    <Pie
                      data={donut}
                      dataKey="v"
                      nameKey="k"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {/* No explicit colors (theme controls later) */}
                      {donut.map((_, i) => (
                        <Cell key={i} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ClientOnly>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Overcollateral Ratio
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {backing ? `${fmtNumber(backing.overcollateral_ratio, 2)}x` : "—"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Reserve Coverage
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {fmtPercent(backing?.reserve_coverage, 1)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Collateral Buffer
            </div>
            <div className="mt-1 font-semibold tabular-nums">
              {backing ? fmtNumber(buffer, 0) : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
