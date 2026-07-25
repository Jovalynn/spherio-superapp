"use client";

export default function ComingSoonPanel({ title }: { title: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-10 text-center shadow-[0_0_45px_rgba(15,23,42,0.45)]">
      <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Sprint 2 module</div>
      <h2 className="mt-3 text-3xl font-black text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
        This workspace section is reserved for the next Sprint 2 build. The Intelligence shell is now ready, so this module can plug into the same layout without redesign.
      </p>
    </div>
  );
}
