"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AnalyticsReport = {
  id: string;
  sessionId: string;
  title: string;
  reportType: string;
  status: string;
  content: string;
  artifactName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function splitSections(content: string) {
  return String(content || "")
    .replace(/\\n/g, "\n")
    .split(/\n(?=##\s+)/)
    .map((section) => section.trim())
    .filter(Boolean);
}

export default function NexusAnalyticsReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    void params.then((value) => setReportId(value.id));
  }, [params]);

  useEffect(() => {
    if (!reportId) return;

    async function loadReport() {
      setLoading(true);
      try {
        const res = await fetch(`/api/riomind/analytics/reports/${encodeURIComponent(reportId)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        setReport(data.report ?? null);
      } finally {
        setLoading(false);
      }
    }

    void loadReport();
  }, [reportId]);

  const sections = useMemo(() => splitSections(report?.content ?? ""), [report?.content]);

  async function generateDashboard() {
    if (!report) return;

    setDashboardLoading(true);

    try {
      const res = await fetch("/api/riomind/analytics/dashboards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId: report.id }),
      });

      const data = await res.json();

      if (!res.ok || !data?.dashboard?.id) {
        throw new Error(data?.error || "dashboard_generation_failed");
      }

      window.location.href = `/nexus/analytics/dashboards/${data.dashboard.id}`;
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Nexus could not generate this dashboard."
      );
    } finally {
      setDashboardLoading(false);
    }
  }

  async function exportReport(format: string) {
    if (!report) return;

    setExportingFormat(format);
    setExportError(null);

    try {
      const res = await fetch(`/api/riomind/analytics/reports/${encodeURIComponent(report.id)}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format: format.toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok || !data?.artifact?.downloadUrl) {
        throw new Error(data?.error || "export_failed");
      }

      window.open(data.artifact.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Nexus could not export this report."
      );
    } finally {
      setExportingFormat(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#050914] px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-cyan-300/15 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-950/20">
          <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200/55">
            RioMind Nexus
          </div>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                {report?.title || "Analytics Report"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-white/55">
                Professional analytics report reader with export and dashboard readiness.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/nexus/analytics/reports"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white/70"
              >
                Reports
              </Link>
              <Link
                href="/nexus/analytics/sessions"
                className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-5 py-3 text-sm font-black text-cyan-50"
              >
                Sessions
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-white/50">
            Loading report...
          </section>
        ) : !report ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-white/50">
            Report not found.
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                  Type
                </div>
                <div className="mt-2 font-black text-cyan-50">{report.reportType}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                  Status
                </div>
                <div className="mt-2 font-black text-cyan-50">{report.status}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 md:col-span-2">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                  Source Session
                </div>
                <div className="mt-2 truncate font-mono text-xs font-black text-cyan-50">
                  {report.sessionId}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
              <div className="mb-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void generateDashboard()}
                  disabled={dashboardLoading}
                  className="rounded-2xl border border-emerald-300/25 bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {dashboardLoading ? "Generating Dashboard..." : "Generate Dashboard"}
                </button>
                {["PDF", "DOCX", "PPTX", "XLSX"].map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => void exportReport(format)}
                    disabled={exportingFormat !== null}
                    className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {exportingFormat === format ? `Exporting ${format}...` : `Export ${format}`}
                  </button>
                ))}

                {exportError ? (
                  <div className="w-full rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
                    {exportError}
                  </div>
                ) : null}
              </div>

              <article className="space-y-5">
                {sections.map((section, index) => {
                  const lines = section.split("\n");
                  const heading = lines[0]?.replace(/^#+\s*/, "") || `Section ${index + 1}`;
                  const body = lines.slice(1).join("\n").trim();

                  return (
                    <section
                      key={`${heading}-${index}`}
                      className="rounded-3xl border border-white/10 bg-black/20 p-6"
                    >
                      <h2 className="text-2xl font-black text-cyan-50">{heading}</h2>
                      {body ? (
                        <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm font-semibold leading-7 text-white/65">
                          {body}
                        </pre>
                      ) : null}
                    </section>
                  );
                })}
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
