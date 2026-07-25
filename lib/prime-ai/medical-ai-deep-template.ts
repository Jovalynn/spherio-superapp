import type { DeepNicheTemplate } from "./deep-niche-template";

export const MEDICAL_AI_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "medical_ai",
  title: "Clinical Documentation & Medical Research Support AI",
  publicPositioning: "A creator-owned medical support platform for clinical documentation, SOAP-style note preparation, medical literature summaries, research protocol support, evidence tables, case summaries, and clinician-review packages.",
  creatorPromise: "Prime lets a creator launch a clinical documentation assistant, medical research support workspace, literature review tool, protocol drafting hub, or clinician-review preparation platform.",
  userPromise: "Clinicians, researchers, and medical teams can structure notes, summarize literature, prepare evidence tables, organize case facts, draft research protocols, and generate review-ready medical documentation packages.",
  audiences: [
    { title: "Clinicians", description: "Prepare note drafts, case summaries, documentation checklists, and review-ready clinical records." },
    { title: "Medical researchers", description: "Summarize papers, build evidence tables, draft protocol outlines, and structure research questions." },
    { title: "Clinic documentation teams", description: "Organize intake notes, visit summaries, referral drafts, and documentation workflows." },
    { title: "Health educators", description: "Create medically reviewed learning summaries, evidence notes, and terminology explanations." }
  ],
  creatorSetup: [
    { title: "Medical focus", description: "Choose the medical-support category.", options: ["Clinical notes", "Research support", "Literature review", "Evidence table", "Protocol draft", "Case summary"] },
    { title: "Workflow type", description: "Choose the main workflow.", options: ["SOAP note", "Research summary", "Evidence synthesis", "Case organization", "Protocol outline", "Clinician brief"] },
    { title: "Safety posture", description: "Choose safety boundary.", options: ["Clinician review", "No diagnosis", "No prescription", "Research only", "Documentation only", "Emergency warning"] },
    { title: "Access", description: "Choose monetization.", options: ["Free", "Subscription", "Usage credits", "Clinic license", "RIO/RUSD", "USDT/USDC"] }
  ],
  userWorkflow: [
    { step: "01", title: "Enter medical context", description: "User describes note, case, research question, paper set, protocol idea, or documentation task." },
    { step: "02", title: "Structure medical information", description: "Runtime organizes history, symptoms, findings, timeline, papers, evidence, methods, and missing context." },
    { step: "03", title: "Generate draft support", description: "App prepares note draft, case summary, literature summary, evidence table, or protocol outline." },
    { step: "04", title: "Review safety and evidence", description: "System flags missing sources, uncertainty, red flags, review boundaries, and clinician-review needs." },
    { step: "05", title: "Prepare review package", description: "Runtime creates clinician/researcher review notes, questions, limitations, and evidence checklist." },
    { step: "06", title: "Generate medical support report", description: "App outputs documentation/research package with assumptions, evidence notes, and next actions." }
  ],
  deepModules: [
    { title: "Clinical Note Structurer", purpose: "Organize subjective, objective, assessment-support, plan-support, timeline, and missing documentation fields.", outputs: ["note_structure", "missing_fields", "review_questions"] },
    { title: "SOAP Draft Assistant", purpose: "Prepare SOAP-style draft documentation for qualified clinician review.", outputs: ["soap_draft", "review_flags", "documentation_notes"] },
    { title: "Medical Literature Summarizer", purpose: "Summarize papers, methods, findings, limitations, population, outcomes, and evidence strength.", outputs: ["literature_summary", "study_limits", "evidence_notes"] },
    { title: "Evidence Table Builder", purpose: "Create structured evidence tables with study design, sample, intervention, comparator, outcomes, and limitations.", outputs: ["evidence_table", "study_matrix", "limitations"] },
    { title: "Research Protocol Planner", purpose: "Draft research question, objectives, methods, inclusion/exclusion, endpoints, ethics notes, and analysis plan.", outputs: ["protocol_outline", "method_notes", "ethics_flags"] },
    { title: "Case Summary Organizer", purpose: "Structure case timeline, presentation, findings, investigations, management notes, and discussion points.", outputs: ["case_summary", "timeline", "discussion_points"] },
    { title: "Medical Safety Reviewer", purpose: "Flag emergency warnings, uncertainty, source gaps, clinical-review boundaries, and documentation risks.", outputs: ["safety_flags", "source_gaps", "clinician_review"] },
    { title: "Medical Support Report", purpose: "Generate medical documentation/research support report with assumptions, limits, evidence, and next actions.", outputs: ["medical_report", "evidence_flags", "next_actions"] }
  ],
  accessModels: [
    { title: "Public medical education support", description: "Anyone can access general medical education summaries and terminology explanations." },
    { title: "Subscription research workspace", description: "Researchers pay for saved literature reviews, evidence tables, protocols, and reports." },
    { title: "Clinic documentation workspace", description: "Clinics use documentation drafts, case summaries, review checklists, and workflows." },
    { title: "Usage-credit medical support", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced documentation or research packages." }
  ],
  rioMindNexusRole: [
    "Act as the clinical documentation and medical research support intelligence layer behind Medical AI.",
    "Structure clinical notes, SOAP drafts, medical literature summaries, evidence tables, research protocols, and case summaries.",
    "Generate review-ready medical support reports with assumptions, limitations, evidence notes, safety flags, and clinician-review requirements."
  ],
  proofAndVerification: [
    "Medical AI must not provide autonomous diagnosis, prescription, treatment decisions, or emergency replacement.",
    "Clinical outputs require qualified clinician review before use.",
    "Research summaries require source verification and evidence-quality review.",
    "Emergency symptoms, clinical uncertainty, and missing context must be clearly flagged."
  ]
};
