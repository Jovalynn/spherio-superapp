"use client";

import { useState } from "react";
import { DEVELOPER_AI_ECOSYSTEM_DEEP_TEMPLATE } from "@/lib/prime-ai/developer-ai-ecosystem-deep-template";
import { DEVELOPER_AI_ECOSYSTEM_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/developer-ai-ecosystem-nexus-contract";

const actions = ["Plan architecture","Review code","Debug issue","Generate tests","Prepare docs/DevOps","Engineering report","Access model"];

export function DeveloperAiEcosystemRuntimeClient() {
  const template = DEVELOPER_AI_ECOSYSTEM_DEEP_TEMPLATE;
  const contract = DEVELOPER_AI_ECOSYSTEM_NEXUS_READY_CONTRACT;
  const [active, setActive] = useState("Plan architecture");
  const [ready, setReady] = useState(false);
  const [goal, setGoal] = useState("Build a production-ready developer dashboard with API, database, auth, and deployment workflow");
  const [stack, setStack] = useState("Next.js, TypeScript, Node.js, Postgres, Docker");
  const [issue, setIssue] = useState("Need architecture, tests, docs, security review, and deployment checklist");
  const [output, setOutput] = useState("Architecture plan, task list, test plan, docs, DevOps checklist, and security notes");

  const summary = ready
    ? `${active}: Nexus-ready developer workflow prepared for ${stack}. Goal: ${goal}.`
    : "Fill the developer profile and click Prepare Developer Runtime.";

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · Developer AI Ecosystem</div>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight md:text-5xl">{template.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-white/62">{template.publicPositioning}</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-300/15 bg-amber-500/[0.055] p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/75">Creator promise</div><p className="mt-2 text-sm leading-7 text-white/68">{template.creatorPromise}</p></div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/[0.055] p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">Developer promise</div><p className="mt-2 text-sm leading-7 text-white/68">{template.userPromise}</p></div>
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">RioMind Nexus-ready contract</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future developer intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">{contract.rioMindNexusRole}</p>
          </div>
          <div className="h-fit rounded-2xl border border-violet-300/18 bg-black/25 px-4 py-3 text-xs font-bold text-violet-100">{contract.status.replaceAll("_", " ")}</div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Input fields</div><div className="mt-1 text-2xl font-semibold text-cyan-100">{contract.inputSchema.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Workflows</div><div className="mt-1 text-2xl font-semibold text-amber-100">{contract.workflowActions.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Outputs</div><div className="mt-1 text-2xl font-semibold text-emerald-100">{contract.expectedOutputs.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Verification rules</div><div className="mt-1 text-2xl font-semibold text-violet-100">{contract.verificationLayer.length}</div></div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Developer input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the engineering goal</h2>
          <div className="mt-5 space-y-4">
            <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white" />
            <input value={stack} onChange={(e) => setStack(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white" />
            <textarea value={issue} onChange={(e) => setIssue(e.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white" />
            <textarea value={output} onChange={(e) => setOutput(e.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white" />
            <button onClick={() => setReady(true)} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100">Prepare Developer Runtime</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {actions.map((item) => (
              <button key={item} onClick={() => setActive(item)} className={`rounded-2xl border p-4 text-left text-sm font-bold ${active === item ? "border-cyan-300/40 bg-cyan-500/16 text-cyan-100" : "border-white/10 bg-white/[0.045] text-white/62"}`}>{item}</button>
            ))}
          </div>
          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Developer Hook</div>
            <h3 className="mt-2 text-xl font-semibold text-white">{active}</h3>
            <p className="mt-3 text-sm leading-7 text-white/66">{summary}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {template.deepModules.map((m) => (
            <div key={m.title} className="rounded-3xl border border-white/10 bg-black/24 p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/70">Developer module</div>
              <div className="mt-2 text-xl font-semibold text-white">{m.title}</div>
              <p className="mt-2 text-sm leading-7 text-white/58">{m.purpose} Outputs: {m.outputs.join(", ")}.</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
