import type { DeepNicheTemplate } from "./deep-niche-template";

export const LEGAL_AI_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "legal_ai",
  title: "Legal AI Intelligence Platform",
  publicPositioning: "A creator-owned legal support platform for legal education, document review, contract analysis, compliance workflows, case organization, policy drafting, legal intake, and lawyer-review preparation.",
  creatorPromise: "Prime lets a creator launch a legal support assistant, contract review workspace, compliance hub, policy drafting tool, or case-preparation platform.",
  userPromise: "Users can organize legal questions, review documents, prepare contract notes, draft policies, structure case facts, generate compliance checklists, and prepare lawyer-review packages.",
  audiences: [
    { title: "Individuals", description: "Organize legal questions, documents, timelines, and lawyer-prep notes." },
    { title: "Small businesses", description: "Prepare contracts, policies, compliance checklists, and operational legal workflows." },
    { title: "Legal teams", description: "Draft summaries, intake notes, case organization, research prompts, and document review checklists." },
    { title: "Compliance teams", description: "Map obligations, policies, risks, controls, audit notes, and review workflows." }
  ],
  creatorSetup: [
    { title: "Legal focus", description: "Choose the legal-support category.", options: ["Contract review", "Policy drafting", "Compliance", "Case intake", "Legal education", "Document summary"] },
    { title: "Workflow type", description: "Choose the main workflow.", options: ["Review document", "Draft checklist", "Prepare lawyer brief", "Map obligations", "Summarize facts", "Risk notes"] },
    { title: "User level", description: "Choose user level.", options: ["Individual", "Small business", "Legal ops", "Compliance team", "Law firm support"] },
    { title: "Access", description: "Choose monetization.", options: ["Free", "Subscription", "Usage credits", "RIO/RUSD", "USDT/USDC"] }
  ],
  userWorkflow: [
    { step: "01", title: "Enter legal context", description: "User describes legal question, document, contract, policy, compliance issue, or case facts." },
    { step: "02", title: "Structure facts and documents", description: "Runtime organizes parties, dates, obligations, clauses, claims, risks, and missing information." },
    { step: "03", title: "Analyze legal-support posture", description: "App reviews document issues, contract clauses, compliance gaps, policy needs, and review boundaries." },
    { step: "04", title: "Generate lawyer-review package", description: "System creates summary, questions, issue list, clause notes, compliance checklist, and review points." },
    { step: "05", title: "Flag risk and limits", description: "Runtime marks jurisdiction needs, legal uncertainty, missing facts, and qualified-lawyer review requirements." },
    { step: "06", title: "Generate legal support report", description: "App outputs organized facts, document notes, risks, assumptions, review points, and next actions." }
  ],
  deepModules: [
    { title: "Legal Intake Structurer", purpose: "Organize parties, facts, dates, documents, claims, obligations, and missing information.", outputs: ["intake_summary", "fact_timeline", "missing_info"] },
    { title: "Contract Review Assistant", purpose: "Review clauses, obligations, renewal terms, termination, liability, payment, and risk areas.", outputs: ["contract_notes", "clause_flags", "question_list"] },
    { title: "Compliance Checklist Builder", purpose: "Map obligations, policies, controls, audit points, records, and responsible owners.", outputs: ["compliance_checklist", "control_map", "audit_notes"] },
    { title: "Policy Drafting Assistant", purpose: "Create draft policies, terms, procedures, disclaimers, and internal governance notes.", outputs: ["policy_draft", "procedure_notes", "review_flags"] },
    { title: "Case Organization Planner", purpose: "Structure issues, facts, evidence, timelines, witnesses, documents, and lawyer-prep questions.", outputs: ["case_outline", "evidence_list", "lawyer_questions"] },
    { title: "Legal Risk Reviewer", purpose: "Flag jurisdiction issues, missing facts, high-risk claims, deadlines, and qualified-review needs.", outputs: ["risk_notes", "jurisdiction_flags", "review_required"] },
    { title: "Document Summary Engine", purpose: "Summarize legal documents, key clauses, obligations, dates, parties, and action items.", outputs: ["document_summary", "key_terms", "action_items"] },
    { title: "Legal Support Report", purpose: "Generate support report with facts, risks, assumptions, limitations, and next actions.", outputs: ["legal_report", "risk_flags", "next_actions"] }
  ],
  accessModels: [
    { title: "Public legal education assistant", description: "Anyone can generate general legal education, document summaries, and lawyer-prep notes." },
    { title: "Subscription legal workspace", description: "Users pay for saved matters, documents, compliance checklists, and reports." },
    { title: "Usage-credit legal support", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced document support." },
    { title: "Team/legal-ops workspace", description: "Teams manage documents, matters, compliance workflows, policies, and review packages." }
  ],
  rioMindNexusRole: [
    "Act as the legal support and document intelligence layer behind Legal AI.",
    "Structure legal intake, review documents, summarize contracts, map compliance, prepare policies, organize cases, and generate lawyer-review packages.",
    "Generate legal support reports with assumptions, limitations, jurisdiction flags, risk notes, and next actions."
  ],
  proofAndVerification: [
    "Legal AI must not provide autonomous legal advice or replace a qualified lawyer.",
    "Jurisdiction-specific issues require qualified legal review.",
    "The system must not guarantee legal outcomes, compliance, enforceability, or court results.",
    "Legal documents, facts, deadlines, and obligations require human verification before use."
  ]
};
