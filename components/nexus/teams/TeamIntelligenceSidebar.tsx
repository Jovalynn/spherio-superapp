"use client";

import { useEffect, useState } from "react";

function stateDot(state: string) {
  if (state === "healthy") return "●";
  if (state === "partial") return "●";
  return "○";
}

function stateColor(state: string) {
  if (state === "healthy") return "text-emerald-300";
  if (state === "partial") return "text-amber-300";
  return "text-slate-400";
}

export default function TeamIntelligenceSidebar() {
  const [data, setData] = useState<any>(null);

  async function load() {
    try {
      const res = await fetch("/api/riomind/teams/diagnostics", { cache: "no-store" });
      setData(await res.json());
    } catch {
      setData(null);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  const intelligence = data?.intelligence || {};
  const runtimes = data?.runtimes || [];
  const agents = runtimes.find((x: any) => x.key === "agents")?.metrics || {};
  const reasoning = runtimes.find((x: any) => x.key === "reasoning")?.metrics || {};
  const reports = runtimes.find((x: any) => x.key === "reports")?.metrics || {};

  return (
    <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.045] p-5 shadow-[0_0_45px_rgba(34,211,238,0.10)]">
      <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
        Team Intelligence
      </div>
      <div className="mt-1 text-xs font-bold text-slate-400">
        Powered by RioMind Core
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-black/25 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Intelligence Score</div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="text-5xl font-black text-white">{data?.overall?.score ?? "—"}</div>
          <div className="text-sm font-black text-cyan-200">{data?.overall?.label || "Loading"}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          ["Clusters", intelligence.clusters],
          ["Meetings", intelligence.meetingClusters],
          ["Decisions", intelligence.decisions],
          ["Risks", intelligence.risks],
        ].map(([label, value]: any) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
            <div className="mt-1 text-xl font-black text-white">{value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          Live Executive Brief
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          This team currently has {intelligence.meetingClusters || 0} meeting intelligence cluster(s),
          {intelligence.decisions || 0} decision(s), {intelligence.actions || 0} action item(s),
          and {intelligence.risks || 0} risk signal(s). Reasoning is {reasoning.engine || "loading"}.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          Intelligence Timeline
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {[
            "Meeting intelligence detected",
            "Knowledge graph updated",
            "Decisions / actions / risks extracted",
            "Reasoning runtime refreshed",
            "Executive reports available",
          ].map((item, index) => (
            <div key={item} className="flex gap-3">
              <span className="text-cyan-300">{index === 0 ? "●" : "↓"}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          Active Agents
        </div>
        <div className="mt-4 space-y-2">
          {Object.entries(agents).map(([name, value]: any) => (
            <div key={name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <span className="text-sm font-bold text-white">{name.replace(/([A-Z])/g, " $1")}</span>
              <span className={`text-xs font-black ${stateColor(String(value).includes("idle") ? "placeholder" : "partial")}`}>
                {stateDot(String(value).includes("idle") ? "placeholder" : "partial")} {String(value).replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          Latest Executive Report
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {reports.reportCards || 0} report cards available. Executive workspace: {reports.executiveWorkspace || "loading"}.
        </p>
        <a href="/nexus/intelligence?tab=Reports" className="mt-3 inline-block text-xs font-black text-cyan-300">
          Open Reports →
        </a>
      </div>
    </section>
  );
}
