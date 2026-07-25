"use client";

import { useMemo, useState } from "react";
import { AI_AGENT_MARKETPLACE_DEEP_TEMPLATE } from "@/lib/prime-ai/ai-agent-marketplace-deep-template";
import { AI_AGENT_MARKETPLACE_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/ai-agent-marketplace-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "discover"
  | "capability"
  | "safety"
  | "run"
  | "revenue"
  | "report"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this marketplace is", helper: "Understand the agent marketplace project." },
  { id: "creator", label: "Creator setup", helper: "What the marketplace creator configures." },
  { id: "discover", label: "Discover agents", helper: "Match task to agent categories." },
  { id: "capability", label: "Analyze capability", helper: "Inspect what agents can and cannot do." },
  { id: "safety", label: "Evaluate safety", helper: "Review permissions, risks, and human-review needs." },
  { id: "run", label: "Run workflow", helper: "Plan future Nexus agent execution route." },
  { id: "revenue", label: "Usage and revenue", helper: "Credits, fees, publisher revenue." },
  { id: "report", label: "Agent report", helper: "Output, assumptions, confidence, next actions." },
  { id: "access", label: "Access model", helper: "Public, subscription, usage credits, publisher." },
];

function panelClass(active: boolean) {
  return active
    ? "border-cyan-300/40 bg-cyan-500/16 text-cyan-100 shadow-[0_0_34px_-18px_rgba(34,211,238,0.95)]"
    : "border-white/10 bg-white/[0.045] text-white/62 hover:bg-white/[0.075]";
}

function SectionCard({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/24 p-5">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/70">{eyebrow}</div>
      <div className="mt-2 text-xl font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-white/58">{body}</p>
    </div>
  );
}

function StepRow({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm md:grid-cols-[0.18fr_0.35fr_1fr]">
      <span className="font-black text-cyan-200">{step}</span>
      <span className="font-semibold text-white">{title}</span>
      <span className="text-white/60">{body}</span>
    </div>
  );
}

