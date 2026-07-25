"use client";

import { useMemo, useState } from "react";
import { AI_DEVELOPMENT_APP_BUILDING_DEEP_TEMPLATE } from "@/lib/prime-ai/ai-development-app-building-deep-template";
import { AI_DEVELOPMENT_APP_BUILDING_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/ai-development-app-building-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "blueprint"
  | "architecture"
  | "codebase"
  | "ai"
  | "risks"
  | "roadmap"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this builder is", helper: "Understand the AI app builder project." },
  { id: "creator", label: "Creator setup", helper: "What the app-builder creator configures." },
  { id: "blueprint", label: "Build blueprint", helper: "Turn app idea into product structure." },
  { id: "architecture", label: "Generate architecture", helper: "Frontend, backend, database, API, AI, deployment." },
  { id: "codebase", label: "Plan codebase", helper: "Routes, services, schemas, workers, components." },
  { id: "ai", label: "Design AI layer", helper: "Model router, agents, prompts, usage credits." },
  { id: "risks", label: "Review risks", helper: "Security, scaling, billing, compliance, data." },
  { id: "roadmap", label: "Build roadmap", helper: "MVP phases, tasks, dependencies, next actions." },
  { id: "access", label: "Access model", helper: "Public, subscription, usage credits, agency." },
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

export function AiDevelopmentRuntimeClient() {
  const template = AI_DEVELOPMENT_APP_BUILDING_DEEP_TEMPLATE;
  const nexusContract = AI_DEVELOPMENT_APP_BUILDING_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [appIdea, setAppIdea] = useState("Build an AI customer support chatbot for small businesses");
  const [targetUsers, setTargetUsers] = useState("Small businesses and online store owners");
  const [coreFeatures, setCoreFeatures] = useState("Chat widget, admin dashboard, knowledge base, ticket escalation, billing");
  const [aiRequirements, setAiRequirements] = useState("Answer customer questions, summarize support tickets, route difficult cases to human agents");
  const [launchTarget, setLaunchTarget] = useState("MVP in 30 days");
  const [blueprintBuilt, setBlueprintBuilt] = useState(false);

  const featureList = useMemo(
    () => coreFeatures.split(",").map((item) => item.trim()).filter(Boolean),
    [coreFeatures],
  );

  function loadExample(type: "school" | "marketplace" | "crm" | "support") {
    if (type === "school") {
      setAppIdea("Build a school portal with AI tutor support");
      setTargetUsers("Students, teachers, parents, and school administrators");
      setCoreFeatures("Student dashboard, teacher portal, assignments, exam prep, progress reports");
      setAiRequirements("Generate study notes, answer student questions, create mock exams, summarize progress");
      setLaunchTarget("School MVP in 45 days");
    }

    if (type === "marketplace") {
      setAppIdea("Build a tutor marketplace");
      setTargetUsers("Tutors, students, and parents");
      setCoreFeatures("Tutor profiles, booking, payments, reviews, messaging, admin panel");
      setAiRequirements("Match students with tutors, summarize tutor profiles, recommend learning paths");
      setLaunchTarget("Marketplace MVP in 60 days");
    }

    if (type === "crm") {
      setAppIdea("Build an AI CRM for small businesses");
      setTargetUsers("Sales teams, SMEs, and business owners");
      setCoreFeatures("Lead pipeline, customer notes, reminders, reports, email templates");
      setAiRequirements("Summarize customers, score leads, generate follow-up messages, forecast deals");
      setLaunchTarget("SaaS MVP in 30 days");
    }

    if (type === "support") {
      setAppIdea("Build an AI customer support chatbot for small businesses");
      setTargetUsers("Small businesses and online store owners");
      setCoreFeatures("Chat widget, admin dashboard, knowledge base, ticket escalation, billing");
      setAiRequirements("Answer customer questions, summarize support tickets, route difficult cases to human agents");
      setLaunchTarget("MVP in 30 days");
    }

    setBlueprintBuilt(false);
    setMode("blueprint");
  }

  function buildBlueprint() {
    setBlueprintBuilt(true);
    setMode("architecture");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator app-builder blueprint";
    if (mode === "blueprint") return "Product blueprint";
    if (mode === "architecture") return "System architecture";
    if (mode === "codebase") return "Codebase plan";
    if (mode === "ai") return "AI layer design";
    if (mode === "risks") return "Risk review";
    if (mode === "roadmap") return "Build roadmap";
    if (mode === "access") return "Access and monetization model";
    return "AI app builder workflow";
  }

  function activeWorkflowOutput() {
    if (!blueprintBuilt && ["architecture", "codebase", "ai", "risks", "roadmap"].includes(mode)) {
      return "Build the product blueprint first. The runtime needs the app idea, users, features, AI needs, and launch target before deeper outputs can be generated.";
    }

    if (mode === "overview") return "This project is a creator-owned AI app-building platform. It helps users convert ideas into structured software plans, architecture, codebase blueprints, AI layer design, and build roadmap.";
    if (mode === "creator") return "The creator configures builder market, app categories, development depth, and access model. This turns Prime into a product/app launcher.";
    if (mode === "blueprint") return blueprintBuilt ? `Blueprint ready for: ${appIdea}. Target users: ${targetUsers}.` : "Fill the app profile and click Build Product Blueprint.";
    if (mode === "architecture") return `Architecture should include frontend surfaces, backend services, database models, API routes, auth, payment, AI layer, and deployment path for: ${appIdea}.`;
    if (mode === "codebase") return `Codebase plan should break ${featureList.length} major feature(s) into routes, components, services, schemas, workers, and integrations.`;
    if (mode === "ai") return `AI layer should support: ${aiRequirements}. RioMind Nexus later becomes the intelligence router behind these AI workflows.`;
    if (mode === "risks") return "Risk review should flag auth, data privacy, payment, scaling, model hallucination, prompt abuse, deployment, and compliance issues.";
    if (mode === "roadmap") return `Build roadmap should sequence MVP tasks for launch target: ${launchTarget}.`;
    if (mode === "access") return "The creator can choose public, subscription, usage-credit, RIO/RUSD/USDT/USDC payment, card rails later, or agency/team access.";
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · AI Development & App Building</div>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight md:text-5xl">{template.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-white/62">{template.publicPositioning}</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-300/15 bg-amber-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/75">Creator promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.creatorPromise}</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">Builder promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.userPromise}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">RioMind Nexus-ready contract</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future product-building Nexus intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This AI Development niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will receive app ideas and return product blueprint, architecture, codebase plan,
              AI layer design, risks, deployment plan, and build roadmap.
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
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this builder</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">App idea input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the product idea</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The user defines the app they want to build, who it serves, what features it needs, and how AI should help.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("support")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load support app</button>
            <button type="button" onClick={() => loadExample("school")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load school portal</button>
            <button type="button" onClick={() => loadExample("marketplace")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load marketplace</button>
            <button type="button" onClick={() => loadExample("crm")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load AI CRM</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">App idea</span><textarea value={appIdea} onChange={(event) => setAppIdea(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Target users</span><textarea value={targetUsers} onChange={(event) => setTargetUsers(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Core features</span><textarea value={coreFeatures} onChange={(event) => setCoreFeatures(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">AI requirements</span><textarea value={aiRequirements} onChange={(event) => setAiRequirements(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Launch target</span><input value={launchTarget} onChange={(event) => setLaunchTarget(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={buildBlueprint} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Build Product Blueprint</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus product intelligence panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Blueprint</div><div className="mt-1 text-lg font-semibold text-white">{blueprintBuilt ? "Built" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Features</div><div className="mt-1 text-lg font-semibold text-cyan-100">{blueprintBuilt ? featureList.length : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{blueprintBuilt ? "Generate architecture, then plan codebase." : "Fill app profile and build blueprint."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Product Hook</div><h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3></div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "blueprint" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Product blueprint" title={blueprintBuilt ? "Blueprint ready" : "Awaiting blueprint"} body={blueprintBuilt ? `${appIdea}. Users: ${targetUsers}.` : "Fill the app idea input and click Build Product Blueprint."} /><SectionCard eyebrow="Product posture" title="Problem before code" body="The runtime should define problem, users, value, and flows before architecture." /><SectionCard eyebrow="Recommended next step" title={blueprintBuilt ? "Generate architecture" : "Build blueprint first"} body={blueprintBuilt ? "Generate architecture, then plan codebase." : "Fill app idea, users, features, AI needs, and launch target."} /></div> : null}
        {mode === "architecture" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Frontend" title="User surfaces" body="Landing, dashboard, workspace, admin, billing, settings, and output/report views." /><SectionCard eyebrow="Backend" title="Services and APIs" body="Auth, projects, AI requests, usage credits, billing, storage, notifications, and reports." /><SectionCard eyebrow="Database" title="Core schemas" body="Users, projects, app blueprints, generations, outputs, billing, logs, and permissions." /></div> : null}
        {mode === "codebase" ? <div className="grid gap-4 md:grid-cols-3">{featureList.map((feature) => <SectionCard key={feature} eyebrow="Feature module" title={feature} body="Create route, UI component, API handler, database model, validation, and test path for this module." />)}</div> : null}
        {mode === "ai" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Nexus layer" title="Model and agent routing" body={aiRequirements} /><SectionCard eyebrow="Usage credits" title="Metered AI actions" body="Track prompts, generations, saved plans, deployment reviews, and premium workflows." /><SectionCard eyebrow="Output contract" title="Structured results" body="Every AI response should return blueprint, assumptions, risks, outputs, and next action." /></div> : null}
        {mode === "risks" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Security" title="Auth and API safety" body="Review authentication, authorization, API abuse, secrets, and dependency risks." /><SectionCard eyebrow="Data" title="Privacy and storage" body="Review user data, file uploads, retention, encryption, and compliance needs." /><SectionCard eyebrow="Deployment" title="Production readiness" body="Review environment variables, monitoring, CI/CD, domains, logs, and rollback plan." /></div> : null}
        {mode === "roadmap" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Roadmap module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Trust and proof layer" body={proof} />)}</div> : null}
      </section>
    </section>
  );
}
