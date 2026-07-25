"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function formatCompact(value: number) {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function MiniLineChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const width = 520;
  const height = 180;
  const padding = 28;
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - ((item.value - min) / range) * (height - padding * 2);
    return { ...item, x, y };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full overflow-visible">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.16)" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.16)" />

        <path d={pathData} fill="none" stroke="rgba(103,232,249,0.95)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill="rgba(103,232,249,1)" />
            <text x={point.x} y={height - 6} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.55)">
              {point.label}
            </text>
            <text x={point.x} y={point.y - 12} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.75)">
              {formatCompact(point.value)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ScenarioBarChart({
  scenarios,
}: {
  scenarios: Array<{ scenario: string; revenue?: number; valuation?: number; impact?: number; confidence?: string }>;
}) {
  const values = scenarios.map((item) => item.valuation ?? item.revenue ?? item.impact ?? 0);
  const max = Math.max(...values, 1);

  return (
    <div className="mt-5 space-y-3">
      {scenarios.map((scenario) => {
        const value = scenario.valuation ?? scenario.revenue ?? scenario.impact ?? 0;
        const width = Math.max(8, (value / max) * 100);

        return (
          <div key={scenario.scenario} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4 text-sm font-black">
              <span className="text-cyan-50">{scenario.scenario}</span>
              <span className="text-white/70">
                {scenario.valuation || scenario.revenue ? `$${formatCompact(value)}` : formatCompact(value)}
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300/80" style={{ width: `${width}%` }} />
            </div>
            {scenario.confidence ? (
              <div className="mt-2 text-xs font-bold text-white/40">Confidence: {scenario.confidence}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}


type DashboardJson = {
  kpis?: Array<{ label: string; value: string; trend?: string; tone?: string }>;
  sections?: Array<{ title: string; summary: string }>;
  insights?: Array<{ label?: string; severity?: string; text?: string } | string>;
  chartPlaceholders?: Array<{ title: string; type: string; description?: string; data?: Array<{ label: string; value: number }> }>;
  charts?: Array<{ title: string; type: string; description?: string; data?: Array<{ label: string; value: number }> }>;
  scenarios?: Array<{ scenario: string; revenue?: number; valuation?: number; confidence?: string; impact?: number }>;
  risks?: Array<{ risk: string; impact: string; confidence: string; action: string }>;
  financialTable?: Array<{ year: string; revenue: number; ebitda: number; valuation: number }>;
  templateName?: string;
  templateSections?: string[];
  executiveSummary?: string;
};

type AnalyticsDashboard = {
  id: string;
  reportId: string;
  sessionId?: string | null;
  title: string;
  dashboardType: string;
  status: string;
  dashboardJson?: DashboardJson;
};

export default function NexusAnalyticsDashboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [dashboardId, setDashboardId] = useState("");
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void params.then((value) => setDashboardId(value.id));
  }, [params]);

  useEffect(() => {
    if (!dashboardId) return;

    async function loadDashboard() {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/riomind/analytics/dashboards/${encodeURIComponent(dashboardId)}`,
          { cache: "no-store" }
        );

        const data = await res.json();
        setDashboard(data.dashboard ?? null);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [dashboardId]);

  const json = dashboard?.dashboardJson ?? {};

  return (
    <main className="min-h-screen bg-[#050914] px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-cyan-300/15 bg-slate-950/70 p-8">
          <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200/55">
            RioMind Nexus
          </div>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                {dashboard?.title || "Analytics Dashboard"}
              </h1>
              <p className="mt-2 text-sm font-semibold text-white/55">
                KPI cards, insights, analysis sections, and chart-ready dashboard structure.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/nexus/analytics/dashboards"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white/70"
              >
                Dashboards
              </Link>

              <Link
                href="/nexus/analytics/reports"
                className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50"
              >
                Reports
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-white/50">
            Loading dashboard...
          </section>
        ) : !dashboard ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-white/50">
            Dashboard not found.
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              {(json.kpis ?? []).map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-3xl border border-white/10 bg-slate-950/70 p-5"
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                    {kpi.label}
                  </div>
                  <div className="mt-2 text-xl font-black capitalize text-cyan-50">
                    {kpi.value}
                  </div>
                  {kpi.trend ? (
                    <div
                      className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${
                        kpi.tone === "positive"
                          ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                          : kpi.tone === "warning"
                            ? "border-amber-300/25 bg-amber-400/10 text-amber-100"
                            : "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
                      }`}
                    >
                      <span className="mr-1">
                        {kpi.tone === "positive" ? "↑" : kpi.tone === "warning" ? "!" : "•"}
                      </span>
                      {kpi.trend}
                    </div>
                  ) : null}
                </div>
              ))}
            </section>

            {json.executiveSummary ? (
              <section className="rounded-[2rem] border border-cyan-300/15 bg-cyan-400/[0.06] p-6">
                <h2 className="text-2xl font-black text-cyan-50">Executive Summary</h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/65">
                  {json.executiveSummary}
                </p>
              </section>
            ) : null}

            {json.templateName ? (
              <section className="rounded-[2rem] border border-emerald-300/15 bg-emerald-400/[0.055] p-6">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-100/45">
                  Dashboard Template
                </div>
                <h2 className="mt-2 text-2xl font-black text-emerald-50">
                  {json.templateName}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(json.templateSections ?? []).map((section) => (
                    <span
                      key={section}
                      className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-100"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="grid gap-4 lg:grid-cols-3">
              {((json.charts ?? json.chartPlaceholders) ?? []).map((chart) => (
                <div
                  key={chart.title}
                  className="rounded-3xl border border-cyan-300/15 bg-cyan-400/[0.06] p-6"
                >
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/50">
                    {chart.type}
                  </div>
                  <h2 className="mt-3 text-xl font-black text-cyan-50">
                    {chart.title}
                  </h2>
                  <p className="mt-3 text-sm font-semibold text-white/45">
                    {chart.description || "Chart-ready visualization panel."}
                  </p>

                  {"data" in chart && Array.isArray(chart.data) && chart.type === "line" ? (
                    <MiniLineChart data={chart.data} />
                  ) : "data" in chart && Array.isArray(chart.data) ? (
                    <div className="mt-4 space-y-2">
                      {chart.data.map((point) => (
                        <div key={point.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-white/65">
                          <span>{point.label}</span>
                          <span>{point.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </section>

            {(json.scenarios ?? []).length > 0 ? (
              <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
                <h2 className="text-2xl font-black text-cyan-50">Scenario Comparison</h2>
                <ScenarioBarChart scenarios={json.scenarios ?? []} />
              </section>
            ) : null}

            {(json.risks ?? []).length > 0 ? (
              <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
                <h2 className="text-2xl font-black text-cyan-50">Risk Matrix</h2>
                <div className="mt-4 grid gap-3">
                  {(json.risks ?? []).map((risk) => (
                    <div key={risk.risk} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-white/65 md:grid-cols-4">
                      <div className="font-black text-cyan-50">{risk.risk}</div>
                      <div>Impact: {risk.impact}</div>
                      <div>Confidence: {risk.confidence}</div>
                      <div>{risk.action}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {(json.financialTable ?? []).length > 0 ? (
              <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
                <h2 className="text-2xl font-black text-cyan-50">Financial Table</h2>
                <div className="mt-4 overflow-x-auto rounded-3xl border border-white/10">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-cyan-400/10 text-xs uppercase tracking-[0.18em] text-cyan-100/60">
                      <tr>
                        <th className="px-4 py-3">Year</th>
                        <th className="px-4 py-3">Revenue</th>
                        <th className="px-4 py-3">EBITDA</th>
                        <th className="px-4 py-3">Valuation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(json.financialTable ?? []).map((row) => (
                        <tr key={row.year} className="border-t border-white/10 text-white/70">
                          <td className="px-4 py-3 font-black text-cyan-50">{row.year}</td>
                          <td className="px-4 py-3">${row.revenue.toLocaleString()}</td>
                          <td className="px-4 py-3">${row.ebitda.toLocaleString()}</td>
                          <td className="px-4 py-3">${row.valuation.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
              <h2 className="text-2xl font-black text-cyan-50">
                Dashboard Insights
              </h2>

              <div className="mt-4 grid gap-3">
                {(json.insights ?? []).map((insight, index) => {
                  const item =
                    typeof insight === "string"
                      ? { label: `Insight ${index + 1}`, severity: "Note", text: insight }
                      : insight;

                  return (
                    <div
                      key={`${item.label}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-white/65"
                    >
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/50">
                        {item.severity || "Insight"}
                      </div>
                      <div className="mt-1 font-black text-cyan-50">{item.label}</div>
                      <div className="mt-2">{item.text}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              {(json.sections ?? []).map((section) => (
                <article
                  key={section.title}
                  className="rounded-3xl border border-white/10 bg-slate-950/70 p-6"
                >
                  <h2 className="text-xl font-black text-cyan-50">
                    {section.title}
                  </h2>
                  <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm font-semibold leading-7 text-white/60">
                    {section.summary || "No summary available."}
                  </pre>
                </article>
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
