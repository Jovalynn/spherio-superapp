"use client";

import ClientOnly from "@/components/ClientOnly";
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";

export default function RiskGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const data = [{ name: "Risk", value: v }];

  return (
    <div className="w-full min-w-0">
      {/* Deterministic height container prevents width(-1)/height(-1) */}
      <div className="h-[220px] w-full min-h-[220px]">
        <ClientOnly
          fallback={<div className="h-full w-full rounded-xl border border-slate-800 bg-slate-950/40" />}
        >
          <div className="h-full w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={data}
                innerRadius="70%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  background
                />

                {/* Center label */}
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-200"
                >
                  {v.toFixed(0)}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </ClientOnly>
      </div>
    </div>
  );
}
