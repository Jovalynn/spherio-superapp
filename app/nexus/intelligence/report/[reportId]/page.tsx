"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import IntelligenceTrail from "@/components/nexus/intelligence/IntelligenceTrail";

function titleFromId(id: string) {
  return String(id || "executive-report")
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}


function getReportProfile(reportId: string, summary: any) {
  const profiles: Record<string, any> = {
    "executive-overview": {
      title: "Executive Intelligence Report",
      focus: "Whole-organization intelligence across documents, KPIs, trends, memory, decisions, risks, actions, and knowledge graph relationships.",
      signals: ["Organization-wide knowledge is active.", "KPIs and trends are available.", "Risks, decisions, and actions are visible."],
      recommendations: [
        "Review high-priority risks before executive planning.",
        "Use KPI trends to update current operating priorities.",
        "Validate action items linked to decisions.",
        "Open evidence before finalizing executive conclusions.",
      ],
    },
    "kpi-performance": {
      title: "KPI Performance Report",
      focus: "Performance intelligence across tracked KPIs, improving indicators, declining indicators, and stable metrics.",
      signals: [`${summary.improvingKpis || 0} KPI(s) improving.`, `${summary.decliningKpis || 0} KPI(s) declining.`, `${summary.stableKpis || 0} KPI(s) stable.`],
      recommendations: [
        "Review improving KPIs and identify what is driving growth.",
        "Investigate declining KPIs immediately if any appear.",
        "Compare KPIs with related documents and decisions.",
        "Use KPI evidence before making planning decisions.",
      ],
    },
    "knowledge-graph": {
      title: "Knowledge Graph Report",
      focus: "Connected organizational knowledge, node relationships, relationship clusters, evidence paths, and graph health.",
      signals: [`${summary.knowledgeNodes || 0} knowledge nodes available.`, `${summary.knowledgeEdges || 0} graph edges available.`, "Relationship intelligence is active."],
      recommendations: [
        "Review high-importance relationship clusters.",
        "Reduce isolated knowledge nodes by linking documents, meetings, decisions, and risks.",
        "Use cluster intelligence to understand connected business context.",
        "Prepare team-level graph inheritance for Nexus Teams.",
      ],
    },
    "document-intelligence": {
      title: "Document Intelligence Report",
      focus: "Learned documents, extracted metrics, document evidence, source traceability, and document-driven intelligence.",
      signals: [`${summary.documents || 0} document(s) learned.`, "Document evidence is available.", "Document metrics can feed KPI and trend intelligence."],
      recommendations: [
        "Review recently learned documents.",
        "Validate extracted metrics and decisions.",
        "Use evidence detail to inspect document traceability.",
        "Connect document findings to reports and team workspaces.",
      ],
    },
    "memory-intelligence": {
      title: "Enterprise Memory Report",
      focus: "Persistent organizational memory, remembered facts, memory highlights, and reusable context for Nexus chat.",
      signals: [`${summary.enterpriseMemory || 0} memory item(s) available.`, "Memory is available to support chat and reports.", "Memory can connect to KG evidence."],
      recommendations: [
        "Review important memory highlights.",
        "Connect memories to source documents and decisions.",
        "Use memory to improve chat continuity.",
        "Prepare team-specific memory inheritance for Nexus Teams.",
      ],
    },
    "risk-decision-action": {
      title: "Risk, Decision & Action Report",
      focus: "Governance intelligence across risks, decisions, action items, follow-ups, and operational accountability.",
      signals: [`${summary.risks || 0} risk(s) visible.`, `${summary.decisions || 0} decision(s) visible.`, `${summary.actionItems || 0} action item(s) visible.`],
      recommendations: [
        "Review unresolved risks and assign mitigation owners.",
        "Validate decisions that require execution.",
        "Convert action items into tracked work.",
        "Use Teams later to manage ownership and follow-up.",
      ],
    },
  };

  return profiles[reportId] || profiles["executive-overview"];
}

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = decodeURIComponent(String(params?.reportId || "executive-overview"));
  const [data, setData] = useState<any>(null);

  async function load() {
    try {
      const res = await fetch("/api/riomind/intelligence/overview?limit=8", { cache: "no-store" });
      setData(await res.json());
    } catch {
      setData(null);
    }
  }

  useEffect(() => {
    load();
  }, [reportId]);

  const summary = data?.summary || {};
  const profile = getReportProfile(reportId, summary);
  const reportTitle = profile.title || titleFromId(reportId);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_30%),#020617] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <Link href="/nexus/intelligence" className="text-sm font-bold text-cyan-300 hover:text-cyan-100">
            ← Back to Intelligence Center
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Executive Report</div>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-5xl">
                {reportTitle}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {profile.focus}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">Confidence</div>
              <div className="mt-1 text-2xl font-black text-white">High</div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
          <div className="flex flex-wrap gap-2">
            {["Overview", "Reasoning", "Evidence", "Notebook", "Compare", "Board Report"].map((tab) => (
              <button
                key={tab}
                className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"
              >
                {tab}
              </button>
            ))}
          </div>
        </section>


        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Knowledge</div>
            <div className="mt-2 text-4xl font-black">{summary.knowledgeNodes || 0}</div>
          </div>
          <div className="rounded-3xl border border-violet-300/20 bg-violet-300/[0.06] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-violet-300">Evidence</div>
            <div className="mt-2 text-4xl font-black">{summary.knowledgeEdges || 0}</div>
          </div>
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-amber-300">Decisions</div>
            <div className="mt-2 text-4xl font-black">{summary.decisions || 0}</div>
          </div>
          <div className="rounded-3xl border border-rose-300/20 bg-rose-300/[0.06] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-rose-300">Risks</div>
            <div className="mt-2 text-4xl font-black">{summary.risks || 0}</div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Executive Summary</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {profile.focus} RioMind synthesized {summary.documents || 0} documents, {summary.kpis || 0} KPIs,
            {summary.trends || 0} trends, {summary.enterpriseMemory || 0} memory records, {summary.decisions || 0}
            decisions, {summary.actionItems || 0} action items, and {summary.risks || 0} risks into this report.
          </p>
        </section>


        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-6">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Executive Brief</div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</div>
                <div className="mt-2 text-2xl font-black text-rose-200">Critical</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Impact</div>
                <div className="mt-2 text-2xl font-black text-amber-200">High</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Confidence</div>
                <div className="mt-2 text-2xl font-black text-emerald-200">High</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Priority</div>
                <div className="mt-2 text-2xl font-black text-cyan-200">Immediate</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Evidence Strength</div>
            <div className="mt-5 space-y-3 text-sm font-bold text-slate-300">
              <div>Knowledge ██████████</div>
              <div>Relationships █████████</div>
              <div>Documents ████████</div>
              <div>Decisions ██████</div>
              <div>Risks █████</div>
            </div>
          </div>
        </section>

        <IntelligenceTrail
          items={[
            { type: "document", label: "Documents" },
            { type: "metric", label: "KPIs and Trends" },
            { type: "memory", label: "Enterprise Memory" },
            { type: "knowledge", label: "Knowledge Graph" },
            { type: "evidence", label: "Evidence and Traceability" },
            { type: "briefing", label: "Executive Report" },
          ]}
        />

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Business Signals</h2>
            <div className="mt-5 grid gap-3">
              {profile.signals.map((signal: string, index: number) => (
                <div key={`profile-signal-${index}`} className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Report Signal</div>
                  <div className="mt-2 font-bold text-white">{signal}</div>
                </div>
              ))}

              {(data?.latestIntelligence || []).slice(0, 4).map((item: any, index: number) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{item.type}</div>
                  <div className="mt-2 font-bold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Executive Recommendations</h2>
            <div className="mt-5 space-y-3">
              {profile.recommendations.map((item: string) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
                  <span className="text-cyan-300">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.035] p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Ask RioMind</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Report-scoped Ask RioMind will use this report, evidence, reasoning, KPIs, trends, risks, decisions, and knowledge graph context.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Summarize this report.",
              "What evidence supports this report?",
              "Which risks need attention?",
              "Generate a board summary.",
            ].map((question) => (
              <button
                key={question}
                disabled
                className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-bold text-slate-300 opacity-80"
              >
                {question}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
