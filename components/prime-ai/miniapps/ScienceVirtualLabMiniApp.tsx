import Link from "next/link";

const modules = [
  {
    title: "Physics Lab",
    value: "Motion, energy, waves, circuits",
    helper: "Guided simulations for mechanics, electricity, waves, and energy systems.",
  },
  {
    title: "Chemistry Lab",
    value: "Reactions and calculations",
    helper: "Explore titration, bonding, organic pathways, mole calculations, and periodic trends.",
  },
  {
    title: "Biology Lab",
    value: "Cells, genetics, ecology",
    helper: "Visualize life systems, genetic probability, photosynthesis, and population models.",
  },
  {
    title: "Engineering Lab",
    value: "Build and test systems",
    helper: "Model circuits, robotics, structures, thermodynamics, and signal systems.",
  },
  {
    title: "Scientific Calculator",
    value: "Formula-guided solving",
    helper: "RioMind Nexus can later help solve and explain formulas step by step.",
  },
  {
    title: "Lab Reports",
    value: "Proof-ready reports",
    helper: "Generate experiment summaries, calculations, graphs, limitations, and conclusions.",
  },
];

const flows = [
  { title: "Physics", href: "/prime-ai/science-virtual-lab/physics", tone: "cyan" },
  { title: "Chemistry", href: "/prime-ai/science-virtual-lab/chemistry", tone: "amber" },
  { title: "Biology", href: "/prime-ai/science-virtual-lab/biology", tone: "emerald" },
  { title: "Engineering", href: "/prime-ai/science-virtual-lab/engineering", tone: "violet" },
  { title: "Reports", href: "/prime-ai/science-virtual-lab/reports", tone: "cyan" },
];

function flowClass(tone: string) {
  if (tone === "amber") return "border-amber-300/25 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18";
  if (tone === "emerald") return "border-emerald-300/25 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18";
  if (tone === "violet") return "border-violet-300/25 bg-violet-500/12 text-violet-100 hover:bg-violet-500/18";
  return "border-cyan-300/25 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18";
}

export function ScienceVirtualLabMiniApp({
  projectName = "Science & Virtual Lab Project",
  tokenAddress,
}: {
  projectName?: string;
  tokenAddress?: string;
}) {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[34px] border border-cyan-300/20 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.17),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.13),transparent_36%),linear-gradient(135deg,rgba(8,20,38,0.72),rgba(13,17,34,0.92))] p-7 shadow-[0_30px_110px_-80px_rgba(34,211,238,0.9)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
              Project App Module · Science & Virtual Lab
            </div>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
              {projectName}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
              This embedded module gives the creator project a virtual STEM laboratory:
              simulations, guided experiments, scientific calculators, datasets, lab reports,
              and RioMind Nexus-assisted explanations.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {flows.map((flow) => (
                <Link
                  key={flow.title}
                  href={flow.href}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold ${flowClass(flow.tone)}`}
                >
                  {flow.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 lg:w-[380px]">
            <div className="text-sm font-semibold text-white">How viewers use this</div>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Students and learners can use the virtual lab module to explore scientific concepts,
              run guided simulations, generate lab reports, and understand formulas. The creator can
              later make access public, token-gated, subscription-based, or institution-only.
            </p>
            <div className="mt-4 rounded-2xl border border-cyan-300/14 bg-cyan-500/[0.055] px-4 py-3 text-xs leading-5 text-cyan-100/80">
              {tokenAddress ? (
                <>
                  Project token: <span className="font-mono">{tokenAddress.slice(0, 12)}…{tokenAddress.slice(-8)}</span>
                </>
              ) : (
                "Prime project token proof will appear here after indexing."
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <div key={module.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
              {module.title}
            </div>
            <div className="mt-2 text-xl font-semibold text-white">{module.value}</div>
            <p className="mt-2 text-sm leading-6 text-white/55">{module.helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
