"use client";

import { useMemo, useState } from "react";
import { DATA_MARKETPLACE_DEEP_TEMPLATE } from "@/lib/prime-ai/data-marketplace-deep-template";
import { DATA_MARKETPLACE_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/data-marketplace-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "profile"
  | "quality"
  | "provenance"
  | "license"
  | "suitability"
  | "report"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this marketplace is", helper: "Understand the data marketplace project." },
  { id: "creator", label: "Creator setup", helper: "What the data-marketplace creator configures." },
  { id: "profile", label: "Build data profile", helper: "Metadata, schema, source, coverage, format." },
  { id: "quality", label: "Analyze quality", helper: "Completeness, missing values, anomalies." },
  { id: "provenance", label: "Review provenance", helper: "Source, ownership, trust posture." },
  { id: "license", label: "Review license/privacy", helper: "Usage rights, privacy, compliance warnings." },
  { id: "suitability", label: "AI suitability", helper: "Training, fine-tuning, benchmarking fit." },
  { id: "report", label: "Data report", helper: "Buyer/seller report and risk summary." },
  { id: "access", label: "Access model", helper: "Public, subscription, credits, seller access." },
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

export function DataMarketplaceRuntimeClient() {
  const template = DATA_MARKETPLACE_DEEP_TEMPLATE;
  const nexusContract = DATA_MARKETPLACE_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [datasetGoal, setDatasetGoal] = useState("Sell anonymized customer support dataset for AI training");
  const [dataDomain, setDataDomain] = useState("Customer support / retail");
  const [dataStructure, setDataStructure] = useState("CSV, 50,000 rows, columns: ticket_id, category, message, response, resolution_status");
  const [intendedUse, setIntendedUse] = useState("AI training, chatbot evaluation, support automation benchmarking");
  const [licenseNotes, setLicenseNotes] = useState("Anonymized, commercial license, no resale without permission");
  const [profileBuilt, setProfileBuilt] = useState(false);

  const fields = useMemo(
    () => dataStructure.split(",").map((item) => item.trim()).filter(Boolean),
    [dataStructure],
  );

  function loadExample(type: "support" | "agriculture" | "finance" | "research") {
    if (type === "support") {
      setDatasetGoal("Sell anonymized customer support dataset for AI training");
      setDataDomain("Customer support / retail");
      setDataStructure("CSV, 50,000 rows, columns: ticket_id, category, message, response, resolution_status");
      setIntendedUse("AI training, chatbot evaluation, support automation benchmarking");
      setLicenseNotes("Anonymized, commercial license, no resale without permission");
    }

    if (type === "agriculture") {
      setDatasetGoal("Find agricultural crop-yield data for predictive analytics");
      setDataDomain("Agriculture");
      setDataStructure("CSV and geospatial data, region, rainfall, soil type, fertilizer, crop yield");
      setIntendedUse("Prediction model, agriculture analytics, policy research");
      setLicenseNotes("Research use, attribution required, no personal data");
    }

    if (type === "finance") {
      setDatasetGoal("Publish market data feed for analytics subscribers");
      setDataDomain("Financial market data");
      setDataStructure("API feed, asset price, volume, timestamp, market source, daily updates");
      setIntendedUse("Market intelligence, dashboards, trading research");
      setLicenseNotes("Subscription access, no redistribution, enterprise terms required");
    }

    if (type === "research") {
      setDatasetGoal("Share research survey dataset with institution access");
      setDataDomain("Education research");
      setDataStructure("Survey dataset, anonymized student responses, demographics removed, 10,000 records");
      setIntendedUse("Academic research, learning analytics, policy analysis");
      setLicenseNotes("Institution-only, ethics review required, anonymized");
    }

    setProfileBuilt(false);
    setMode("profile");
  }

  function buildProfile() {
    setProfileBuilt(true);
    setMode("quality");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator data marketplace blueprint";
    if (mode === "profile") return "Dataset profile";
    if (mode === "quality") return "Data quality analysis";
    if (mode === "provenance") return "Provenance review";
    if (mode === "license") return "License and privacy review";
    if (mode === "suitability") return "AI suitability analysis";
    if (mode === "report") return "Data product report";
    if (mode === "access") return "Access and monetization model";
    return "Data marketplace workflow";
  }

  function activeWorkflowOutput() {
    if (!profileBuilt && ["quality", "provenance", "license", "suitability", "report"].includes(mode)) {
      return "Build the dataset profile first. The runtime needs goal, domain, structure, intended use, and license/privacy notes before deeper outputs can be generated.";
    }

    if (mode === "overview") return "This project is a creator-owned data marketplace. It helps sellers list data and buyers evaluate quality, provenance, licensing, privacy, and AI suitability.";
    if (mode === "creator") return "The creator configures marketplace category, listing model, data access model, and monetization. This turns Prime into a data product launcher.";
    if (mode === "profile") return profileBuilt ? `Dataset profile ready for ${dataDomain}: ${datasetGoal}.` : "Fill the data profile and click Build Dataset Profile.";
    if (mode === "quality") return `Quality analysis should inspect ${fields.length} structure signal(s), missing values, duplicates, anomalies, and consistency.`;
    if (mode === "provenance") return "Provenance review should verify source, ownership posture, collection method, update history, and trust notes.";
    if (mode === "license") return `License/privacy review should inspect: ${licenseNotes}.`;
    if (mode === "suitability") return `AI suitability should evaluate whether this dataset fits: ${intendedUse}.`;
    if (mode === "report") return "Data report should include dataset profile, quality report, provenance, license/privacy review, AI suitability, risk flags, and next actions.";
    if (mode === "access") return "The creator can choose public directory, subscription, usage-credit access, RIO/RUSD/USDT/USDC payment, card rails later, and verified seller access.";
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · Data Marketplace</div>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight md:text-5xl">{template.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-white/62">{template.publicPositioning}</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-300/15 bg-amber-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/75">Creator promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.creatorPromise}</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">Data user promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.userPromise}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">RioMind Nexus-ready contract</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future data intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This Data Marketplace niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will profile datasets, assess quality, verify provenance posture, review privacy and licensing,
              evaluate AI-training suitability, and generate data product reports.
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
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this data marketplace</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Dataset input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the dataset goal</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The user defines the dataset, domain, structure, intended use, and licensing/privacy posture.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("support")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load support data</button>
            <button type="button" onClick={() => loadExample("agriculture")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load agriculture data</button>
            <button type="button" onClick={() => loadExample("finance")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load market feed</button>
            <button type="button" onClick={() => loadExample("research")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load research data</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Dataset goal</span><textarea value={datasetGoal} onChange={(event) => setDatasetGoal(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Data domain</span><input value={dataDomain} onChange={(event) => setDataDomain(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Data structure</span><textarea value={dataStructure} onChange={(event) => setDataStructure(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Intended use</span><textarea value={intendedUse} onChange={(event) => setIntendedUse(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">License or privacy notes</span><textarea value={licenseNotes} onChange={(event) => setLicenseNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={buildProfile} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Build Dataset Profile</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus data intelligence panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Profile</div><div className="mt-1 text-lg font-semibold text-white">{profileBuilt ? "Ready" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Structure signals</div><div className="mt-1 text-lg font-semibold text-cyan-100">{profileBuilt ? fields.length : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{profileBuilt ? "Analyze quality, then review license/privacy." : "Fill dataset profile and build profile."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Data Hook</div><h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3></div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "profile" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Dataset profile" title={profileBuilt ? "Profile ready" : "Awaiting profile"} body={profileBuilt ? `${dataDomain}: ${datasetGoal}.` : "Fill dataset input and click Build Dataset Profile."} /><SectionCard eyebrow="Data posture" title="Metadata before market" body="The runtime should define schema, source, coverage, and intended use before listing or selling data." /><SectionCard eyebrow="Recommended next step" title={profileBuilt ? "Analyze quality" : "Build profile first"} body={profileBuilt ? "Analyze quality, then review license/privacy." : "Fill goal, domain, structure, use, and license/privacy notes."} /></div> : null}
        {mode === "quality" ? <div className="grid gap-4 md:grid-cols-3">{fields.map((field) => <SectionCard key={field} eyebrow="Structure signal" title={field} body="Nexus later should inspect completeness, consistency, missing values, anomalies, and quality risk." />)}</div> : null}
        {mode === "provenance" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Source" title="Collection and ownership" body="Check source reliability, collection method, ownership posture, and update history." /><SectionCard eyebrow="Trust" title="Provenance posture" body="Strong marketplace trust requires seller verification, source evidence, and usage rights." /><SectionCard eyebrow="Risk" title="Unverified source warning" body="Unverified datasets should not be marketed as trusted or enterprise-grade." /></div> : null}
        {mode === "license" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="License" title="Usage rights" body={licenseNotes} /><SectionCard eyebrow="Privacy" title="Sensitive data check" body="Flag personal data, sensitive fields, consent issues, and regulated data risk." /><SectionCard eyebrow="Compliance" title="Human review" body="Restricted, sensitive, or regulated datasets require professional review before sale or distribution." /></div> : null}
        {mode === "suitability" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="AI training" title="Suitability check" body={`Evaluate usefulness for: ${intendedUse}.`} /><SectionCard eyebrow="Bias" title="Bias and coverage" body="Training data must disclose imbalance, underrepresented categories, missing context, and source limitations." /><SectionCard eyebrow="Benchmark" title="Evaluation value" body="Some datasets are better for testing, benchmarking, or analytics than training." /></div> : null}
        {mode === "report" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Data report module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Trust and proof layer" body={proof} />)}</div> : null}
      </section>
    </section>
  );
}
