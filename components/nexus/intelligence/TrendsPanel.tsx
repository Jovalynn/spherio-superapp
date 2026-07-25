"use client";

import Link from "next/link";
import MiniTrendChart from "./MiniTrendChart";

function displayValue(point: any) {
  if (!point) return "—";
  const n = Number(point.valueNumber);
  if (!Number.isFinite(n)) return point.valueText || "—";

  let out = String(n);
  if (Math.abs(n) >= 1_000_000_000) out = `${(n / 1_000_000_000).toFixed(1)}B`;
  else if (Math.abs(n) >= 1_000_000) out = `${(n / 1_000_000).toFixed(1)}M`;
  else if (Math.abs(n) >= 1_000) out = `${(n / 1_000).toFixed(1)}K`;

  return point.unit === "percent" ? `${out}%` : out;
}

export default function TrendsPanel({ dashboard }: { dashboard?: any }) {
  const cards = dashboard?.cards || [];

  if (!cards.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-10 text-center">
        <div className="text-2xl font-bold text-white">No trend intelligence available yet.</div>
        <p className="mt-3 text-sm text-slate-400">Upload or ingest documents with structured metrics to generate trends.</p>
      </div>
    );
  }

  const improving = cards.filter((card: any) => card.directionFromFirst === "increased");
  const declining = cards.filter((card: any) => card.directionFromFirst === "decreased");
  const stable = cards.filter((card: any) => card.directionFromFirst === "unchanged");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Improving</div>
          <div className="mt-2 text-4xl font-black text-white">{improving.length}</div>
        </div>

        <div className="rounded-3xl border border-rose-300/20 bg-rose-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-rose-300">Declining</div>
          <div className="mt-2 text-4xl font-black text-white">{declining.length}</div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Stable</div>
          <div className="mt-2 text-4xl font-black text-white">{stable.length}</div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {cards.map((card: any) => (
          <Link
            key={card.metricName}
            href={`/nexus/intelligence/metric/${encodeURIComponent(card.metricName)}`}
            className="block rounded-3xl border border-white/10 bg-slate-950/60 p-6 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.035]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  {card.status}
                </div>
                <div className="mt-2 text-2xl font-black text-white">{card.metricName}</div>
              </div>

              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm font-bold text-emerald-300">
                {card.percentChangeLabel || "—"}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">From</div>
                <div className="mt-2 text-2xl font-black text-slate-200">{displayValue(card.first)}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">To</div>
                <div className="mt-2 text-2xl font-black text-white">{displayValue(card.current)}</div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.03] p-4">
              <MiniTrendChart data={card.chartData?.data} />
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">{card.summary}</p>

            <div className="mt-5 text-xs font-bold text-cyan-300">Open Metric Intelligence →</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
