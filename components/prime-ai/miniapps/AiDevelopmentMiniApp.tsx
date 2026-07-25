import Link from "next/link";

const modules = [
  {
    title: "Prompt-to-App Workspace",
    value: "Build from natural language",
    helper: "Creators or users describe an app idea and the module turns it into a structured app plan.",
  },
  {
    title: "Template Gallery",
    value: "One-click app patterns",
    helper: "Chatbot, marketplace, CRM, school portal, e-commerce, healthcare app, and business workflow templates.",
  },
  {
    title: "Model Router",
    value: "AI provider orchestration",
    helper: "Future RioMind Nexus routing layer can select the right AI model or agent for each task.",
  },
  {
    title: "Usage Credits",
    value: "Metered AI usage",
    helper: "Tracks prompts, generations, deployment actions, API usage, and future RIO/RUSD payment credits.",
  },
  {
    title: "Deployment Console",
    value: "Launch readiness",
    helper: "Organizes generated frontend, backend, database, hosting, and environment configuration status.",
  },
  {
    title: "Developer Portal",
    value: "API and SDK access",
    helper: "Supports API keys, SDK docs, rate limits, usage records, and builder onboarding.",
  },
];

const flows = [
  {
    title: "App Workspace",
    href: "/prime-ai/ai-development-app-building/workspace",
    tone: "cyan",
  },
  {
    title: "Templates",
    href: "/prime-ai/ai-development-app-building/templates",
    tone: "amber",
  },
  {
    title: "Deployments",
    href: "/prime-ai/ai-development-app-building/deployments",
    tone: "emerald",
  },
  {
    title: "Dashboard",
    href: "/prime-ai/ai-development-app-building/dashboard",
    tone: "violet",
  },
];

function flowClass(tone: string) {
  if (tone === "amber") return "border-amber-300/25 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18";
  if (tone === "emerald") return "border-emerald-300/25 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18";
  if (tone === "violet") return "border-violet-300/25 bg-violet-500/12 text-violet-100 hover:bg-violet-500/18";
  return "border-cyan-300/25 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18";
}

export function AiDevelopmentMiniApp({
  projectName = "AI App Builder Project",
  tokenAddress,
}: {
  projectName?: string;
  tokenAddress?: string;
}) {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[34px] border border-violet-300/20 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.15),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.16),transparent_36%),linear-gradient(135deg,rgba(8,20,38,0.72),rgba(13,17,34,0.92))] p-7 shadow-[0_30px_110px_-80px_rgba(168,85,247,0.9)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-violet-200">
              Project App Module · AI Development & App Building
            </div>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
              {projectName}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
              This embedded module gives the creator project an AI app-building surface:
              templates, prompt-to-app planning, model routing readiness, usage credits,
              deployment preparation, and developer-facing API/SDK access.
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
              Viewers can use this module to explore app templates, understand what can be built,
              and later generate AI-powered apps through RioMind Nexus-backed workflows.
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
