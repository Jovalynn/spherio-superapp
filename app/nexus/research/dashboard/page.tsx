"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ResearchSession = {
  id: string;
  title: string;
  goal: string;
  depth: string;
  sources: string;
  outputType: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

type ResearchReport = {
  id: string;
  sessionId: string;
  title: string;
  reportContent: string;
  reportType: string;
  artifactName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ArtifactItem = {
  id?: string;
  type?: string;
  name?: string;
  title?: string;
  downloadUrl?: string;
  createdAt?: string;
};

type NexusProject = {
  id: string;
  name: string;
  description?: string | null;
  memories?: unknown[];
};

export default function ResearchDashboardPage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [projects, setProjects] = useState<NexusProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const [sessionsRes, reportsRes, artifactsRes, projectsRes] = await Promise.all([
        fetch("/api/riomind/research/sessions?limit=100", { cache: "no-store" }),
        fetch("/api/riomind/research/reports?limit=100", { cache: "no-store" }),
        fetch("/api/riomind/artifacts/list?limit=100", { cache: "no-store" }),
        fetch("/api/riomind/projects?limit=100", { cache: "no-store" }),
      ]);

      const [sessionsData, reportsData, artifactsData, projectsData] = await Promise.all([
        sessionsRes.json(),
        reportsRes.json(),
        artifactsRes.json(),
        projectsRes.json(),
      ]);

      setSessions(Array.isArray(sessionsData.sessions) ? sessionsData.sessions : []);
      setReports(Array.isArray(reportsData.reports) ? reportsData.reports : []);
      setArtifacts(Array.isArray(artifactsData.artifacts) ? artifactsData.artifacts : []);
      setProjects(Array.isArray(projectsData.projects) ? projectsData.projects : []);
    } catch {
      setError("Nexus could not load the Research Dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const activeSessions = sessions.filter((session) => session.status !== "archived").length;
    const archivedSessions = sessions.filter((session) => session.status === "archived").length;
    const researchArtifacts = artifacts.filter((artifact) =>
      String(artifact.name || artifact.title || "").toLowerCase().includes("report")
    );

    return {
      sessions: sessions.length,
      activeSessions,
      archivedSessions,
      reports: reports.length,
      artifacts: researchArtifacts.length,
      projects: projects.length,
    };
  }, [artifacts, projects.length, reports.length, sessions]);

  const statCards = [
    ["🔬 Sessions", stats.sessions, `${stats.activeSessions} active · ${stats.archivedSessions} archived`],
    ["📑 Reports", stats.reports, "Saved research reports"],
    ["📦 Artifacts", stats.artifacts, "Research exports found"],
    ["🧠 Projects", stats.projects, "Project Memory workspaces"],
  ];

  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-cyan-300/15 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/50">
              RioMind Nexus
            </div>
            <h1 className="mt-1 text-3xl font-black text-cyan-50">Research Dashboard</h1>
            <p className="mt-1 text-sm font-semibold text-white/45">
              Overview of research sessions, reports, artifacts, and Project Memory.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/nexus/research" className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2 text-sm font-black text-cyan-100">
              New Research
            </Link>
            <Link href="/nexus/research/sessions" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/60">
              Sessions
            </Link>
            <Link href="/nexus/research/reports" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/60">
              Reports
            </Link>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">
            {error}
          </div>
        ) : null}

        <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map(([title, value, subtitle]) => (
            <article key={String(title)} className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5">
              <div className="text-sm font-black text-cyan-100/70">{title}</div>
              <div className="mt-3 text-3xl font-black text-cyan-50">{value}</div>
              <div className="mt-1 text-xs font-semibold text-white/35">{subtitle}</div>
            </article>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-cyan-50">Recent Sessions</h2>
              <Link href="/nexus/research/sessions" className="text-xs font-black text-cyan-100/70">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-sm font-bold text-white/35">Loading...</div>
              ) : sessions.slice(0, 5).length ? (
                sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-black text-cyan-50">{session.title}</div>
                      <span className="rounded-full border border-cyan-300/15 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-100">
                        {session.status}
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs font-semibold text-white/35">{session.goal}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm font-bold text-white/35">No sessions yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-cyan-50">Saved Reports</h2>
              <Link href="/nexus/research/reports" className="text-xs font-black text-cyan-100/70">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-sm font-bold text-white/35">Loading...</div>
              ) : reports.slice(0, 5).length ? (
                reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="truncate text-sm font-black text-cyan-50">{report.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs font-semibold text-white/35">
                      {report.reportContent}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm font-bold text-white/35">No reports yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-cyan-50">Recent Artifacts</h2>
              <Link href="/nexus/workspace" className="text-xs font-black text-cyan-100/70">
                Workspace
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-sm font-bold text-white/35">Loading...</div>
              ) : artifacts.slice(0, 5).length ? (
                artifacts.slice(0, 5).map((artifact, index) => (
                  <div key={artifact.id || artifact.name || index} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="truncate text-sm font-black text-cyan-50">
                      {artifact.title || artifact.name || "Nexus Artifact"}
                    </div>
                    <div className="mt-1 text-xs font-semibold uppercase text-white/35">{artifact.type || "artifact"}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm font-bold text-white/35">No artifacts yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-cyan-50">Project Memory</h2>
              <Link href="/nexus/projects" className="text-xs font-black text-cyan-100/70">
                Projects
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-sm font-bold text-white/35">Loading...</div>
              ) : projects.slice(0, 5).length ? (
                projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="truncate text-sm font-black text-cyan-50">{project.name}</div>
                    <div className="mt-1 line-clamp-2 text-xs font-semibold text-white/35">
                      {project.description || "Project Memory workspace"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm font-bold text-white/35">No projects yet.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
