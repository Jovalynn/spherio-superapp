"use client";

import { useEffect, useMemo, useState } from "react";

function pillClass(state: string) {
  if (state === "healthy") return "border-emerald-300/20 bg-emerald-300/10 text-emerald-200";
  if (state === "partial") return "border-amber-300/20 bg-amber-300/10 text-amber-200";
  return "border-slate-300/15 bg-slate-300/10 text-slate-300";
}

function dot(state: string) {
  if (state === "healthy") return "●";
  if (state === "partial") return "●";
  return "○";
}

function getRuntime(runtimes: any[], key: string) {
  return runtimes.find((item: any) => item.key === key) || {};
}

export default function TeamIntelligenceWorkspace({ meetingCode }: { meetingCode?: string }) {
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  async function load() {
    try {
      const res = await fetch("/api/riomind/teams/diagnostics", { cache: "no-store" });
      setData(await res.json());
    } catch {
      setData(null);
    }
  }

  async function loadEvents() {
    try {
      const suffix = meetingCode ? `?meetingCode=${encodeURIComponent(meetingCode)}` : "";
      const res = await fetch(`/api/riomind/teams/intelligence/events${suffix}`, { cache: "no-store" });
      const json = await res.json();
      setEvents(Array.isArray(json?.events) ? json.events : []);
    } catch {
      setEvents([]);
    }
  }

  useEffect(() => {
    load();
    loadEvents();
    const timer = setInterval(() => {
      load();
      loadEvents();
    }, 15000);
    return () => clearInterval(timer);
  }, [meetingCode]);

  const runtimes = data?.runtimes || [];
  const intelligence = data?.intelligence || {};
  const meeting = getRuntime(runtimes, "meeting");
  const transcript = getRuntime(runtimes, "transcript");
  const graph = getRuntime(runtimes, "knowledge_graph");
  const reasoning = getRuntime(runtimes, "reasoning");
  const rda = getRuntime(runtimes, "risks_decisions_actions");
  const memory = getRuntime(runtimes, "memory");
  const agents = getRuntime(runtimes, "agents");
  const reports = getRuntime(runtimes, "reports");

  const score = data?.overall?.score ?? 0;

  const healthCards = useMemo(() => ([
    ["Knowledge", graph?.score ?? "—", graph?.state || "placeholder"],
    ["Reasoning", reasoning?.score ?? "—", reasoning?.state || "placeholder"],
    ["Decisions", intelligence.decisions ?? 0, rda?.state || "placeholder"],
    ["Risks", intelligence.risks ?? 0, rda?.state || "placeholder"],
    ["Memory", memory?.score ?? "—", memory?.state || "placeholder"],
    ["Reports", reports?.score ?? "—", reports?.state || "placeholder"],
  ]), [graph, reasoning, intelligence, rda, memory, reports]);


  const agentMetrics = agents?.metrics || {};

  return (
    <aside className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto rounded-[1.75rem] border border-cyan-300/20 bg-[#07111c]/95 p-5 shadow-[0_0_50px_rgba(34,211,238,0.12)]">
      <header className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.055] p-4">
        <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
          Team Intelligence
        </div>
        <div className="mt-1 text-xs font-bold text-slate-400">
          Powered by RioMind Core
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Score</div>
            <div className="mt-1 text-6xl font-black text-white">{score || "—"}</div>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-black/25 px-3 py-2 text-right">
            <div className="text-xs uppercase tracking-[0.16em] text-cyan-300">Status</div>
            <div className="mt-1 text-sm font-black text-white">{data?.overall?.label || "Loading"}</div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {healthCards.map(([label, value, state]: any) => (
          <div key={label} className={`rounded-2xl border p-4 ${pillClass(state)}`}>
            <div className="text-[11px] uppercase tracking-[0.16em] hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]">{label}</div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-2xl font-black text-white">{value}</span>
              <span className="text-xs font-black">{dot(state)}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          Executive Brief
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {meetingCode ? `Meeting ${meetingCode}` : "This team"} currently has {intelligence.meetingClusters || 0}
          meeting intelligence cluster(s), {intelligence.decisions || 0} decision(s),
          {intelligence.actions || 0} action item(s), and {intelligence.risks || 0} risk signal(s).
        </p>
        <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3 text-xs leading-5 text-slate-300">
          Recommended next step: keep reasoning, memory, reports, and agent state synchronized as meeting activity changes.
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          Live Runtime
        </div>
        <div className="mt-3 grid gap-2">
          {[
            ["Meeting", meeting?.state, meeting?.metrics?.latestMeeting],
            ["Transcript", transcript?.state, `${transcript?.metrics?.transcriptLinkedNodes ?? 0} linked nodes`],
            ["Graph", graph?.state, `${graph?.metrics?.clusters ?? 0} clusters`],
            ["Reasoning", reasoning?.state, reasoning?.metrics?.chatRouter],
          ].map(([label, state, value]: any) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-white">{label}</span>
                <span className={`text-xs font-black ${state === "healthy" ? "text-emerald-300" : "text-amber-300"}`}>
                  {dot(state)} {state || "loading"}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-400">{value || "—"}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          Live Meeting Timeline
        </div>
        <div className="mt-4 space-y-4">
          {(events.length ? events : []).slice(0, 9).map((item: any, index: number) => (
            <div key={item.id || `${item.title}-${index}`} className="relative flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-5 text-slate-300">
              {index < Math.min(events.length, 9) - 1 && (
                <div className="absolute left-[5px] top-5 h-full w-px bg-cyan-300/20" />
              )}
              <span className={`relative mt-1 ${
                item.status === "completed" ? "text-emerald-300" :
                item.status === "warning" ? "text-amber-300" :
                item.status === "pending" ? "text-slate-400" : "text-cyan-300"
              }`}>{index === 0 ? "●" : "↓"}</span>
              <span>
                <span className="font-black text-white">{item.title}</span>
                <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-cyan-300/70">
                  {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "live"}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">{item.summary}</span>
              </span>
            </div>
          ))}

          {!events.length && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs text-slate-400">
              Waiting for live intelligence events...
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          Active Agents
        </div>
        <div className="mt-3 space-y-2">
          {Object.entries(agentMetrics).map(([name, value]: any) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-white">{name.replace(/([A-Z])/g, " $1")}</span>
                <span className="text-xs font-black text-amber-300">● {String(value).replace(/_/g, " ")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          Executive Reports
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {reports?.metrics?.reportCards || 0} executive report cards are available. Report workspace is {reports?.metrics?.executiveWorkspace || "loading"}.
        </p>
        <a href="/nexus/intelligence?tab=Reports" className="mt-3 inline-block text-xs font-black text-cyan-300">
          Open Reports →
        </a>
      </section>

      <section className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.035] p-4">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          Ask Team AI
        </div>
        <div className="mt-3 grid gap-2">
          {[
            "What changed in this meeting?",
            "Which risks need attention?",
            "Summarize decisions.",
            "Generate executive brief.",
          ].map((question) => (
            <button
              key={question}
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left text-xs font-bold text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"
            >
              {question}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
