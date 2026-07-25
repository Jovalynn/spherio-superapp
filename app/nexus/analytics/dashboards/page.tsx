"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AnalyticsDashboard = {
  id: string;
  reportId: string;
  sessionId?: string | null;
  title: string;
  dashboardType: string;
  status: string;
  dashboardJson?: {
    kpis?: Array<{ label: string; value: string }>;
    sections?: Array<{ title: string; summary: string }>;
    insights?: string[];
    chartPlaceholders?: Array<{ title: string; type: string }>;
  };
  createdAt?: string;
  updatedAt?: string;
};

type DashboardFilter = "all" | "generated" | "archived";

export default function NexusAnalyticsDashboardsPage() {
  const [dashboards, setDashboards] = useState<AnalyticsDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  async function loadDashboards() {
    setLoading(true);
    try {
      const res = await fetch("/api/riomind/analytics/dashboards?limit=100", {
        cache: "no-store",
      });
      const data = await res.json();
      setDashboards(data.dashboards ?? []);
    } finally {
      setLoading(false);
    }
  }

  const filteredDashboards = useMemo(
    () =>
      filter === "all"
        ? dashboards
        : dashboards.filter((dashboard) => dashboard.status === filter),
    [dashboards, filter]
  );

  const pageCount = Math.max(1, Math.ceil(filteredDashboards.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pagedDashboards = filteredDashboards.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    void loadDashboards();
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
                Analytics Dashboards
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-white/55">
                Visual decision surfaces generated from analytics reports, with KPI cards,
                insights, chart placeholders, and executive dashboard structure.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/nexus/analytics/reports"
                className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50"
              >
                Reports
              </Link>
              <Link
                href="/nexus/analytics/sessions"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white/70"
              >
                Sessions
              </Link>
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "generated", "archived"] as DashboardFilter[]).map((item) => (
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
            Showing {filteredDashboards.length ? pageStart + 1 : 0}-
            {Math.min(pageStart + pageSize, filteredDashboards.length)} of {filteredDashboards.length}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/50">
              Loading dashboards...
            </div>
          ) : filteredDashboards.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/50">
              No dashboards generated yet.
            </div>
          ) : (
            pagedDashboards.map((dashboard) => (
              <article
                key={dashboard.id}
                className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-black/20"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-cyan-50">
                      {dashboard.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-white/45">
                      {dashboard.dashboardType.replace(/_/g, " ")}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">
                    {dashboard.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {(dashboard.dashboardJson?.kpis ?? []).slice(0, 4).map((kpi) => (
                    <div
                      key={`${dashboard.id}-${kpi.label}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                        {kpi.label}
                      </div>
                      <div className="mt-1 font-black capitalize text-white">
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/nexus/analytics/dashboards/${dashboard.id}`}
                    className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50"
                  >
                    Open Dashboard
                  </Link>
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
