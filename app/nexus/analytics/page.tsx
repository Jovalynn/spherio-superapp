"use client";

import { useState } from "react";
import Link from "next/link";

const analyticsModes = [
  ["📊 Data Analysis", "Excel, CSV, JSON, database analysis, data cleaning, audit, and transformation."],
  ["📈 Business Intelligence", "KPIs, revenue, sales, customers, marketing, operations, and executive dashboards."],
  ["📉 Forecasting & Prediction", "Revenue, sales, demand, cash flow, market trend, scenario, and sensitivity forecasting."],
  ["💹 Market Intelligence", "Market research, competitors, pricing, market sizing, TAM/SAM/SOM, and opportunities."],
  ["🧮 Financial Modeling", "DCF, valuation, startup model, investment analysis, budget, cash flow, and break-even."],
  ["📋 Professional Reporting", "Executive, board, investor, research, compliance, audit, technical, and consulting reports."],
  ["📑 Certification & Compliance", "ISO, SOC, audit readiness, policy analysis, risk registers, control matrix, and gaps."],
  ["📊 Spreadsheet Intelligence", "Formulas, VLOOKUP, XLOOKUP, INDEX MATCH, pivot tables, Power Query, and automation."],
  ["📈 Visualization", "Charts, dashboards, executive visuals, presentation charts, infographics, and data storytelling."],
  ["🤖 AI Analytics", "Pattern discovery, anomaly detection, correlation, root cause, recommendations, and decisions."],
  ["🌍 Deep Research Analytics", "Web data, public datasets, benchmarks, academic, policy, economic, and industry analysis."],
];

export default function NexusAnalyticsPage() {
  const [mode, setMode] = useState(analyticsModes[0][0]);
  const [goal, setGoal] = useState("");

  async function startAnalytics() {
    const cleanGoal = goal.trim();
    if (!cleanGoal) return;

    const modeName = mode.replace(/^[^\w]+/, "").trim();

    try {
      await fetch("/api/riomind/analytics/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: cleanGoal.slice(0, 80),
          mode,
          goal: cleanGoal,
          status: "active",
        }),
      });
    } catch {
      // Do not block chat handoff if analytics session persistence fails.
    }

      const prompt = [
        "Resume this Nexus Analytics Session.",
        "",
        `Analysis title: ${cleanGoal.slice(0, 80)}`,
        `Analysis mode: ${mode}`,
        `Goal / dataset / question: ${cleanGoal}`,
        "Status: active",
        "",
        "Continue the analysis with a professional structured output, assumptions, methodology, computations, tables, visualization recommendations, risks, and actionable next steps.",
        "",
        "Cover the selected analytics mode deeply and practically for professional users.",
        "If formulas are useful, include Excel/Google Sheets formulas, model tabs, Power Query guidance, pivot structure, or modern spreadsheet alternatives.",
        "If forecasting, market prediction, compliance, certification, valuation, or business intelligence is requested, explain assumptions, risks, validation checks, and avoid presenting guesses as certainty.",
      ].join("\n");

    window.location.href = `/riomind/chat?prompt=${encodeURIComponent(prompt)}`;
  }

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
            <p className="mt-1 max-w-3xl text-sm font-semibold text-white/45">
              Analyze data, spreadsheets, charts, forecasts, markets, business intelligence,
              professional reports, certification documentation, and predictive models.
            </p>
          </div>

          <Link
            href="/riomind/chat"
            className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/18"
          >
            Back to Chat
          </Link>
        </header>

        <section className="mb-5 rounded-[28px] border border-white/10 bg-white/[0.025] p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
            Analytics Goal
          </div>

          <textarea
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="Example: Build a 3-year SaaS revenue forecast, analyze this Excel dataset, create KPI dashboard logic, generate XLOOKUP formulas, or prepare ISO audit gap analysis..."
            rows={6}
            className="mt-3 w-full resize-none rounded-3xl border border-white/10 bg-black/35 p-4 text-sm font-semibold leading-7 text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30"
          />

          <button
            type="button"
            onClick={() => void startAnalytics()}
            disabled={!goal.trim()}
            className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/18 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Analytics
          </button>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {analyticsModes.map(([title, subtitle]) => (
            <button
              key={title}
              type="button"
              onClick={() => setMode(title)}
              className={`rounded-[28px] border p-5 text-left shadow-xl shadow-black/25 backdrop-blur-xl transition ${
                mode === title
                  ? "border-cyan-300/30 bg-cyan-500/[0.10]"
                  : "border-white/10 bg-white/[0.025] hover:border-cyan-300/20 hover:bg-cyan-500/[0.06]"
              }`}
            >
              <div className="text-lg font-black text-cyan-50">{title}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/42">{subtitle}</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/24 px-3 py-2 text-xs font-black text-white/40">
                {mode === title ? "Selected" : "Select Mode"}
              </div>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
