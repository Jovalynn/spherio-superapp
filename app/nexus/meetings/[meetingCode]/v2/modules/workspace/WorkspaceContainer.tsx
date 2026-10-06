"use client";

import type {
  ReactNode,
} from "react";

export default function WorkspaceContainer({
  tabs,
  children,
}: {
  tabs: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 rounded-3xl border border-white/10 bg-[#050b12]/[0.04] p-4">
      <div className="mb-4">
        {tabs}
      </div>

      <div className="min-h-[260px]">
        {children}
      </div>
    </section>
  );
}
