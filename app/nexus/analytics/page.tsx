"use client";

import Link from "next/link";

const analyticsModes = [
  ["📊 Excel Analysis", "Analyze spreadsheets, formulas, tables, and workbook structure."],
  ["📈 Forecasting", "Project trends, growth, revenue, demand, and market movement."],
  ["📉 Market Analysis", "Analyze markets, assets, tokens, competitors, and narratives."],
  ["🧮 Financial Models", "Build valuation models, scenarios, assumptions, and projections."],
  ["📋 Business Intelligence", "Create KPI summaries, dashboards, reports, and executive insights."],
  ["🗄 Database Analysis", "Explore structured data, SQL outputs, logs, and indexed records."],
  ["🔎 VLOOKUP / XLOOKUP", "Prepare lookup logic, matching tables, and spreadsheet formulas."],
  ["📌 Pivot Tables", "Summarize large datasets by category, date, owner, value, or status."],
  ["📊 Charts & Graphs", "Prepare chart-ready data, trend lines, comparisons, and dashboards."],
];

export default function NexusAnalyticsPage() {
  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-cyan-300/15 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/50">
              RioMind Nexus
            </div>
            <h1 className="mt-1 text-3xl font-black text-cyan-50">
              Data Analytics Workspace
            </h1>
            <p className="mt-1 text-sm font-semibold text-white/45">
              Analyze data, spreadsheets, charts, forecasts, markets, and business intelligence.
            </p>
          </div>

          <Link
            href="/riomind/chat"
            className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/18"
          >
            Back to Chat
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {analyticsModes.map(([title, subtitle]) => (
            <article
              key={title}
              className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5 shadow-xl shadow-black/25 backdrop-blur-xl"
            >
              <div className="text-lg font-black text-cyan-50">{title}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/42">{subtitle}</p>
              <button
                type="button"
                disabled
                className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-black text-white/35"
              >
                Coming Soon
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
