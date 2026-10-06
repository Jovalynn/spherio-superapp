"use client";

import type { ReactNode } from "react";

export default function WorkspaceModuleShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-300">
        {eyebrow}
      </div>

      <h3 className="mt-2 text-xl font-black text-white">
        {title}
      </h3>

      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
        {description}
      </p>

      <div className="mt-5">
        {children}
      </div>
    </div>
  );
}
