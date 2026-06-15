"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type NexusProject = {
  id: string;
  name: string;
  description?: string | null;
};

export default function NexusResearchPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<NexusProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState("standard");
  const [sources, setSources] = useState("combined");
  const [format, setFormat] = useState("report");

  async function loadProjects() {
    try {
      const res = await fetch("/api/riomind/projects?limit=100", { cache: "no-store" });
      const data = await res.json();
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch {
      setProjects([]);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  function startResearch() {
    const cleanTopic = topic.trim();
    if (!cleanTopic) return;

    const prompt = [
      "Start a Nexus Research Workspace task.",
      "",
      `Research goal: ${cleanTopic}`,
      `Research depth: ${depth}`,
      `Source preference: ${sources}`,
      projectId
        ? `Project context: ${projects.find((project) => project.id === projectId)?.name || projectId}`
        : "Project context: none selected",
      `Output format: ${format}`,
      "",
      "Please produce a structured research plan first, then continue with the research answer using clear sections, citations where web sources are used, tables where helpful, and action-ready recommendations.",
    ].join("\n");

    router.push(`/riomind/chat?prompt=${encodeURIComponent(prompt)}`);
  }

  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between rounded-[32px] border border-cyan-300/15 bg-white/[0.035] p-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/50">
              RioMind Nexus
            </div>
            <h1 className="mt-1 text-3xl font-black text-cyan-50">Research Workspace</h1>
            <p className="mt-1 text-sm font-semibold text-white/45">
              Research topics, markets, competitors, projects, trends, and reports.
            </p>
          </div>

          <Link
            href="/riomind/chat"
            className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2 text-sm font-black text-cyan-100"
          >
            Back to Chat
          </Link>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
              Research Goal
            </div>

            <label className="mt-3 block rounded-3xl border border-white/10 bg-black/24 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/50">
                Project Memory
              </div>
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-sm font-bold text-white"
              >
                <option value="">No project selected</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Example: Research AI infrastructure aggregators for Nexus Creator Studio..."
              rows={8}
              className="mt-3 w-full resize-none rounded-3xl border border-white/10 bg-black/35 p-4 text-sm font-semibold leading-7 text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30"
            />

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="rounded-3xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/50">
                  Depth
                </div>
                <select
                  value={depth}
                  onChange={(event) => setDepth(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-sm font-bold text-white"
                >
                  <option value="quick">Quick</option>
                  <option value="standard">Standard</option>
                  <option value="deep">Deep</option>
                </select>
              </label>

              <label className="rounded-3xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/50">
                  Sources
                </div>
                <select
                  value={sources}
                  onChange={(event) => setSources(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-sm font-bold text-white"
                >
                  <option value="web">Web</option>
                  <option value="project_memory">Project Memory</option>
                  <option value="files">Uploaded Files</option>
                  <option value="artifacts">Artifacts</option>
                  <option value="combined">Combined</option>
                </select>
              </label>

              <label className="rounded-3xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/50">
                  Output
                </div>
                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-sm font-bold text-white"
                >
                  <option value="report">📄 Report</option>
                  <option value="briefing">📋 Executive Brief</option>
                  <option value="spreadsheet">📊 Spreadsheet</option>
                  <option value="presentation">📽 PowerPoint Briefing</option>
                  <option value="notebook">🧠 Research Notebook</option>
                  <option value="market_analysis">📈 Market Analysis</option>
                  <option value="forecast_model">🔮 Forecast Model</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={startResearch}
              disabled={!topic.trim()}
              className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/18 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start Research
            </button>
          </div>

          <aside className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
              Research Modes
            </div>

            <div className="mt-4 space-y-3">
              {[
                ["📊 Market Research", "Trends, competitors, narratives"],
                ["🧠 Project Research", "Use Project Memory context"],
                ["📁 File Research", "Analyze uploaded documents"],
                ["📈 Data Research", "Tables, graphs, forecasts"],
                ["🚀 Launch Research", "Prime, Pump, product launches"],
              ].map(([title, subtitle]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-black/24 p-4">
                  <div className="text-sm font-black text-cyan-50">{title}</div>
                  <div className="mt-1 text-xs font-semibold text-white/35">{subtitle}</div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
