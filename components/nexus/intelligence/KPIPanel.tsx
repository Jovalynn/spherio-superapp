"use client";

import Link from "next/link";
import MiniTrendChart from "./MiniTrendChart";

function compactValue(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;

  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;

  return String(n);
}

function displayMetricValue(point: any) {
  if (!point) return "--";

  const compact = compactValue(point.valueNumber);
  if (compact) {
    return point.unit === "percent" ? `${compact}%` : compact;
  }

  return point.valueText || "--";
}

export default function KPIPanel({ dashboard }: { dashboard?: any }) {
  const cards = dashboard?.cards || [];

  if (!cards.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-10 text-center">
        <div className="text-2xl font-bold text-white">
          No KPI intelligence available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
      {cards.map((card: any) => {
        const currentValue = displayMetricValue(card.current);
        const previousValue = displayMetricValue(card.previous || card.first);

        return (
          <div
            key={card.metricName}
            className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 transition hover:border-cyan-300/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  {card.status}
                </div>

                <div className="mt-2 text-2xl font-black text-white">
                  {card.metricName}
                </div>
              </div>

              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-300">
                ▲ {card.percentChangeLabel || "--"}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Current
                </div>
                <div className="mt-2 text-3xl font-black text-white">
                  {currentValue}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Previous
                </div>
                <div className="mt-2 text-3xl font-black text-slate-300">
                  {previousValue}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.03] p-3">
              <MiniTrendChart data={card.chartData?.data} />
            </div>

            <div className="mt-4 text-sm leading-6 text-slate-300">
              {card.summary}
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
              <div>
                Points: {card.pointCount || 0}
              </div>

              <Link
                href={`/nexus/intelligence/metric/${encodeURIComponent(card.metricName)}`}
                className="rounded-lg border border-cyan-300/20 px-3 py-1 text-cyan-300 hover:bg-cyan-300/10"
              >
                View Trend →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
