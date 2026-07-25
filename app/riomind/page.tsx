import Link from "next/link";

import { RIOMIND_AGENT_REGISTRY } from "@/lib/riomind/agents/registry";
import { RIOMIND_CORE_CAPABILITIES } from "@/lib/riomind/core/capabilities";
import { RIOMIND_KNOWLEDGE_REGISTRY } from "@/lib/riomind/knowledge/registry";
import { RIOMIND_MEMORY_REGISTRY } from "@/lib/riomind/memory/registry";
import { RIOMIND_ORCHESTRATION_REGISTRY } from "@/lib/riomind/orchestration/registry";
import { RIOMIND_PROVIDER_REGISTRY } from "@/lib/riomind/providers/registry";
import { RIOMIND_TOOL_REGISTRY } from "@/lib/riomind/tools/registry";

const statCards = [
  ["Providers", RIOMIND_PROVIDER_REGISTRY.length],
  ["Agents", RIOMIND_AGENT_REGISTRY.length],
  ["Knowledge", RIOMIND_KNOWLEDGE_REGISTRY.length],
  ["Tools", RIOMIND_TOOL_REGISTRY.length],
  ["Memory", RIOMIND_MEMORY_REGISTRY.length],
  ["Orchestration", RIOMIND_ORCHESTRATION_REGISTRY.length],
];

const connectedNetworks = [
  "RioExplorer",
  "RioEx",
  "RioLight",
  "Prime AI",
  "SPO-20",
  "Treasury",
  "Governance",
  "Developers",
  "Researchers",
  "Creators",
  "Enterprises",
  "External Apps",
];

function pill(label: string) {
  return (
    <span
      key={label}
      className="rounded-full border border-cyan-300/15 bg-cyan-500/[0.07] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/65"
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}

export default function RioMindLandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(168,85,247,0.12),transparent_30%),linear-gradient(180deg,#040712,#070a14_52%,#05070d)] px-4 py-5 text-white md:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col gap-5">
        <header className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-4xl">
              <div className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-200/75">
                RioMind Sovereign Intelligence
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Command layer for Spherio intelligence.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">
                RioMind Nexus routes users, builders, researchers, creators, enterprises,
                and ecosystem products through agents, providers, knowledge, tools, memory,
                and orchestration. It is the broad command layer; connected products use it
                as intelligence infrastructure.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/riomind/chat"
                className="rounded-2xl border border-cyan-300/25 bg-cyan-500/15 px-4 py-2.5 text-xs font-black text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Enter Nexus
              </Link>

              <Link
                href="/api/riomind/audit"
                className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2.5 text-xs font-black text-white/62 transition hover:text-white"
              >
                Foundation Audit
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-6">
          {statCards.map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-white/10 bg-black/22 p-4 shadow-xl shadow-black/10">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/32">
                {label}
              </div>
              <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
            </div>
          ))}
        </section>

        <section className="grid flex-1 gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <div className="rounded-[30px] border border-cyan-300/12 bg-cyan-500/[0.045] p-5 shadow-2xl shadow-cyan-950/15 backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">
                Connected Networks
              </div>

              <p className="mt-3 text-sm leading-7 text-white/52">
                Nexus is not limited to one product surface. It is prepared to serve
                multiple Spherio intelligence domains through the same routing foundation.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {connectedNetworks.map((network) => (
                  <div
                    key={network}
                    className="rounded-2xl border border-white/10 bg-black/22 px-3 py-3 text-xs font-bold text-white/58"
                  >
                    {network}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/15 backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/38">
                Core Capabilities
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {RIOMIND_CORE_CAPABILITIES.map((item) => pill(item))}
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-violet-300/12 bg-violet-500/[0.045] p-5 shadow-2xl shadow-black/15 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-200/70">
                  Agent Registry
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  Specialist routes prepared for Nexus.
                </div>
              </div>

              <div className="rounded-full border border-emerald-300/15 bg-emerald-500/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100/70">
                Foundation Ready
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {RIOMIND_AGENT_REGISTRY.map((agent) => (
                <div key={agent.id} className="rounded-[22px] border border-white/10 bg-black/22 p-4">
                  <div className="text-sm font-semibold text-white">{agent.name}</div>
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/34">
                    {agent.recommendedModels.join(" + ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
