"use client";

import Link from "next/link";

function badgeClass(label: string) {
  if (label === "Critical") return "border-rose-300/25 bg-rose-300/10 text-rose-200";
  if (label === "High") return "border-amber-300/25 bg-amber-300/10 text-amber-200";
  if (label === "Medium") return "border-cyan-300/25 bg-cyan-300/10 text-cyan-200";
  return "border-white/10 bg-white/5 text-slate-300";
}

function cleanType(type: string) {
  return String(type || "knowledge").replace(/_/g, " ");
}

export default function RelationshipClusterCard({ cluster }: { cluster: any }) {
  const previewNodes = cluster?.previewNodes || [];
  const href = `/nexus/intelligence/cluster/${encodeURIComponent(cluster.clusterId)}`;

  return (
    <Link
      href={href}
      className="block rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.035]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            {cleanType(cluster.type)}
          </div>
          <div className="mt-2 text-xl font-black text-white">
            {cluster.title}
          </div>
        </div>

        <div className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(cluster.importance?.label)}`}>
          {cluster.importance?.label || "Informational"}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">
        {cluster.summary}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Nodes</div>
          <div className="mt-2 text-2xl font-black text-white">{cluster.counts?.nodes || 0}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Decisions</div>
          <div className="mt-2 text-2xl font-black text-white">{cluster.counts?.decisions || 0}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Risks</div>
          <div className="mt-2 text-2xl font-black text-white">{cluster.counts?.risks || 0}</div>
        </div>
      </div>

      {!!cluster.memberTypes?.length && (
        <div className="mt-5 flex flex-wrap gap-2">
          {cluster.memberTypes.slice(0, 6).map((member: any) => (
            <span
              key={member.nodeType}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300"
            >
              {cleanType(member.nodeType)} · {member.count}
            </span>
          ))}
        </div>
      )}

      {!!previewNodes.length && (
        <div className="mt-5 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.03] p-4">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Graph Preview</div>
          <div className="mt-3 space-y-2">
            {previewNodes.slice(0, 4).map((node: any, index: number) => (
              <div key={`${node.id}-${index}`} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-cyan-300">{index === 0 ? "●" : "↓"}</span>
                <span className="line-clamp-1">{node.title || node.node_key}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 text-xs font-bold text-cyan-300">
        Open Cluster Intelligence →
      </div>
    </Link>
  );
}
