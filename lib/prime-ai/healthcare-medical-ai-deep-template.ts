import type { DeepNicheTemplate } from "./deep-niche-template";

export const HEALTHCARE_MEDICAL_AI_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "healthcare_medical_ai",
  title: "Healthcare & Medical AI Intelligence Platform",
  publicPositioning:
    "A creator-owned healthcare AI support platform for health education, patient intake, symptom documentation, wellness tracking, clinic workflow, medical-note preparation, and care-navigation support.",
  creatorPromise:
    "Prime lets a creator launch their own healthcare support platform, clinic intake assistant, patient education tool, wellness tracker, care-navigation system, or medical workflow assistant without building the full stack from scratch.",
  userPromise:
    "Users can document symptoms, prepare intake notes, understand health topics, track wellness signals, organize clinic information, and generate care-navigation summaries while keeping medical decisions under qualified human review.",
  audiences: [
    {
      title: "Patients and families",
      description: "Document symptoms, prepare questions, understand health topics, and organize care information before seeing a professional.",
    },
    {
      title: "Clinics and healthcare teams",
      description: "Use intake forms, triage documentation, workflow summaries, patient education, and administrative support.",
    },
    {
      title: "Wellness and care-navigation providers",
      description: "Support wellness tracking, referral guidance, appointment preparation, and non-diagnostic care coordination.",
    },
    {
      title: "Medical educators and health creators",
      description: "Create educational health content, condition explainers, prevention material, and guided learning modules.",
    },
  ],
  creatorSetup: [
    {
      title: "Healthcare use case",
      description: "The creator chooses the healthcare-support workflow.",
      options: ["Patient intake", "Health education", "Wellness tracking", "Clinic workflow", "Care navigation", "Medical note prep", "Symptom documentation"],
    },
    {
      title: "Audience type",
      description: "The creator chooses who the project serves.",
      options: ["Patients", "Clinics", "Nurses", "Doctors", "Caregivers", "Wellness users", "Health educators"],
    },
    {
      title: "Safety posture",
      description: "The creator chooses how strict the safety and human-review layer should be.",
      options: ["Education only", "Human review required", "Emergency warning", "No diagnosis", "No prescription", "Clinic approval required"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides how users access the platform.",
      options: ["Free", "Subscription", "Clinic license", "Usage credits", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Enter health context",
      description: "User describes symptoms, wellness goal, health question, clinic task, or care-navigation need.",
    },
    {
      step: "02",
      title: "Structure intake information",
      description: "The runtime organizes symptoms, duration, severity, medications, history, red flags, and questions for a clinician.",
    },
    {
      step: "03",
      title: "Screen safety flags",
      description: "The app identifies emergency warning signs, high-risk context, missing data, and human-review requirements.",
    },
    {
      step: "04",
      title: "Generate educational explanation",
      description: "The system explains possible health concepts in general terms without diagnosing or prescribing.",
    },
    {
      step: "05",
      title: "Prepare care-navigation summary",
      description: "The runtime creates questions to ask, appointment prep, care notes, and referral/workflow suggestions.",
    },
    {
      step: "06",
      title: "Generate healthcare support report",
      description: "The app outputs intake summary, risk flags, education notes, human-review routing, and next steps.",
    },
  ],
  deepModules: [
    {
      title: "Patient Intake Structurer",
      purpose: "Convert patient context into organized intake fields, timeline, symptoms, medications, history, and questions.",
      outputs: ["intake_summary", "symptom_timeline", "clinician_questions"],
    },
    {
      title: "Safety Flag Screener",
      purpose: "Identify red flags, emergency warnings, missing data, and human-review needs.",
      outputs: ["red_flag_notes", "urgency_posture", "human_review_route"],
    },
    {
      title: "Health Education Explainer",
      purpose: "Explain general health concepts, prevention, wellness, and care-navigation topics without diagnosis.",
      outputs: ["education_summary", "general_explanation", "source_needed_notes"],
    },
    {
      title: "Clinic Workflow Assistant",
      purpose: "Prepare clinic intake notes, administrative summaries, patient instructions, and handoff support.",
      outputs: ["clinic_note_draft", "workflow_summary", "handoff_checklist"],
    },
    {
      title: "Medical Note Preparation Engine",
      purpose: "Generate structured note drafts for review, such as SOAP-style summaries or visit-prep notes.",
      outputs: ["note_draft", "review_required_flags", "missing_context"],
    },
    {
      title: "Wellness Tracking Analyst",
      purpose: "Track non-diagnostic wellness signals, habits, symptoms, medication reminders, and progress notes.",
      outputs: ["wellness_log", "trend_notes", "followup_questions"],
    },
    {
      title: "Care Navigation Planner",
      purpose: "Suggest appointment preparation, questions to ask, referral categories, and non-emergency care pathways.",
      outputs: ["care_navigation_plan", "appointment_prep", "referral_category_notes"],
    },
    {
      title: "Healthcare Safety Report",
      purpose: "Generate support report with education notes, risk flags, limitations, human-review path, and next actions.",
      outputs: ["healthcare_support_report", "safety_limitations", "next_actions"],
    },
  ],
  accessModels: [
    {
      title: "Public health education assistant",
      description: "Anyone can access general health education and appointment-prep support.",
    },
    {
      title: "Subscription wellness workspace",
      description: "Users pay for saved wellness logs, care notes, reminders, and non-diagnostic summaries.",
    },
    {
      title: "Clinic workflow workspace",
      description: "Clinics use intake, documentation, education, and administrative workflow support.",
    },
    {
      title: "Usage-credit health support",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced summaries and workflow packages.",
    },
  ],
  rioMindNexusRole: [
    "Act as the healthcare support and intake intelligence layer behind Healthcare & Medical AI.",
    "Structure patient intake, symptom timelines, wellness context, clinic notes, and care-navigation summaries.",
    "Flag emergency warnings, missing context, high-risk information, and human-review requirements.",
    "Generate general health education without autonomous diagnosis, prescription, or treatment claims.",
    "Support clinic workflow, documentation drafts, appointment preparation, and safety routing.",
    "Generate healthcare support reports with assumptions, limitations, and qualified-review warnings.",
  ],
  proofAndVerification: [
    "The system must not provide autonomous diagnosis, prescription, or emergency replacement.",
    "Emergency symptoms must route users to urgent/emergency care guidance immediately.",
    "Medical outputs require qualified human review before clinical use.",
    "Health education should disclose uncertainty, missing context, and source/clinician review needs.",
  ],
};
