"use client";

import Link from "next/link";

function evidenceId(item: any) {
  return (
    item.sourceId ||
    item.nodeKey ||
    item.nodeId ||
    item.trace?.nodeKey ||
    item.trace?.nodeId ||
    item.trace?.key ||
    item.title ||
    "evidence"
  );
}

function evidenceType(item: any) {
  return item.type || (item.sourceId ? "document" : "evidence");
}

function evidenceHref(item: any, metricName?: string) {
  const type = encodeURIComponent(evidenceType(item));
  const id = encodeURIComponent(evidenceId(item));
  const metric = encodeURIComponent(metricName || "Revenue");

  return `/nexus/intelligence/evidence/${type}/${id}?metric=${metric}`;
}

function EvidenceGroup({
  title,
  items,
  metricName,
}: {
  title: string;
  items?: Array<any>;
  metricName?: string;
}) {
  const visible = (items || []).slice(0, 5);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{title}</div>
        <div className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-slate-300">{items?.length || 0}</div>
      </div>

      <div className="mt-3 space-y-2">
        {visible.map((item, index) => (
          <Link
            key={`${item.title || item.sourceId || index}-${index}`}
            href={evidenceHref(item, metricName)}
            className="block rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white">{item.title || item.sourceId || "Evidence item"}</div>
                {(item.summary || item.valueText) && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{item.summary || item.valueText}</p>
                )}
              </div>

              <div className="text-cyan-300">→</div>
            </div>

            {item.trace?.source && (
              <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-cyan-300">
                {item.trace.source}
              </div>
            )}
          </Link>
        ))}

        {!visible.length && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-500">
            No evidence found yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default function EvidencePanel({ evidenceBundle, metricName }: { evidenceBundle?: any; metricName?: string }) {
  const confidence = evidenceBundle?.confidence;
  const evidence = evidenceBundle?.evidence || {};
  const resolvedMetricName = metricName || evidenceBundle?.target?.name || "Revenue";

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Evidence</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Why RioMind believes this conclusion. Evidence is assembled from documents, metric nodes, decisions, risks, and enterprise memory.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">Confidence</div>
          <div className="mt-1 text-2xl font-black text-white">{confidence?.label || "Medium"}</div>
          <div className="mt-1 text-xs text-slate-400">
            {confidence?.evidenceCount || 0} evidence items · {confidence?.independentSourceCount || 0} source types
          </div>
        </div>
      </div>

      {evidenceBundle?.conclusion && (
        <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 text-sm leading-6 text-slate-300">
          {evidenceBundle.conclusion}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <EvidenceGroup title="Documents" items={evidence.documents} metricName={resolvedMetricName} />
        <EvidenceGroup title="Metrics" items={evidence.metrics} metricName={resolvedMetricName} />
        <EvidenceGroup title="Decisions" items={evidence.decisions} metricName={resolvedMetricName} />
        <EvidenceGroup title="Risks" items={evidence.risks} metricName={resolvedMetricName} />
        <EvidenceGroup title="Memory" items={evidence.memories} metricName={resolvedMetricName} />
      </div>
    </section>
  );
}
