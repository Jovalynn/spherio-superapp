"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type NexusArtifact = {
  id?: string;
  type?: string;
  name?: string;
  title?: string;
  downloadUrl?: string;
  pageCount?: number;
  slideCount?: number;
  paragraphCount?: number;
  rowCount?: number;
  columnCount?: number;
  tableCount?: number;
  sectionCount?: number;
  createdAt?: string;
};

const NEXUS_LOGO =
  "https://raw.githubusercontent.com/Lerivee/Nexus-logo/refs/heads/main/0ae5a7d5-8b81-4085-b7cf-50699dd2aa56.jpeg";

function artifactIcon(type?: string) {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "pdf") return "📄";
  if (normalized === "docx") return "📝";
  if (normalized === "pptx") return "🎞️";
  if (normalized === "excel" || normalized === "xlsx") return "📊";
  return "📁";
}

function artifactLabel(type?: string) {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "pdf") return "PDF";
  if (normalized === "docx") return "DOCX";
  if (normalized === "pptx") return "PPTX";
  if (normalized === "excel" || normalized === "xlsx") return "Excel";
  return normalized ? normalized.toUpperCase() : "Artifact";
}

function metricsFor(artifact: NexusArtifact) {
  return [
    typeof artifact.pageCount === "number" ? `${artifact.pageCount} pages` : null,
    typeof artifact.slideCount === "number" ? `${artifact.slideCount} slides` : null,
    typeof artifact.paragraphCount === "number" ? `${artifact.paragraphCount} paragraphs` : null,
    typeof artifact.rowCount === "number" ? `${artifact.rowCount} rows` : null,
    typeof artifact.columnCount === "number" ? `${artifact.columnCount} columns` : null,
    typeof artifact.tableCount === "number" ? `${artifact.tableCount} tables` : null,
    typeof artifact.sectionCount === "number" ? `${artifact.sectionCount} sections` : null,
  ].filter((item): item is string => Boolean(item));
}

export default function RioMindWorkspacePage() {
  const [artifacts, setArtifacts] = useState<NexusArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function loadArtifacts() {
    setLoading(true);
    setError(null);

    try {
      const query = typeFilter === "all" ? "" : `?type=${encodeURIComponent(typeFilter)}`;
      const res = await fetch(`/api/riomind/artifacts/list${query}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "artifact_list_failed");
      }

      setArtifacts(Array.isArray(data.artifacts) ? data.artifacts : []);
    } catch {
      setArtifacts([]);
      setError("Nexus could not load artifacts yet.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadArtifacts();
  }, [typeFilter]);

  const filteredArtifacts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return artifacts;

    return artifacts.filter((artifact) =>
      [artifact.name, artifact.title, artifact.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [artifacts, search]);

  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-cyan-300/15 bg-white/[0.035] p-5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <img
              src={NEXUS_LOGO}
              alt="RioMind Nexus"
              className="h-14 w-14 shrink-0 rounded-2xl border border-cyan-300/20 object-cover shadow-lg shadow-cyan-500/10"
            />

            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/50">
                RioMind Nexus
              </div>
              <h1 className="truncate text-2xl font-black text-cyan-50 sm:text-3xl">
                Artifact Workspace
              </h1>
              <p className="mt-1 text-sm font-semibold text-white/45">
                Manage generated PDF, DOCX, Excel, and PowerPoint artifacts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/riomind/chat"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/65 transition hover:border-cyan-300/30 hover:text-cyan-100"
            >
              Back to Chat
            </Link>

            <button
              type="button"
              onClick={() => void loadArtifacts()}
              className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/18"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="grid flex-1 gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-[28px] border border-white/10 bg-white/[0.025] p-4 backdrop-blur-xl">
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
              Artifact Types
            </div>

            <div className="grid gap-2">
              {[
                ["all", "All"],
                ["pdf", "PDF"],
                ["docx", "DOCX"],
                ["pptx", "PowerPoint"],
                ["excel", "Excel"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTypeFilter(value)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                    typeFilter === value
                      ? "border-cyan-300/30 bg-cyan-500/14 text-cyan-50"
                      : "border-white/10 bg-white/[0.025] text-white/50 hover:border-cyan-300/20 hover:text-cyan-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0 rounded-[28px] border border-white/10 bg-white/[0.025] p-4 backdrop-blur-xl sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
                  Recent Artifacts
                </div>
                <div className="mt-1 text-sm font-semibold text-white/45">
                  {loading ? "Loading..." : `${filteredArtifacts.length} artifacts`}
                </div>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search artifacts..."
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30 sm:max-w-sm"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-100">
                {error}
              </div>
            ) : null}

            {!loading && filteredArtifacts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/12 bg-black/20 p-8 text-center">
                <div className="text-4xl">📁</div>
                <h2 className="mt-3 text-lg font-black text-cyan-50">No artifacts found</h2>
                <p className="mt-2 text-sm font-semibold text-white/40">
                  Generate PDF, DOCX, Excel, or PowerPoint files from Nexus chat.
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredArtifacts.map((artifact) => {
                const metrics = metricsFor(artifact);

                return (
                  <article
                    key={artifact.id || artifact.name}
                    className="overflow-hidden rounded-3xl border border-cyan-300/14 bg-slate-950/70 shadow-xl shadow-black/20"
                  >
                    <div className="h-1 bg-gradient-to-r from-cyan-400/40 via-fuchsia-400/20 to-transparent" />

                    <div className="p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-3xl">{artifactIcon(artifact.type)}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                          {artifactLabel(artifact.type)}
                        </span>
                      </div>

                      <h2 className="line-clamp-2 min-h-[44px] text-sm font-black leading-5 text-cyan-50">
                        {artifact.title || artifact.name || "Untitled artifact"}
                      </h2>

                      {artifact.name ? (
                        <p className="mt-2 truncate text-[11px] font-semibold text-white/32" title={artifact.name}>
                          {artifact.name}
                        </p>
                      ) : null}

                      {metrics.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {metrics.slice(0, 3).map((metric) => (
                            <span
                              key={metric}
                              className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] font-bold text-white/45"
                            >
                              {metric}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {artifact.downloadUrl ? (
                          <>
                            <a
                              href={artifact.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/60 transition hover:border-cyan-300/25 hover:text-cyan-100"
                            >
                              Open
                            </a>

                            <a
                              href={artifact.downloadUrl}
                              download={artifact.name}
                              className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-500/18"
                            >
                              Download
                            </a>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
