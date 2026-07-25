"use client";

import { useMemo, useState } from "react";
import { AI_PERSONAL_WORK_MARKETPLACE_DEEP_TEMPLATE } from "@/lib/prime-ai/ai-personal-work-marketplace-deep-template";
import { AI_PERSONAL_WORK_MARKETPLACE_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/ai-personal-work-marketplace-nexus-contract";

type RuntimeMode = "overview" | "creator" | "priorities" | "plan" | "admin" | "match" | "communication" | "report" | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this marketplace is", helper: "Understand personal/work marketplace." },
  { id: "creator", label: "Creator setup", helper: "What the marketplace creator configures." },
  { id: "priorities", label: "Map priorities", helper: "Tasks, urgency, blockers, timeline." },
  { id: "plan", label: "Generate work plan", helper: "Milestones, checklist, schedule." },
  { id: "admin", label: "Route admin", helper: "Documents, forms, reminders." },
  { id: "match", label: "Match service/template", helper: "Agents, providers, packages." },
  { id: "communication", label: "Communication", helper: "Emails, meetings, follow-ups." },
  { id: "report", label: "Work report", helper: "Package, review points, next actions." },
  { id: "access", label: "Access model", helper: "Public, subscription, credits, teams." },
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

export function AiPersonalWorkMarketplaceRuntimeClient() {
  const template = AI_PERSONAL_WORK_MARKETPLACE_DEEP_TEMPLATE;
  const nexusContract = AI_PERSONAL_WORK_MARKETPLACE_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [workGoal, setWorkGoal] = useState("Plan my week and prepare client follow-up tasks");
  const [userContext, setUserContext] = useState("Professional");
  const [timeline, setTimeline] = useState("This week");
  const [blockers, setBlockers] = useState("Need client feedback, limited focus time, two pending meetings");
  const [desiredOutput, setDesiredOutput] = useState("Priority map, task plan, email draft, and follow-up checklist");
  const [prioritiesMapped, setPrioritiesMapped] = useState(false);

  const blockerSignals = useMemo(
    () => blockers.split(",").map((item) => item.trim()).filter(Boolean),
    [blockers],
  );

  function loadExample(type: "week" | "client" | "family" | "service") {
    if (type === "week") {
      setWorkGoal("Plan my week and prepare client follow-up tasks");
      setUserContext("Professional");
      setTimeline("This week");
      setBlockers("Need client feedback, limited focus time, two pending meetings");
      setDesiredOutput("Priority map, task plan, email draft, and follow-up checklist");
    }
    if (type === "client") {
      setWorkGoal("Prepare a proposal package for a new client");
      setUserContext("Freelancer");
      setTimeline("Before Friday");
      setBlockers("Missing client budget, need scope clarity, need pricing structure");
      setDesiredOutput("Proposal checklist, service package, email draft, and delivery timeline");
    }
    if (type === "family") {
      setWorkGoal("Organize household admin and school documents");
      setUserContext("Parent");
      setTimeline("This month");
      setBlockers("Scattered documents, school deadlines, appointment reminders");
      setDesiredOutput("Document checklist, reminder plan, calendar tasks, and admin route");
    }
    if (type === "service") {
      setWorkGoal("Find a productivity assistant workflow for small team operations");
      setUserContext("Team lead");
      setTimeline("Next 2 weeks");
      setBlockers("Unclear ownership, repeated manual tasks, no reporting rhythm");
      setDesiredOutput("Service match, workflow template, task routing, and report structure");
    }
    setPrioritiesMapped(false);
    setMode("priorities");
  }

  function mapPriorities() {
    setPrioritiesMapped(true);
    setMode("plan");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator productivity marketplace blueprint";
    if (mode === "priorities") return "Priority mapping";
    if (mode === "plan") return "Work plan generation";
    if (mode === "admin") return "Personal admin routing";
    if (mode === "match") return "Service and template matching";
    if (mode === "communication") return "Communication preparation";
    if (mode === "report") return "Work output report";
    if (mode === "access") return "Access and monetization model";
    return "Personal and work workflow";
  }

  function activeWorkflowOutput() {
    if (!prioritiesMapped && ["plan", "admin", "match", "communication", "report"].includes(mode)) {
      return "Map priorities first. The runtime needs the work goal, user context, timeline, blockers, and desired output before deeper productivity outputs can be generated.";
    }
    if (mode === "overview") return "This project is a creator-owned personal and work marketplace for productivity agents, templates, service requests, task planning, personal admin, and work-output packages.";
    if (mode === "creator") return "The creator configures marketplace focus, workflow type, user model, and access model. This turns Prime into a productivity/work marketplace launcher.";
    if (mode === "priorities") return prioritiesMapped ? `Priority map ready for ${userContext}: ${workGoal}.` : "Fill the productivity input and click Map Priorities.";
    if (mode === "plan") return `Work plan should respect timeline: ${timeline}, blockers: ${blockers}, and desired output: ${desiredOutput}.`;
    if (mode === "admin") return "Admin route should organize documents, reminders, forms, errands, approvals, and follow-up actions.";
    if (mode === "match") return "Service/template matching should recommend productivity agents, templates, providers, or marketplace packages.";
    if (mode === "communication") return "Communication package should prepare email drafts, agendas, meeting notes, follow-ups, and decision logs.";
    if (mode === "report") return "Work report should include priority map, work plan, service match, templates, communication package, review points, and next actions.";
    if (mode === "access") return "The creator can choose public assistant, subscription workspace, usage-credit marketplace, RIO/RUSD/USDT/USDC payment, and team/service-provider workspace.";
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · AI Personal & Work Marketplace</div>
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
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future productivity orchestration</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This Personal & Work Marketplace niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will map priorities, generate work plans, route admin, match services/templates, prepare communication, and generate work reports.
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
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this productivity marketplace</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Productivity input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the work or life goal</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The user defines goal, context, timeline, blockers, and desired output.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("week")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load weekly plan</button>
            <button type="button" onClick={() => loadExample("client")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load client proposal</button>
            <button type="button" onClick={() => loadExample("family")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load family admin</button>
            <button type="button" onClick={() => loadExample("service")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load service match</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Work or personal goal</span><textarea value={workGoal} onChange={(event) => setWorkGoal(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">User context</span><input value={userContext} onChange={(event) => setUserContext(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Deadline or timeline</span><input value={timeline} onChange={(event) => setTimeline(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Constraints or blockers</span><textarea value={blockers} onChange={(event) => setBlockers(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Desired output</span><textarea value={desiredOutput} onChange={(event) => setDesiredOutput(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={mapPriorities} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Map Priorities</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus productivity panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Priorities</div><div className="mt-1 text-lg font-semibold text-white">{prioritiesMapped ? "Mapped" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Blockers</div><div className="mt-1 text-lg font-semibold text-cyan-100">{prioritiesMapped ? blockerSignals.length : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{prioritiesMapped ? "Generate work plan, then match service/template." : "Fill productivity profile and map priorities."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Work Hook</div><h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3></div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "priorities" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Priority map" title={prioritiesMapped ? "Priorities mapped" : "Awaiting priority map"} body={prioritiesMapped ? `${userContext}: ${workGoal}. Timeline: ${timeline}.` : "Fill productivity input and click Map Priorities."} /><SectionCard eyebrow="Work posture" title="Plan before execution" body="The runtime should clarify urgency, dependencies, blockers, and desired outputs before generating workflows." /><SectionCard eyebrow="Recommended next step" title={prioritiesMapped ? "Generate work plan" : "Map priorities first"} body={prioritiesMapped ? "Generate work plan, then match service/template." : "Fill goal, context, timeline, blockers, and desired output."} /></div> : null}
        {mode === "plan" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Work plan" title="Execution plan" body={desiredOutput} /><SectionCard eyebrow="Timeline" title={timeline} body="Break work into tasks, milestones, reminders, review points, and deliverables." /><SectionCard eyebrow="Blockers" title="Remove friction" body={blockers} /></div> : null}
        {mode === "admin" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Admin route" title="Documents and reminders" body="Organize forms, files, deadlines, errands, approvals, and follow-up actions." /><SectionCard eyebrow="Life workflow" title="Make it repeatable" body="Turn repeated admin into reusable templates and reminders." /><SectionCard eyebrow="Review" title="Human confirmation" body="Sensitive personal, legal, financial, or health tasks need human review." /></div> : null}
        {mode === "match" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Marketplace match" title="Service or template" body="Recommend providers, task agents, template packages, or workflow kits." /><SectionCard eyebrow="Fit" title="Match reasoning" body="Explain why the service/template fits timeline, user context, and desired output." /><SectionCard eyebrow="Purchase logic" title="Transparent terms" body="Show scope, price, delivery terms, and quality/dispute posture." /></div> : null}
        {mode === "communication" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Communication" title="Drafts and follow-ups" body="Prepare emails, meeting agendas, notes, summaries, decisions, and next-action messages." /><SectionCard eyebrow="Tone" title={userContext} body="Adapt wording to professional, family, team, or provider context." /><SectionCard eyebrow="Decision log" title="Keep track" body="Record decisions, owners, due dates, and review points." /></div> : null}
        {mode === "report" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Work report module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Work marketplace safety layer" body={proof} />)}</div> : null}
      </section>
    </section>
  );
}
