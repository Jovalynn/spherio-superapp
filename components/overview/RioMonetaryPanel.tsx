"use client";

import ClientOnly from "@/components/ClientOnly";
import { fmtCompact, fmtNumber } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type RioState = {
  total_supply: number;
  circulating: number;
  bonded: number;
  forever_lock: number;
  treasury: number;
};

export function RioMonetaryPanel({ rio }: { rio?: RioState }) {
  const rows = rio
    ? [
        { k: "Circulating", v: rio.circulating },
        { k: "Bonded", v: rio.bonded },
        { k: "Forever Lock", v: rio.forever_lock },
        { k: "Treasury", v: rio.treasury },
      ]
    : [];

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/60 shadow-sm backdrop-blur-md p-8">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs tracking-wide text-slate-600 uppercase">
            RIO Monetary Structure
          </div>

          <div className="mt-2 text-xl font-semibold text-slate-900">
            Total Supply{" "}
            <span className="tabular-nums">{fmtNumber(rio?.total_supply, 0)}</span>
          </div>

          <div className="mt-1 text-sm text-slate-600">
            Breakdown across liquidity, security, and permanent lock.
          </div>
        </div>
      </div>

      {/* Deterministic chart box (no percentage height ambiguity) */}
      <div className="mt-6 w-full">
        <div className="h-[240px] w-full min-h-[240px] min-w-0">
          <ClientOnly
            fallback={
              <div className="h-full w-full rounded-xl border border-slate-200/70 bg-white/50" />
            }
          >
            <div className="h-full w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart
                  data={rows}
                  margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <XAxis
                    dataKey="k"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    height={40}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(v) => fmtCompact(Number(v))}
                  />
                  <Tooltip
                    cursor={{ fillOpacity: 0.06 }}
                    formatter={(value) => fmtNumber(Number(value), 0)}
                    labelFormatter={(label) => String(label)}
                  />
                  <Bar dataKey="v" radius={[10, 10, 10, 10]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ClientOnly>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-700">
        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Circulating
          </div>
          <div className="mt-1 font-semibold tabular-nums">
            {fmtNumber(rio?.circulating, 0)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Bonded</div>
          <div className="mt-1 font-semibold tabular-nums">
            {fmtNumber(rio?.bonded, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
