"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AnalyticsSession = {
  id: string;
  ownerKey?: string;
  title: string;
  mode: string;
  goal?: string | null;
  status: string;
  archivedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type SessionFilter = "all" | "active" | "completed" | "archived";

export default function NexusAnalyticsSessionsPage() {
  const [sessions, setSessions] = useState<AnalyticsSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SessionFilter>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await fetch("/api/riomind/analytics/sessions?limit=30", {
        cache: "no-store",
      });
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openSession(session: AnalyticsSession) {
    const prompt = [
      `Resume this Nexus Analytics Session.`,
      ``,
      `Analysis title: ${session.title}`,
      `Analysis mode: ${session.mode}`,
      `Goal / dataset / question: ${session.goal || session.title}`,
      `Status: ${session.status}`,
      ``,
      `Continue the analysis with a professional structured output, assumptions, methodology, computations, tables, visualization recommendations, risks, and actionable next steps.`,
    ].join("\n");

    window.location.href = `/riomind/chat?prompt=${encodeURIComponent(prompt)}`;
  }

  async function archiveSession(sessionId: string) {
    await fetch(`/api/riomind/analytics/sessions/${encodeURIComponent(sessionId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "archived" }),
    });

    await loadSessions();
  }

  const filteredSessions =
    filter === "all"
      ? sessions
      : sessions.filter((session) => session.status === filter);

  const pageCount = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pagedSessions = filteredSessions.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    void loadSessions();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  return (
    <main className="min-h-screen bg-[#050914] px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-cyan-300/15 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-950/20">
          <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200/55">
            RioMind Nexus
          </div>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                Analytics Sessions
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-white/55">
                Manage saved analytics tasks, reopen structured analysis, and continue
                financial modeling, forecasting, spreadsheet, BI, market, and visualization work.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/nexus/analytics"
                className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50"
              >
                New Analysis
              </Link>
              <Link
                href="/riomind/chat"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white/70"
              >
                Back to Chat
              </Link>
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "active", "completed", "archived"] as SessionFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                  filter === item
                    ? "border-cyan-300/35 bg-cyan-400/15 text-cyan-50"
                    : "border-white/10 bg-white/5 text-white/45 hover:border-cyan-300/20 hover:text-cyan-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-white/40">
            Showing {filteredSessions.length ? pageStart + 1 : 0}-
            {Math.min(pageStart + pageSize, filteredSessions.length)} of {filteredSessions.length}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/50">
              Loading analytics sessions...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/50">
              No analytics sessions saved yet.
            </div>
          ) : (
            pagedSessions.map((session) => (
              <article
                key={session.id}
                className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-cyan-50">
                      {session.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-white/45">
                      {session.goal || session.title}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">
                    {session.status}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                    Mode
                  </div>
                  <div className="mt-1 font-black text-white">
                    {session.mode}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openSession(session)}
                    className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50"
                  >
                    Open
                  </button>
                  {session.status !== "archived" ? (
                    <button
                      type="button"
                      onClick={() => void archiveSession(session.id)}
                      className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-black text-rose-100"
                    >
                      Archive
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/35"
                    >
                      Archived
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>

        <section className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/[0.025] p-4">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage <= 1}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/60 disabled:opacity-30"
          >
            Previous
          </button>

          <div className="text-sm font-black text-white/50">
            Page {safePage} of {pageCount}
          </div>

          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={safePage >= pageCount}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/60 disabled:opacity-30"
          >
            Next
          </button>
        </section>
      </section>
    </main>
  );
}
