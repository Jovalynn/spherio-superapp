import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const MEDICAL_AI_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "medical_ai",
  nicheTitle: "Clinical Documentation & Medical Research Support AI",
  rioMindNexusRole: "RioMind Nexus will act as the clinical documentation and medical research support intelligence layer. It will structure notes, prepare SOAP-style drafts, summarize literature, build evidence tables, plan research protocols, organize case summaries, review safety, and generate clinician-review packages.",
  nexusHooks: ["clinical_note_structurer","soap_draft_assistant","medical_literature_summarizer","evidence_table_builder","research_protocol_planner","case_summary_organizer","medical_safety_reviewer","medical_support_reporter"],
  inputSchema: [
    { key: "medical_context", label: "Medical context", type: "textarea", required: true, helper: "Clinical note, case, paper, research question, protocol idea, or documentation task.", examples: ["Prepare SOAP note draft", "Summarize papers", "Draft research protocol"] },
    { key: "workflow_type", label: "Workflow type", type: "text", required: true, helper: "Type of medical-support workflow.", examples: ["SOAP note", "Literature review", "Evidence table", "Protocol outline"] },
    { key: "clinical_or_research_details", label: "Clinical or research details", type: "textarea", required: true, helper: "Relevant case facts, study details, findings, methods, or source notes.", examples: ["Patient visit summary", "Paper methods and outcomes", "Case timeline"] },
    { key: "safety_or_source_concerns", label: "Safety or source concerns", type: "textarea", required: false, helper: "Uncertainty, missing context, emergency flags, source gaps, or review concerns.", examples: ["Missing labs", "No source links", "Needs clinician review"] },
    { key: "target_output", label: "Target output", type: "textarea", required: true, helper: "What should be generated.", examples: ["SOAP draft", "Evidence table", "Research protocol", "Clinician brief"] }
  ],
  workflowActions: [
    { id: "structure_medical_information", label: "Structure Medical Information", purpose: "Organize clinical/research details, timeline, evidence, missing context, and review needs." },
    { id: "prepare_clinical_documentation", label: "Prepare Clinical Documentation", purpose: "Create note structure, SOAP-style draft, review questions, and documentation flags.", requiresDiagnosis: true },
    { id: "summarize_literature_evidence", label: "Summarize Literature/Evidence", purpose: "Summarize papers, methods, outcomes, limitations, and evidence table.", requiresDiagnosis: true },
    { id: "plan_research_protocol", label: "Plan Research Protocol", purpose: "Draft objectives, methods, endpoints, inclusion/exclusion, ethics notes, and analysis plan.", requiresDiagnosis: true },
    { id: "review_medical_safety", label: "Review Medical Safety", purpose: "Flag emergency warnings, uncertainty, source gaps, and clinician-review requirements.", requiresDiagnosis: true },
    { id: "generate_medical_report", label: "Generate Medical Report", purpose: "Produce review-ready support package with assumptions, evidence, limits, and next actions.", requiresDiagnosis: true }
  ],
  expectedOutputs: [
    { key: "medical_information_structure", label: "Medical Information Structure", description: "Clinical/research context, timeline, details, evidence, missing context, and review needs." },
    { key: "clinical_documentation_draft", label: "Clinical Documentation Draft", description: "Note structure, SOAP-style draft, review flags, and documentation questions." },
    { key: "literature_evidence_summary", label: "Literature/Evidence Summary", description: "Paper summaries, study design, outcomes, limitations, and evidence notes." },
    { key: "research_protocol_outline", label: "Research Protocol Outline", description: "Research question, objectives, methods, endpoints, ethics notes, and analysis plan." },
    { key: "case_summary_package", label: "Case Summary Package", description: "Case timeline, findings, investigations, documentation gaps, and discussion points." },
    { key: "medical_safety_review", label: "Medical Safety Review", description: "Emergency flags, uncertainty, source gaps, clinical-review boundaries, and limitations." },
    { key: "medical_support_report", label: "Medical Support Report", description: "Final documentation/research support package with evidence, assumptions, limits, and next actions." }
  ],
  verificationLayer: [
    { title: "No autonomous medical advice", rule: "Medical AI must not provide autonomous diagnosis, prescription, treatment decisions, or emergency replacement." },
    { title: "Clinician review", rule: "Clinical outputs require qualified clinician review before use." },
    { title: "Source verification", rule: "Research summaries require source verification and evidence-quality review." },
    { title: "Safety disclosure", rule: "Emergency symptoms, clinical uncertainty, and missing context must be clearly flagged." }
  ],
  accessModel: [
    { id: "public_medical_education", label: "Public medical education support", description: "General medical education summaries and terminology explanations." },
    { id: "subscription_research_workspace", label: "Subscription research workspace", description: "Saved literature reviews, evidence tables, protocols, and reports." },
    { id: "clinic_documentation_workspace", label: "Clinic documentation workspace", description: "Documentation drafts, case summaries, review checklists, and workflows." },
    { id: "usage_credit_medical_support", label: "Usage-credit medical support", description: "Advanced packages using credits, RIO, RUSD, USDT, or USDC." }
  ]
});
