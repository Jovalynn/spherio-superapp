"use client";

import { ReactNode, Children, useMemo, useState } from "react";

type PumpPhaseTabsProps = {
  children: ReactNode;
};

const phaseTabs = [
  {
    key: "bonding",
    eyebrow: "Phase 1",
    title: "Bonding Curve",
    description: "Live bonding activity, buys/sells, chart, market progress, and curve execution.",
  },
  {
    key: "graduation",
    eyebrow: "Phase 2",
    title: "Graduation",
    description: "Graduation readiness, LP seed, LP proof, RioDex handoff, and market finalization.",
  },
  {
    key: "rewards",
    eyebrow: "Phase 3",
    title: "Creator Rewards",
    description: "Reward eligibility, organic buyers, sustainability, risk checks, and payout status.",
  },
];

export function PumpPhaseTabs({ children }: PumpPhaseTabsProps) {
  const panels = useMemo(() => Children.toArray(children), [children]);
  const [activeIndex, setActiveIndex] = useState(0);

  const activePanel = panels[activeIndex] ?? panels[0];

  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(8,13,26,0.98),rgba(3,6,13,0.99))] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.30)]">
      <div className="grid gap-3 lg:grid-cols-3">
        {phaseTabs.map((phase, index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={phase.key}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={[
                "rounded-2xl border p-4 text-left transition",
                isActive
                  ? "border-cyan-300/35 bg-cyan-500/[0.10] shadow-[0_18px_55px_rgba(34,211,238,0.10)]"
                  : "border-white/10 bg-white/[0.035] hover:border-white/18 hover:bg-white/[0.055]",
              ].join(" ")}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100/60">
                {phase.eyebrow}
              </div>

              <div className="mt-2 text-lg font-extrabold tracking-[-0.02em] text-white">
                {phase.title}
              </div>

              <p className="mt-2 text-xs leading-5 text-white/52">
                {phase.description}
              </p>

              <div
                className={[
                  "mt-4 h-1.5 rounded-full transition",
                  isActive
                    ? "bg-[linear-gradient(90deg,rgba(34,211,238,0.98),rgba(217,70,239,0.92))]"
                    : "bg-white/10",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {activePanel}
      </div>
    </section>
  );
}
