"use client";

import { useMemo, useState } from "react";
import { STUDENT_AI_DEEP_TEMPLATE } from "@/lib/prime-ai/student-ai-deep-template";
import { STUDENT_AI_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/student-ai-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "diagnosis"
  | "gaps"
  | "mastery"
  | "exam"
  | "correction"
  | "report"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  {
    id: "overview",
    label: "What this project is",
    helper: "Understand the Student AI Prime project.",
  },
  {
    id: "creator",
    label: "Creator setup",
    helper: "What the project creator configures.",
  },
  {
    id: "diagnosis",
    label: "Start diagnosis",
    helper: "Enter student context and run diagnosis.",
  },
  {
    id: "gaps",
    label: "Find weak areas",
    helper: "Show missing foundations and blockers.",
  },
  {
    id: "mastery",
    label: "Build study path",
    helper: "Create staged mastery map.",
  },
  {
    id: "exam",
    label: "Practice exam",
    helper: "Simulate exam and classify mistakes.",
  },
  {
    id: "correction",
    label: "Fix mistakes",
    helper: "Generate targeted correction drills.",
  },
  {
    id: "report",
    label: "View progress report",
    helper: "Show learner, teacher, and institution summary.",
  },
  {
    id: "access",
    label: "Access model",
    helper: "Public, subscription, token-gated, or institution.",
  },
];

function panelClass(active: boolean) {
  return active
    ? "border-cyan-300/40 bg-cyan-500/16 text-cyan-100 shadow-[0_0_34px_-18px_rgba(34,211,238,0.95)]"
    : "border-white/10 bg-white/[0.045] text-white/62 hover:bg-white/[0.075]";
}

function SectionCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/24 p-5">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/70">
        {eyebrow}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-white/58">{body}</p>
    </div>
  );
}

function StepRow({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm md:grid-cols-[0.18fr_0.35fr_1fr]">
      <span className="font-black text-cyan-200">{step}</span>
      <span className="font-semibold text-white">{title}</span>
      <span className="text-white/60">{body}</span>
    </div>
  );
}

