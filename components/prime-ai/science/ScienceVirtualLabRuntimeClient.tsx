"use client";

import { useMemo, useState } from "react";
import { SCIENCE_VIRTUAL_LAB_DEEP_TEMPLATE } from "@/lib/prime-ai/science-virtual-lab-deep-template";
import { SCIENCE_VIRTUAL_LAB_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/science-virtual-lab-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "experiment"
  | "variables"
  | "simulation"
  | "formula"
  | "interpretation"
  | "report"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this lab is", helper: "Understand the virtual lab project." },
  { id: "creator", label: "Creator setup", helper: "What the lab creator configures." },
  { id: "experiment", label: "Design experiment", helper: "Create objective, hypothesis, variables, and method." },
  { id: "variables", label: "Control variables", helper: "Separate independent, dependent, and controlled variables." },
  { id: "simulation", label: "Run simulation reasoning", helper: "Predict result logic and assumptions." },
  { id: "formula", label: "Solve formula", helper: "Select formula, substitute values, and check units." },
  { id: "interpretation", label: "Interpret result", helper: "Explain trend, anomaly, limitation, and conclusion." },
  { id: "report", label: "Generate lab report", helper: "Produce structured lab report." },
  { id: "access", label: "Access model", helper: "Public, subscription, token-gated, or institution." },
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

export function ScienceVirtualLabRuntimeClient() {
  const template = SCIENCE_VIRTUAL_LAB_DEEP_TEMPLATE;
  const nexusContract = SCIENCE_VIRTUAL_LAB_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [scienceTrack, setScienceTrack] = useState("Chemistry");
  const [objective, setObjective] = useState("Investigate how temperature affects reaction rate");
  const [hypothesis, setHypothesis] = useState("Increasing temperature will increase reaction rate");
  const [variables, setVariables] = useState("Independent: temperature; Dependent: reaction rate; Controlled: concentration, volume, catalyst");
  const [dataValues, setDataValues] = useState("Baseline rate = 1.0x; heated condition = 1.8x");
  const [experimentDesigned, setExperimentDesigned] = useState(false);

  const variableCount = useMemo(
    () => variables.split(";").map((item) => item.trim()).filter(Boolean).length,
    [variables],
  );

  function loadExample(type: "chemistry" | "physics" | "biology" | "engineering") {
    if (type === "chemistry") {
      setScienceTrack("Chemistry");
      setObjective("Investigate how temperature affects reaction rate");
      setHypothesis("Increasing temperature will increase reaction rate");
      setVariables("Independent: temperature; Dependent: reaction rate; Controlled: concentration, volume, catalyst");
      setDataValues("Baseline rate = 1.0x; heated condition = 1.8x");
    }

    if (type === "physics") {
      setScienceTrack("Physics");
      setObjective("Analyze projectile motion for a launched object");
      setHypothesis("Greater launch angle changes horizontal range and flight time");
      setVariables("Independent: launch angle; Dependent: range; Controlled: initial speed, gravity");
      setDataValues("Initial speed = 20 m/s; angle = 45 degrees; gravity = 9.8 m/s²");
    }

    if (type === "biology") {
      setScienceTrack("Biology");
      setObjective("Model how light intensity affects photosynthesis rate");
      setHypothesis("Higher light intensity increases photosynthesis until saturation");
      setVariables("Independent: light intensity; Dependent: oxygen production; Controlled: CO2, water, temperature");
      setDataValues("Low light = 2 units oxygen; high light = 6 units oxygen");
    }

    if (type === "engineering") {
      setScienceTrack("Engineering");
      setObjective("Calculate current in a simple electric circuit");
      setHypothesis("Current increases when resistance decreases at fixed voltage");
      setVariables("Independent: resistance; Dependent: current; Controlled: voltage");
      setDataValues("Voltage = 12V; Resistance = 4Ω");
    }

    setExperimentDesigned(false);
    setMode("experiment");
  }

  function designExperiment() {
    setExperimentDesigned(true);
    setMode("variables");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator lab blueprint";
    if (mode === "experiment") return "Experiment design";
    if (mode === "variables") return "Variable control";
    if (mode === "simulation") return "Simulation reasoning";
    if (mode === "formula") return "Formula assistant";
    if (mode === "interpretation") return "Result interpretation";
    if (mode === "report") return "Lab report generation";
    if (mode === "access") return "Access and monetization model";
    return "Science workflow";
  }

  function activeWorkflowOutput() {
    if (!experimentDesigned && ["variables", "simulation", "formula", "interpretation", "report"].includes(mode)) {
      return "Design the experiment first. The runtime needs the science track, objective, hypothesis, variables, and data before deeper lab outputs can be generated.";
    }

    if (mode === "overview") return "This project is a creator-owned virtual science lab. It gives learners guided scientific reasoning, experiment planning, formula support, simulations, interpretation, and reports.";
    if (mode === "creator") return "The creator configures science market, lab focus, learning purpose, and access model. This turns Prime into a science lab project launcher.";
    if (mode === "experiment") return experimentDesigned ? `Experiment designed for ${scienceTrack}: ${objective}. Hypothesis: ${hypothesis}.` : "Fill the lab profile and click Design Experiment.";
    if (mode === "variables") return `Variable control found ${variableCount} variable groups. Nexus should check whether the experiment has a clear independent variable, dependent variable, and controlled variables.`;
    if (mode === "simulation") return `Simulation reasoning should explain what is likely to happen in ${scienceTrack}, based on the objective: ${objective}.`;
    if (mode === "formula") return `Formula assistant should identify relevant formulas, substitute known values, check units, and explain the result from: ${dataValues}.`;
    if (mode === "interpretation") return "Result interpretation should explain trend, anomaly, uncertainty, limitation, and whether the hypothesis is supported.";
    if (mode === "report") return "Lab report should include objective, hypothesis, apparatus, variables, method, observations, result, conclusion, safety, and limitations.";
    if (mode === "access") return "The creator can choose public, subscription, token-gated, RIO/RUSD/USDT/USDC payment, card rails later, or institution access.";
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · Science & Virtual Lab</div>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight md:text-5xl">{template.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-white/62">{template.publicPositioning}</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-300/15 bg-amber-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/75">Creator promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.creatorPromise}</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">Learner promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.userPromise}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">RioMind Nexus-ready contract</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future scientific Nexus intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This Science & Virtual Lab niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will receive the lab inputs, run scientific reasoning, return experiment logic, formula help,
              simulation reasoning, interpretation, report output, and safety/limitation notes.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-300/18 bg-black/25 px-4 py-3 text-xs font-bold text-violet-100">
            {nexusContract.status.replaceAll("_", " ")}
          </div>
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
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this lab</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => (
            <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Virtual lab input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the experiment problem</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The learner defines what they want to test, calculate, simulate, or understand.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("chemistry")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load chemistry example</button>
            <button type="button" onClick={() => loadExample("physics")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load physics example</button>
            <button type="button" onClick={() => loadExample("biology")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load biology example</button>
            <button type="button" onClick={() => loadExample("engineering")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load engineering example</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Science track</span><input value={scienceTrack} onChange={(event) => setScienceTrack(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Objective</span><textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Hypothesis</span><textarea value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Variables</span><textarea value={variables} onChange={(event) => setVariables(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Data or values</span><textarea value={dataValues} onChange={(event) => setDataValues(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={designExperiment} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Design Experiment</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus scientific intelligence panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Experiment</div><div className="mt-1 text-lg font-semibold text-white">{experimentDesigned ? "Designed" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Variables</div><div className="mt-1 text-lg font-semibold text-cyan-100">{experimentDesigned ? variableCount : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{experimentDesigned ? "Control variables, then run simulation." : "Fill lab profile and design experiment."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Scientific Hook</div>
                <h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3>
              </div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "experiment" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Experiment" title={experimentDesigned ? "Experiment blueprint ready" : "Awaiting design"} body={experimentDesigned ? `${scienceTrack}: ${objective}. Hypothesis: ${hypothesis}.` : "Fill the virtual lab input and click Design Experiment."} /><SectionCard eyebrow="Scientific posture" title="Control before conclusion" body="The system should identify variables and assumptions before making a scientific claim." /><SectionCard eyebrow="Recommended next step" title={experimentDesigned ? "Open Control variables" : "Design experiment first"} body={experimentDesigned ? "Control variables, then run simulation reasoning." : "Fill objective, hypothesis, variables, and values."} /></div> : null}
        {mode === "variables" ? <div className="grid gap-4 md:grid-cols-3">{variables.split(";").map((item) => item.trim()).filter(Boolean).map((item) => <SectionCard key={item} eyebrow="Variable group" title={item.split(":")[0] || "Variable"} body={item.includes(":") ? item.split(":").slice(1).join(":") : item} />)}</div> : null}
        {mode === "simulation" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Simulation reasoning" title="Predicted behavior" body={`Based on ${scienceTrack}, Nexus should reason through the objective: ${objective}.`} /><SectionCard eyebrow="Assumptions" title="State what must be true" body="The output must show controlled variables, simplifications, and confidence limits." /><SectionCard eyebrow="Scientific explanation" title="Explain why" body="The learner should understand the principle, not only the result." /></div> : null}
        {mode === "formula" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Formula assistant" title="Select formula" body="Choose the correct formula for the science track and explain every variable." /><SectionCard eyebrow="Known values" title={dataValues || "No values entered"} body="Substitute values carefully, preserve units, and show calculation steps." /><SectionCard eyebrow="Unit check" title="Check physical meaning" body="The result should include units and explain whether the value makes sense." /></div> : null}
        {mode === "interpretation" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Trend" title="What changed?" body="Explain how the dependent variable changed when the independent variable changed." /><SectionCard eyebrow="Anomaly" title="What may be wrong?" body="Identify possible measurement error, uncontrolled variables, or weak assumptions." /><SectionCard eyebrow="Conclusion" title="Is the hypothesis supported?" body={`Hypothesis to assess: ${hypothesis}`} /></div> : null}
        {mode === "report" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Report module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Trust and proof layer" body={proof} />)}</div> : null}
      </section>
    </section>
  );
}
