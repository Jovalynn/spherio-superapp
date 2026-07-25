"use client";

import { useMemo, useState } from "react";
import { HEALTHCARE_MEDICAL_AI_DEEP_TEMPLATE } from "@/lib/prime-ai/healthcare-medical-ai-deep-template";
import { HEALTHCARE_MEDICAL_AI_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/healthcare-medical-ai-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "intake"
  | "safety"
  | "education"
  | "clinic"
  | "note"
  | "report"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this platform is", helper: "Understand healthcare support." },
  { id: "creator", label: "Creator setup", helper: "What the healthcare creator configures." },
  { id: "intake", label: "Structure intake", helper: "Symptoms, timeline, history, questions." },
  { id: "safety", label: "Safety flags", helper: "Red flags, urgency, human review." },
  { id: "education", label: "Health education", helper: "General explanation, not diagnosis." },
  { id: "clinic", label: "Clinic workflow", helper: "Admin summary, handoff, intake." },
  { id: "note", label: "Medical note draft", helper: "Structured draft for review." },
  { id: "report", label: "Healthcare report", helper: "Support summary and next actions." },
  { id: "access", label: "Access model", helper: "Public, subscription, clinic, credits." },
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

export function HealthcareMedicalAiRuntimeClient() {
  const template = HEALTHCARE_MEDICAL_AI_DEEP_TEMPLATE;
  const nexusContract = HEALTHCARE_MEDICAL_AI_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [healthContext, setHealthContext] = useState("Prepare a clear doctor-visit summary for recurring headaches");
  const [userType, setUserType] = useState("Patient");
  const [durationSeverity, setDurationSeverity] = useState("Two weeks, moderate, comes and goes");
  const [historyMedication, setHistoryMedication] = useState("No known allergies, occasional pain relief medication");
  const [workflowGoal, setWorkflowGoal] = useState("Create intake summary and questions to ask a doctor");
  const [intakeStructured, setIntakeStructured] = useState(false);

  const contextSignals = useMemo(
    () => [healthContext, durationSeverity, historyMedication, workflowGoal].filter(Boolean),
    [healthContext, durationSeverity, historyMedication, workflowGoal],
  );

  function loadExample(type: "intake" | "wellness" | "clinic" | "education") {
    if (type === "intake") {
      setHealthContext("Prepare a clear doctor-visit summary for recurring headaches");
      setUserType("Patient");
      setDurationSeverity("Two weeks, moderate, comes and goes");
      setHistoryMedication("No known allergies, occasional pain relief medication");
      setWorkflowGoal("Create intake summary and questions to ask a doctor");
    }

    if (type === "wellness") {
      setHealthContext("Track sleep, stress, hydration, and energy for wellness improvement");
      setUserType("Wellness user");
      setDurationSeverity("Ongoing tracking, mild fatigue");
      setHistoryMedication("No medication listed");
      setWorkflowGoal("Create wellness log and follow-up questions");
    }

    if (type === "clinic") {
      setHealthContext("Create clinic intake workflow for new patient appointment");
      setUserType("Clinic admin");
      setDurationSeverity("Administrative intake, non-emergency");
      setHistoryMedication("Collect medication, allergies, history, and consent status");
      setWorkflowGoal("Prepare clinic workflow summary and handoff checklist");
    }

    if (type === "education") {
      setHealthContext("Explain general blood pressure basics for patient education");
      setUserType("Health educator");
      setDurationSeverity("Education only");
      setHistoryMedication("No patient-specific medication context");
      setWorkflowGoal("Generate general education summary with clinician-review note");
    }

    setIntakeStructured(false);
    setMode("intake");
  }

  function structureIntake() {
    setIntakeStructured(true);
    setMode("safety");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator healthcare support blueprint";
    if (mode === "intake") return "Patient intake structure";
    if (mode === "safety") return "Safety flag screening";
    if (mode === "education") return "Health education support";
    if (mode === "clinic") return "Clinic workflow support";
    if (mode === "note") return "Medical note draft";
    if (mode === "report") return "Healthcare support report";
    if (mode === "access") return "Access and monetization model";
    return "Healthcare support workflow";
  }

  function activeWorkflowOutput() {
    if (!intakeStructured && ["safety", "education", "clinic", "note", "report"].includes(mode)) {
      return "Structure the intake first. The runtime needs health context, user type, duration/severity, history/medication, and workflow goal before deeper healthcare support outputs can be generated.";
    }

    if (mode === "overview") return "This project is a healthcare support platform for education, intake, wellness, clinic workflow, note preparation, and care-navigation support. It is not autonomous diagnosis.";
    if (mode === "creator") return "The creator configures healthcare use case, audience type, safety posture, and access model. This turns Prime into a healthcare-support launcher.";
    if (mode === "intake") return intakeStructured ? `Intake structured for ${userType}: ${healthContext}.` : "Fill the healthcare input and click Structure Intake.";
    if (mode === "safety") return "Safety screen should check emergency red flags, high-risk symptoms, missing context, and human-review routing. It must not diagnose.";
    if (mode === "education") return "Education output should explain general health concepts, uncertainty, and clinician-review needs without treatment instruction.";
    if (mode === "clinic") return "Clinic workflow should create intake summary, handoff checklist, missing fields, and administrative support notes.";
    if (mode === "note") return "Medical note draft should be clearly marked draft-only and for qualified professional review.";
    if (mode === "report") return "Healthcare report should include intake summary, safety flags, education notes, care-navigation plan, limitations, and next actions.";
    if (mode === "access") return "The creator can choose public health education, subscription wellness workspace, clinic workspace, usage-credit support, RIO/RUSD/USDT/USDC payment, and card rails later.";
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · Healthcare & Medical AI</div>
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

        <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/[0.07] p-4 text-sm leading-7 text-red-100/85">
          Safety: this module is for education, intake, documentation, workflow support, and care-navigation. It must not replace doctors, emergency care, diagnosis, prescription, or treatment decisions.
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">RioMind Nexus-ready contract</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future healthcare support intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This Healthcare & Medical AI niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will structure intake, screen safety flags, generate education, support clinic workflow,
              prepare note drafts, and route high-risk cases to human review.
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
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this healthcare support platform</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Healthcare input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the health context</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The user defines context, user type, duration/severity, history/medication, and workflow goal.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("intake")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load intake example</button>
            <button type="button" onClick={() => loadExample("wellness")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load wellness example</button>
            <button type="button" onClick={() => loadExample("clinic")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load clinic workflow</button>
            <button type="button" onClick={() => loadExample("education")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load education example</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Health context</span><textarea value={healthContext} onChange={(event) => setHealthContext(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">User type</span><input value={userType} onChange={(event) => setUserType(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Duration and severity</span><textarea value={durationSeverity} onChange={(event) => setDurationSeverity(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">History or medications</span><textarea value={historyMedication} onChange={(event) => setHistoryMedication(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Workflow goal</span><textarea value={workflowGoal} onChange={(event) => setWorkflowGoal(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={structureIntake} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Structure Intake</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus healthcare support panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Intake</div><div className="mt-1 text-lg font-semibold text-white">{intakeStructured ? "Structured" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Context signals</div><div className="mt-1 text-lg font-semibold text-cyan-100">{intakeStructured ? contextSignals.length : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{intakeStructured ? "Screen safety flags, then prepare report." : "Fill healthcare profile and structure intake."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Healthcare Hook</div><h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3></div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "intake" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Intake" title={intakeStructured ? "Intake structured" : "Awaiting intake"} body={intakeStructured ? `${userType}: ${healthContext}. Goal: ${workflowGoal}.` : "Fill healthcare input and click Structure Intake."} /><SectionCard eyebrow="Safety posture" title="Support, not diagnosis" body="This module organizes information and routes review; it must not diagnose or prescribe." /><SectionCard eyebrow="Recommended next step" title={intakeStructured ? "Screen safety flags" : "Structure intake first"} body={intakeStructured ? "Screen safety flags, then prepare report." : "Fill context, user type, severity, history, and goal."} /></div> : null}
        {mode === "safety" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Safety" title="Red flag screening" body="Check emergency symptoms, high-risk context, severe/rapid changes, and missing critical details." /><SectionCard eyebrow="Routing" title="Human review" body="Clinical and high-risk outputs must route to qualified professional review." /><SectionCard eyebrow="Emergency" title="Urgent care warning" body="The system should direct emergency cases to urgent/emergency care, not continue ordinary workflow." /></div> : null}
        {mode === "education" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Education" title="General explanation" body={healthContext} /><SectionCard eyebrow="Limits" title="No diagnosis" body="Educational content should be general and include uncertainty and review notes." /><SectionCard eyebrow="Questions" title="Ask a clinician" body="Generate useful questions for a qualified professional." /></div> : null}
        {mode === "clinic" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Clinic intake" title="Workflow summary" body="Prepare intake summary, missing fields, patient instructions, and handoff checklist." /><SectionCard eyebrow="Admin" title="Operational support" body="Support scheduling, triage documentation, and preparation without clinical decision replacement." /><SectionCard eyebrow="Review" title="Qualified approval" body="Clinic-facing drafts need professional review before use." /></div> : null}
        {mode === "note" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Draft note" title="Review required" body="Generate structured note draft only. It must be reviewed by qualified medical staff." /><SectionCard eyebrow="Missing context" title="Clarify before use" body={historyMedication} /><SectionCard eyebrow="Limit" title="Not clinical decision" body="The draft is documentation support, not a clinical conclusion." /></div> : null}
        {mode === "report" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Healthcare report module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Medical safety layer" body={proof} />)}</div> : null}
      </section>
    </section>
  );
}
