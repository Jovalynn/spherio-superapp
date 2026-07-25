import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const LEGAL_AI_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "legal_ai",
  nicheTitle: "Legal AI Intelligence Platform",
  rioMindNexusRole: "RioMind Nexus will act as the legal support and document intelligence layer. It will structure intake, review documents, summarize contracts, map compliance, prepare policies, organize case facts, flag risks, and generate lawyer-review packages.",
  nexusHooks: ["legal_intake_structurer","contract_review_assistant","compliance_checklist_builder","policy_drafting_assistant","case_organization_planner","legal_risk_reviewer","document_summary_engine","legal_support_reporter"],
  inputSchema: [
    { key: "legal_context", label: "Legal context", type: "textarea", required: true, helper: "Question, document, contract, policy, compliance issue, or case facts.", examples: ["Review contract", "Prepare compliance checklist", "Organize case facts"] },
    { key: "jurisdiction", label: "Jurisdiction", type: "text", required: false, helper: "Country, state, region, or governing law if known.", examples: ["Nigeria", "UK", "Delaware", "Not sure"] },
    { key: "document_or_facts", label: "Document or facts", type: "textarea", required: true, helper: "Paste summary of document, facts, parties, dates, or obligations.", examples: ["Service contract with payment and termination terms"] },
    { key: "risk_concerns", label: "Risk concerns", type: "textarea", required: false, helper: "Specific clauses, deadlines, obligations, or concerns.", examples: ["Termination clause", "Late payment", "Liability cap"] },
    { key: "target_output", label: "Target output", type: "textarea", required: true, helper: "What should be generated.", examples: ["Lawyer brief", "Contract notes", "Compliance checklist", "Policy draft"] }
  ],
  workflowActions: [
    { id: "structure_legal_intake", label: "Structure Legal Intake", purpose: "Organize parties, facts, dates, documents, claims, obligations, and missing info." },
    { id: "review_contract_document", label: "Review Contract/Document", purpose: "Summarize clauses, obligations, risks, key dates, action items, and questions.", requiresDiagnosis: true },
    { id: "build_compliance_policy", label: "Build Compliance/Policy", purpose: "Create compliance checklist, control map, policy draft, and review flags.", requiresDiagnosis: true },
    { id: "organize_case_facts", label: "Organize Case Facts", purpose: "Structure issues, evidence, timelines, documents, and lawyer-prep questions.", requiresDiagnosis: true },
    { id: "flag_legal_risk", label: "Flag Legal Risk", purpose: "Identify jurisdiction issues, missing facts, deadlines, high-risk claims, and review needs.", requiresDiagnosis: true },
    { id: "generate_legal_report", label: "Generate Legal Report", purpose: "Produce legal-support package, limitations, assumptions, risks, and next actions.", requiresDiagnosis: true }
  ],
  expectedOutputs: [
    { key: "legal_intake_summary", label: "Legal Intake Summary", description: "Parties, facts, dates, documents, obligations, and missing information." },
    { key: "contract_document_notes", label: "Contract/Document Notes", description: "Clauses, obligations, key terms, risks, deadlines, and questions." },
    { key: "compliance_policy_package", label: "Compliance/Policy Package", description: "Checklist, control map, policy draft, procedure notes, and review flags." },
    { key: "case_organization", label: "Case Organization", description: "Issues, facts, evidence, timelines, documents, and lawyer-prep questions." },
    { key: "legal_risk_review", label: "Legal Risk Review", description: "Jurisdiction flags, missing facts, deadlines, high-risk claims, and review notes." },
    { key: "lawyer_review_package", label: "Lawyer Review Package", description: "Brief, questions, document summary, evidence list, and action items." },
    { key: "legal_support_report", label: "Legal Support Report", description: "Final support report with assumptions, limitations, risks, and next actions." }
  ],
  verificationLayer: [
    { title: "No autonomous legal advice", rule: "Legal AI must not provide autonomous legal advice or replace a qualified lawyer." },
    { title: "Jurisdiction review", rule: "Jurisdiction-specific issues require qualified legal review." },
    { title: "No outcome guarantee", rule: "The system must not guarantee legal outcomes, compliance, enforceability, or court results." },
    { title: "Human verification", rule: "Legal documents, facts, deadlines, and obligations require human verification before use." }
  ],
  accessModel: [
    { id: "public_legal_education", label: "Public legal education assistant", description: "General legal education, document summaries, and lawyer-prep notes." },
    { id: "subscription_legal_workspace", label: "Subscription legal workspace", description: "Saved matters, documents, compliance checklists, and reports." },
    { id: "usage_credit_legal_support", label: "Usage-credit legal support", description: "Advanced support using credits, RIO, RUSD, USDT, or USDC." },
    { id: "team_legal_ops_workspace", label: "Team/legal-ops workspace", description: "Documents, matters, compliance workflows, policies, and review packages." }
  ]
});
