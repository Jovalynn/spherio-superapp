"use client";

import { useMemo, useState } from "react";
import { RESEARCH_ECONOMY_DEEP_TEMPLATE } from "@/lib/prime-ai/research-economy-deep-template";
import { RESEARCH_ECONOMY_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/research-economy-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "frame"
  | "literature"
  | "gap"
  | "methodology"
  | "proposal"
  | "verify"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this platform is", helper: "Understand the research economy project." },
  { id: "creator", label: "Creator setup", helper: "What the research creator configures." },
  { id: "frame", label: "Frame research", helper: "Problem, scope, question, objective." },
  { id: "literature", label: "Map literature", helper: "Themes, debates, sources, contradictions." },
  { id: "gap", label: "Find research gap", helper: "Novelty, missing work, contribution angle." },
  { id: "methodology", label: "Plan methodology", helper: "Method, data, ethics, limitations." },
  { id: "proposal", label: "Prepare proposal", helper: "Proposal, paper, grant, or journal outline." },
  { id: "verify", label: "Review and verify", helper: "Citations, evidence, bias, integrity." },
  { id: "access", label: "Access model", helper: "Public, subscription, institution, credits." },
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

export function ResearchEconomyRuntimeClient() {
  const template = RESEARCH_ECONOMY_DEEP_TEMPLATE;
  const nexusContract = RESEARCH_ECONOMY_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [topic, setTopic] = useState("AI-powered personalized learning in secondary education");
  const [field, setField] = useState("Education Technology");
  const [output, setOutput] = useState("Research proposal");
  const [sources, setSources] = useState("Prior studies on adaptive learning, AI tutoring, student performance, and learning analytics");
  const [constraints, setConstraints] = useState("APA format, mixed-method design, 3000 words, 2-week deadline");
  const [researchFramed, setResearchFramed] = useState(false);

  const sourceSignals = useMemo(
    () => sources.split(",").map((item) => item.trim()).filter(Boolean),
    [sources],
  );

  function loadExample(type: "education" | "energy" | "blockchain" | "medical") {
    if (type === "education") {
      setTopic("AI-powered personalized learning in secondary education");
      setField("Education Technology");
      setOutput("Research proposal");
      setSources("Adaptive learning studies, AI tutoring literature, student performance datasets");
      setConstraints("APA format, mixed-method design, 3000 words, 2-week deadline");
    }

    if (type === "energy") {
      setTopic("Renewable energy adoption barriers in Nigeria");
      setField("Energy Economics");
      setOutput("Grant application");
      setSources("World Bank energy data, Nigerian electricity reports, renewable policy papers");
      setConstraints("Policy impact focus, 5000 words, mixed methods");
    }

    if (type === "blockchain") {
      setTopic("Governance models for decentralized blockchain ecosystems");
      setField("Blockchain Governance");
      setOutput("Journal paper outline");
      setSources("DAO governance papers, validator economics studies, protocol governance frameworks");
      setConstraints("Academic tone, comparative analysis, citation-heavy");
    }

    if (type === "medical") {
      setTopic("AI-assisted literature review for early disease detection");
      setField("Medical AI Research");
      setOutput("Literature review");
      setSources("Medical imaging papers, diagnostic AI studies, clinical validation literature");
      setConstraints("No clinical claims without evidence, human expert review required");
    }

    setResearchFramed(false);
    setMode("frame");
  }

  function frameResearch() {
    setResearchFramed(true);
    setMode("literature");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator research blueprint";
    if (mode === "frame") return "Research framing";
    if (mode === "literature") return "Literature mapping";
    if (mode === "gap") return "Research gap analysis";
    if (mode === "methodology") return "Methodology planning";
    if (mode === "proposal") return "Proposal or paper preparation";
    if (mode === "verify") return "Research integrity review";
    if (mode === "access") return "Access and monetization model";
    return "Research workflow";
  }

  function activeWorkflowOutput() {
    if (!researchFramed && ["literature", "gap", "methodology", "proposal", "verify"].includes(mode)) {
      return "Frame the research first. The runtime needs the topic, field, intended output, sources, and constraints before deeper research outputs can be generated.";
    }

    if (mode === "overview") return "This project is a creator-owned research platform. It helps users convert research ideas into proposals, literature maps, methodology plans, grant logic, peer-review notes, and verification reports.";
    if (mode === "creator") return "The creator configures research market, workflow type, research field, and access model. This turns Prime into a research product launcher.";
    if (mode === "frame") return researchFramed ? `Research frame ready for ${field}: ${topic}. Intended output: ${output}.` : "Fill the research profile and click Frame Research.";
    if (mode === "literature") return `Literature map should organize source signals: ${sourceSignals.join(", ")}. Nexus later should identify themes, debates, contradictions, and missing sources.`;
    if (mode === "gap") return `Gap analysis should explain what is underexplored in ${topic}, what contribution is possible, and what evidence is still missing.`;
    if (mode === "methodology") return `Methodology should respect constraints: ${constraints}, and propose data needs, ethics, limitations, and analysis plan.`;
    if (mode === "proposal") return `Prepare ${output} with problem statement, objectives, literature logic, methodology, expected contribution, and references plan.`;
    if (mode === "verify") return "Research verification should flag invented citation risk, weak evidence, missing methodology, bias, unsupported claims, and human-review requirements.";
    if (mode === "access") return "The creator can choose public, subscription, institution, research credits, RIO/RUSD/USDT/USDC payment, and card rails later.";
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · Research Economy</div>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight md:text-5xl">{template.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-white/62">{template.publicPositioning}</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-300/15 bg-amber-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/75">Creator promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.creatorPromise}</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">Researcher promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.userPromise}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">RioMind Nexus-ready contract</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future research intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This Research Economy niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will frame research problems, map literature, identify gaps, plan methodology,
              support proposals and grants, review quality, and expose verification needs.
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
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this research platform</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Research input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the research objective</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The user defines the topic, field, output type, known sources, and constraints.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("education")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load education research</button>
            <button type="button" onClick={() => loadExample("energy")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load energy grant</button>
            <button type="button" onClick={() => loadExample("blockchain")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load blockchain paper</button>
            <button type="button" onClick={() => loadExample("medical")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load medical review</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Research topic</span><textarea value={topic} onChange={(event) => setTopic(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Research field</span><input value={field} onChange={(event) => setField(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Intended output</span><input value={output} onChange={(event) => setOutput(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Known sources or data</span><textarea value={sources} onChange={(event) => setSources(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Constraints</span><textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={frameResearch} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Frame Research</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus research intelligence panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Research frame</div><div className="mt-1 text-lg font-semibold text-white">{researchFramed ? "Ready" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Source signals</div><div className="mt-1 text-lg font-semibold text-cyan-100">{researchFramed ? sourceSignals.length : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{researchFramed ? "Map literature, then find gap." : "Fill research profile and frame research."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Research Hook</div><h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3></div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "frame" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Research frame" title={researchFramed ? "Frame ready" : "Awaiting frame"} body={researchFramed ? `${field}: ${topic}. Intended output: ${output}.` : "Fill research input and click Frame Research."} /><SectionCard eyebrow="Research posture" title="Question before answer" body="The runtime should clarify the problem, scope, and objective before drafting content." /><SectionCard eyebrow="Recommended next step" title={researchFramed ? "Map literature" : "Frame first"} body={researchFramed ? "Map literature, then identify research gap." : "Fill topic, field, output, sources, and constraints."} /></div> : null}
        {mode === "literature" ? <div className="grid gap-4 md:grid-cols-3">{sourceSignals.map((source) => <SectionCard key={source} eyebrow="Source signal" title={source} body="Nexus later should verify source quality, cluster themes, detect contradictions, and flag missing citations." />)}</div> : null}
        {mode === "gap" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Research gap" title="Underexplored angle" body={`Find what is missing or weak in current work around: ${topic}.`} /><SectionCard eyebrow="Novelty" title="Contribution angle" body="Explain what new insight, method, dataset, or context the research can contribute." /><SectionCard eyebrow="Evidence need" title="Missing proof" body="Flag what must be sourced before making strong claims." /></div> : null}
        {mode === "methodology" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Method" title="Research design" body={`Plan method for ${field}, respecting: ${constraints}.`} /><SectionCard eyebrow="Data" title="Evidence requirements" body="Define data source, sampling, measurement, limitations, and analysis plan." /><SectionCard eyebrow="Ethics" title="Review posture" body="Flag human subjects, sensitive data, consent, privacy, and institutional review needs." /></div> : null}
        {mode === "proposal" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Proposal module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "verify" ? <div className="grid gap-4 md:grid-cols-2">{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Research integrity" body={proof} />)}<SectionCard eyebrow="Human review" title="Expert review required" body="Academic, journal, grant, and institutional outputs must be reviewed by qualified humans before submission." /></div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}</div> : null}
      </section>
    </section>
  );
}
