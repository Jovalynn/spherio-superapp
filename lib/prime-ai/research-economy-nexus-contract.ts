import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const RESEARCH_ECONOMY_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "research_economy",
  nicheTitle: "Research Economy Intelligence Platform",
  rioMindNexusRole:
    "RioMind Nexus will act as the research analyst behind the Research Economy project. It will frame research problems, map literature, identify gaps, plan methodology, support grant and paper preparation, review quality, and expose verification needs.",
  nexusHooks: [
    "research_problem_framer",
    "literature_review_mapper",
    "research_gap_analyst",
    "methodology_planner",
    "grant_application_builder",
    "peer_review_assistant",
    "citation_formatting_engine",
    "research_integrity_layer",
  ],
  inputSchema: [
    {
      key: "research_topic",
      label: "Research topic",
      type: "textarea",
      required: true,
      helper: "The research idea, question, or subject area.",
      examples: ["AI in education", "Renewable energy adoption in Nigeria", "Blockchain governance models"],
    },
    {
      key: "research_field",
      label: "Research field",
      type: "text",
      required: true,
      helper: "The academic or professional domain.",
      examples: ["Education", "Medicine", "Engineering", "Law", "Economics", "Computer Science"],
    },
    {
      key: "intended_output",
      label: "Intended output",
      type: "select",
      required: true,
      helper: "The type of research output needed.",
      examples: ["Proposal", "Literature review", "Grant application", "Journal paper", "Peer review", "Dataset plan"],
    },
    {
      key: "known_sources_or_data",
      label: "Known sources or data",
      type: "textarea",
      required: false,
      helper: "Any known papers, datasets, authors, sources, or evidence already available.",
      examples: ["WHO reports, World Bank data, 2020-2025 journal papers"],
    },
    {
      key: "constraints",
      label: "Constraints",
      type: "textarea",
      required: false,
      helper: "Deadline, format, word count, institution rules, methodology preference, or funding requirements.",
      examples: ["APA format, 3000 words, mixed methods, 2-week deadline"],
    },
  ],
  workflowActions: [
    {
      id: "frame_research_problem",
      label: "Frame Research Problem",
      purpose: "Convert topic into problem statement, research question, scope, and objective.",
    },
    {
      id: "map_literature",
      label: "Map Literature",
      purpose: "Organize themes, debates, contradictions, citation clusters, and missing sources.",
      requiresDiagnosis: true,
    },
    {
      id: "identify_research_gap",
      label: "Identify Research Gap",
      purpose: "Find missing, weak, contradictory, or underexplored areas.",
      requiresDiagnosis: true,
    },
    {
      id: "plan_methodology",
      label: "Plan Methodology",
      purpose: "Design method, data requirements, ethics notes, and limitation posture.",
      requiresDiagnosis: true,
    },
    {
      id: "prepare_proposal_or_paper",
      label: "Prepare Proposal or Paper",
      purpose: "Generate structured proposal, paper sections, grant logic, or journal-prep outline.",
      requiresDiagnosis: true,
    },
    {
      id: "review_and_verify",
      label: "Review and Verify",
      purpose: "Flag assumptions, citation needs, bias, weak evidence, and human-review requirements.",
      requiresDiagnosis: true,
    },
  ],
  expectedOutputs: [
    {
      key: "research_frame",
      label: "Research Frame",
      description: "Problem statement, research question, objective, scope, and contribution angle.",
    },
    {
      key: "literature_map",
      label: "Literature Map",
      description: "Themes, debates, citation clusters, contradictions, and missing-source warnings.",
    },
    {
      key: "gap_analysis",
      label: "Gap Analysis",
      description: "Research gap, novelty claim, underexplored areas, and contribution logic.",
    },
    {
      key: "methodology_plan",
      label: "Methodology Plan",
      description: "Method, data needs, sampling, limitations, ethics, and analysis approach.",
    },
    {
      key: "proposal_or_paper_outline",
      label: "Proposal or Paper Outline",
      description: "Structured academic sections, abstract, introduction, method, impact, and reference plan.",
    },
    {
      key: "peer_review_notes",
      label: "Peer Review Notes",
      description: "Quality flags, clarity issues, originality, evidence concerns, and revision plan.",
    },
    {
      key: "integrity_report",
      label: "Integrity Report",
      description: "Citation warnings, unsupported claims, assumptions, limitations, and human-review notes.",
    },
  ],
  verificationLayer: [
    {
      title: "Citation integrity",
      rule: "The system must not invent citations or present unverifiable references as real.",
    },
    {
      title: "Evidence requirement",
      rule: "Research claims require verifiable sources, datasets, or clearly marked assumptions.",
    },
    {
      title: "Human review",
      rule: "Grant, journal, academic, and peer-review outputs require human expert review.",
    },
    {
      title: "Integrity warning",
      rule: "The system should flag plagiarism risk, weak evidence, bias, and missing methodology details.",
    },
  ],
  accessModel: [
    {
      id: "public_access",
      label: "Public research assistant",
      description: "Anyone can create basic research topics, outlines, and proposal drafts.",
    },
    {
      id: "subscription_access",
      label: "Subscription research workspace",
      description: "Researchers pay for saved projects, deeper analysis, literature maps, and publication workflows.",
    },
    {
      id: "institution_access",
      label: "Institution portal",
      description: "Universities, labs, journals, and grant bodies manage research workflows and reviews.",
    },
    {
      id: "research_credit_access",
      label: "Research credits",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for deep reviews and research packages.",
    },
  ],
});
