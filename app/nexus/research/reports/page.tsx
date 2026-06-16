"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

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

export default function SavedResearchReportsPage() {
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [exportUrls, setExportUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function loadReports() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/riomind/research/reports?limit=100", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data.ok) throw new Error(data.error || "reports_failed");
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch {
      setReports([]);
      setError("Nexus could not load saved research reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  function openReport(report: ResearchReport) {
    const prompt = [
      "Open this saved Nexus research report.",
      "",
      `Report title: ${report.title}`,
      `Report type: ${report.reportType}`,
      "",
      report.reportContent,
      "",
      "Summarize the report, identify useful next steps, and suggest whether it should become a PDF, Excel workbook, PowerPoint briefing, or Project Memory entry.",
    ].join("\n");

    window.location.href = `/riomind/chat?prompt=${encodeURIComponent(prompt)}`;
  }

  async function exportReport(report: ResearchReport, format: "pdf" | "excel" | "pptx") {
    const key = `${report.id}:${format}`;
    setExportingKey(key);
    setError(null);

    try {
      const res = await fetch(`/api/riomind/research/reports/${encodeURIComponent(report.id)}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) throw new Error(data.error || "export_failed");

      const downloadUrl = data.artifact?.downloadUrl;
      if (downloadUrl) {
        setExportUrls((current) => ({ ...current, [key]: downloadUrl }));
      }
    } catch {
      setError(`Nexus could not export this report as ${format.toUpperCase()}.`);
    } finally {
      setExportingKey(null);
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
            <h1 className="mt-1 text-3xl font-black text-cyan-50">Saved Reports Library</h1>
            <p className="mt-1 text-sm font-semibold text-white/45">
              View, reopen, and export saved Nexus research reports.
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
              href="/nexus/research/sessions"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/60"
            >
              Sessions
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 text-sm font-bold text-white/40">
              Loading reports...
            </div>
          ) : reports.length ? (
            reports.map((report) => (
              <article
                key={report.id}
                className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5 shadow-xl shadow-black/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-cyan-50">{report.title}</h2>
                    <p className="mt-2 line-clamp-4 text-sm font-semibold leading-6 text-white/42">
                      {report.reportContent}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100">
                    {report.reportType}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openReport(report)}
                    className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-3 py-2 text-xs font-black text-cyan-100"
                  >
                    Open
                  </button>

                  {(["pdf", "excel", "pptx"] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => void exportReport(report, format)}
                      disabled={exportingKey === `${report.id}:${format}`}
                      className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs font-black text-cyan-100 disabled:opacity-35"
                    >
                      {exportingKey === `${report.id}:${format}`
                        ? "Exporting..."
                        : format.toUpperCase()}
                    </button>
                  ))}
                </div>

                {["pdf", "excel", "pptx"].some((format) => exportUrls[`${report.id}:${format}`]) ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["pdf", "excel", "pptx"] as const).map((format) =>
                      exportUrls[`${report.id}:${format}`] ? (
                        <a
                          key={format}
                          href={exportUrls[`${report.id}:${format}`]}
                          className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-white/60 transition hover:text-cyan-100"
                        >
                          Download {format.toUpperCase()}
                        </a>
                      ) : null
                    )}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/12 bg-black/20 p-8 text-center md:col-span-2 xl:col-span-3">
              <div className="text-4xl">📚</div>
              <h2 className="mt-3 text-xl font-black text-cyan-50">No saved reports yet</h2>
              <p className="mt-2 text-sm font-semibold text-white/40">
                Create reports from Research Sessions and they will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
