"use client";

import Link from "next/link";

function reportHref(id: string) {
  return `/nexus/intelligence/report/${encodeURIComponent(id)}`;
}

export default function ReportsPanel({ data }: { data?: any }) {
  const summary = data?.summary || {};
  const kpiSummary = data?.kpiDashboard?.summary || {};
  const latest = data?.latestIntelligence || [];
  const documents = data?.recentDocuments || [];
  const memories = data?.memoryHighlights || [];

  const reports = [
    {
      id: "executive-overview",
      title: "Executive Intelligence Report",
      type: "executive",
      confidence: "High",
      importance: "Critical",
      summary: `RioMind has ${summary.knowledgeNodes || 0} knowledge nodes, ${summary.knowledgeEdges || 0} relationships, ${summary.documents || 0} documents, ${summary.trends || 0} trends, ${summary.decisions || 0} decisions, ${summary.actionItems || 0} actions, and ${summary.risks || 0} risks.`,
      sources: (summary.documents || 0) + (summary.enterpriseMemory || 0) + (summary.knowledgeNodes || 0),
      evidence: (summary.knowledgeEdges || 0) + latest.length,
    },
    {
      id: "kpi-performance",
      title: "KPI Performance Report",
      type: "kpi_report",
      confidence: "High",
      importance: (kpiSummary.decliningCount || 0) > 0 ? "High" : "Medium",
      summary: `${kpiSummary.metricCount || 0} tracked KPI metrics. ${kpiSummary.improvingCount || 0} improving, ${kpiSummary.decliningCount || 0} declining, ${kpiSummary.stableCount || 0} stable.`,
      sources: summary.kpis || 0,
      evidence: summary.trends || 0,
    },
    {
      id: "knowledge-graph",
      title: "Knowledge Graph Report",
      type: "knowledge_report",
      confidence: "High",
      importance: "High",
      summary: `RioMind Core currently contains ${summary.knowledgeNodes || 0} knowledge nodes and ${summary.knowledgeEdges || 0} graph relationships.`,
      sources: summary.knowledgeNodes || 0,
      evidence: summary.knowledgeEdges || 0,
    },
    {
      id: "document-intelligence",
      title: "Document Intelligence Report",
      type: "document_report",
      confidence: "High",
      importance: "Medium",
      summary: `${documents.length} recent learned documents are available for executive reporting and traceability.`,
      sources: documents.length,
      evidence: latest.length,
    },
    {
      id: "memory-intelligence",
      title: "Enterprise Memory Report",
      type: "memory_report",
      confidence: "High",
      importance: "Medium",
      summary: `${memories.length} highlighted memory records are available from RioMind enterprise memory.`,
      sources: memories.length,
      evidence: summary.enterpriseMemory || 0,
    },
    {
      id: "risk-decision-action",
      title: "Risk, Decision & Action Report",
      type: "governance_report",
      confidence: "Medium",
      importance: (summary.risks || 0) > 0 ? "High" : "Medium",
      summary: `${summary.decisions || 0} decisions, ${summary.actionItems || 0} action items, and ${summary.risks || 0} risks are visible in current intelligence.`,
      sources: (summary.decisions || 0) + (summary.actionItems || 0) + (summary.risks || 0),
      evidence: summary.knowledgeEdges || 0,
    },
  ];

  const critical = reports.filter((r) => r.importance === "Critical").length;
  const high = reports.filter((r) => r.importance === "High").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Executive Reports</div>
          <div className="mt-2 text-4xl font-black text-white">{reports.length}</div>
        </div>

        <div className="rounded-3xl border border-rose-300/20 bg-rose-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-rose-300">Critical</div>
          <div className="mt-2 text-4xl font-black text-white">{critical}</div>
        </div>

        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">High Priority</div>
          <div className="mt-2 text-4xl font-black text-white">{high}</div>
        </div>

        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Confidence</div>
          <div className="mt-2 text-4xl font-black text-white">High</div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
          Executive Reports Intelligence
        </div>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Reports synthesize KPIs, trends, documents, memory, knowledge graph relationships, decisions, risks, actions, evidence, and reasoning into executive intelligence objects.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {reports.map((report) => (
          <Link
            key={report.id}
            href={reportHref(report.id)}
            className="block rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.035]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  {report.type.replace(/_/g, " ")}
                </div>
                <div className="mt-2 text-2xl font-black text-white">{report.title}</div>
              </div>

              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
                {report.importance}
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-300">{report.summary}</p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Sources</div>
                <div className="mt-2 text-2xl font-black text-white">{report.sources}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Evidence</div>
                <div className="mt-2 text-2xl font-black text-white">{report.evidence}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Confidence</div>
                <div className="mt-2 text-2xl font-black text-white">{report.confidence}</div>
              </div>
            </div>

            <div className="mt-5 text-xs font-bold text-cyan-300">
              Open Executive Report →
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
