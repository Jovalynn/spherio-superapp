"use client";

import { useMemo, useState } from "react";
import { ENTERPRISE_AI_AUTOMATION_DEEP_TEMPLATE } from "@/lib/prime-ai/enterprise-ai-automation-deep-template";
import { ENTERPRISE_AI_AUTOMATION_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/enterprise-ai-automation-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "process"
  | "automation"
  | "sop"
  | "documents"
  | "risk"
  | "report"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this platform is", helper: "Understand enterprise automation." },
  { id: "creator", label: "Creator setup", helper: "What the enterprise creator configures." },
  { id: "process", label: "Map process", helper: "Steps, owners, inputs, bottlenecks." },
  { id: "automation", label: "Design automation", helper: "Routing, triggers, approvals, escalation." },
  { id: "sop", label: "Generate SOP", helper: "Procedures, checklists, handoffs." },
  { id: "documents", label: "Route documents", helper: "Classify, extract, approve, flag gaps." },
  { id: "risk", label: "Risk/compliance", helper: "Sensitive data, policy gaps, audit." },
  { id: "report", label: "Enterprise report", helper: "Blueprint, SOPs, risk, deployment." },
  { id: "access", label: "Access model", helper: "Subscription, credits, team workspace." },
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

export function EnterpriseAiAutomationRuntimeClient() {
  const template = ENTERPRISE_AI_AUTOMATION_DEEP_TEMPLATE;
  const nexusContract = ENTERPRISE_AI_AUTOMATION_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [businessProcess, setBusinessProcess] = useState("Automate customer support ticket routing and escalation");
  const [department, setDepartment] = useState("Customer support");
  const [documentsInputs, setDocumentsInputs] = useState("Support tickets, customer profile, product policy, refund rules");
  const [approvalRules, setApprovalRules] = useState("Human review for refunds, escalation for legal threats, manager approval for VIP complaints");
  const [automationGoal, setAutomationGoal] = useState("Reduce response time, route tickets correctly, and create audit trail");
  const [processMapped, setProcessMapped] = useState(false);

  const inputSignals = useMemo(
    () => documentsInputs.split(",").map((item) => item.trim()).filter(Boolean),
    [documentsInputs],
  );

  function loadExample(type: "support" | "invoice" | "onboarding" | "compliance") {
    if (type === "support") {
      setBusinessProcess("Automate customer support ticket routing and escalation");
      setDepartment("Customer support");
      setDocumentsInputs("Support tickets, customer profile, product policy, refund rules");
      setApprovalRules("Human review for refunds, escalation for legal threats, manager approval for VIP complaints");
      setAutomationGoal("Reduce response time, route tickets correctly, and create audit trail");
    }

    if (type === "invoice") {
      setBusinessProcess("Automate invoice approval workflow");
      setDepartment("Finance operations");
      setDocumentsInputs("Invoices, purchase orders, receipts, vendor profile, payment terms");
      setApprovalRules("Manager approval above $5000, finance review for mismatch, audit log required");
      setAutomationGoal("Reduce invoice delays and prevent unauthorized payments");
    }

    if (type === "onboarding") {
      setBusinessProcess("Automate employee onboarding");
      setDepartment("HR");
      setDocumentsInputs("Offer letter, employee profile, policy documents, equipment checklist");
      setApprovalRules("HR approval, IT equipment confirmation, manager onboarding checklist");
      setAutomationGoal("Create consistent onboarding, reduce manual follow-up, track completion");
    }

    if (type === "compliance") {
      setBusinessProcess("Automate contract compliance review intake");
      setDepartment("Legal operations");
      setDocumentsInputs("Contracts, vendor forms, risk questionnaire, policy checklist");
      setApprovalRules("Legal review for clause changes, compliance review for regulated vendors");
      setAutomationGoal("Route contracts correctly and flag missing compliance information");
    }

    setProcessMapped(false);
    setMode("process");
  }

  function mapProcess() {
    setProcessMapped(true);
    setMode("automation");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator enterprise automation blueprint";
    if (mode === "process") return "Business process map";
    if (mode === "automation") return "Automation design";
    if (mode === "sop") return "SOP generation";
    if (mode === "documents") return "Document routing";
    if (mode === "risk") return "Risk and compliance review";
    if (mode === "report") return "Enterprise automation report";
    if (mode === "access") return "Access and monetization model";
    return "Enterprise automation workflow";
  }

  function activeWorkflowOutput() {
    if (!processMapped && ["automation", "sop", "documents", "risk", "report"].includes(mode)) {
      return "Map the business process first. The runtime needs process, department, inputs, approval rules, and automation goal before deeper enterprise outputs can be generated.";
    }

    if (mode === "overview") return "This project is a creator-owned enterprise automation platform for workflows, SOPs, document routing, approvals, support automation, compliance, and operations intelligence.";
    if (mode === "creator") return "The creator configures business segment, automation workflow, operational depth, and access model. This turns Prime into an enterprise automation launcher.";
    if (mode === "process") return processMapped ? `Process map ready for ${department}: ${businessProcess}.` : "Fill the enterprise input and click Map Business Process.";
    if (mode === "automation") return `Automation design should route ${inputSignals.length} input type(s), apply approval rules, assign owners, and define escalation logic.`;
    if (mode === "sop") return "SOP package should include steps, role instructions, checklist, exception handling, escalation, and handoff rules.";
    if (mode === "documents") return `Document routing should classify: ${documentsInputs}, extract required fields, and flag missing information.`;
    if (mode === "risk") return `Risk review should inspect approval logic: ${approvalRules}.`;
    if (mode === "report") return "Enterprise report should include process map, automation flow, SOP package, document routing, risk review, dashboard plan, and next actions.";
    if (mode === "access") return "The creator can choose public assistant, subscription workspace, usage-credit automation, RIO/RUSD/USDT/USDC payment, card rails later, and enterprise team workspace.";
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · Enterprise AI Automation</div>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight md:text-5xl">{template.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-white/62">{template.publicPositioning}</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-300/15 bg-amber-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/75">Creator promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.creatorPromise}</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">Business promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.userPromise}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">RioMind Nexus-ready contract</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future enterprise automation intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This Enterprise AI Automation niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will map workflows, design automation, generate SOPs, route documents, review risk,
              and produce enterprise intelligence reports.
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
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this enterprise automation platform</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Enterprise input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the business process</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The user defines process, department, documents, approval rules, and automation goal.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("support")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load support workflow</button>
            <button type="button" onClick={() => loadExample("invoice")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load invoice workflow</button>
            <button type="button" onClick={() => loadExample("onboarding")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load onboarding</button>
            <button type="button" onClick={() => loadExample("compliance")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load compliance review</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Business process</span><textarea value={businessProcess} onChange={(event) => setBusinessProcess(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Department or team</span><input value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Documents or inputs</span><textarea value={documentsInputs} onChange={(event) => setDocumentsInputs(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Approval rules</span><textarea value={approvalRules} onChange={(event) => setApprovalRules(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Automation goal</span><textarea value={automationGoal} onChange={(event) => setAutomationGoal(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={mapProcess} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Map Business Process</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus enterprise intelligence panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Process</div><div className="mt-1 text-lg font-semibold text-white">{processMapped ? "Mapped" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Inputs</div><div className="mt-1 text-lg font-semibold text-cyan-100">{processMapped ? inputSignals.length : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{processMapped ? "Design automation, then generate SOP." : "Fill enterprise profile and map process."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Enterprise Hook</div><h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3></div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "process" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Process map" title={processMapped ? "Process mapped" : "Awaiting process map"} body={processMapped ? `${department}: ${businessProcess}. Goal: ${automationGoal}.` : "Fill enterprise input and click Map Business Process."} /><SectionCard eyebrow="Enterprise posture" title="Map before automating" body="The runtime should identify steps, owners, dependencies, and risks before automation." /><SectionCard eyebrow="Recommended next step" title={processMapped ? "Design automation" : "Map process first"} body={processMapped ? "Design automation, then generate SOP." : "Fill process, team, inputs, approval rules, and goal."} /></div> : null}
        {mode === "automation" ? <div className="grid gap-4 md:grid-cols-3">{inputSignals.map((input) => <SectionCard key={input} eyebrow="Automation input" title={input} body="Nexus later should classify, route, assign owner, apply approval rules, and log actions for this input." />)}</div> : null}
        {mode === "sop" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Procedure" title="Standard operating process" body="Generate steps, responsible roles, required fields, timing, escalation, and handoff rules." /><SectionCard eyebrow="Checklist" title="Operational checklist" body="Create repeatable checklist for team execution and quality control." /><SectionCard eyebrow="Exception handling" title="When automation stops" body="Define when human review, manager approval, or compliance review is required." /></div> : null}
        {mode === "documents" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Documents" title="Input routing" body={documentsInputs} /><SectionCard eyebrow="Extraction" title="Required fields" body="Extract identifiers, values, dates, owners, policy references, and missing information." /><SectionCard eyebrow="Approval" title="Routing path" body="Route documents to the right team, reviewer, or approval chain." /></div> : null}
        {mode === "risk" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Approval rules" title="Governance check" body={approvalRules} /><SectionCard eyebrow="Sensitive data" title="Data handling" body="Flag personal data, financial data, health data, legal documents, and restricted records." /><SectionCard eyebrow="Audit" title="Traceability" body="Automation should leave reviewable logs for decisions, approvals, and exceptions." /></div> : null}
        {mode === "report" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Enterprise report module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Enterprise safety layer" body={proof} />)}</div> : null}
      </section>
    </section>
  );
}
