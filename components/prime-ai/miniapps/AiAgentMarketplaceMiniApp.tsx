import Link from "next/link";

const modules = [
  {
    title: "Agent Catalog",
    value: "Browse installable agents",
    helper: "Users discover education, research, trading, coding, marketing, and support agents.",
  },
  {
    title: "Install / Rent Flow",
    value: "Activate agent utility",
    helper: "Users can install, rent, subscribe to, or later purchase agent workflows.",
  },
  {
    title: "Publisher Console",
    value: "Creator and developer revenue",
    helper: "Agent publishers manage listings, metadata, capability descriptions, and revenue readiness.",
  },
  {
    title: "Execution Logs",
    value: "Track agent runs",
    helper: "Agent usage, task history, approvals, safety summaries, and outputs are tracked.",
  },
  {
    title: "Revenue Dashboard",
    value: "Marketplace monetization",
    helper: "Tracks future agent rentals, purchases, subscriptions, usage fees, and publisher shares.",
  },
  {
    title: "RioMind Nexus Router",
    value: "Agent orchestration",
    helper: "RioMind Nexus can later recommend, route, supervise, and summarize agent workflows.",
  },
];

const flows = [
  {
    title: "Agent Catalog",
    href: "/prime-ai/ai-agent-marketplace/agents",
    tone: "violet",
  },
  {
    title: "Publishers",
    href: "/prime-ai/ai-agent-marketplace/publishers",
    tone: "cyan",
  },
  {
    title: "Agent Runs",
    href: "/prime-ai/ai-agent-marketplace/runs",
    tone: "amber",
  },
  {
    title: "Revenue",
    href: "/prime-ai/ai-agent-marketplace/revenue",
    tone: "emerald",
  },
];

function flowClass(tone: string) {
  if (tone === "cyan") return "border-cyan-300/25 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18";
  if (tone === "amber") return "border-amber-300/25 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18";
  if (tone === "emerald") return "border-emerald-300/25 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18";
  return "border-violet-300/25 bg-violet-500/12 text-violet-100 hover:bg-violet-500/18";
}

export function AiAgentMarketplaceMiniApp({
  projectName = "AI Agent Marketplace Project",
  tokenAddress,
}: {
  projectName?: string;
  tokenAddress?: string;
}) {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[34px] border border-violet-300/20 bg-[radial-gradient(circle_at_0%_0%,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.14),transparent_36%),linear-gradient(135deg,rgba(8,20,38,0.72),rgba(13,17,34,0.92))] p-7 shadow-[0_30px_110px_-80px_rgba(139,92,246,0.9)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-violet-200">
              Project App Module · AI Agent Marketplace
            </div>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
              {projectName}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
              This embedded module gives the creator project an agent marketplace:
              agent discovery, install/rent flow, publisher onboarding, execution logs,
              revenue readiness, and RioMind Nexus agent orchestration.
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
              Viewers can browse available agents, understand what each agent does,
              and later install, rent, or subscribe to agent workflows from the creator project.
            </p>
            <div className="mt-4 rounded-2xl border border-violet-300/14 bg-violet-500/[0.055] px-4 py-3 text-xs leading-5 text-violet-100/80">
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
            <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-200/70">
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
