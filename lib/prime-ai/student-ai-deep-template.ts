import type { DeepNicheTemplate } from "./deep-niche-template";

export const STUDENT_AI_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "student_ai_platform",
  title: "Student AI Learning Intelligence Platform",
  publicPositioning:
    "A creator-owned AI learning platform for students, tutors, schools, exam candidates, training centers, and education entrepreneurs.",
  creatorPromise:
    "Prime lets a creator launch their own AI school, AI tutor, exam-prep app, course assistant, or learning platform without building the full stack from scratch.",
  userPromise:
    "Students enter what they are studying, what they find difficult, and what exam or learning goal they have. The app diagnoses weak areas, builds a study path, creates practice, and tracks progress.",
  audiences: [
    {
      title: "Students and exam candidates",
      description: "Use diagnosis, study paths, notes, flashcards, mock exams, correction drills, and progress reports.",
    },
    {
      title: "Tutors and teachers",
      description: "Launch subject-specific AI tutoring, track learner weaknesses, and generate teaching support material.",
    },
    {
      title: "Schools and training centers",
      description: "Offer branded AI learning support, institution access, progress reports, and future certification proof.",
    },
    {
      title: "Education entrepreneurs",
      description: "Launch niche products such as WAEC AI Tutor, JAMB AI Prep, Nursing Student AI, Coding Student AI, or Engineering Maths AI.",
    },
  ],
  creatorSetup: [
    {
      title: "Education market",
      description: "The creator chooses the student group they want to serve.",
      options: ["Primary", "Secondary", "University", "Professional certification", "Vocational", "Research students"],
    },
    {
      title: "Subject focus",
      description: "The creator chooses one or more subject tracks.",
      options: ["Mathematics", "Chemistry", "Biology", "Physics", "Coding", "Law", "Medicine", "Business", "Engineering", "Languages"],
    },
    {
      title: "Learning purpose",
      description: "The creator selects the core purpose of the project.",
      options: ["Exam prep", "AI tutor", "Course support", "Notes and flashcards", "Certification readiness", "Virtual lab support"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides how students access the learning utility.",
      options: ["Free", "Subscription", "Token-gated", "Institution access", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Enter learning profile",
      description: "Student enters subject, level, exam target, weak topics, and learning goal.",
    },
    {
      step: "02",
      title: "Run learning diagnosis",
      description: "The runtime detects likely weak areas, missing foundations, and study blockers.",
    },
    {
      step: "03",
      title: "Review knowledge gaps",
      description: "The student sees the prerequisites and concepts they need before advanced study.",
    },
    {
      step: "04",
      title: "Build mastery path",
      description: "The app creates a staged learning route from foundation to exam readiness.",
    },
    {
      step: "05",
      title: "Practice and correct",
      description: "The student practices questions, receives mistake classification, and follows correction drills.",
    },
    {
      step: "06",
      title: "Generate progress report",
      description: "The app outputs mastery estimate, weak areas, exam readiness, and next recommended action.",
    },
  ],
  deepModules: [
    {
      title: "Learning Diagnosis",
      purpose: "Detect the student's level, target, weak topics, confidence, and likely learning blockers.",
      outputs: ["student_profile", "weak_area_signals", "diagnosis_summary"],
    },
    {
      title: "Knowledge Gap Detector",
      purpose: "Identify missing foundations and prerequisite concepts before teaching advanced topics.",
      outputs: ["gap_list", "prerequisite_map", "foundation_repair_plan"],
    },
    {
      title: "Subject Mastery Map",
      purpose: "Map the subject into foundation, core understanding, application, advanced reasoning, and proof readiness.",
      outputs: ["mastery_stages", "topic_progression", "study_path"],
    },
    {
      title: "AI Tutor",
      purpose: "Explain topics at the student's level using examples, analogies, guided reasoning, and follow-up checks.",
      outputs: ["explanation", "worked_examples", "test_back_questions"],
    },
    {
      title: "Exam Simulator",
      purpose: "Generate timed mock questions, classify errors, and create adaptive retests.",
      outputs: ["mock_test", "mistake_classification", "adaptive_retest"],
    },
    {
      title: "Weak-Area Correction Engine",
      purpose: "Produce targeted drills and retry loops for the exact concepts blocking progress.",
      outputs: ["correction_drills", "practice_plan", "retry_path"],
    },
    {
      title: "Progress Intelligence Report",
      purpose: "Summarize student improvement, weak areas, readiness, confidence, and next steps.",
      outputs: ["progress_report", "teacher_brief", "parent_brief", "institution_summary"],
    },
    {
      title: "Certification Readiness",
      purpose: "Prepare assessment records and proof-style learning summaries for future credential flows.",
      outputs: ["completion_summary", "readiness_score", "proof_package"],
    },
  ],
  accessModels: [
    {
      title: "Public learning utility",
      description: "Anyone can use the learning tools for free or limited access.",
    },
    {
      title: "Subscription learning platform",
      description: "Students pay monthly or yearly for premium tutoring, exams, reports, and learning history.",
    },
    {
      title: "Token-gated education app",
      description: "Access is based on holding or paying with the creator token, RIO, RUSD, USDT, or USDC.",
    },
    {
      title: "Institution access",
      description: "Schools, tutors, and training centers manage student groups and reports.",
    },
  ],
  rioMindNexusRole: [
    "Diagnose the learning problem before answering.",
    "Detect whether the issue is memory, concept weakness, formula misuse, reading comprehension, or exam pressure.",
    "Teach at the correct student level instead of giving generic answers.",
    "Generate practice questions and classify the student's mistakes.",
    "Create progress intelligence for student, teacher, parent, and institution views.",
    "Support future certificate and proof generation through Spherio/RioExplorer layers.",
  ],
  proofAndVerification: [
    "AI-generated study output should show assumptions and limitations.",
    "Exam readiness should be based on practice records, not claims only.",
    "Certification proof should require assessment history and human/institution review where needed.",
    "Sensitive education outcomes should not be overstated without verification.",
  ],
};
