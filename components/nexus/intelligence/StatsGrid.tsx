"use client";

function StatCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_30px_rgba(59,130,246,0.08)]">
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{String(value ?? 0)}</div>
    </div>
  );
}

export default function StatsGrid({ summary }: { summary: Record<string, any> }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
      <StatCard label="Knowledge" value={summary.knowledgeNodes} />
      <StatCard label="Memory" value={summary.enterpriseMemory} />
      <StatCard label="Documents" value={summary.documents} />
      <StatCard label="KPIs" value={summary.kpis} />
      <StatCard label="Trends" value={summary.trends} />
      <StatCard label="Risks" value={summary.risks} />
      <StatCard label="Decisions" value={summary.decisions} />
      <StatCard label="Actions" value={summary.actionItems} />
      <StatCard label="Edges" value={summary.knowledgeEdges} />
      <StatCard label="Improving" value={summary.improvingKpis} />
      <StatCard label="Declining" value={summary.decliningKpis} />
      <StatCard label="Stable" value={summary.stableKpis} />
    </div>
  );
}
