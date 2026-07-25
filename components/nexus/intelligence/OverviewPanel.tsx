"use client";

import StatsGrid from "./StatsGrid";
import MiniTrendChart from "./MiniTrendChart";
import IntelligenceFeed from "./IntelligenceFeed";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_0_45px_rgba(15,23,42,0.45)]">
      <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function OverviewPanel({ data }: { data: any }) {
  const summary = data?.summary || {};
  const kpiCards = data?.kpiDashboard?.cards || [];

  return (
    <div className="space-y-6">
      <StatsGrid summary={summary} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Section title="KPI Dashboard">
          <div className="grid gap-4 md:grid-cols-2">
            {kpiCards.map((card: any) => (
              <div key={card.metricName} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-black text-white">{card.metricName}</div>
                    <div className="mt-1 text-sm text-slate-400">{card.status}</div>
                  </div>
                  <div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-sm font-bold text-emerald-200">
                    {card.percentChangeLabel || "—"}
                  </div>
                </div>
                <div className="mt-3">
                  <MiniTrendChart data={card.chartData?.data} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{card.summary}</p>
              </div>
            ))}
            {!kpiCards.length && <div className="text-sm text-slate-400">No KPI cards available yet.</div>}
          </div>
        </Section>

        <Section title="Latest Intelligence">
          <IntelligenceFeed items={data?.latestIntelligence || []} />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Recent Documents">
          <div className="space-y-3">
            {(data?.recentDocuments || []).map((doc: any) => (
              <div key={`${doc.document_id}-${doc.version}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="font-bold text-white">{doc.title}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {doc.document_id} · v{doc.version} · {doc.status}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Memory Highlights">
          <div className="space-y-3">
            {(data?.memoryHighlights || []).map((memory: any, index: number) => (
              <div key={`${memory.key}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="font-bold text-white">{memory.key}</div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{memory.value}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
