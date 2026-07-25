import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const STUDENT_AI_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "student_ai_platform",
  nicheTitle: "Student AI Learning Intelligence Platform",
  rioMindNexusRole:
    "RioMind Nexus will act as the deep learning analyst behind the Student AI project. It will diagnose the learner, detect knowledge gaps, build mastery paths, generate exam practice, classify mistakes, create correction drills, and produce progress intelligence.",
  nexusHooks: [
    "learning_diagnosis_agent",
    "knowledge_gap_detector",
    "subject_mastery_mapper",
    "deep_tutor_reasoner",
    "exam_simulator_agent",
    "mistake_classifier",
    "weak_area_correction_engine",
    "progress_report_generator",
    "certification_readiness_assistant",
  ],
  inputSchema: [
    {
      key: "student_subject",
      label: "Subject",
      type: "text",
      required: true,
      helper: "The subject or course the learner wants help with.",
      examples: ["Mathematics", "Chemistry", "Coding", "Nursing", "Law", "Physics"],
    },
    {
      key: "student_level",
      label: "Learning level",
      type: "text",
      required: true,
      helper: "The learner's current academic or professional level.",
      examples: ["Secondary School", "University Year 1", "Professional certification", "Beginner developer"],
    },
    {
      key: "learning_target",
      label: "Learning or exam target",
      type: "text",
      required: true,
      helper: "The goal the learner wants to achieve.",
      examples: ["Prepare for WAEC", "Pass organic chemistry exam", "Prepare for coding interview"],
    },
    {
      key: "weak_areas",
      label: "Weak areas",
      type: "textarea",
      required: true,
      helper: "Topics, concepts, or question types the learner finds difficult.",
      examples: ["Algebra, word problems", "Reaction mechanisms, stereochemistry", "Async JavaScript, debugging"],
    },
    {
      key: "time_available",
      label: "Time available",
      type: "text",
      required: false,
      helper: "How much time the learner has before exam or assessment.",
      examples: ["2 weeks", "1 month", "3 days"],
    },
  ],
  workflowActions: [
    {
      id: "run_learning_diagnosis",
      label: "Run Learning Diagnosis",
      purpose: "Detect the learner's current level, weak areas, blockers, and recommended starting point.",
    },
    {
      id: "find_knowledge_gaps",
      label: "Find Knowledge Gaps",
      purpose: "Identify missing prerequisite concepts and foundational weaknesses.",
      requiresDiagnosis: true,
    },
    {
      id: "build_mastery_path",
      label: "Build Mastery Path",
      purpose: "Create a staged learning route from foundation to exam readiness.",
      requiresDiagnosis: true,
    },
    {
      id: "simulate_exam",
      label: "Simulate Exam",
      purpose: "Generate timed practice questions and classify mistakes.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_correction_drills",
      label: "Generate Correction Drills",
      purpose: "Create targeted practice for weak topics and repeated mistakes.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_progress_report",
      label: "Generate Progress Report",
      purpose: "Summarize mastery, weak areas, exam readiness, next actions, and certification readiness.",
      requiresDiagnosis: true,
    },
  ],
  expectedOutputs: [
    {
      key: "diagnosis_summary",
      label: "Diagnosis Summary",
      description: "A clear explanation of the learner's level, blockers, and starting point.",
    },
    {
      key: "knowledge_gaps",
      label: "Knowledge Gaps",
      description: "Missing foundations and prerequisite concepts that must be repaired.",
    },
    {
      key: "mastery_path",
      label: "Mastery Path",
      description: "A staged study route from foundation to advanced reasoning.",
    },
    {
      key: "exam_plan",
      label: "Exam Plan",
      description: "Mock exam structure, practice questions, timing strategy, and mistake classification.",
    },
    {
      key: "correction_drills",
      label: "Correction Drills",
      description: "Targeted drills for the exact weak areas blocking progress.",
    },
    {
      key: "progress_report",
      label: "Progress Report",
      description: "Student, teacher, parent, and institution-ready progress intelligence.",
    },
    {
      key: "certification_readiness",
      label: "Certification Readiness",
      description: "Assessment summary and proof-readiness posture for future credential flows.",
    },
  ],
  verificationLayer: [
    {
      title: "Educational limitation",
      rule: "The system supports learning and revision but should not falsely guarantee exam outcomes.",
    },
    {
      title: "Assessment proof",
      rule: "Certification readiness must depend on assessment records, not only AI-generated claims.",
    },
    {
      title: "Human review",
      rule: "School, institution, or professional certification use cases may require human review.",
    },
    {
      title: "Confidence and assumptions",
      rule: "Generated study plans should show assumptions, weak data points, and confidence level.",
    },
  ],
  accessModel: [
    {
      id: "public_access",
      label: "Public access",
      description: "Anyone can use the project with free or limited learning tools.",
    },
    {
      id: "subscription_access",
      label: "Subscription",
      description: "Students pay monthly or yearly for premium tutoring, exam simulation, reports, and learning history.",
    },
    {
      id: "token_gated_access",
      label: "Token-gated",
      description: "Access is based on holding or paying with creator token, RIO, RUSD, USDT, or USDC.",
    },
    {
      id: "institution_access",
      label: "Institution",
      description: "Schools, tutors, and training centers manage groups, reports, and learning progress.",
    },
  ],
});
