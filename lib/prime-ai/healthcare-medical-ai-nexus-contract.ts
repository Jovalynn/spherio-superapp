import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const HEALTHCARE_MEDICAL_AI_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "healthcare_medical_ai",
  nicheTitle: "Healthcare & Medical AI Intelligence Platform",
  rioMindNexusRole:
    "RioMind Nexus will act as the healthcare support and intake intelligence layer behind Healthcare & Medical AI. It will structure intake, screen safety flags, generate educational explanations, support clinic workflow, prepare medical-note drafts, and route high-risk cases to human review.",
  nexusHooks: [
    "patient_intake_structurer",
    "safety_flag_screener",
    "health_education_explainer",
    "clinic_workflow_assistant",
    "medical_note_preparation_engine",
    "wellness_tracking_analyst",
    "care_navigation_planner",
    "healthcare_safety_reporter",
  ],
  inputSchema: [
    {
      key: "health_context",
      label: "Health context",
      type: "textarea",
      required: true,
      helper: "Describe the symptom, wellness goal, health question, clinic task, or care-navigation need.",
      examples: ["Prepare questions for a doctor visit", "Document symptoms for clinic intake", "Understand general blood pressure basics"],
    },
    {
      key: "user_type",
      label: "User type",
      type: "text",
      required: true,
      helper: "Who is using the workflow.",
      examples: ["Patient", "Caregiver", "Clinic admin", "Nurse", "Doctor", "Health educator"],
    },
    {
      key: "duration_and_severity",
      label: "Duration and severity",
      type: "textarea",
      required: false,
      helper: "How long the issue has been present and how severe it feels.",
      examples: ["3 days, mild", "2 hours, severe", "Recurring for 2 weeks"],
    },
    {
      key: "history_or_medications",
      label: "History or medications",
      type: "textarea",
      required: false,
      helper: "Relevant history, medication, allergies, prior diagnoses, or known risk factors.",
      examples: ["Taking blood pressure medication", "No known allergies", "History of asthma"],
    },
    {
      key: "workflow_goal",
      label: "Workflow goal",
      type: "textarea",
      required: true,
      helper: "What the user wants the system to produce.",
      examples: ["Intake summary", "Questions for doctor", "General education", "Clinic note draft", "Wellness log"],
    },
  ],
  workflowActions: [
    {
      id: "structure_patient_intake",
      label: "Structure Patient Intake",
      purpose: "Organize symptoms, timeline, severity, history, medication, and questions.",
    },
    {
      id: "screen_safety_flags",
      label: "Screen Safety Flags",
      purpose: "Identify emergency warnings, high-risk context, missing data, and human-review routing.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_health_education",
      label: "Generate Health Education",
      purpose: "Explain general health concepts without diagnosis, prescription, or treatment instructions.",
      requiresDiagnosis: true,
    },
    {
      id: "prepare_clinic_workflow",
      label: "Prepare Clinic Workflow",
      purpose: "Create intake notes, administrative summaries, patient instructions, and handoff support.",
      requiresDiagnosis: true,
    },
    {
      id: "prepare_medical_note_draft",
      label: "Prepare Medical Note Draft",
      purpose: "Draft structured visit-prep or SOAP-style notes for qualified review.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_healthcare_report",
      label: "Generate Healthcare Report",
      purpose: "Produce support report, risk flags, education notes, limitations, and next actions.",
      requiresDiagnosis: true,
    },
  ],
  expectedOutputs: [
    {
      key: "intake_summary",
      label: "Intake Summary",
      description: "Structured symptoms, timeline, severity, history, medication, and patient questions.",
    },
    {
      key: "safety_flag_report",
      label: "Safety Flag Report",
      description: "Red flags, urgency posture, missing context, and human-review routing.",
    },
    {
      key: "education_summary",
      label: "Education Summary",
      description: "General health education with limitations and qualified-review warning.",
    },
    {
      key: "clinic_workflow_summary",
      label: "Clinic Workflow Summary",
      description: "Clinic intake, administrative summary, patient instructions, and handoff checklist.",
    },
    {
      key: "medical_note_draft",
      label: "Medical Note Draft",
      description: "Structured note draft for qualified medical review.",
    },
    {
      key: "care_navigation_plan",
      label: "Care Navigation Plan",
      description: "Appointment preparation, questions to ask, referral category notes, and next steps.",
    },
    {
      key: "healthcare_support_report",
      label: "Healthcare Support Report",
      description: "Full support report with assumptions, limitations, safety notes, and next actions.",
    },
  ],
  verificationLayer: [
    {
      title: "No autonomous diagnosis",
      rule: "The system must not present outputs as diagnosis, prescription, or treatment decision.",
    },
    {
      title: "Emergency routing",
      rule: "Emergency symptoms must route users to urgent or emergency care guidance immediately.",
    },
    {
      title: "Qualified human review",
      rule: "Clinical outputs require qualified healthcare professional review before use.",
    },
    {
      title: "Medical uncertainty disclosure",
      rule: "Outputs must disclose uncertainty, missing context, and need for clinician/source review.",
    },
  ],
  accessModel: [
    {
      id: "public_health_education",
      label: "Public health education assistant",
      description: "Anyone can access general health education and appointment-prep support.",
    },
    {
      id: "subscription_wellness",
      label: "Subscription wellness workspace",
      description: "Users pay for saved wellness logs, care notes, reminders, and non-diagnostic summaries.",
    },
    {
      id: "clinic_workspace",
      label: "Clinic workflow workspace",
      description: "Clinics use intake, documentation, education, and administrative workflow support.",
    },
    {
      id: "usage_credit_health_support",
      label: "Usage-credit health support",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced summaries and workflow packages.",
    },
  ],
});