export function AiAgentMarketplaceRuntimeClient() {
  const template = AI_AGENT_MARKETPLACE_DEEP_TEMPLATE;
  const nexusContract = AI_AGENT_MARKETPLACE_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [agentTask, setAgentTask] = useState("Automate customer support responses for an online store");
  const [agentCategory, setAgentCategory] = useState("Business automation");
  const [executionMode, setExecutionMode] = useState("Install");
  const [riskLevel, setRiskLevel] = useState("Low risk");
  const [budget, setBudget] = useState("10 usage credits");
  const [agentsDiscovered, setAgentsDiscovered] = useState(false);

  const recommendedAgents = useMemo(
    () => [
      `${agentCategory} Assistant`,
      `${agentCategory} Workflow Runner`,
      `${agentCategory} Report Agent`,
    ],
    [agentCategory],
  );

  function loadExample(type: "support" | "research" | "coding" | "marketing") {
    if (type === "support") {
      setAgentTask("Automate customer support responses for an online store");
      setAgentCategory("Business automation");
      setExecutionMode("Install");
      setRiskLevel("Low risk");
      setBudget("10 usage credits");
    }

    if (type === "research") {
      setAgentTask("Review papers and create a structured literature review");
      setAgentCategory("Research");
      setExecutionMode("Subscribe");
      setRiskLevel("Human review required");
      setBudget("Monthly subscription");
    }

    if (type === "coding") {
      setAgentTask("Debug a Next.js API route and suggest fixes");
      setAgentCategory("Coding");
      setExecutionMode("Run once");
      setRiskLevel("Sensitive");
      setBudget("5 credits");
    }

    if (type === "marketing") {
      setAgentTask("Generate a campaign plan for a product launch");
      setAgentCategory("Marketing");
      setExecutionMode("Rent");
      setRiskLevel("Low risk");
      setBudget("RIO payment");
    }

    setAgentsDiscovered(false);
    setMode("discover");
  }

  function discoverAgents() {
    setAgentsDiscovered(true);
    setMode("capability");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator marketplace blueprint";
    if (mode === "discover") return "Agent discovery";
    if (mode === "capability") return "Capability analysis";
    if (mode === "safety") return "Safety evaluation";
    if (mode === "run") return "Workflow execution route";
    if (mode === "revenue") return "Usage and publisher revenue";
    if (mode === "report") return "Agent output report";
    if (mode === "access") return "Access and monetization model";
    return "Agent marketplace workflow";
  }

  function activeWorkflowOutput() {
    if (!agentsDiscovered && ["capability", "safety", "run", "revenue", "report"].includes(mode)) {
      return "Discover matching agents first. The runtime needs the task, category, execution mode, risk level, and budget before deeper marketplace outputs can be generated.";
    }

    if (mode === "overview") return "This project is a creator-owned AI agent marketplace. Users can find, inspect, install, rent, run, and rate agents while publishers monetize agent utilities.";
    if (mode === "creator") return "The creator configures marketplace category, publisher rules, execution model, and monetization. This turns Prime into an agent economy launcher.";
    if (mode === "discover") return agentsDiscovered ? `Agents discovered for ${agentCategory}: ${recommendedAgents.join(", ")}.` : "Fill the task profile and click Discover Matching Agents.";
    if (mode === "capability") return `Capability analysis should explain what each ${agentCategory} agent can do, the tools it needs, and where it is limited.`;
    if (mode === "safety") return `Safety review should evaluate risk level: ${riskLevel}, including permissions, sensitive actions, and human-review needs.`;
    if (mode === "run") return `Execution route should prepare a future Nexus workflow for task: ${agentTask}.`;
    if (mode === "revenue") return `Usage and revenue model should use ${budget}, execution mode ${executionMode}, marketplace fees, and publisher revenue share.`;
    if (mode === "report") return "Agent report should include result, execution trace, assumptions, confidence, limitations, and next actions.";
    if (mode === "access") return "The creator can choose public, subscription, usage-credit, RIO/RUSD/USDT/USDC payment, card rails later, and verified publisher access.";
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · AI Agent Marketplace</div>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight md:text-5xl">{template.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-white/62">{template.publicPositioning}</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-300/15 bg-amber-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/75">Creator promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.creatorPromise}</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">User promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.userPromise}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">RioMind Nexus-ready contract</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future agent orchestration intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This Agent Marketplace niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will match tasks to agents, evaluate capabilities and risks, route executions, meter usage,
              and support publisher monetization.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-300/18 bg-black/25 px-4 py-3 text-xs font-bold text-violet-100">{nexusContract.status.replaceAll("_", " ")}</div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Input fields</div><div className="mt-1 text-2xl font-semibold text-cyan-100">{nexusContract.inputSchema.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Workflows</div><div className="mt-1 text-2xl font-semibold text-amber-100">{nexusContract.workflowActions.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Outputs</div><div className="mt-1 text-2xl font-semibold text-emerald-100">{nexusContract.expectedOutputs.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Verification rules</div><div className="mt-1 text-2xl font-semibold text-violet-100">{nexusContract.verificationLayer.length}</div></div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/22 p-4">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-200/70">Nexus role</div>
          <p className="mt-2 text-sm leading-7 text-white/62">{nexusContract.rioMindNexusRole}</p>
        </div>
      </section>

      <section className="rounded-[34px] border border-white/10 bg-black/20 p-5">
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this marketplace</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Agent task input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the user task</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The user describes the problem or workflow they want an agent to solve.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("support")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load support agent</button>
            <button type="button" onClick={() => loadExample("research")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load research agent</button>
            <button type="button" onClick={() => loadExample("coding")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load coding agent</button>
            <button type="button" onClick={() => loadExample("marketing")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load marketing agent</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Agent task</span><textarea value={agentTask} onChange={(event) => setAgentTask(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Agent category</span><input value={agentCategory} onChange={(event) => setAgentCategory(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Execution mode</span><input value={executionMode} onChange={(event) => setExecutionMode(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Risk level</span><input value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Budget or credits</span><input value={budget} onChange={(event) => setBudget(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={discoverAgents} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Discover Matching Agents</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus agent intelligence panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Discovery</div><div className="mt-1 text-lg font-semibold text-white">{agentsDiscovered ? "Complete" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Matches</div><div className="mt-1 text-lg font-semibold text-cyan-100">{agentsDiscovered ? recommendedAgents.length : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{agentsDiscovered ? "Analyze capability, then safety." : "Fill task profile and discover agents."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Agent Hook</div><h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3></div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "discover" ? <div className="grid gap-4 md:grid-cols-3">{recommendedAgents.map((agent) => <SectionCard key={agent} eyebrow="Recommended agent" title={agentsDiscovered ? agent : "Awaiting discovery"} body={agentsDiscovered ? `Recommended for task: ${agentTask}` : "Fill task profile and click Discover Matching Agents."} />)}</div> : null}
        {mode === "capability" ? <div className="grid gap-4 md:grid-cols-3">{recommendedAgents.map((agent) => <SectionCard key={agent} eyebrow="Capability profile" title={agent} body={`Can assist with ${agentCategory} workflows. Must show tools, limits, permissions, and best-use cases.`} />)}</div> : null}
        {mode === "safety" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Risk level" title={riskLevel} body="Check whether the task is low-risk, sensitive, regulated, or requires human review." /><SectionCard eyebrow="Permissions" title="Tool and data access" body="Agent permissions must be explicit before execution." /><SectionCard eyebrow="Human review" title="Safety gate" body="Sensitive or high-impact outputs should require human confirmation." /></div> : null}
        {mode === "run" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Execution route" title="Future Nexus workflow" body={`Route task through discovery, capability check, safety gate, execution, output report: ${agentTask}.`} /><SectionCard eyebrow="Trace" title="Show what happened" body="Execution should show selected agent, tools, assumptions, and output path." /><SectionCard eyebrow="Next action" title="Review output" body="The user should inspect confidence, limits, and next recommended action." /></div> : null}
        {mode === "revenue" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Usage" title={budget} body={`Execution mode: ${executionMode}. Usage credits and fees should be metered.`} /><SectionCard eyebrow="Publisher revenue" title="Revenue share" body="Publishers can earn from installs, runs, rentals, subscriptions, or workflow bundles." /><SectionCard eyebrow="Marketplace fee" title="Protocol logic" body="Marketplace may route protocol fees to configured treasury rules later." /></div> : null}
        {mode === "report" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Agent report module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Trust and proof layer" body={proof} />)}</div> : null}
      </section>
    </section>
  );
}
