"use client";

import Link from "next/link";

export default function DocumentsPanel({ documents }: { documents?: Array<any> }) {
  const items = documents || [];

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-10 text-center">
        <div className="text-2xl font-bold text-white">No documents learned yet.</div>
        <p className="mt-3 text-sm text-slate-400">Upload or ingest documents to activate Document Intelligence.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Documents</div>
          <div className="mt-2 text-4xl font-black text-white">{items.length}</div>
        </div>

        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Learned</div>
          <div className="mt-2 text-4xl font-black text-white">
            {items.filter((d) => d.status === "learned").length}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Latest Version</div>
          <div className="mt-2 text-4xl font-black text-white">
            {Math.max(...items.map((d) => Number(d.version || 1)))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {items.map((doc: any) => (
          <Link
            key={`${doc.document_id}-${doc.version}`}
            href={`/nexus/intelligence/evidence/document/${encodeURIComponent(doc.document_id)}?metric=Revenue`}
            className="block rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.035]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  {doc.document_type || "document"}
                </div>
                <div className="mt-2 text-xl font-black text-white">{doc.title || doc.document_id}</div>
              </div>

              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-300">
                {doc.status || "learned"}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Document ID</div>
                <div className="mt-2 break-all text-sm font-bold text-white">{doc.document_id}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Version</div>
                <div className="mt-2 text-2xl font-black text-white">v{doc.version || 1}</div>
              </div>
            </div>

            <div className="mt-5 text-xs font-bold text-cyan-300">Open Document Evidence →</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
