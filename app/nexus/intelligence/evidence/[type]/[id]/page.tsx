"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";


function evidenceItemId(item: any) {
  return (
    item?.sourceId ||
    item?.nodeKey ||
    item?.nodeId ||
    item?.trace?.nodeKey ||
    item?.trace?.nodeId ||
    item?.trace?.key ||
    item?.title ||
    "evidence"
  );
}

function evidenceItemType(item: any) {
  return item?.type || (item?.sourceId ? "document" : "evidence");
}

function evidenceItemHref(item: any, metric: string) {
  return `/nexus/intelligence/evidence/${encodeURIComponent(evidenceItemType(item))}/${encodeURIComponent(evidenceItemId(item))}?metric=${encodeURIComponent(metric)}`;
}


function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 break-words text-sm font-bold text-white">{String(value || "—")}</div>
    </div>
  );
}

export default function EvidenceDetailPage() {
  const params = useParams();
  const search = useSearchParams();

  const type = decodeURIComponent(String(params?.type || "document"));
  const id = decodeURIComponent(String(params?.id || ""));
  const metric = search.get("metric") || "Revenue";

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  async function loadDetail() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/riomind/intelligence/evidence-detail?metric=${encodeURIComponent(metric)}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setDetail(json);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [metric, type, id]);

  const evidence = detail?.evidence;
  const trace = detail?.traceability || {};

  const prettyType = useMemo(() => {
    return String(type || "evidence").replace(/_/g, " ");
  }, [type]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_30%),#020617] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_60px_rgba(34,211,238,0.10)]">
          <Link href={`/nexus/intelligence/metric/${encodeURIComponent(metric)}`} className="text-sm font-bold text-cyan-300 hover:text-cyan-100">
            ← Back to {metric} Intelligence
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Evidence Detail</div>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-5xl">
                {loading ? "Loading evidence..." : evidence?.title || id || "Evidence"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Traceability view for the evidence behind RioMind's {metric} intelligence conclusion.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">Confidence</div>
              <div className="mt-1 text-2xl font-black text-white">{detail?.confidence?.label || "—"}</div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Conclusion</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {detail?.conclusion || "No conclusion available yet."}
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Evidence</h2>

            <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{evidence?.type || prettyType}</div>
              <div className="mt-2 text-2xl font-black text-white">{evidence?.title || "Evidence item"}</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{evidence?.summary || evidence?.valueText || "No summary available."}</p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Type" value={evidence?.type || type} />
              <Field label="Metric" value={metric} />
              <Field label="Source ID" value={evidence?.sourceId || id} />
              <Field label="Version" value={evidence?.version || evidence?.documentVersion} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Traceability</h2>

            <div className="mt-5 grid gap-4">
              <Field label="Source" value={trace.source} />
              <Field label="Node ID" value={trace.nodeId} />
              <Field label="Node Key" value={trace.nodeKey} />
              <Field label="Memory Key" value={trace.key} />
              <Field label="Updated" value={trace.updatedAt} />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Related Evidence</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(detail?.relatedEvidence || []).map((item: any, index: number) => (
              <Link
                key={`${item.title}-${index}`}
                href={evidenceItemHref(item, metric)}
                className="block rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.type || "evidence"}</div>
                    <div className="mt-2 font-bold text-white">{item.title || item.sourceId || "Evidence item"}</div>
                  </div>
                  <div className="text-cyan-300">→</div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{item.summary || item.valueText}</p>
              </Link>
            ))}

            {!detail?.relatedEvidence?.length && (
              <div className="text-sm text-slate-500">No related evidence found yet.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
