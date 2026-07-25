"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import MiniTrendChart from "@/components/nexus/intelligence/MiniTrendChart";
import EvidencePanel from "@/components/nexus/intelligence/EvidencePanel";
import IntelligenceTrail from "@/components/nexus/intelligence/IntelligenceTrail";

function compactValue(value: any, unit?: string | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";

  let out = String(n);

  if (Math.abs(n) >= 1_000_000_000) out = `${(n / 1_000_000_000).toFixed(1)}B`;
  else if (Math.abs(n) >= 1_000_000) out = `${(n / 1_000_000).toFixed(1)}M`;
  else if (Math.abs(n) >= 1_000) out = `${(n / 1_000).toFixed(1)}K`;

  return unit === "percent" ? `${out}%` : out;
}

function displayPoint(point: any) {
  if (!point) return "--";
  return compactValue(point.valueNumber, point.unit) || point.valueText || "--";
}

export default function MetricIntelligencePage() {
  const params = useParams();
  const metricName = decodeURIComponent(String(params?.metricName || "Revenue"));

  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<any>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [evidenceBundle, setEvidenceBundle] = useState<any>(null);

  async function loadTrend() {
    setLoading(true);
    try {
      const res = await fetch(`/api/riomind/documents/trends?metric=${encodeURIComponent(metricName)}&limit=1000`, {
        cache: "no-store",
      });
      const json = await res.json();
      setTrend(json?.trends?.[0] || null);

      try {
        const brief = await fetch(
          `/api/riomind/intelligence/metric-briefing?metric=${encodeURIComponent(metricName)}`,
          { cache: "no-store" }
        );

        const briefJson = await brief.json();
        setBriefing(briefJson?.briefing || null);

      } catch {
        setBriefing(null);
      }

      try {
        const evidence = await fetch(
          `/api/riomind/intelligence/evidence?metric=${encodeURIComponent(metricName)}&limit=12`,
          { cache: "no-store" }
        );

        const evidenceJson = await evidence.json();
        setEvidenceBundle(evidenceJson?.ok ? evidenceJson : null);

      } catch {
        setEvidenceBundle(null);
      }
    } catch {
      setTrend(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrend();
  }, [metricName]);

  const insight = useMemo(() => {
    if (!trend) return "No trend intelligence is available yet for this metric.";
    return `${trend.metricName} ${trend.directionFromFirst} across ${trend.points?.length || 0} observed points. Change from first recorded value is ${
      typeof trend.percentChangeFromFirst === "number" ? `${trend.percentChangeFromFirst.toFixed(2)}%` : "unknown"
    }.`;
  }, [trend]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_30%),#020617] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_60px_rgba(34,211,238,0.10)]">
          <Link href="/nexus/intelligence" className="text-sm font-bold text-cyan-300 hover:text-cyan-100">
            ← Back to Intelligence Center
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Metric Intelligence</div>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-6xl">
                {metricName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Explorable KPI intelligence generated from documents, metrics, trends, memory, and RioMind Core knowledge.
              </p>
            </div>

            <button
              onClick={loadTrend}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-300/15"
            >
              {loading ? "Refreshing..." : "Refresh metric"}
            </button>
          </div>
        </header>

        {!trend ? (
          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-10 text-center">
            <h2 className="text-2xl font-black text-white">No trend found</h2>
            <p className="mt-3 text-sm text-slate-400">
              RioMind has not learned enough metric history for {metricName} yet.
            </p>
          </section>
        ) : (
          <>
            
<section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
  <div className="grid gap-5 md:grid-cols-4">

    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-5">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
        Current
      </div>

      <div className="mt-3 text-4xl font-black text-white">
        {displayPoint(trend.current)}
      </div>
    </div>

    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        Previous
      </div>

      <div className="mt-3 text-4xl font-black text-slate-200">
        {displayPoint(trend.previous || trend.first)}
      </div>
    </div>

    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.07] p-5">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
        Change
      </div>

      <div className="mt-3 text-4xl font-black text-emerald-200">
        {typeof trend.percentChangeFromFirst === "number"
          ? `${trend.percentChangeFromFirst.toFixed(2)}%`
          : "--"}
      </div>

      <div className="mt-2 text-xs text-emerald-300">
        {trend.directionFromFirst}
      </div>
    </div>

    <div className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-5">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
        Confidence
      </div>

      <div className="mt-3 text-4xl font-black text-white">
        {briefing?.confidence || "Medium"}
      </div>

      <div className="mt-2 text-xs text-violet-200">
        {trend.points?.length || 0} observations
      </div>

    </div>

  </div>
</section>


            <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Trend Chart</h2>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
                  {trend.directionFromFirst}
                </span>
              </div>

              <div className="mt-5 rounded-3xl border border-cyan-300/10 bg-cyan-300/[0.03] p-8">
                <MiniTrendChart data={trend.chartData?.data} />
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-300">{trend.summary}</p>
            </section>

            
            <EvidencePanel
              evidenceBundle={evidenceBundle}
              metricName={metricName}
            />

            <IntelligenceTrail
              items={[
                {
                  type: "metric",
                  label: metricName,
                },
                {
                  type: "document",
                  label: trend?.current?.documentId || "Source Document",
                },
                {
                  type: "knowledge",
                  label: "Knowledge Graph",
                },
                {
                  type: "memory",
                  label: "Enterprise Memory",
                },
                {
                  type: "trend",
                  label: "Trend Intelligence",
                },
                {
                  type: "briefing",
                  label: "Executive Brief",
                },
                {
                  type: "forecast",
                  label: "Forecast",
                },
              ]}
            />


            <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Timeline</h2>

                <div className="mt-5 space-y-3">
                  {(trend.points || []).map((point: any, index: number) => (
                    <div key={`${point.documentId}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-white">{point.valueText}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                            {point.documentId} · v{point.documentVersion || 1}
                          </div>
                        </div>
                        <div className="text-xl font-black text-cyan-100">{displayPoint(point)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">AI Executive Brief</h2>
                    <p className="mt-2 text-sm text-slate-500">Generated from RioMind trend intelligence, KPI signals, and memory context.</p>
                  </div>

                  <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
                    {briefing?.confidence || "Medium"} confidence
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-300">
                  {briefing?.narrative || insight}
                </p>

                {briefing?.forecast && (
                  <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Forecast</div>
                    <div className="mt-2 text-2xl font-black text-white">{briefing.forecast.label}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{briefing.forecast.assumption}</p>
                  </div>
                )}

                {!!briefing?.supportingSignals?.length && (
                  <div className="mt-6">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Supporting Signals</div>
                    <div className="mt-3 space-y-2">
                      {briefing.supportingSignals.map((signal: any) => (
                        <div key={signal.metricName} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-bold text-white">{signal.metricName}</div>
                            <div className="text-xs font-bold text-emerald-300">{signal.percentChangeLabel || signal.status}</div>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-400">{signal.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!!briefing?.recommendations?.length && (
                  <div className="mt-6">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommended Actions</div>
                    <div className="mt-3 space-y-2">
                      {briefing.recommendations.map((item: string, index: number) => (
                        <div key={`${item}-${index}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-slate-300">
                          <span className="text-cyan-300">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Source</div>
                  <div className="mt-2 text-sm font-bold text-white">RioMind AI Executive Briefing</div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
