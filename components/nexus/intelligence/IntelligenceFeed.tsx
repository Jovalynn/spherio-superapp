"use client";

export default function IntelligenceFeed({ items }: { items?: Array<any> }) {
  return (
    <div className="space-y-3">
      {(items || []).map((item, index) => (
        <div key={`${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-white">{item.title}</div>
            <div className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
              {item.type}
            </div>
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{item.summary}</p>
        </div>
      ))}
      {!items?.length && <div className="text-sm text-slate-400">No latest intelligence yet.</div>}
    </div>
  );
}