export function StudentDeepLearningRuntimeClient() {
  const template = STUDENT_AI_DEEP_TEMPLATE;
  const nexusContract = STUDENT_AI_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [subject, setSubject] = useState("Chemistry");
  const [level, setLevel] = useState("University Year 1");
  const [target, setTarget] = useState("Prepare for organic chemistry exam");
  const [weakAreas, setWeakAreas] = useState("reaction mechanisms, stereochemistry, naming compounds");
  const [diagnosisRan, setDiagnosisRan] = useState(false);

  const weakAreaList = useMemo(
    () =>
      weakAreas
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [weakAreas],
  );

  const masteryScore = diagnosisRan ? 68 : 0;
  const nextAction = diagnosisRan ? "Open Find weak areas, then Build study path." : "Fill the profile and click Run Learning Diagnosis.";

  function runDiagnosis() {
    setDiagnosisRan(true);
    setMode("gaps");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator setup blueprint";
    if (mode === "diagnosis") return "Learning diagnosis";
    if (mode === "gaps") return "Knowledge gap analysis";
    if (mode === "mastery") return "Subject mastery path";
    if (mode === "exam") return "Exam simulation";
    if (mode === "correction") return "Weak-area correction";
    if (mode === "report") return "Progress intelligence report";
    if (mode === "access") return "Access and monetization model";
    return "Student AI workflow";
  }

  function activeWorkflowOutput() {
    if (!diagnosisRan && ["gaps", "mastery", "exam", "correction", "report"].includes(mode)) {
      return "Run Learning Diagnosis first. The system needs the student's subject, level, target, and weak areas before deeper outputs can be generated.";
    }

    if (mode === "overview") {
      return "This project is a creator-owned Student AI platform. The creator launches the education product, while students use the app to diagnose weaknesses, study, practice, correct mistakes, and track progress.";
    }

    if (mode === "creator") {
      return "The creator configures education market, subject focus, learning purpose, and access model. This turns Prime from token creation into a usable education project launcher.";
    }

    if (mode === "diagnosis") {
      return diagnosisRan
        ? `Diagnosis complete for ${subject} at ${level}. Target: ${target}. The system detected ${weakAreaList.length} weak-area signal(s): ${weakAreaList.join(", ")}.`
        : "Fill the student profile and click Run Learning Diagnosis. The app will then move into weak-area and mastery-path analysis.";
    }

    if (mode === "gaps") {
      return `RioMind Nexus should inspect the student's weak areas — ${weakAreaList.join(", ")} — and identify missing foundations before teaching advanced material.`;
    }

    if (mode === "mastery") {
      return `The mastery path should move the learner from foundations to core understanding, application, advanced reasoning, and proof-ready exam confidence in ${subject}.`;
    }

    if (mode === "exam") {
      return "The exam simulator should generate timed questions from the weak areas, classify mistake types, then create adaptive retests until the learner improves.";
    }

    if (mode === "correction") {
      return "The correction engine should explain simply, show worked examples, ask the student to retry, classify the mistake, then increase difficulty gradually.";
    }

    if (mode === "report") {
      return `Progress report: ${masteryScore || 0}% estimated mastery. The report should show strengths, weak areas, exam readiness, next action, and teacher/parent/institution brief.`;
    }

    if (mode === "access") {
      return "The creator can choose public access, subscription, token-gated access, RIO/RUSD/USDT/USDC payment, card rails later, or institution access.";
    }

    return "Select a workflow to generate output.";
  }

  function loadExample(type: "waec" | "coding" | "nursing" | "chemistry") {
    if (type === "waec") {
      setSubject("Mathematics");
      setLevel("Secondary School / WAEC");
      setTarget("Prepare for WAEC final exam");
      setWeakAreas("algebra, word problems, simultaneous equations");
    }

    if (type === "coding") {
      setSubject("Programming");
      setLevel("Beginner developer");
      setTarget("Prepare for JavaScript coding interview");
      setWeakAreas("functions, async programming, debugging errors");
    }

    if (type === "nursing") {
      setSubject("Nursing");
      setLevel("Professional certification");
      setTarget("Prepare for nursing board exam");
      setWeakAreas("pharmacology, patient assessment, clinical reasoning");
    }

    if (type === "chemistry") {
      setSubject("Chemistry");
      setLevel("University Year 1");
      setTarget("Prepare for organic chemistry exam");
      setWeakAreas("reaction mechanisms, stereochemistry, naming compounds");
    }

    setDiagnosisRan(false);
    setMode("diagnosis");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
          Prime AI Niche Template · Student AI
        </div>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight md:text-5xl">
          {template.title}
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-white/62">
          {template.publicPositioning}
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-300/15 bg-amber-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/75">
              Creator promise
            </div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.creatorPromise}</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">
              Student promise
            </div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.userPromise}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">
              RioMind Nexus-ready contract
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Ready for future Nexus intelligence connection
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This Student AI niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              When RioMind Nexus is built, this contract tells Nexus what inputs to collect, what workflows
              to run, what outputs to return, what verification rules to respect, and what access models to support.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-300/18 bg-black/25 px-4 py-3 text-xs font-bold text-violet-100">
            {nexusContract.status.replaceAll("_", " ")}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4">
            <div className="text-xs text-white/35">Input fields</div>
            <div className="mt-1 text-2xl font-semibold text-cyan-100">{nexusContract.inputSchema.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4">
            <div className="text-xs text-white/35">Workflows</div>
            <div className="mt-1 text-2xl font-semibold text-amber-100">{nexusContract.workflowActions.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4">
            <div className="text-xs text-white/35">Outputs</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-100">{nexusContract.expectedOutputs.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4">
            <div className="text-xs text-white/35">Verification rules</div>
            <div className="mt-1 text-2xl font-semibold text-violet-100">{nexusContract.verificationLayer.length}</div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/22 p-4">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-200/70">
            Nexus role
          </div>
          <p className="mt-2 text-sm leading-7 text-white/62">{nexusContract.rioMindNexusRole}</p>
        </div>
      </section>

      <section className="rounded-[34px] border border-white/10 bg-black/20 p-5">
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">
          How to use this app
        </div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => (
            <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Student profile input
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the learner problem</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">
            This is the student-facing part. A learner tells the app what they study, their level,
            their goal, and what they find difficult.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("waec")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">
              Load WAEC example
            </button>
            <button type="button" onClick={() => loadExample("chemistry")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">
              Load chemistry example
            </button>
            <button type="button" onClick={() => loadExample("coding")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">
              Load coding example
            </button>
            <button type="button" onClick={() => loadExample("nursing")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">
              Load nursing example
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Subject</span>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Level</span>
              <input value={level} onChange={(event) => setLevel(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Learning or exam target</span>
              <input value={target} onChange={(event) => setTarget(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Weak areas</span>
              <textarea value={weakAreas} onChange={(event) => setWeakAreas(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" />
            </label>

            <button type="button" onClick={runDiagnosis} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">
              Run Learning Diagnosis
            </button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">
            Runtime actions
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">
            Click a workflow below. The selected workflow produces a generated output in the
            RioMind Nexus intelligence panel. This is the pattern for all 23 Prime AI niches:
            intake problem, analyze deeply, generate useful output, verify, and guide next action.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs text-white/35">Diagnosis</div>
              <div className="mt-1 text-lg font-semibold text-white">{diagnosisRan ? "Complete" : "Pending"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs text-white/35">Mastery</div>
              <div className="mt-1 text-lg font-semibold text-cyan-100">{diagnosisRan ? `${masteryScore}%` : "--"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs text-white/35">Next action</div>
              <div className="mt-1 text-sm font-semibold text-amber-100">{nextAction}</div>
            </div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">
                  RioMind Nexus Intelligence Hook
                </div>
                <h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3>
              </div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">
                Nexus-ready
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">
              {activeWorkflowOutput()}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {template.audiences.map((audience) => (
              <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />
            ))}
          </div>
        ) : null}

        {mode === "creator" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {template.creatorSetup.map((setup) => (
              <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div>
                <div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {setup.options.map((option) => (
                    <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {mode === "diagnosis" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <SectionCard eyebrow="Diagnosis" title={diagnosisRan ? "Learning profile generated" : "Awaiting diagnosis"} body={diagnosisRan ? `${subject} learner at ${level}. Goal: ${target}. System detected ${weakAreaList.length} weak-area signals.` : "Fill the student profile and click Run Learning Diagnosis."} />
            <SectionCard eyebrow="Reasoning posture" title="Diagnose before answering" body="The system should find why the student is failing before producing explanations or answers." />
            <SectionCard eyebrow="Recommended next step" title={diagnosisRan ? "Open Find weak areas" : "Run diagnosis first"} body={nextAction} />
          </div>
        ) : null}

        {mode === "gaps" ? (
          <div className="grid gap-4 md:grid-cols-3">
            {weakAreaList.map((area) => (
              <SectionCard key={area} eyebrow="Knowledge gap" title={area} body={`Likely blocker in ${subject}. The app should test prerequisites, repair foundations, then continue to advanced study.`} />
            ))}
          </div>
        ) : null}

        {mode === "mastery" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {template.deepModules.slice(0, 8).map((module) => (
              <div key={module.title} className="rounded-3xl border border-white/10 bg-black/24 p-5">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/70">{module.title}</div>
                <p className="mt-2 text-sm leading-7 text-white/58">{module.purpose}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {module.outputs.map((output) => (
                    <span key={output} className="rounded-full border border-cyan-300/12 bg-cyan-500/[0.065] px-3 py-1 text-xs text-cyan-100/76">
                      {output}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {mode === "exam" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <SectionCard eyebrow="Exam simulator" title="Timed practice" body="Generate questions from weak areas, add time pressure, then classify the type of mistake." />
            <SectionCard eyebrow="Mistake classifier" title="Know why the answer failed" body="Separate concept error, formula error, reading error, careless mistake, and exam pressure." />
            <SectionCard eyebrow="Adaptive retest" title="Practice again differently" body="After correction, retest the same concept with a different question style." />
          </div>
        ) : null}

        {mode === "correction" ? (
          <div className="grid gap-4 md:grid-cols-3">
            {weakAreaList.map((area) => (
              <SectionCard key={area} eyebrow="Correction drill" title={`Fix ${area}`} body="Explain simply, show a worked example, ask the learner to solve, classify the mistake, then retry harder." />
            ))}
          </div>
        ) : null}

        {mode === "report" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard eyebrow="Progress intelligence" title={`${masteryScore || 0}% mastery estimate`} body="Summarize completed topics, weak concepts, exam readiness, confidence, and suggested next action." />
            <SectionCard eyebrow="Teacher / parent brief" title="Human-readable summary" body="Explain what improved, what is still weak, and what the learner should do next." />
            <SectionCard eyebrow="Certification readiness" title="Proof requires verification" body="Certificates should depend on assessment history, completion records, and human or institutional review." />
            <SectionCard eyebrow="RioMind Nexus" title="Deep education analyst" body={template.rioMindNexusRole.join(" ")} />
          </div>
        ) : null}

        {mode === "access" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {template.accessModels.map((access) => (
              <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />
            ))}
            {template.proofAndVerification.map((proof) => (
              <SectionCard key={proof} eyebrow="Verification rule" title="Trust and proof layer" body={proof} />
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
