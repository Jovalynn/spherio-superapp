import type { DeepNicheTemplate } from "./deep-niche-template";

export const RESEARCH_ECONOMY_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "research_economy",
  title: "Research Economy Intelligence Platform",
  publicPositioning:
    "A creator-owned AI research platform for literature reviews, proposals, grants, peer review, citations, datasets, academic publishing, and research collaboration.",
  creatorPromise:
    "Prime lets a creator launch their own research platform, academic workflow hub, grant assistant, journal-prep workspace, peer-review network, or research-data marketplace without building the full stack from scratch.",
  userPromise:
    "Researchers, students, academics, institutions, and organizations can turn research ideas into proposals, literature reviews, data plans, grant applications, citation structures, peer-review summaries, and publication-ready reports.",
  audiences: [
    {
      title: "Students and postgraduate researchers",
      description: "Prepare research topics, proposals, literature reviews, citations, methodology, and thesis support.",
    },
    {
      title: "Academic researchers",
      description: "Analyze literature, discover research gaps, prepare manuscripts, organize datasets, and manage publication workflows.",
    },
    {
      title: "Peer reviewers and journals",
      description: "Use structured review workflows, review notes, quality checks, and editorial decision support.",
    },
    {
      title: "Institutions and grant bodies",
      description: "Manage proposals, scoring, funding applications, data quality, and research output tracking.",
    },
  ],
  creatorSetup: [
    {
      title: "Research market",
      description: "The creator chooses the research audience they want to serve.",
      options: ["Students", "Postgraduates", "Academic researchers", "Journals", "Grant bodies", "Institutions", "Data contributors"],
    },
    {
      title: "Research workflow",
      description: "The creator chooses the main research utility.",
      options: ["Proposal builder", "Literature review", "Grant application", "Peer review", "Citation assistant", "Journal formatting", "Dataset marketplace"],
    },
    {
      title: "Research field",
      description: "The creator chooses the supported field or allows multi-field support.",
      options: ["Science", "Medicine", "Law", "Engineering", "Social science", "Business", "AI", "Blockchain", "Education"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides how users access research utilities.",
      options: ["Free", "Subscription", "Institution access", "Token-gated", "Research credits", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Enter research objective",
      description: "User describes topic, research question, field, goal, and intended output.",
    },
    {
      step: "02",
      title: "Build research frame",
      description: "The runtime identifies problem statement, scope, variables, assumptions, and research gap.",
    },
    {
      step: "03",
      title: "Generate literature map",
      description: "The app structures themes, debates, prior work, contradictions, and citation clusters.",
    },
    {
      step: "04",
      title: "Plan methodology",
      description: "The system proposes research design, data needs, methods, limitations, and ethics notes.",
    },
    {
      step: "05",
      title: "Prepare proposal or paper",
      description: "The app generates proposal sections, abstract, introduction, method, expected contribution, and references plan.",
    },
    {
      step: "06",
      title: "Review and verify",
      description: "The runtime checks assumptions, citation needs, bias, limitations, peer-review posture, and funding readiness.",
    },
  ],
  deepModules: [
    {
      title: "Research Problem Framer",
      purpose: "Convert a vague topic into a clear research problem, question, scope, and objective.",
      outputs: ["problem_statement", "research_question", "scope_boundary"],
    },
    {
      title: "Literature Review Mapper",
      purpose: "Organize themes, debates, gaps, contradictions, and citation clusters.",
      outputs: ["literature_map", "theme_clusters", "gap_analysis"],
    },
    {
      title: "Research Gap Analyst",
      purpose: "Identify what is missing, underexplored, contradictory, or methodologically weak in existing work.",
      outputs: ["research_gap", "novelty_claim", "contribution_angle"],
    },
    {
      title: "Methodology Planner",
      purpose: "Design qualitative, quantitative, mixed-method, experimental, review, or computational methodology.",
      outputs: ["methodology_plan", "data_requirements", "ethics_notes"],
    },
    {
      title: "Grant Application Builder",
      purpose: "Prepare research funding logic, significance, budget framing, impact, and implementation plan.",
      outputs: ["grant_summary", "impact_case", "funding_readiness"],
    },
    {
      title: "Peer Review Assistant",
      purpose: "Evaluate clarity, originality, method, evidence, limitations, and publication readiness.",
      outputs: ["peer_review_notes", "quality_flags", "revision_plan"],
    },
    {
      title: "Citation and Formatting Engine",
      purpose: "Organize references, citation needs, journal formatting, and missing-source warnings.",
      outputs: ["citation_plan", "formatting_checklist", "missing_sources"],
    },
    {
      title: "Research Proof and Integrity Layer",
      purpose: "Flag unverifiable claims, weak evidence, plagiarism risk, dataset limitations, and human-review needs.",
      outputs: ["integrity_report", "verification_flags", "human_review_notes"],
    },
  ],
  accessModels: [
    {
      title: "Public research assistant",
      description: "Anyone can create basic proposals, topic outlines, and research plans.",
    },
    {
      title: "Subscription research workspace",
      description: "Researchers pay for saved projects, literature mapping, proposal drafting, and publication workflows.",
    },
    {
      title: "Institution research portal",
      description: "Universities, labs, journals, and grant bodies manage research workflows and reviews.",
    },
    {
      title: "Research credit economy",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for deep reviews, grant analysis, and publication packages.",
    },
  ],
  rioMindNexusRole: [
    "Act as the research analyst behind the Research Economy project.",
    "Transform broad topics into structured research questions and proposal logic.",
    "Map literature themes, contradictions, gaps, and citation needs.",
    "Support methodology design, grant readiness, peer review, and journal preparation.",
    "Generate research integrity notes, assumptions, limitations, and human-review requirements.",
    "Support future proof, citation, dataset, reputation, and reward flows through Spherio/RioExplorer layers.",
  ],
  proofAndVerification: [
    "AI-generated research content must not invent citations or claim unsupported evidence.",
    "Literature reviews require verifiable sources and citation checks.",
    "Grant, journal, and peer-review workflows require human expert review.",
    "Research outputs should show assumptions, limitations, missing evidence, and confidence posture.",
  ],
};
