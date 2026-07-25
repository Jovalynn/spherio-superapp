"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function stateClass(state: string) {
  if (state === "healthy") return "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200";
  if (state === "partial") return "border-amber-300/20 bg-amber-300/[0.06] text-amber-200";
  return "border-slate-300/15 bg-slate-300/[0.05] text-slate-300";
}

function stateDot(state: string) {
  if (state === "healthy") return "🟢";
  if (state === "partial") return "🟡";
  return "⚪";
}

export default function NexusTeamsDiagnosticsPage() {
  const [data, setData] = useState<any>(null);

  async function load() {
    const res = await fetch("/api/riomind/teams/diagnostics", { cache: "no-store" });
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  const checks = data?.runtimes || data?.checks || [];

  return (
    <main className="min-h-screen bg-[#060b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <Link href="/nexus" className="text-sm font-bold text-cyan-300">
            ← Back to Nexus
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Nexus Teams</div>
              <h1 className="mt-2 text-4xl font-black">Runtime Diagnostics</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Internal verification surface for Teams, meetings, voice, translation, transcript, knowledge graph, reasoning, memory, reports, search, and agents.
              </p>
            </div>

            <button
              onClick={load}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100"
            >
              Refresh diagnostics
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">Overall Score</div>
            <div className="mt-2 text-5xl font-black">{data?.overall?.score ?? "—"}</div>
          </div>

          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-emerald-300">Healthy</div>
            <div className="mt-2 text-5xl font-black">{checks.filter((x:any) => x.state === "healthy").length}</div>
          </div>

          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-amber-300">Needs Verification</div>
            <div className="mt-2 text-5xl font-black">{checks.filter((x:any) => x.state !== "healthy").length}</div>
          </div>
        </section>


        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Live Intelligence Snapshot</div>
          <div className="mt-5 grid gap-3 md:grid-cols-6">
            {[
              ["Clusters", data?.intelligence?.clusters],
              ["Meetings", data?.intelligence?.meetingClusters],
              ["Critical", data?.intelligence?.criticalClusters],
              ["Nodes", data?.intelligence?.knowledgeNodes],
              ["Decisions", data?.intelligence?.decisions],
              ["Risks", data?.intelligence?.risks],
            ].map(([label, value]: any) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
                <div className="mt-2 text-2xl font-black text-white">{value ?? "—"}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {checks.map((check: any) => (
            <div key={check.label} className={`rounded-3xl border p-5 ${stateClass(check.state)}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] opacity-80">{check.state}</div>
                  <h2 className="mt-2 text-2xl font-black text-white">{stateDot(check.state)} {check.label}</h2>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-2xl font-black text-white">
                  {check.score}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {(check.details || []).map((detail: string) => (
                  <div key={detail} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-200">
                    {detail}
                  </div>
                ))}
              </div>

              {check.metrics && (
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {Object.entries(check.metrics).slice(0, 6).map(([key, value]: any) => (
                    <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{String(key).replace(/([A-Z])/g, " $1")}</div>
                      <div className="mt-1 break-words text-sm font-bold text-white">{String(value ?? "—")}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Next verification actions</div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(data?.nextActions || []).map((item: string) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
                ✓ {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
