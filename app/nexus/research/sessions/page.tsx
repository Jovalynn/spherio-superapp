"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type ResearchSession = {
  id: string;
  title: string;
  goal: string;
  depth: string;
  sources: string;
  outputType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type NexusProject = {
  id: string;
  name: string;
  description?: string | null;
};

export default function ResearchSessionsPage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [projects, setProjects] = useState<NexusProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/riomind/research/sessions?limit=100", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data.ok) throw new Error(data.error || "sessions_failed");
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch {
      setSessions([]);
      setError("Nexus could not load research sessions.");
    } finally {
      setLoading(false);
    }
  }

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
    void loadSessions();
    void loadProjects();
  }, []);

  function openSession(session: ResearchSession) {
    const prompt = [
      "Resume this Nexus Research Session.",
      "",
      `Research title: ${session.title}`,
      `Research goal: ${session.goal}`,
      `Research depth: ${session.depth}`,
      `Source preference: ${session.sources}`,
      `Output format: ${session.outputType}`,
      "",
      "Continue the research with a structured update, findings, recommendations, and next actions.",
    ].join("\n");

    window.location.href = `/riomind/chat?prompt=${encodeURIComponent(prompt)}`;
  }

  async function saveSessionToMemory(session: ResearchSession) {
    if (!projectId) {
      setError("Select a Project Memory project first.");
      return;
    }

    setSavingId(session.id);
    setError(null);

    try {
      const res = await fetch(`/api/riomind/projects/${encodeURIComponent(projectId)}/memories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memoryType: "research_finding",
          title: session.title,
          content: [
            `Research goal: ${session.goal}`,
            `Depth: ${session.depth}`,
            `Sources: ${session.sources}`,
            `Output type: ${session.outputType}`,
            `Status: ${session.status}`,
          ].join("\n"),
          importance: 4,
          source: "research_session",
          metadata: {
            researchSessionId: session.id,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "memory_save_failed");
    } catch {
      setError("Nexus could not save this session to Project Memory.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-cyan-300/15 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/50">
              RioMind Nexus
            </div>
            <h1 className="mt-1 text-3xl font-black text-cyan-50">Research Sessions</h1>
            <p className="mt-1 text-sm font-semibold text-white/45">
              Manage saved research tasks and send findings into Project Memory.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/nexus/research"
              className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2 text-sm font-black text-cyan-100"
            >
              New Research
            </Link>
            <Link
              href="/riomind/chat"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/60"
            >
              Back to Chat
            </Link>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">
            {error}
          </div>
        ) : null}

        <section className="mb-5 rounded-[28px] border border-white/10 bg-white/[0.025] p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
            Project Memory Target
          </div>
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="mt-3 w-full max-w-xl rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-bold text-white"
          >
            <option value="">Select project for memory saving</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 text-sm font-bold text-white/40">
              Loading sessions...
            </div>
          ) : sessions.length ? (
            sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5 shadow-xl shadow-black/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-cyan-50">{session.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-white/42">
                      {session.goal}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100">
                    {session.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                    <div className="text-[10px] font-bold uppercase text-white/30">Depth</div>
                    <div className="mt-1 text-xs font-black text-cyan-50">{session.depth}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                    <div className="text-[10px] font-bold uppercase text-white/30">Sources</div>
                    <div className="mt-1 text-xs font-black text-cyan-50">{session.sources}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                    <div className="text-[10px] font-bold uppercase text-white/30">Output</div>
                    <div className="mt-1 text-xs font-black text-cyan-50">{session.outputType}</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openSession(session)}
                    className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-3 py-2 text-xs font-black text-cyan-100"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveSessionToMemory(session)}
                    disabled={!projectId || savingId === session.id}
                    className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-100 disabled:opacity-35"
                  >
                    {savingId === session.id ? "Saving..." : "Save to Memory"}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-white/35"
                  >
                    Archive
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/12 bg-black/20 p-8 text-center md:col-span-2 xl:col-span-3">
              <div className="text-4xl">🔬</div>
              <h2 className="mt-3 text-xl font-black text-cyan-50">No research sessions yet</h2>
              <p className="mt-2 text-sm font-semibold text-white/40">
                Start research from the Research Workspace and sessions will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
