"use client";

import Link from "next/link";
import { getPrimeAiCodebasePackage } from "@/lib/prime/ai-codebase-engine";
import { connectRioLight } from "@/lib/riolight/client";
import {
  createRioLightGlobalHandoverIntent,
  rioLightExplorerProofHref,
} from "@/lib/riolight/handover";
import { executeRioLightContract, waitForRioLightStoredExecutionResult } from "@/lib/riolight/signer";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

type PrimeLiquidityBase = "RIO" | "RUSD";
type PrimeLiquidityMode = "manual" | "guided" | "deferred";
type PrimeLiquidityGrade = "minister" | "senior_minister" | "prime_minister";

type PrimeTemplate = {
  id: string;
  name: string;
  category: string;
  tone?: string;
  description: string;
  launchModel: string;
  aiContext: string;
  defaultLiquidityBases: PrimeLiquidityBase[];
  defaultLiquidityMode: PrimeLiquidityMode;
  feeTier: "standard" | "advanced" | "premium" | "hybrid";
  allocationDefaults: string[];
  trustDefaults: string[];
  readinessDefaults: string[];
  screenerLabel: string;
  successActions: string[];
  aiOutputs?: string[];
  powerUps?: string[];
  liquidityGuidance?: string[];
  requiredDisclosures?: string[];
  reviewSections?: {
    id: string;
    title: string;
    items: string[];
  }[];
};

type PrimeFeeQuote = {
  templateId: string;
  tier: string;
  feeUsd: number;
  feeRio: number;
  rioPriceUsd: number;
  label: string;
  hybridLabel?: string;
};

type PrimeAutoLiquidityState = {
  tokenAddress: string;
  symbol: string;
  projectName: string;
  liquidityBase: PrimeLiquidityBase;
  liquidityMode: PrimeLiquidityMode;
  liquidityGrade: PrimeLiquidityGrade;
  lpPositionId?: string | null;
  poolUrl?: string | null;
  screenerUrl?: string | null;
  tradeUrl?: string | null;
  explorerUrl?: string | null;
};

type PrimeCreateSuccess = {
  projectId: string;
  templateId: string;
  templateName: string;
  hybridLabel?: string;
  tokenAddress: string;
  tokenPageUrl?: string;
  explorerUrl: string;
  screenerUrl: string;
  liquidityUrl: string;
  verifiedStatus: "verified" | "unverified";
  feePaidRio: number;
  feeUsdReference: number;
  feeRecipient: string;
  successActions: string[];
  aiOutputs: string[];
  powerUps: string[];
  liquidityGuidance: string[];
  requiredDisclosures: string[];
  reviewSections: {
    id: string;
    title: string;
    items: string[];
  }[];
};

type PrimeMetadataPackage = {
  projectId: string;
  templateId: string;
  templateName: string;
  hybridLabel?: string;
  tokenAddress: string;
  symbol: string;
  projectName: string;
  liquidityBase: PrimeLiquidityBase;
  liquidityMode: PrimeLiquidityMode;
  aiContext: string;
  aiOutputs: string[];
  powerUps: string[];
  liquidityGuidance: string[];
  requiredDisclosures: string[];
  reviewSections: {
    id: string;
    title: string;
    items: string[];
  }[];
  screenerLabel: string;
  successActions: string[];
  rioExProfilePreviewUrl?: string;
};

type LaunchLifecycleStep = {
  key: string;
  label: string;
  status: "complete" | "active" | "pending" | "optional";
};

type LaunchLifecycleState = {
  rail: "pump" | "prime";
  progressPercent: number;
  steps: LaunchLifecycleStep[];
};

type PrimeFeaturedNicheState = {
  id: string;
  name: string;
  category: string;
};

type PrimeLaunchSurfaceState = {
  featuredNiche: PrimeFeaturedNicheState | null;
  lifecycle: LaunchLifecycleState;
};

type PrimeLaunchSurfaceResponse = {
  ok: boolean;
  source?: string;
  error?: string;
  state?: PrimeLaunchSurfaceState;
};

type PrimeNicheFamily = "core" | "ai_ecosystem";

type PrimeAiNiche = {
  id: string;
  title: string;
  category: string;
  badge: string;
  tags?: string[];
  description?: string;
  chips?: string[];
  launchModel: string;
  allocationDefaults: string[];
  trustDefaults: string[];
  readinessExpectations: string[];
  architecture: {
    frontend: string;
    backend: string;
    codebase: string;
    modules: string[];
  };
  recommendedUtilities: string[];
};

const AI_ECOSYSTEM_NICHES: PrimeAiNiche[] = [
  {
    id: "blockchain_ai",
    title: "Blockchain AI",
    category: "Blockchain Intelligence",
    badge: "CHAIN AI",
    tags: ["BLOCKCHAIN", "SMART CONTRACTS", "ON-CHAIN", "SECURITY"],
    launchModel:
      "Advanced blockchain intelligence launch for smart contracts, tokenomics, DEX liquidity, bridges, validators, governance, and on-chain proof analysis.",
    allocationDefaults: [
      "Protocol intelligence reserve",
      "Security and audit reserve",
      "Developer ecosystem allocation",
      "Governance research reserve",
    ],
    trustDefaults: [
      "Smart-contract risk disclosure",
      "No exploit-proof guarantee",
      "Bridge and liquidity risk warning",
      "On-chain evidence required",
    ],
    readinessExpectations: [
      "Chain data source",
      "Contract registry",
      "Risk-analysis workflow",
      "Explorer proof integration",
    ],
    architecture: {
      frontend:
        "Blockchain intelligence dashboard, contract analyzer, tokenomics simulator, transaction explorer, governance review, and risk workspace.",
      backend:
        "On-chain index adapter, contract parser, risk engine, liquidity analyzer, validator/governance analyzer, and report generator.",
      codebase:
        "Next.js frontend, Node.js/TypeScript APIs, Postgres chain data tables, optional Rust/WASM contract analysis workers.",
      modules: ["CONTRACT_ANALYZER", "TOKENOMICS_ENGINE", "DEX_RISK", "BRIDGE_RISK", "GOVERNANCE_AI"],
    },
    recommendedUtilities: ["verification_layer", "analytics_dashboard", "developer_portal"],
  },
  {
    id: "cloud_ai",
    title: "Cloud AI",
    category: "Infrastructure Intelligence",
    badge: "CLOUD AI",
    tags: ["CLOUD", "DEVOPS", "KUBERNETES", "SECURITY"],
    launchModel:
      "Advanced infrastructure intelligence launch for cloud architecture, scaling, DevOps, observability, security, cost, and disaster recovery.",
    allocationDefaults: [
      "Infrastructure tooling reserve",
      "Monitoring and observability reserve",
      "Security hardening reserve",
      "Cloud cost optimization reserve",
    ],
    trustDefaults: [
      "No zero-downtime guarantee",
      "Security review required",
      "Cloud provider dependency disclosure",
      "Cost-estimate uncertainty notice",
    ],
    readinessExpectations: [
      "Infrastructure dashboard",
      "Deployment planner",
      "Monitoring workflow",
      "Cost and scaling analyzer",
    ],
    architecture: {
      frontend:
        "Cloud architecture console, deployment planner, scaling simulator, cost dashboard, monitoring map, and incident response workspace.",
      backend:
        "Cloud inventory service, infrastructure planner, cost analyzer, CI/CD registry, observability adapter, and security checklist service.",
      codebase:
        "Next.js frontend, Node.js APIs, Postgres infrastructure metadata, optional Terraform/Kubernetes manifest generators.",
      modules: ["ARCHITECTURE_PLANNER", "SCALING_ANALYST", "COST_ENGINE", "OBSERVABILITY", "SECURITY_REVIEW"],
    },
    recommendedUtilities: ["documentation_pack", "analytics_dashboard", "developer_portal"],
  },
  {
    id: "telecom_ai",
    title: "Telecom AI",
    category: "Network Intelligence",
    badge: "TELECOM AI",
    tags: ["TELECOM", "NETWORK", "EDGE", "IOT"],
    launchModel:
      "Advanced telecom intelligence launch for network planning, coverage, bandwidth, edge systems, subscriber analytics, and service quality.",
    allocationDefaults: [
      "Network planning reserve",
      "Edge infrastructure reserve",
      "Subscriber analytics reserve",
      "Service quality reserve",
    ],
    trustDefaults: [
      "Coverage estimate disclosure",
      "Hardware dependency warning",
      "Regulatory review required",
      "No guaranteed service quality claim",
    ],
    readinessExpectations: [
      "Network planning dashboard",
      "Coverage model",
      "Subscriber analytics workflow",
      "QoS monitoring surface",
    ],
    architecture: {
      frontend:
        "Telecom command center, coverage planner, bandwidth analyzer, edge/CDN map, subscriber analytics, and QoS dashboard.",
      backend:
        "Network model service, telemetry adapter, subscriber analytics engine, QoS monitor, edge node registry, and report generator.",
      codebase:
        "Next.js frontend, Node.js APIs, Postgres telemetry tables, optional Python network optimization workers.",
      modules: ["NETWORK_PLANNER", "COVERAGE_MODEL", "BANDWIDTH_ANALYST", "QOS_MONITOR", "EDGE_AI"],
    },
    recommendedUtilities: ["analytics_dashboard", "verification_layer", "documentation_pack"],
  },
  {
    id: "data_science_machine_learning_ai",
    title: "Data Science & Machine Learning AI",
    category: "ML Intelligence",
    badge: "ML AI",
    tags: ["DATA SCIENCE", "MACHINE LEARNING", "BI", "PREDICTION"],
    launchModel:
      "Advanced data science and machine learning launch for dataset analysis, feature engineering, model selection, evaluation, bias, drift, and deployment planning.",
    allocationDefaults: [
      "Dataset processing reserve",
      "ML experiment reserve",
      "Model evaluation reserve",
      "Analytics infrastructure reserve",
    ],
    trustDefaults: [
      "Model accuracy disclosure",
      "Bias and drift warning",
      "Data quality dependency",
      "No guaranteed prediction outcome",
    ],
    readinessExpectations: [
      "Dataset workspace",
      "Model experiment tracker",
      "Evaluation dashboard",
      "Prediction and BI surface",
    ],
    architecture: {
      frontend:
        "Data science workspace, dataset profiler, feature engineering console, model experiment tracker, metrics dashboard, and prediction studio.",
      backend:
        "Dataset ingestion service, feature pipeline, model registry, metrics evaluator, drift detector, and report generator.",
      codebase:
        "Next.js frontend, Node.js APIs, Postgres metadata, optional Python ML workers for feature engineering and model evaluation.",
      modules: ["DATA_PROFILER", "FEATURE_ENGINE", "MODEL_REGISTRY", "METRICS_EVALUATOR", "DRIFT_DETECTOR"],
    },
    recommendedUtilities: ["analytics_dashboard", "documentation_pack", "developer_portal"],
  },
  {
    id: "legal_ai",
    title: "Legal AI",
    category: "Legal Intelligence",
    badge: "LEGAL AI",
    tags: ["LEGAL", "CONTRACTS", "COMPLIANCE", "POLICY"],
    launchModel:
      "Advanced legal intelligence launch for contract review, clause extraction, risk flags, compliance workflows, document comparison, and legal research support.",
    allocationDefaults: [
      "Legal research reserve",
      "Compliance workflow reserve",
      "Document intelligence reserve",
      "Human review reserve",
    ],
    trustDefaults: [
      "Not legal advice",
      "Lawyer review required",
      "Jurisdiction matters",
      "No outcome guarantee",
    ],
    readinessExpectations: [
      "Document upload/review workflow",
      "Clause extraction engine",
      "Compliance checklist",
      "Human review handoff",
    ],
    architecture: {
      frontend:
        "Legal document workspace, contract summary panel, clause risk map, compliance checklist, comparison viewer, and review handoff surface.",
      backend:
        "Document parser, clause extraction service, risk classifier, compliance checklist engine, jurisdiction metadata service, and report generator.",
      codebase:
        "Next.js frontend, Node.js APIs, Postgres legal document metadata, optional OCR/NLP workers.",
      modules: ["CONTRACT_REVIEW", "CLAUSE_EXTRACTOR", "RISK_FLAGS", "COMPLIANCE_AI", "LEGAL_REPORTS"],
    },
    recommendedUtilities: ["documentation_pack", "verification_layer", "analytics_dashboard"],
  },
  {
    id: "medical_ai",
    title: "Medical AI",
    category: "Medical Intelligence",
    badge: "MEDICAL AI",
    tags: ["MEDICAL", "RESEARCH", "HEALTH", "COMPLIANCE"],
    launchModel:
      "Advanced medical intelligence launch for medical literature, patient education, clinical workflow support, research collaboration, and compliance-aware health data review.",
    allocationDefaults: [
      "Medical research reserve",
      "Compliance review reserve",
      "Health data security reserve",
      "Human expert review reserve",
    ],
    trustDefaults: [
      "Not medical advice",
      "Doctor review required",
      "No diagnosis guarantee",
      "Emergency care exclusion",
    ],
    readinessExpectations: [
      "Medical research workspace",
      "Safety disclosure layer",
      "Consent/compliance workflow",
      "Human review handoff",
    ],
    architecture: {
      frontend:
        "Medical research portal, literature summary workspace, patient education panel, compliance checklist, consent workflow, and safety-first assistant.",
      backend:
        "Literature parser, health workflow service, consent record service, compliance review service, data access audit, and report generator.",
      codebase:
        "Next.js frontend, Node.js APIs, Postgres health/compliance metadata, optional medical literature NLP workers.",
      modules: ["LITERATURE_AI", "PATIENT_EDUCATION", "CONSENT_FLOW", "COMPLIANCE_REVIEW", "SAFETY_LAYER"],
    },
    recommendedUtilities: ["verification_layer", "documentation_pack", "analytics_dashboard"],
  },
  {
    id: "complex_project_manager_ai",
    title: "Complex Project Manager AI",
    category: "Execution Intelligence",
    badge: "PROJECT AI",
    tags: ["PROJECTS", "PMO", "RISK", "EXECUTION"],
    launchModel:
      "Advanced project execution intelligence launch for complex planning, dependencies, risk, milestones, budgets, teams, decision logs, and progress reporting.",
    allocationDefaults: [
      "Project operations reserve",
      "Risk management reserve",
      "Team coordination reserve",
      "Reporting and analytics reserve",
    ],
    trustDefaults: [
      "Execution risk disclosure",
      "Human manager review required",
      "Budget estimate uncertainty",
      "Dependency change warning",
    ],
    readinessExpectations: [
      "Project command center",
      "Milestone planner",
      "Risk register",
      "Progress reporting workflow",
    ],
    architecture: {
      frontend:
        "Project command center, milestone planner, dependency map, risk register, team board, budget tracker, and decision log.",
      backend:
        "Project planning service, dependency engine, risk scoring service, budget tracker, report generator, and team assignment service.",
      codebase:
        "Next.js frontend, Node.js APIs, Postgres project execution tables, optional optimization/scheduling workers.",
      modules: ["MILESTONE_ENGINE", "DEPENDENCY_MAP", "RISK_REGISTER", "BUDGET_TRACKER", "EXEC_REPORTS"],
    },
    recommendedUtilities: ["analytics_dashboard", "documentation_pack", "telegram_utility"],
  },
  {
    id: "code_software_developer_ai",
    title: "Code & Software Developer AI",
    category: "Software Intelligence",
    badge: "CODE AI",
    tags: ["CODE", "SOFTWARE", "DEBUGGING", "ARCHITECTURE"],
    launchModel:
      "Advanced software development intelligence launch for architecture, coding, debugging, refactoring, testing, security review, DevOps, and full-stack engineering.",
    allocationDefaults: [
      "Developer tooling reserve",
      "Security audit reserve",
      "Testing infrastructure reserve",
      "Code assistant reserve",
    ],
    trustDefaults: [
      "Code review required",
      "Security audit warning",
      "No bug-free guarantee",
      "Dependency risk disclosure",
    ],
    readinessExpectations: [
      "Developer workspace",
      "Code analysis engine",
      "Test generation workflow",
      "Architecture review surface",
    ],
    architecture: {
      frontend:
        "Developer copilot workspace, code review panel, architecture planner, debugging console, test generator, and deployment assistant.",
      backend:
        "Code analysis service, refactor planner, test generator, dependency scanner, security checklist, and DevOps assistant.",
      codebase:
        "Next.js frontend, Node.js APIs, Postgres project/code metadata, optional language-specific static analysis workers.",
      modules: ["CODE_REVIEW", "DEBUGGER_AI", "TEST_GENERATOR", "ARCHITECTURE_AI", "SECURITY_CHECK"],
    },
    recommendedUtilities: ["developer_portal", "documentation_pack", "analytics_dashboard"],
  },
  {
    id: "ai_development_app_building",
    title: "AI Development & App Building",
    category: "AI App Builder",
    badge: "NO-CODE AI",
    description:
      "Launch an AI development platform for API access, no-code AI apps, model deployment, agent execution, and AI-powered application building.",
    chips: ["AI", "APP BUILDER", "DEVELOPER TOOL", "NO-CODE AI", "MODEL MARKETPLACE"],
    launchModel:
      "Structured AI app-building launch for creators offering AI API access, no-code app generation, model routing, deployment tools, and developer-facing AI infrastructure.",
    allocationDefaults: [
      "Developer ecosystem allocation",
      "AI compute and API reserve",
      "Builder incentive pool",
      "Template marketplace reserve",
    ],
    trustDefaults: [
      "API usage clarity",
      "No guaranteed AI output",
      "Model/source disclosure",
      "Usage metering enabled",
    ],
    readinessExpectations: [
      "Frontend app-builder surface",
      "Backend API orchestration",
      "Model/provider configuration",
      "Usage-credit or deployment logic",
    ],
    architecture: {
      frontend:
        "No-code AI builder dashboard, prompt workspace, app template gallery, model selector, and deployment panel.",
      backend:
        "API gateway, model router, usage-metering service, credit deduction service, deployment registry, and project provisioning queue.",
      codebase:
        "Next.js frontend, Node.js/TypeScript API routes, Postgres usage tables, optional Python workers for AI/model tasks.",
      modules: ["app_templates", "ai_model_routes", "usage_credits", "deployments", "creator_projects"],
    },
    recommendedUtilities: ["project_website", "developer_portal", "api_docs", "app_template", "analytics"],
  },
  {
    id: "ai_agent_marketplace",
    title: "AI Agent Marketplace",
    category: "Agent Economy",
    badge: "AGENT MARKET",
    description:
      "Launch a marketplace where users can buy, rent, sell, install, train, and monetize AI agents and agent workflows.",
    chips: ["AI", "AGENT ECONOMY", "MARKETPLACE", "AUTOMATION", "WORKFLOW AGENTS"],
    launchModel:
      "Structured AI agent marketplace launch where the token powers agent access, execution credits, subscriptions, publisher revenue, and workflow monetization.",
    allocationDefaults: [
      "Agent marketplace allocation",
      "Developer revenue pool",
      "Workflow execution reserve",
      "Agent verification reserve",
    ],
    trustDefaults: [
      "Agent capability disclosure",
      "No autonomous outcome guarantee",
      "Agent publisher verification",
      "Usage monitoring enabled",
    ],
    readinessExpectations: [
      "Agent catalog",
      "Install/rent/buy workflow",
      "Execution credit system",
      "Publisher profile and rating system",
    ],
    architecture: {
      frontend:
        "Agent marketplace, agent detail pages, install/rent buttons, user dashboard, publisher console, and execution logs.",
      backend:
        "Agent registry, execution router, billing/credit engine, publisher payout records, review system, and agent run telemetry.",
      codebase:
        "Next.js marketplace UI, Node.js orchestration API, Postgres agent registry, optional Python agent runtime workers.",
      modules: ["agents", "agent_publishers", "agent_installs", "agent_runs", "agent_reviews", "agent_revenue"],
    },
    recommendedUtilities: ["project_website", "agent_catalog", "marketplace_module", "developer_portal", "analytics"],
  },
  {
    id: "student_ai_platform",
    title: "Student AI Platform",
    category: "Education AI",
    badge: "STUDENT AI",
    description:
      "Launch AI tutors, study notes, flashcards, exam preparation, course access, certification, and student learning support.",
    chips: ["AI", "EDUCATION", "STUDENT TOOLS", "EXAM PREP", "CERTIFICATION"],
    launchModel:
      "Structured student AI platform launch for learning assistance, course access, certification, scholarship support, and AI-powered study workflows.",
    allocationDefaults: [
      "Student access allocation",
      "Scholarship/support reserve",
      "Tutor marketplace reserve",
      "Certification utility reserve",
    ],
    trustDefaults: [
      "Educational-use disclosure",
      "No exam cheating support",
      "Content accuracy warning",
      "Certification proof enabled",
    ],
    readinessExpectations: [
      "Student dashboard",
      "AI tutor interface",
      "Course/study module",
      "Certification or progress tracking",
    ],
    architecture: {
      frontend:
        "Student dashboard, subject selector, tutor chat, flashcard generator, exam prep workspace, and certification view.",
      backend:
        "Learning content generator, progress tracker, certification issuer, payment/credit engine, and scholarship registry.",
      codebase:
        "Next.js learning portal, Node.js API, Postgres student progress tables, optional AI content-generation worker.",
      modules: ["courses", "study_sessions", "tutor_threads", "flashcards", "certifications", "scholarships"],
    },
    recommendedUtilities: ["education_portal", "ai_tutor", "certification_proof", "project_website", "telegram_utility"],
  },
  {
    id: "science_virtual_lab",
    title: "Science & Virtual Lab Platform",
    category: "Science Lab",
    badge: "VIRTUAL LAB",
    description:
      "Launch virtual laboratories for physics, chemistry, biology, electronics, robotics, engineering simulations, and scientific tools.",
    chips: ["AI", "SCIENCE LAB", "SIMULATION", "STEM", "RESEARCH TOOLS"],
    launchModel:
      "Structured science and virtual laboratory launch where the token powers lab access, simulations, datasets, scientific calculators, and research workflows.",
    allocationDefaults: [
      "Lab access allocation",
      "Simulation compute reserve",
      "Research dataset reserve",
      "Science grant reserve",
    ],
    trustDefaults: [
      "Scientific accuracy warning",
      "Simulation limitation disclosure",
      "Dataset/source transparency",
      "Academic-use posture",
    ],
    readinessExpectations: [
      "Virtual lab surface",
      "Simulation module",
      "Dataset access logic",
      "Student/researcher workflow",
    ],
    architecture: {
      frontend:
        "Virtual lab dashboard, experiment selector, simulation canvas, results panel, report generator, and lab history.",
      backend:
        "Simulation engine connector, dataset registry, experiment templates, lab credit metering, and report storage.",
      codebase:
        "Next.js interface, Node.js API, Postgres lab/dataset records, optional Python scientific computation workers.",
      modules: ["labs", "experiments", "simulations", "datasets", "lab_reports", "scientific_models"],
    },
    recommendedUtilities: ["education_portal", "research_portal", "virtual_lab", "certification_proof", "analytics"],
  },
  {
    id: "research_economy",
    title: "Research Economy",
    category: "Research Network",
    badge: "RESEARCH",
    description:
      "Launch research funding, publishing, peer review, citation reputation, datasets, grant proposals, and scientific collaboration.",
    chips: ["AI", "RESEARCH", "GRANTS", "PEER REVIEW", "PUBLISHING"],
    launchModel:
      "Structured research economy launch for proposal funding, literature review, publishing, peer review rewards, datasets, reputation, and grant governance.",
    allocationDefaults: [
      "Research grant allocation",
      "Peer-review reward pool",
      "Dataset access reserve",
      "Publication incentive pool",
    ],
    trustDefaults: [
      "Research integrity disclosure",
      "Peer-review transparency",
      "Source/citation tracking",
      "Grant governance enabled",
    ],
    readinessExpectations: [
      "Research proposal flow",
      "Reviewer/researcher profiles",
      "Grant/funding workflow",
      "Citation and proof records",
    ],
    architecture: {
      frontend:
        "Research portal, proposal builder, literature review workspace, grant board, publication profile, and reviewer dashboard.",
      backend:
        "Grant registry, proposal workflow, reviewer scoring, citation metadata, funding records, and proof events.",
      codebase:
        "Next.js research portal, Node.js APIs, Postgres proposal/review tables, optional AI literature-review worker.",
      modules: ["proposals", "reviews", "grants", "citations", "publications", "research_profiles"],
    },
    recommendedUtilities: ["research_portal", "documentation_pack", "verification_layer", "dataset_marketplace", "analytics"],
  },
  {
    id: "data_marketplace",
    title: "Data Marketplace",
    category: "Data Economy",
    badge: "DATA MARKET",
    description:
      "Launch a marketplace for buying, selling, licensing, verifying, and monetizing datasets for AI builders and enterprises.",
    chips: ["AI", "DATA ECONOMY", "DATASET MARKETPLACE", "LICENSING", "QUALITY PROOF"],
    launchModel:
      "Structured data marketplace launch where the token powers dataset access, contributor rewards, quality verification, and enterprise subscriptions.",
    allocationDefaults: [
      "Dataset contributor allocation",
      "Data quality reserve",
      "Enterprise access reserve",
      "Marketplace liquidity reserve",
    ],
    trustDefaults: [
      "Data license disclosure",
      "Privacy compliance warning",
      "Dataset provenance tracking",
      "Quality verification enabled",
    ],
    readinessExpectations: [
      "Dataset catalog",
      "Licensing model",
      "Contributor upload flow",
      "Quality/provenance proof",
    ],
    architecture: {
      frontend:
        "Dataset marketplace, dataset detail pages, upload portal, license selection, buyer dashboard, and contributor console.",
      backend:
        "Dataset registry, license records, access control, provenance metadata, payment/credit engine, and file storage integration.",
      codebase:
        "Next.js marketplace UI, Node.js API, Postgres dataset/license tables, object storage for dataset files.",
      modules: ["datasets", "licenses", "contributors", "purchases", "provenance", "quality_reviews"],
    },
    recommendedUtilities: ["dataset_marketplace", "marketplace_module", "verification_layer", "project_website", "analytics"],
  },
  {
    id: "ai_trading_intelligence",
    title: "AI Trading Intelligence",
    category: "Trading AI",
    badge: "MARKET AI",
    description:
      "Launch AI trading bots, market analysis, portfolio optimization, strategy marketplaces, backtesting, and risk tools.",
    chips: ["AI", "TRADING TOOLS", "MARKET ANALYTICS", "RISK ENGINE", "STRATEGY MARKETPLACE"],
    launchModel:
      "Structured AI trading intelligence launch where the token powers premium analytics, strategy access, risk intelligence, and market tooling subscriptions.",
    allocationDefaults: [
      "Strategy marketplace allocation",
      "Risk engine reserve",
      "Analytics access reserve",
      "Trader incentive pool",
    ],
    trustDefaults: [
      "No financial advice disclosure",
      "No profit guarantee",
      "Risk warning required",
      "Strategy performance transparency",
    ],
    readinessExpectations: [
      "Trading dashboard",
      "Risk disclosure layer",
      "Strategy marketplace",
      "Backtesting or analytics module",
    ],
    architecture: {
      frontend:
        "Trading dashboard, strategy cards, portfolio view, risk score panel, signal subscription screen, and alert center.",
      backend:
        "Market-data adapter, strategy registry, backtesting service, subscription/credit engine, and risk scoring jobs.",
      codebase:
        "Next.js dashboard, Node.js API, Postgres strategies/signals tables, optional Python analytics workers.",
      modules: ["strategies", "signals", "backtests", "portfolios", "subscriptions", "risk_scores"],
    },
    recommendedUtilities: ["trading_dashboard", "telegram_utility", "documentation_pack", "analytics", "verification_layer"],
  },
  {
    id: "ai_creator_studio",
    title: "AI Creator Studio",
    category: "Creator AI",
    badge: "CREATOR AI",
    description:
      "Launch AI tools for YouTube scripts, podcasts, blogs, courses, e-books, marketing campaigns, and social content.",
    chips: ["AI", "CREATOR STUDIO", "CONTENT TOOLS", "MEDIA", "CAMPAIGN BUILDER"],
    launchModel:
      "Structured AI creator studio launch where the token powers content generation, templates, subscriptions, creator tools, and marketplace activity.",
    allocationDefaults: [
      "Creator reward allocation",
      "Template marketplace reserve",
      "Content generation credit pool",
      "Community growth reserve",
    ],
    trustDefaults: [
      "AI content disclosure",
      "Copyright responsibility warning",
      "Creator ownership clarity",
      "Moderation enabled",
    ],
    readinessExpectations: [
      "Creator dashboard",
      "Content generation workflow",
      "Template library",
      "Publishing or export flow",
    ],
    architecture: {
      frontend:
        "Creator studio dashboard, content workflow cards, template gallery, campaign calendar, export panel, and brand workspace.",
      backend:
        "Content generation API, template registry, publishing/export service, credit metering, and subscription records.",
      codebase:
        "Next.js creator UI, Node.js API routes, Postgres content/template tables, optional media generation workers.",
      modules: ["creator_projects", "templates", "content_jobs", "campaigns", "exports", "subscriptions"],
    },
    recommendedUtilities: ["project_website", "social_launch_kit", "app_template", "marketplace_module", "analytics"],
  },
  {
    id: "ai_social_platform",
    title: "AI Social Platform",
    category: "Social AI",
    badge: "SOCIAL AI",
    description:
      "Launch AI-powered social media, creator rewards, engagement rewards, subscriptions, moderation, and community governance.",
    chips: ["AI", "SOCIAL NETWORK", "CREATOR REWARDS", "ENGAGEMENT", "COMMUNITY"],
    launchModel:
      "Structured AI social platform launch where the token powers participation, creator/community incentives, premium features, moderation, and governance.",
    allocationDefaults: [
      "Creator reward allocation",
      "Engagement incentive pool",
      "Moderation reserve",
      "Community governance reserve",
    ],
    trustDefaults: [
      "Anti-spam controls",
      "Content moderation enabled",
      "Reward farming protection",
      "Community rules required",
    ],
    readinessExpectations: [
      "User profile system",
      "Content/reward model",
      "Community moderation logic",
      "Engagement tracking",
    ],
    architecture: {
      frontend:
        "Social feed, creator profiles, community spaces, engagement dashboard, token-gated posts, and moderation view.",
      backend:
        "Content registry, engagement tracker, reward calculation service, moderation pipeline, and community governance records.",
      codebase:
        "Next.js social UI, Node.js APIs, Postgres feed/reward tables, optional AI moderation worker.",
      modules: ["posts", "creators", "engagements", "rewards", "communities", "moderation_events"],
    },
    recommendedUtilities: ["project_website", "social_launch_kit", "telegram_utility", "token_gated_access", "analytics"],
  },
  {
    id: "enterprise_ai_automation",
    title: "Enterprise AI Automation",
    category: "Enterprise AI",
    badge: "B2B AI",
    description:
      "Launch AI agents and automation for customer support, document verification, workflow automation, supply chains, and business operations.",
    chips: ["AI", "ENTERPRISE", "WORKFLOW AUTOMATION", "B2B", "DOCUMENT INTELLIGENCE"],
    launchModel:
      "Structured enterprise AI automation launch for businesses using AI agents for support, documents, operations, supply-chain tracking, and productivity systems.",
    allocationDefaults: [
      "Enterprise service allocation",
      "Workflow automation reserve",
      "Partner integration reserve",
      "Customer support reserve",
    ],
    trustDefaults: [
      "Business-use disclosure",
      "Data privacy controls",
      "Audit logging enabled",
      "Service-level clarity",
    ],
    readinessExpectations: [
      "Business dashboard",
      "Workflow builder",
      "Enterprise access controls",
      "Audit and reporting layer",
    ],
    architecture: {
      frontend:
        "Enterprise admin dashboard, workflow builder, automation status board, reports, organization settings, and role access screens.",
      backend:
        "Workflow engine, organization accounts, role-based access, audit logs, billing/credit engine, and integration connectors.",
      codebase:
        "Next.js enterprise console, Node.js API, Postgres org/workflow/audit tables.",
      modules: ["organizations", "workflows", "automations", "audit_logs", "service_plans", "enterprise_users"],
    },
    recommendedUtilities: ["project_website", "app_template", "analytics", "verification_layer", "documentation_pack"],
  },
  {
    id: "healthcare_medical_ai",
    title: "Healthcare & Medical AI",
    category: "Healthcare AI",
    badge: "MEDICAL AI",
    description:
      "Launch medical research collaboration, telemedicine support, health-data systems, diagnostic assistance, and drug-discovery workflows.",
    chips: ["AI", "HEALTHCARE", "MEDICAL RESEARCH", "TELEMEDICINE", "DATA PRIVACY"],
    launchModel:
      "Structured healthcare and medical AI launch for research collaboration, telemedicine support, health-data workflows, diagnostic assistance, and medical research systems.",
    allocationDefaults: [
      "Medical research allocation",
      "Health data compliance reserve",
      "Provider verification reserve",
      "Patient support reserve",
    ],
    trustDefaults: [
      "Medical disclaimer required",
      "No diagnosis guarantee",
      "Data privacy warning",
      "Compliance review recommended",
    ],
    readinessExpectations: [
      "Healthcare disclosure layer",
      "Provider/research profile logic",
      "Privacy-aware data handling",
      "Compliance review before public launch",
    ],
    architecture: {
      frontend:
        "Healthcare portal, research workspace, provider dashboard, patient-safe information screens, and compliance notices.",
      backend:
        "Privacy-aware access control, consent records, research registry, audit logs, and compliance review records.",
      codebase:
        "Next.js compliance-first UI, Node.js API, Postgres consent/audit/research tables.",
      modules: ["providers", "research_cases", "consent_records", "health_data_access", "audit_logs", "compliance_reviews"],
    },
    recommendedUtilities: ["project_website", "documentation_pack", "verification_layer", "research_portal", "analytics"],
  },
  {
    id: "ai_freelance_work_marketplace",
    title: "AI Freelance & Work Marketplace",
    category: "Work Market",
    badge: "WORK AI",
    description:
      "Launch a marketplace for hiring developers, designers, AI specialists, researchers, and service providers using escrow and reputation.",
    chips: ["AI", "WORK MARKET", "FREELANCE", "ESCROW", "REPUTATION"],
    launchModel:
      "Structured AI freelance and work marketplace launch using tokenized escrow, reputation, job posting, service listings, and marketplace payments.",
    allocationDefaults: [
      "Worker reward allocation",
      "Escrow liquidity reserve",
      "Reputation incentive pool",
      "Marketplace growth reserve",
    ],
    trustDefaults: [
      "Escrow clarity",
      "Dispute policy required",
      "Reputation anti-abuse controls",
      "Service delivery disclosure",
    ],
    readinessExpectations: [
      "Job marketplace",
      "Escrow/payment flow",
      "Worker profiles",
      "Dispute/reputation tracking",
    ],
    architecture: {
      frontend:
        "Job board, freelancer profiles, service listings, escrow status page, employer dashboard, and worker dashboard.",
      backend:
        "Job registry, escrow records, reputation engine, dispute workflow, payout tracking, and service marketplace records.",
      codebase:
        "Next.js marketplace, Node.js APIs, Postgres jobs/escrow/reputation tables.",
      modules: ["jobs", "offers", "escrows", "disputes", "reviews", "freelancer_profiles"],
    },
    recommendedUtilities: ["marketplace_module", "verification_layer", "telegram_utility", "analytics", "project_website"],
  },
  {
    id: "developer_ai_ecosystem",
    title: "Developer AI Ecosystem",
    category: "Developer AI",
    badge: "DEV AI",
    description:
      "Launch SDKs, APIs, app deployment tools, smart contract assistance, bug bounties, developer tools, and builder marketplaces.",
    chips: ["AI", "DEVELOPER ECOSYSTEM", "SDK", "API ACCESS", "BUG BOUNTY"],
    launchModel:
      "Structured developer AI ecosystem launch for APIs, SDKs, deployment credits, smart contract tooling, app templates, bounties, and builder adoption.",
    allocationDefaults: [
      "Developer grant allocation",
      "SDK/API access reserve",
      "Bug bounty reward pool",
      "Open-source funding reserve",
    ],
    trustDefaults: [
      "API terms clarity",
      "Developer documentation required",
      "Bug bounty rules required",
      "Open-source/license disclosure",
    ],
    readinessExpectations: [
      "Developer portal",
      "API key/access logic",
      "SDK documentation",
      "Bug bounty or grant flow",
    ],
    architecture: {
      frontend:
        "Developer portal, API dashboard, SDK docs, bug bounty board, deployment console, and app template library.",
      backend:
        "API key service, usage metering, developer registry, grant/bounty workflow, and deployment metadata.",
      codebase:
        "Next.js docs/developer portal, Node.js API, Postgres developer/API/bounty tables.",
      modules: ["developers", "api_keys", "sdk_downloads", "bounties", "grants", "deployments"],
    },
    recommendedUtilities: ["developer_portal", "api_docs", "documentation_pack", "analytics", "verification_layer"],
  },
  {
    id: "ai_business_launch_hub",
    title: "AI Business Launch Hub",
    category: "Business AI",
    badge: "BUSINESS AI",
    description:
      "Launch one-click AI business products such as CRM, school portals, e-commerce, support agents, and workflow automation.",
    chips: ["AI", "BUSINESS APPS", "CRM", "E-COMMERCE", "AUTOMATION"],
    launchModel:
      "Structured AI business launch hub for creators generating business apps, CRM systems, school portals, e-commerce tools, and support automation.",
    allocationDefaults: [
      "Business app allocation",
      "Template generation reserve",
      "Customer support reserve",
      "Partner integration reserve",
    ],
    trustDefaults: [
      "Business-use disclosure",
      "Template limitation warning",
      "Data handling clarity",
      "Service support posture",
    ],
    readinessExpectations: [
      "Business app selector",
      "Template deployment flow",
      "Customer/support dashboard",
      "Service-credit logic",
    ],
    architecture: {
      frontend:
        "Business app launcher, template selector, generated app preview, customer support panel, and admin dashboard.",
      backend:
        "Template generator, project provisioning service, deployment metadata, subscription/credit engine, and support agent registry.",
      codebase:
        "Next.js business portal, Node.js API, Postgres project/template tables, optional deployment workers.",
      modules: ["business_templates", "generated_apps", "deployments", "subscriptions", "support_agents"],
    },
    recommendedUtilities: ["app_template", "project_website", "analytics", "documentation_pack", "telegram_utility"],
  },
  {
    id: "ai_education_research_ecosystem",
    title: "AI Education & Research Ecosystem",
    category: "Full Ecosystem",
    badge: "AI RESEARCH HUB",
    description:
      "Launch a full AI education and research ecosystem combining tutors, labs, research assistants, grants, datasets, credentials, agents, and developer apps.",
    chips: ["AI", "EDUCATION", "RESEARCH", "AGENTS", "FULL ECOSYSTEM"],
    launchModel:
      "Flagship AI ecosystem launch combining student learning, research assistants, virtual labs, research funding, dataset marketplaces, academic credential verification, agents, and developer AI apps.",
    allocationDefaults: [
      "Student access allocation",
      "Research grant reserve",
      "AI agent marketplace reserve",
      "Developer ecosystem reserve",
      "Credential verification reserve",
    ],
    trustDefaults: [
      "Academic integrity disclosure",
      "Research/source transparency",
      "AI output limitations",
      "Credential proof enabled",
    ],
    readinessExpectations: [
      "Multi-module ecosystem plan",
      "Student/researcher/developer paths",
      "Credential or proof layer",
      "Long-term utility roadmap",
    ],
    architecture: {
      frontend:
        "Multi-module ecosystem dashboard with Student, Research, AI Agents, Data, Developer, Lab, and Credential sections.",
      backend:
        "Unified project registry, module access control, usage credits, credential proof, grant/research records, and AI workflow services.",
      codebase:
        "Next.js ecosystem portal, Node.js API layer, Postgres multi-module registry, optional Python AI/research workers.",
      modules: ["learning", "research", "agents", "datasets", "credentials", "grants", "developer_apps"],
    },
    recommendedUtilities: ["education_portal", "research_portal", "agent_catalog", "dataset_marketplace", "developer_portal", "verification_layer"],
  },
];

const PRIME_CREATOR_UTILITY_SUITE: Array<{
  id: string;
  title: string;
  description: string;
}> = [
  {
    id: "project_website",
    title: "Project Website",
    description: "Generate a polished public website with utility, roadmap, disclosure, links, and launch information.",
  },
  {
    id: "telegram_utility",
    title: "Telegram Utility",
    description: "Enable community link, bot utilities, announcements, moderation, token-holder checks, or alerts.",
  },
  {
    id: "social_launch_kit",
    title: "X / Social Launch Kit",
    description: "Prepare launch posts, pinned copy, campaign calendar, community rules, and thread structures.",
  },
  {
    id: "app_template",
    title: "App Experience Template",
    description: "Select a professional app-style experience such as marketplace, education, agent, trading, or research portal.",
  },
  {
    id: "ai_tutor",
    title: "AI Tutor Module",
    description: "Attach a tutoring, study, explanation, exam-prep, or guided-learning assistant to the project.",
  },
  {
    id: "agent_catalog",
    title: "Agent Catalog",
    description: "Add agent listings, publisher profiles, install/rent flows, and agent execution records.",
  },
  {
    id: "developer_portal",
    title: "Developer Portal",
    description: "Add API keys, SDK docs, app templates, developer onboarding, and usage dashboards.",
  },
  {
    id: "api_docs",
    title: "API Documentation",
    description: "Generate documentation for endpoints, usage credits, authentication, limits, and developer workflows.",
  },
  {
    id: "education_portal",
    title: "Education Portal",
    description: "Add courses, study sessions, certifications, student dashboards, and learning workflows.",
  },
  {
    id: "research_portal",
    title: "Research Portal",
    description: "Add proposals, publications, peer review, grants, citations, and research collaboration surfaces.",
  },
  {
    id: "virtual_lab",
    title: "Virtual Lab",
    description: "Add science simulations, experiment templates, reports, datasets, and guided lab workflows.",
  },
  {
    id: "dataset_marketplace",
    title: "Dataset Marketplace",
    description: "Add dataset upload, licensing, provenance, quality reviews, access controls, and purchases.",
  },
  {
    id: "trading_dashboard",
    title: "Trading Dashboard",
    description: "Add signals, strategy cards, portfolio view, risk scoring, and financial-risk disclosures.",
  },
  {
    id: "marketplace_module",
    title: "Marketplace Module",
    description: "Add listings, purchases, seller profiles, service categories, payments, and discovery surfaces.",
  },
  {
    id: "token_gated_access",
    title: "Token-Gated Access",
    description: "Use the token to unlock courses, dashboards, communities, research access, tools, or content.",
  },
  {
    id: "documentation_pack",
    title: "Documentation Pack",
    description: "Generate litepaper, utility statement, launch summary, liquidity plan, risk disclosure, and roadmap.",
  },
  {
    id: "verification_layer",
    title: "Verification & Trust Layer",
    description: "Add creator verification, metadata proof, liquidity proof, RioExplorer proof, and disclosure proof.",
  },
  {
    id: "analytics",
    title: "Creator Analytics Dashboard",
    description: "Track holders, volume, liquidity, market cap, community growth, utility usage, and project activity.",
  },
];


const PRIME_LIQUIDITY_GRADES: Array<{
  id: PrimeLiquidityGrade;
  title: string;
  range: string;
  badge: string;
  description: string;
  minUsd: number;
  maxUsd: number | null;
}> = [
  {
    id: "minister",
    title: "Minister Liquidity",
    range: "$500 – $1,000",
    badge: "Entry-grade readiness",
    description: "Entry-grade market readiness for early Prime issuers.",
    minUsd: 500,
    maxUsd: 1000,
  },
  {
    id: "senior_minister",
    title: "Senior Minister Liquidity",
    range: "$1,000 – $10,000",
    badge: "Structured depth",
    description: "Deeper launch liquidity for serious structured issuers.",
    minUsd: 1000,
    maxUsd: 10000,
  },
  {
    id: "prime_minister",
    title: "Prime Minister Liquidity",
    range: "$10,000+",
    badge: "Premium readiness",
    description: "Premium market readiness for high-conviction Prime launches.",
    minUsd: 10000,
    maxUsd: null,
  },
];

function primeLiquidityGradeTone(id: PrimeLiquidityGrade, active: boolean) {
  const tones = {
    minister: active
      ? {
          card: "border-emerald-300/55 bg-emerald-500/[0.14] shadow-[0_0_0_1px_rgba(16,185,129,0.14)_inset,0_18px_55px_rgba(16,185,129,0.10)]",
          range: "text-emerald-200",
          badge: "border-emerald-300/35 bg-emerald-400/15 text-emerald-100",
          label: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
        }
      : {
          card: "border-emerald-300/18 bg-emerald-500/[0.045] hover:border-emerald-300/32 hover:bg-emerald-500/[0.075]",
          range: "text-emerald-200/80",
          badge: "border-emerald-300/18 bg-emerald-500/[0.06] text-emerald-100/55",
          label: "border-emerald-300/18 bg-emerald-500/[0.06] text-emerald-100/55",
        },
    senior_minister: active
      ? {
          card: "border-cyan-300/55 bg-cyan-500/[0.14] shadow-[0_0_0_1px_rgba(34,211,238,0.14)_inset,0_18px_55px_rgba(34,211,238,0.10)]",
          range: "text-cyan-200",
          badge: "border-cyan-300/35 bg-cyan-400/15 text-cyan-100",
          label: "border-cyan-300/30 bg-cyan-500/10 text-cyan-100",
        }
      : {
          card: "border-cyan-300/18 bg-cyan-500/[0.045] hover:border-cyan-300/32 hover:bg-cyan-500/[0.075]",
          range: "text-cyan-200/80",
          badge: "border-cyan-300/18 bg-cyan-500/[0.06] text-cyan-100/55",
          label: "border-cyan-300/18 bg-cyan-500/[0.06] text-cyan-100/55",
        },
    prime_minister: active
      ? {
          card: "border-amber-300/60 bg-amber-500/[0.16] shadow-[0_0_0_1px_rgba(245,158,11,0.16)_inset,0_20px_60px_rgba(245,158,11,0.14)]",
          range: "text-amber-200",
          badge: "border-amber-300/40 bg-amber-400/18 text-amber-100",
          label: "border-amber-300/32 bg-amber-500/12 text-amber-100",
        }
      : {
          card: "border-amber-300/20 bg-amber-500/[0.05] hover:border-amber-300/36 hover:bg-amber-500/[0.08]",
          range: "text-amber-200/85",
          badge: "border-amber-300/20 bg-amber-500/[0.07] text-amber-100/60",
          label: "border-amber-300/20 bg-amber-500/[0.07] text-amber-100/60",
        },
  } as const;

  return tones[id];
}

function shell() {
  return "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_18%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.06),transparent_18%),linear-gradient(180deg,#020617_0%,#07101d_40%,#071424_100%)] text-white";
}

function card(extra = "") {
  return `rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,21,38,0.92),rgba(8,13,24,0.96))] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.84)] backdrop-blur-xl ${extra}`;
}

function sectionEyebrow() {
  return "text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/85";
}

function inputClass() {
  return "mt-2 h-12 w-full rounded-2xl border border-white/10 bg-[#060a14] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/45 focus:ring-2 focus:ring-amber-500/10";
}

function textAreaClass() {
  return "mt-2 min-h-[112px] w-full rounded-2xl border border-white/10 bg-[#060a14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/45 focus:ring-2 focus:ring-amber-500/10";
}

function fieldLabel(text: string) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
      {text}
    </label>
  );
}

function actionButton(primary = false) {
  return primary
    ? "inline-flex h-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-[linear-gradient(90deg,rgba(245,158,11,0.96),rgba(217,119,6,0.96))] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_-24px_rgba(245,158,11,0.68)] hover:translate-y-[-1px]"
    : "inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-medium text-white/88 hover:bg-white/[0.07]";
}

function pill(
  tone: "gold" | "slate" | "emerald" | "cyan" | "violet" | "rose" | "neutral" = "neutral",
) {
  const tones: Record<string, string> = {
    gold: "border-amber-300/35 bg-amber-500/10 text-amber-200",
    slate: "border-sky-300/25 bg-sky-500/10 text-sky-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    violet: "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200",
    rose: "border-rose-400/25 bg-rose-500/10 text-rose-200",
    neutral: "border-white/10 bg-white/5 text-slate-300",
  };

  return `inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tones[tone]}`;
}

function feeBandLabel(tier?: string) {
  switch (tier) {
    case "standard":
      return "Standard";
    case "advanced":
      return "Advanced";
    case "premium":
      return "Premium";
    case "hybrid":
      return "Hybrid";
    default:
      return "Prime";
  }
}

function templateAccent(template: PrimeTemplate | null | undefined) {
  const id = template?.id?.toLowerCase() || "";
  const label = (template?.name || "").toLowerCase();

  if (id.includes("community") || label.includes("community")) {
    return {
      shell:
        "border-amber-400/24 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(255,255,255,0.025))]",
      selected:
        "border-amber-400/48 bg-[linear-gradient(180deg,rgba(245,158,11,0.18),rgba(255,255,255,0.04))] shadow-[0_18px_45px_-30px_rgba(245,158,11,0.6)]",
      glow: "bg-amber-400/10",
      pillTone: "gold" as const,
    };
  }

  if (id.includes("governance") || label.includes("governance")) {
    return {
      shell:
        "border-sky-400/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-sky-400/40 bg-[linear-gradient(180deg,rgba(56,189,248,0.15),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(56,189,248,0.5)]",
      glow: "bg-sky-400/10",
      pillTone: "slate" as const,
    };
  }

  if (
    id.includes("revenue") ||
    label.includes("revenue") ||
    id.includes("defi") ||
    label.includes("defi")
  ) {
    return {
      shell:
        "border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-emerald-400/40 bg-[linear-gradient(180deg,rgba(16,185,129,0.15),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(16,185,129,0.45)]",
      glow: "bg-emerald-400/10",
      pillTone: "emerald" as const,
    };
  }

  if (id.includes("asset") || label.includes("asset")) {
    return {
      shell:
        "border-yellow-400/18 bg-[linear-gradient(180deg,rgba(250,204,21,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-yellow-400/34 bg-[linear-gradient(180deg,rgba(250,204,21,0.16),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(250,204,21,0.45)]",
      glow: "bg-yellow-300/10",
      pillTone: "gold" as const,
    };
  }

  if (id.includes("ai") || label.includes("ai") || id.includes("infra") || label.includes("infra")) {
    return {
      shell:
        "border-cyan-400/18 bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-cyan-400/36 bg-[linear-gradient(180deg,rgba(34,211,238,0.16),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(34,211,238,0.45)]",
      glow: "bg-cyan-400/10",
      pillTone: "cyan" as const,
    };
  }

  if (id.includes("creator") || label.includes("creator") || id.includes("gaming") || label.includes("gaming")) {
    return {
      shell:
        "border-rose-400/18 bg-[linear-gradient(180deg,rgba(244,63,94,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-rose-400/36 bg-[linear-gradient(180deg,rgba(244,63,94,0.16),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(244,63,94,0.45)]",
      glow: "bg-rose-400/10",
      pillTone: "rose" as const,
    };
  }

  if (id.includes("dao") || label.includes("dao") || id.includes("nft") || label.includes("nft")) {
    return {
      shell:
        "border-fuchsia-400/16 bg-[linear-gradient(180deg,rgba(217,70,239,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-fuchsia-400/34 bg-[linear-gradient(180deg,rgba(217,70,239,0.15),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(217,70,239,0.45)]",
      glow: "bg-fuchsia-400/10",
      pillTone: "violet" as const,
    };
  }

  return {
    shell:
      "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]",
    selected:
      "border-amber-300/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_18px_45px_-30px_rgba(255,255,255,0.15)]",
    glow: "bg-white/5",
    pillTone: "neutral" as const,
  };
}

const PRIME_FINALIZER_ADDRESS =
  process.env.NEXT_PUBLIC_PRIME_FINALIZER_ADDRESS ||
  process.env.NEXT_PUBLIC_PUMP_FINALIZER_ADDRESS ||
  "rio1e9hszjll3d4pkn74n2th47wwyyh228wn2vhmsf";

// Prime is an issuer/project rail, not a Pump-style fixed mechanic.
// Mainnet policy: no forced platform reserve.
// Creator-defined total supply remains flexible, including very small or very large supplies.
const PRIME_RESERVE_AMOUNT_BASE = "0";

function toPrimeBaseUnits(value: string, decimals = 6): bigint {
  const raw = String(value || "").trim();
  if (!raw) return BigInt(0);

  const [wholePart, fracPart = ""] = raw.split(".");
  const whole = wholePart.replace(/[^\d]/g, "") || "0";
  const frac = fracPart.replace(/[^\d]/g, "").slice(0, decimals).padEnd(decimals, "0");

  return BigInt(`${whole}${frac}`);
}

function normalizePrimeLifecycleLabel(label: string) {
  const raw = String(label || "").trim();
  const normalized = raw.toLowerCase();

  if (
    normalized.includes("cmc") ||
    normalized.includes("gecko") ||
    normalized.includes("coinmarket") ||
    normalized.includes("coingecko")
  ) {
    return "RioExplorer";
  }

  return raw;
}

function normalizePrimeLifecycleState(state: LaunchLifecycleState): LaunchLifecycleState {
  return {
    ...state,
    steps: state.steps.map((step) => ({
      ...step,
      label: normalizePrimeLifecycleLabel(step.label),
    })),
  };
}

function syncPrimeRioLightAddress(address: string) {
  if (typeof window === "undefined" || !address) return;

  try {
    window.localStorage.setItem("spherio_wallet_address", address);
    window.localStorage.setItem("riolight.activeAddress", address);
    window.localStorage.setItem("spherio.riolight.address", address);
    window.localStorage.setItem("spherio.wallet.address", address);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(
      new CustomEvent("spherio:riolight-connected", {
        detail: { address },
      }),
    );
  } catch {
    // Local UI sync only; never block Prime execution.
  }
}

async function withPrimeTimeout<T>(promise: Promise<T>, ms = 20000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          "RioLight approval did not open or respond in time. Reload RioLight, refresh this page, and try again.",
        ),
      );
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function humanizePrimeError(error: unknown, fallback = "Prime request failed. Please review your wallet and try again.") {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const message = raw.toLowerCase();

  if (
    message.includes("insufficient funds") ||
    message.includes("insufficient fee") ||
    message.includes("insufficient creation fee") ||
    message.includes("spendable balance") ||
    message.includes("account") && message.includes("has") && message.includes("but")
  ) {
    return "Prime creation failed because the connected wallet does not have enough unlocked RIO for the required creation fee and gas. Please fund the wallet and try again.";
  }

  if (message.includes("creation fee")) {
    return "Prime creation failed because the factory rejected the creation fee. Please confirm the required fee and try again.";
  }

  if (message.includes("rejected") || message.includes("denied") || message.includes("cancel")) {
    return "Prime creation was cancelled or rejected in the wallet. Please approve the RioLight or wallet confirmation to continue.";
  }

  if (message.includes("missing") && message.includes("factory")) {
    return "Prime creation is not ready because the SPO-20 factory address is missing from the app configuration.";
  }

  if (message.includes("no token address") || message.includes("token address was found")) {
    return "Prime creation transaction completed, but the token address could not be resolved. Please check the transaction in RioExplorer.";
  }

  if (message.includes("metadata registration failed")) {
    return "Prime project was created, but metadata registration failed. The token may exist on-chain while RioExplorer indexing catches up.";
  }

  return fallback;
}

function extractPrimeContractAddressFromExecute(result: any): string | null {
  const events = Array.isArray(result?.events) ? result.events : [];

  for (const event of events) {
    if (event?.type !== "wasm") continue;
    const attrs = Array.isArray(event.attributes) ? event.attributes : [];
    const action = attrs.find((a: any) => a?.key === "action")?.value;
    const contract = attrs.find((a: any) => a?.key === "contract")?.value;

    if (action === "token_created" && typeof contract === "string" && contract.startsWith("rio1")) {
      return contract;
    }
  }

  for (const event of events) {
    if (event?.type !== "instantiate") continue;
    const attrs = Array.isArray(event.attributes) ? event.attributes : [];
    const contract = attrs.find((a: any) => a?.key === "_contract_address")?.value;

    if (typeof contract === "string" && contract.startsWith("rio1")) {
      return contract;
    }
  }

  if (typeof result?.contractAddress === "string" && result.contractAddress.startsWith("rio1")) {
    return result.contractAddress;
  }

  return null;
}

export default function PrimeCreatePage() {
  const [templates, setTemplates] = useState<PrimeTemplate[]>([]);
  const [approvedHybrids, setApprovedHybrids] = useState<string[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");
  const [lockedFrameworkId, setLockedFrameworkId] = useState<string>("");
  const [reviewingTemplateId, setReviewingTemplateId] = useState<string | null>(null);
  const [selectedNicheFamily, setSelectedNicheFamily] = useState<PrimeNicheFamily>("core");
  const [reviewingAiNicheId, setReviewingAiNicheId] = useState<string | null>(null);
  const [lockedAiNicheId, setLockedAiNicheId] = useState<string | null>(null);
  const [selectedCreatorUtilities, setSelectedCreatorUtilities] = useState<string[]>([]);
  const [hybridLabel, setHybridLabel] = useState("");
  const [liquidityBase, setLiquidityBase] = useState<PrimeLiquidityBase>("RIO");
  const [liquidityMode, setLiquidityMode] = useState<PrimeLiquidityMode>("guided");
  const [selectedLiquidityGrade, setSelectedLiquidityGrade] =
    useState<PrimeLiquidityGrade>("senior_minister");
  const [quote, setQuote] = useState<PrimeFeeQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<PrimeCreateSuccess | null>(null);
  const [metadataPackage, setMetadataPackage] = useState<PrimeMetadataPackage | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [surfaceState, setSurfaceState] = useState<PrimeLaunchSurfaceState | null>(null);
  const [surfaceLoading, setSurfaceLoading] = useState(true);
  const [surfaceError, setSurfaceError] = useState("");
  const [primeRioLightAddress, setPrimeRioLightAddress] = useState("");
  const [primeRioLightConnecting, setPrimeRioLightConnecting] = useState(false);

  const [primeRawError, setPrimeRawError] = useState<string | null>(null);
  const [primeRequestStatus, setPrimeRequestStatus] = useState<{
    tone: "success" | "error";
    title: string;
    body: string;
  } | null>(null);


  const [primeAutoLiquidity, setPrimeAutoLiquidity] =
    useState<PrimeAutoLiquidityState | null>(null);
  const [isPrimeLiquidityPanelOpen, setIsPrimeLiquidityPanelOpen] = useState(false);

  const primeFactoryAddress =
    process.env.NEXT_PUBLIC_PRIME_FACTORY_ADDRESS ||
    process.env.NEXT_PUBLIC_SPO20_FACTORY_ADDRESS ||
    process.env.NEXT_PUBLIC_PUMP_FACTORY_ADDRESS ||
    "";

  const primeFactoryFeeUrio =
    process.env.NEXT_PUBLIC_PRIME_CREATE_FEE_URIO ||
    process.env.NEXT_PUBLIC_CREATE_TOKEN_FEE_URIO ||
    process.env.NEXT_PUBLIC_PUMP_CREATE_FEE_URIO ||
    "5000000";

  const [projectCategory, setProjectCategory] = useState("");
  const [projectIdea, setProjectIdea] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [projectStatement, setProjectStatement] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTemplates() {
      try {
        const response = await fetch("/api/prime/templates");
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Failed to load templates");
        }

        if (!isMounted) return;

        const nextTemplates = (data.templates ?? []) as PrimeTemplate[];
        setTemplates(nextTemplates);
        setApprovedHybrids((data.hybrids ?? []).map((item: { label: string }) => item.label));

        const firstTemplate = nextTemplates[0];
        if (firstTemplate) {
          setSelectedFrameworkId(firstTemplate.id);
          setLockedFrameworkId(firstTemplate.id);
          setLiquidityBase(firstTemplate.defaultLiquidityBases?.[0] ?? "RIO");
          setLiquidityMode(firstTemplate.defaultLiquidityMode ?? "guided");
          setProjectCategory(firstTemplate.name);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSurfaceState() {
      try {
        setSurfaceLoading(true);
        setSurfaceError("");

        const response = await fetch("/api/launches/prime", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as PrimeLaunchSurfaceResponse;

        if (!response.ok || !data.ok || !data.state) {
          throw new Error(data.error || "Failed to load Prime launch state.");
        }

        if (!cancelled) {
          setSurfaceState(data.state);
        }
      } catch (error) {
        if (!cancelled) {
          setSurfaceError(
            error instanceof Error ? error.message : "Failed to load Prime launch state.",
          );
          setSurfaceState(null);
        }
      } finally {
        if (!cancelled) {
          setSurfaceLoading(false);
        }
      }
    }

    loadSurfaceState();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedFramework = useMemo(
    () => templates.find((item) => item.id === selectedFrameworkId) ?? null,
    [templates, selectedFrameworkId],
  );

  const lockedFramework = useMemo(
    () => templates.find((item) => item.id === lockedFrameworkId) ?? selectedFramework,
    [templates, lockedFrameworkId, selectedFramework],
  );

  const reviewingTemplate = useMemo(
    () => templates.find((item) => item.id === reviewingTemplateId) ?? null,
    [templates, reviewingTemplateId],
  );

  const reviewingAiNiche = useMemo(
    () => AI_ECOSYSTEM_NICHES.find((item) => item.id === reviewingAiNicheId) ?? null,
    [reviewingAiNicheId],
  );

  const lockedAiNiche = useMemo(
    () => AI_ECOSYSTEM_NICHES.find((item) => item.id === lockedAiNicheId) ?? null,
    [lockedAiNicheId],
  );

  const reviewingAiCodebasePackage = useMemo(
    () => getPrimeAiCodebasePackage(reviewingAiNiche?.id || null),
    [reviewingAiNiche],
  );

  const recommendedUtilityIds = useMemo(
    () => new Set(lockedAiNiche?.recommendedUtilities ?? []),
    [lockedAiNiche],
  );

  useEffect(() => {
    if (!lockedFramework) return;

    setLiquidityBase(lockedFramework.defaultLiquidityBases?.[0] ?? "RIO");
    setLiquidityMode(lockedFramework.defaultLiquidityMode ?? "guided");

    if (!projectCategory) {
      setProjectCategory(lockedFramework.name);
    }

    if (lockedFramework.id !== "hybrid") {
      setHybridLabel("");
    }
  }, [lockedFramework, projectCategory]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!lockedFramework) return;

      try {
        setLoadingQuote(true);
        setQuoteError("");

        const response = await fetch("/api/prime/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: lockedFramework.id,
            rioPriceUsd: 1,
            hybridLabel: lockedFramework.id === "hybrid" ? hybridLabel || undefined : undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Failed to load fee quote");
        }

        if (!cancelled) {
          setQuote(data.quote);
        }
      } catch (error) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(error instanceof Error ? error.message : "Failed to load fee quote");
        }
      } finally {
        if (!cancelled) {
          setLoadingQuote(false);
        }
      }
    }

    loadQuote();

    return () => {
      cancelled = true;
    };
  }, [lockedFramework, hybridLabel]);

  function openTemplateReview(templateId: string) {
    setSelectedFrameworkId(templateId);
    setReviewingTemplateId(templateId);
  }

  function useReviewedTemplate() {
    if (!reviewingTemplate) return;

    setLockedFrameworkId(reviewingTemplate.id);
    setSelectedFrameworkId(reviewingTemplate.id);
    setProjectCategory(reviewingTemplate.name);
    setReviewingTemplateId(null);
  }

  function openAiNicheReview(nicheId: string) {
    setSelectedNicheFamily("ai_ecosystem");
    setReviewingAiNicheId(nicheId);
  }

  function useReviewedAiNiche() {
    if (!reviewingAiNiche) return;

    setSelectedNicheFamily("ai_ecosystem");
    setLockedAiNicheId(reviewingAiNiche.id);
    setProjectCategory(reviewingAiNiche.title);
    setProjectIdea(
      (current) =>
        current ||
        reviewingAiNiche.description ||
        reviewingAiNiche.launchModel ||
        `${reviewingAiNiche.title} project`,
    );
    setSelectedCreatorUtilities((current) =>
      Array.from(new Set([...current, ...reviewingAiNiche.recommendedUtilities])),
    );
    setReviewingAiNicheId(null);
  }

  function toggleCreatorUtility(utilityId: string) {
    setSelectedCreatorUtilities((current) =>
      current.includes(utilityId)
        ? current.filter((item) => item !== utilityId)
        : [...current, utilityId],
    );
  }

  function handleLogoPick() {
    fileInputRef.current?.click();
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoFileName(file.name);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  }

  async function handleCopyContract() {
    if (!success?.tokenAddress) return;

    try {
      await navigator.clipboard.writeText(success.tokenAddress);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch (error) {
      console.error(error);
    }
  }

  async function handlePrimeRioLightConnect() {
    try {
      setPrimeRioLightConnecting(true);

      const wallet = await connectRioLight();
      setPrimeRioLightAddress(wallet.address);
      syncPrimeRioLightAddress(wallet.address);

      setPrimeRequestStatus({
        tone: "success",
        title: "RioLight connected",
        body: `Prime execution signer connected: ${wallet.address.slice(0, 12)}…${wallet.address.slice(-8)}.`,
      });
    } catch (error) {
      setPrimeRequestStatus({
        tone: "error",
        title: "RioLight connection failed",
        body:
          error instanceof Error
            ? error.message
            : "Failed to connect RioLight. Unlock RioLight and try again.",
      });
    } finally {
      setPrimeRioLightConnecting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function detectPrimeRioLight() {
      try {
        const wallet = await connectRioLight();
        if (!cancelled) {
          setPrimeRioLightAddress(wallet.address);
          syncPrimeRioLightAddress(wallet.address);
        }
      } catch {
        // Silent detection only. User can click Connect Wallet manually.
      }
    }

    detectPrimeRioLight();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePrimeLiquidityConfirm() {
    if (!primeAutoLiquidity) {
      setPrimeRequestStatus({
        tone: "error",
        title: "Liquidity not ready",
        body: "Create a Prime project first. The token must be selected before liquidity can be confirmed.",
      });
      return;
    }

    try {
      const rioLight = typeof window !== "undefined" ? (window as any).riolight : null;

      const selectedGrade =
        PRIME_LIQUIDITY_GRADES.find((grade) => grade.id === primeAutoLiquidity.liquidityGrade) ||
        PRIME_LIQUIDITY_GRADES.find((grade) => grade.id === selectedLiquidityGrade);

      if (!rioLight?.requestSimulation) {
        throw new Error("RioLight extension is not available. Install or unlock RioLight, then retry.");
      }

      await rioLight.requestSimulation({
        action: "prime_auto_liquidity",
        spendAmount: selectedGrade?.range || "Prime liquidity",
        spendSymbol: primeAutoLiquidity.liquidityBase,
        receiveAmount: "LP position",
        receiveSymbol: `${primeAutoLiquidity.symbol}/RIO LP`,
        feeAmount: "Estimated dynamic",
        feeSymbol: "RIO",
        contractLabel: `Prime auto-liquidity: ${primeAutoLiquidity.projectName}`,
      });

      setPrimeRequestStatus({
        tone: "success",
        title: "RioLight liquidity confirmation created",
        body: "RioLight liquidity confirmation is ready. After approval, the LP position will appear here for copy, Pool visibility, Screener discovery, Trade, and RioExplorer proof.",
      });

      setPrimeAutoLiquidity({
        ...primeAutoLiquidity,
        lpPositionId:
          primeAutoLiquidity.lpPositionId ||
          `prime-lp:${primeAutoLiquidity.tokenAddress}:${primeAutoLiquidity.liquidityBase}`,
      });
    } catch (error) {
      setPrimeRequestStatus({
        tone: "error",
        title: "Liquidity confirmation failed",
        body: humanizePrimeError(error, "Prime liquidity confirmation failed. Please review your wallet and try again."),
      });
    }
  }

  async function waitForPrimeCreatedToken(params: {
    creator: string;
    symbol: string;
    projectName: string;
    attempts?: number;
    delayMs?: number;
  }) {
    const attempts = params.attempts ?? 24;
    const delayMs = params.delayMs ?? 2500;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch("/api/spo20/tokens", { cache: "no-store" });

        if (response.ok) {
          const data = await response.json();
          const tokens = Array.isArray(data.tokens)
            ? data.tokens
            : Array.isArray(data.items)
              ? data.items
              : Array.isArray(data.data)
                ? data.data
                : [];

          const match = tokens.find((token: any) => {
            const tokenSymbol = String(token.symbol || "").toUpperCase();
            const tokenCreator = String(token.creator || "");
            const tokenName = String(token.name || "");
            return (
              tokenSymbol === params.symbol.toUpperCase() &&
              (!params.creator || tokenCreator === params.creator) &&
              (!params.projectName || tokenName === params.projectName || tokenName.length > 0)
            );
          });

          if (match?.contract_address || match?.token_address) {
            return match;
          }
        }
      } catch (error) {
        console.warn("Prime settlement polling failed:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return null;
  }

  async function handleCreate() {
    if (!lockedFramework) return;

    setIsSubmitting(true);
    setPrimeRequestStatus({
      tone: "success",
      title: "Opening RioLight approval",
      body: "RioLight is preparing the Prime Project review. Keep the RioLight window open if it appears.",
    });
    setPrimeRawError(null);

    const approvalOpenWatchdog = window.setTimeout(() => {
      setIsSubmitting(false);
      setPrimeRequestStatus((current) =>
        current?.title === "Opening RioLight approval"
          ? {
              tone: "success",
              title: "RioLight approval opening",
              body: "RioLight is opening the approval window. If the popup is visible, continue there. This page will not lock while RioLight is active.",
            }
          : current,
      );
    }, 6000);

    try {
      if (!primeFactoryAddress) {
        throw new Error("Missing Prime/SPO-20 factory address.");
      }

      const resolvedSymbol = (symbol || "SPRM").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
      const resolvedName = (tokenName || `${lockedFramework.name} Prime Project`).trim();
      const resolvedSupply = totalSupply || "1000000000";
      const baseSupply = toPrimeBaseUnits(resolvedSupply, 6);
      const reserveBase = BigInt(PRIME_RESERVE_AMOUNT_BASE);

      const msg = {
        create_token: {
          name: resolvedName,
          symbol: resolvedSymbol,
          initial_supply: baseSupply.toString(),
          mintable: false,
          reserve_recipient: PRIME_FINALIZER_ADDRESS,
          reserve_amount: reserveBase.toString(),
        },
      };

      const requestId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `riolight-prime-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const feeRio = String(Number(primeFactoryFeeUrio || "0") / 1_000_000);

      const primeHandoverIntent = createRioLightGlobalHandoverIntent({
        requestId,
        surface: "prime",
        product: "Prime",
        actionKind: "prime_create",
        actionLabel: "Create Prime Project",
        walletAddress: primeRioLightAddress || null,
        contractAddress: primeFactoryAddress,
        contractLabel: "Prime Create Project",
        title: "Prime Project Creation",
        subtitle:
          "Review Prime project creation, factory fee, broadcast, and receipt in one RioLight flow.",
        assets: [
          {
            label: "Factory fee",
            symbol: "RIO",
            assetId: "urio",
            assetType: "native",
            amount: feeRio,
            role: "fee",
          },
          {
            label: "Project token supply",
            symbol: resolvedSymbol,
            amount: resolvedSupply,
            role: "receive",
          },
        ],
        routeLabel: "Prime SPO-20 factory",
        feeAmount: feeRio,
        feeSymbol: "RIO",
        feeRecipient: primeFactoryAddress,
        treasuryRecipient: primeFactoryAddress,
        tokenAddress: null,
        msg,
        funds: [{ denom: "urio", amount: primeFactoryFeeUrio }],
        riskNotes: [
          "Prime creates a public project token and metadata record.",
          "Verify project name, ticker, supply, liquidity grade, and launch settings before approval.",
        ],
        truthNotes: [
          "Prime creation uses the configured Prime factory contract.",
          "RioExplorer proof becomes available after broadcast and indexing.",
        ],
        proofHref: rioLightExplorerProofHref({ address: primeFactoryAddress }),
        explorerHref: rioLightExplorerProofHref({ address: primeFactoryAddress }),
        metadata: {
          rail: "prime",
          family: "spo20",
          source: "prime_create_ui",
          nicheFamily: lockedAiNiche ? "ai_ecosystem" : "core",
          nicheFamilyLabel: primeNicheFamilyLabel,
          aiNicheId: lockedAiNiche?.id || null,
          aiNicheTitle: lockedAiNiche?.title || null,
          aiNicheCategory: lockedAiNiche?.category || null,
          aiNicheBadge: lockedAiNiche?.badge || null,
          aiLaunchModel: lockedAiNiche?.launchModel || null,
          aiArchitecture: lockedAiNiche?.architecture || null,
          creatorUtilities: selectedCreatorUtilities,
          creatorUtilityLabels: selectedCreatorUtilityLabels,
          rioMindNexusReady: Boolean(lockedAiNiche),
          liquidityBase,
          liquidityMode,
          liquidityGrade: selectedLiquidityGrade,
          projectName: resolvedName,
          symbol: resolvedSymbol,
          totalSupply: resolvedSupply,
        },
      });

      const execResult = await withPrimeTimeout(executeRioLightContract({
        contractAddress: primeFactoryAddress,
        msg,
        memo: "Prime Create Project",
        label: "Prime Create Project",
        action: "prime_create",
        funds: [{ denom: "urio", amount: primeFactoryFeeUrio }],
        metadata: {
          handoverIntent: primeHandoverIntent,
          handoverVersion: primeHandoverIntent.version,
          globalHandover: true,
          rail: "prime",
          family: "spo20",
          product: "Prime",
          source: "prime_create_ui",
          surface: "prime_create",
          executionKind: "prime_create",
          reviewTitle: "Prime Project Creation",
          reviewSubtitle: "Review this Prime Project creation before RioLight signs and broadcasts. Your project includes a canonical SPO-20 asset and a market-ready path into liquidity, discovery, and trading.",
          spendAmount: String(Number(primeFactoryFeeUrio || "0") / 1_000_000),
          spendSymbol: "RIO",
          receiveAmount: resolvedSupply,
          receiveSymbol: resolvedSymbol,
          routeLabel: "Prime SPO-20 factory",
          actionLabel: "Confirm Prime Project",
          feeAmount: String(Number(primeFactoryFeeUrio || "0") / 1_000_000),
          feeSymbol: "RIO",
          contractLabel: "Prime Create Project",
          projectName: resolvedName,
          symbol: resolvedSymbol,
          nicheFamily: lockedAiNiche ? "ai_ecosystem" : "core",
          nicheFamilyLabel: primeNicheFamilyLabel,
          aiNicheId: lockedAiNiche?.id || null,
          aiNicheTitle: lockedAiNiche?.title || null,
          aiNicheCategory: lockedAiNiche?.category || null,
          aiLaunchModel: lockedAiNiche?.launchModel || null,
          aiArchitecture: lockedAiNiche?.architecture || null,
          creatorUtilities: selectedCreatorUtilities,
          creatorUtilityLabels: selectedCreatorUtilityLabels,
          rioMindNexusReady: Boolean(lockedAiNiche),
          liquidityBase,
          liquidityMode,
          liquidityGrade: selectedLiquidityGrade,
        },
      }), 15000);

      const sender = execResult?.sender || execResult?.signer || execResult?.address || "";

      if ((execResult as any)?.status === "approval_opened") {
        const requestId = (execResult as any)?.requestId;

        setPrimeRequestStatus({
          tone: "success",
          title: "RioLight approval opened",
          body: "Confirm the Prime creation inside RioLight. This page will continue automatically after RioLight broadcasts the transaction.",
        });

        if (!requestId) {
          throw new Error("RioLight approval opened but no request id was returned.");
        }

        void (async () => {
          try {
            const provider =
              (window as any).riolight ||
              (window as any).rioLight ||
              (window as any).spherio?.riolight ||
              (window as any).spherio?.rioLight;

            const finalResult = await waitForRioLightStoredExecutionResult(
              provider,
              requestId,
              180000,
              1500,
            );

            if (!finalResult) {
              setPrimeRequestStatus({
                tone: "success",
                title: "Prime creation submitted",
                body: "RioLight approval was opened. If you confirmed the transaction, the project may still be indexing. Refresh shortly or check RioExplorer.",
              });

              return;
            }

            setPrimeRequestStatus({
              tone: "success",
              title: "Prime transaction confirmed",
              body: "RioLight confirmed the Prime creation. Waiting for the indexer to surface the created project.",
            });

            const createdToken = await waitForPrimeCreatedToken({
              creator: sender,
              symbol: resolvedSymbol,
              projectName: resolvedName,
            });

            if (createdToken) {
              const tokenAddress = createdToken.contract_address || createdToken.token_address;
              const txHash =
                createdToken.tx_hash ||
                createdToken.txHash ||
                createdToken.create_tx_hash ||
                finalResult.txHash ||
                finalResult.result?.txHash ||
                "";

              const successPayload = {
                tokenAddress,
                contractAddress: tokenAddress,
                txHash,
                symbol: createdToken.symbol || resolvedSymbol,
                projectName: createdToken.name || resolvedName,
                liquidityUrl: "/riodex/pools",
                screenerUrl: "/rioex",
                explorerUrl: `/rioexplorer/spo20/${tokenAddress}`,
              };

              setSuccess(successPayload as any);

              setPrimeAutoLiquidity({
                tokenAddress,
                symbol: successPayload.symbol,
                projectName: successPayload.projectName,
                liquidityBase,
                liquidityMode,
                liquidityGrade: selectedLiquidityGrade,
                lpPositionId: null,
                poolUrl: successPayload.liquidityUrl,
                screenerUrl: successPayload.screenerUrl,
                tradeUrl: successPayload.screenerUrl,
                explorerUrl: successPayload.explorerUrl,
              });

              setIsPrimeLiquidityPanelOpen(true);

              setPrimeRequestStatus({
                tone: "success",
                title: "Prime Project created",
                body: "Your Prime Project was created, indexed, and is ready for the liquidity handoff.",
              });

              return;
            }

            setPrimeRequestStatus({
              tone: "success",
              title: "Prime transaction confirmed",
              body: "RioLight confirmed the transaction, but the created project is still indexing. Refresh shortly or check RioExplorer.",
            });
          } catch (watchError) {
            const message =
              watchError instanceof Error
                ? watchError.message
                : "RioLight result watcher failed.";

            setPrimeRawError(message);
            setPrimeRequestStatus({
              tone: "error",
              title: "Prime result watcher failed",
              body: humanizePrimeError(watchError, "RioLight returned an execution error."),
            });
          }
        })();

        return;
      }

      const tokenAddress = extractPrimeContractAddressFromExecute(execResult);
      const txHash = execResult?.transactionHash || "";
      const createdHeight = Number(execResult?.height || 0);

      if (!tokenAddress) {
        throw new Error("Prime project transaction succeeded, but no token address was found.");
      }

      const response = await fetch("/api/prime/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          templateId: lockedFramework.id,
          projectName: resolvedName,
          symbol: resolvedSymbol,
          totalSupply: resolvedSupply,
          statement: projectStatement,
          logoUrl: logoPreview || "",
          hybridLabel: lockedFramework.id === "hybrid" ? hybridLabel || undefined : undefined,
          liquidityBase,
          liquidityMode,
          liquidityGrade: selectedLiquidityGrade,
          rioPriceUsd: 1,
          tokenAddress,
          txHash,
          createdHeight,
          creatorAddress: sender,
          factoryAddress: primeFactoryAddress,
          projectCategory,
          projectIdea,
          nicheFamily: lockedAiNiche ? "ai_ecosystem" : "core",
          nicheFamilyLabel: primeNicheFamilyLabel,
          aiNicheId: lockedAiNiche?.id || null,
          aiNicheTitle: lockedAiNiche?.title || null,
          aiNicheCategory: lockedAiNiche?.category || null,
          aiNicheBadge: lockedAiNiche?.badge || null,
          aiLaunchModel: lockedAiNiche?.launchModel || null,
          aiAllocationDefaults: lockedAiNiche?.allocationDefaults || [],
          aiTrustDefaults: lockedAiNiche?.trustDefaults || [],
          aiReadinessExpectations: lockedAiNiche?.readinessExpectations || [],
          aiArchitecture: lockedAiNiche?.architecture || null,
          creatorUtilities: selectedCreatorUtilities,
          creatorUtilityLabels: selectedCreatorUtilityLabels,
          rioMindNexusReady: Boolean(lockedAiNiche),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Prime project was created on-chain, but metadata registration failed.");
      }

      const successPayload = data.success as PrimeCreateSuccess;
      const metadataPayload = data.metadataPackage as PrimeMetadataPackage;

      setSuccess(successPayload);
      setMetadataPackage(metadataPayload);

      setPrimeRequestStatus({
        tone: "success",
        title: "Prime project created",
        body: "Prime project created and registered. Auto-liquidity is ready on this page with the selected grade carried forward.",
      });

      setPrimeAutoLiquidity({
        tokenAddress: successPayload.tokenAddress,
        symbol: resolvedSymbol,
        projectName: resolvedName,
        liquidityBase,
        liquidityMode,
        liquidityGrade: selectedLiquidityGrade,
        lpPositionId: null,
        poolUrl: successPayload.liquidityUrl || "/riodex/pools",
        screenerUrl: successPayload.screenerUrl || "/rioex",
        tradeUrl: successPayload.screenerUrl || "/rioex",
        explorerUrl: successPayload.explorerUrl || `/rioexplorer/spo20/${successPayload.tokenAddress}`,
      });

      setIsPrimeLiquidityPanelOpen(true);
    } catch (error) {
      const rawPrimeError =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : JSON.stringify(error, null, 2);

      console.error("Prime creation raw error:", error);
      setPrimeRawError(rawPrimeError);

      setPrimeRequestStatus({
        tone: "error",
        title: "Prime request failed",
        body: humanizePrimeError(error, "Prime creation failed. Please review your wallet and try again."),
      });
    } finally {
      window.clearTimeout(approvalOpenWatchdog);
      setIsSubmitting(false);
    }
  }

  const lockedAccent = templateAccent(lockedFramework);
  const featuredNicheName = surfaceState?.featuredNiche?.name ?? lockedFramework?.name ?? "Prime";
  const featuredNicheCategory =
    surfaceState?.featuredNiche?.category ?? lockedFramework?.category ?? "Framework";
  const activePrimeNicheName = lockedAiNiche?.title ?? featuredNicheName;
  const activePrimeNicheCategory = lockedAiNiche ? "AI Ecosystem" : featuredNicheCategory;
  const activePrimeNicheModel = lockedAiNiche?.launchModel ?? lockedFramework?.launchModel;
  const selectedCreatorUtilityLabels = PRIME_CREATOR_UTILITY_SUITE
    .filter((utility) => selectedCreatorUtilities.includes(utility.id))
    .map((utility) => utility.title);

  const primeNicheFamilyLabel = lockedAiNiche ? "Prime AI Ecosystem Niches" : "Prime Core Launch Niches";
  const lifecycle = surfaceState?.lifecycle ?? {
    rail: "prime" as const,
    progressPercent: 0,
    steps: [],
  };

  return (
    <main className={shell()}>
      <div className="mx-auto max-w-[1660px] p-4 sm:p-5">
        <div className="space-y-5">
          {reviewingAiNiche ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-[30px] border border-cyan-400/22 bg-[linear-gradient(180deg,rgba(10,24,39,0.98),rgba(10,15,28,0.98))] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.82)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={sectionEyebrow()}>Prime AI Ecosystem Niche</div>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      {reviewingAiNiche.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                      Review this AI-native Prime niche before locking it into the creation flow.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReviewingAiNicheId(null)}
                    className={actionButton(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className={pill("cyan")}>{reviewingAiNiche.badge}</span>
                  <span className={pill("neutral")}>{reviewingAiNiche.category}</span>
                  {(reviewingAiNiche.chips || reviewingAiNiche.tags || []).map((chip) => (
                    <span key={chip} className={pill("neutral")}>{chip}</span>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] border border-cyan-300/24 bg-cyan-500/[0.08] p-5">
                  <div className="text-sm font-semibold text-white">Launch model</div>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    {reviewingAiNiche.launchModel}
                  </p>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  {[
                    ["Allocation defaults", reviewingAiNiche.allocationDefaults],
                    ["Trust defaults", reviewingAiNiche.trustDefaults],
                    ["Readiness expectations", reviewingAiNiche.readinessExpectations],
                  ].map(([title, items]) => (
                    <div key={String(title)} className={card("p-5")}>
                      <div className="text-lg font-semibold text-white">{String(title)}</div>
                      <div className="mt-4 space-y-3">
                        {(items as string[]).map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className={card("p-5 xl:col-span-2")}>
                    <div className="text-lg font-semibold text-white">Recommended build architecture</div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Frontend</div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{reviewingAiNiche.architecture.frontend}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Backend</div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{reviewingAiNiche.architecture.backend}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Codebase pattern</div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{reviewingAiNiche.architecture.codebase}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Core modules</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {reviewingAiNiche.architecture.modules.map((module) => (
                            <span key={module} className={pill("neutral")}>{module}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={card("p-5 xl:col-span-2")}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-lg font-semibold text-white">Prime AI Codebase Package</div>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                          {reviewingAiCodebasePackage.productSurface}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={pill("cyan")}>{reviewingAiCodebasePackage.maturity}</span>
                        {reviewingAiCodebasePackage.runtimeUrl ? (
                          <span className={pill("emerald")}>Runtime linked</span>
                        ) : (
                          <span className={pill("neutral")}>Runtime scaffold pending</span>
                        )}
                      </div>
                    </div>

                    {reviewingAiCodebasePackage.scaffoldPath ? (
                      <div className="mt-4 rounded-2xl border border-cyan-300/16 bg-cyan-500/[0.055] px-4 py-3 text-xs leading-5 text-cyan-100/80">
                        Scaffold path:{" "}
                        <code className="font-mono text-cyan-100">
                          {reviewingAiCodebasePackage.scaffoldPath}
                        </code>
                      </div>
                    ) : null}

                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                          Frontend surfaces
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {reviewingAiCodebasePackage.frontendSurfaces.map((item) => (
                            <span key={item} className={pill("neutral")}>{item}</span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                          Backend services
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {reviewingAiCodebasePackage.backendServices.map((item) => (
                            <span key={item} className={pill("neutral")}>{item}</span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                          Database models
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {reviewingAiCodebasePackage.databaseModels.map((item) => (
                            <span key={item} className={pill("neutral")}>{item}</span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                          Runtime workers
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {reviewingAiCodebasePackage.runtimeWorkers.map((item) => (
                            <span key={item} className={pill("neutral")}>{item}</span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                          RioMind Nexus integrations
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {reviewingAiCodebasePackage.rioMindNexusIntegrations.map((item) => (
                            <span key={item} className={pill("emerald")}>{item}</span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                          Compliance notes
                        </div>
                        <div className="mt-3 space-y-2">
                          {reviewingAiCodebasePackage.complianceNotes.map((item) => (
                            <div
                              key={item}
                              className="rounded-xl border border-amber-300/18 bg-amber-500/8 px-3 py-2 text-xs leading-5 text-amber-100/85"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewingAiNicheId(null)}
                    className={actionButton(false)}
                  >
                    Back
                  </button>
                  <button type="button" onClick={useReviewedAiNiche} className={actionButton(true)}>
                    Use this AI niche
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {reviewingTemplate ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[30px] border border-amber-400/20 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,15,28,0.98))] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.82)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={sectionEyebrow()}>Template review</div>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      {reviewingTemplate.name}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                      Review this Prime niche and framework before locking it into the creation flow.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReviewingTemplateId(null)}
                    className={actionButton(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className={pill(templateAccent(reviewingTemplate).pillTone)}>
                    {reviewingTemplate.name}
                  </span>
                  <span className={pill("neutral")}>{reviewingTemplate.category}</span>
                  <span className={pill("neutral")}>
                    Liquidity: {reviewingTemplate.defaultLiquidityBases.join(" / ")}
                  </span>
                  <span className={pill("neutral")}>
                    Mode: {reviewingTemplate.defaultLiquidityMode}
                  </span>
                </div>

                <div
                  className={`mt-6 rounded-[24px] border p-5 ${templateAccent(reviewingTemplate).selected}`}
                >
                  <div className="text-sm font-semibold text-white">Launch model</div>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    {reviewingTemplate.launchModel}
                  </p>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  {(reviewingTemplate.reviewSections ?? []).map((section) => (
                    <div key={section.id} className={card("p-5")}>
                      <div className="text-lg font-semibold text-white">{section.title}</div>
                      <div className="mt-4 space-y-3">
                        {section.items.map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewingTemplateId(null)}
                    className={actionButton(false)}
                  >
                    Back
                  </button>
                  <button type="button" onClick={useReviewedTemplate} className={actionButton(true)}>
                    Use this niche
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <section className="rounded-[34px] border border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,23,40,0.94),rgba(10,15,28,0.94))] p-8 shadow-[0_28px_100px_-42px_rgba(0,0,0,0.86)]">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-300/35 bg-[linear-gradient(135deg,rgba(245,158,11,0.20),rgba(15,23,42,0.92))] px-4 py-3 shadow-[0_0_0_1px_rgba(245,158,11,0.10)_inset,0_18px_55px_rgba(245,158,11,0.10)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/35 bg-black/35 text-lg font-black text-amber-200">
                    P
                  </div>
                  <div>
                    <div className="text-xl font-black uppercase leading-none tracking-[0.14em] text-amber-100">
                      Prime
                    </div>
                    <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.20em] text-amber-300/80">
                      Structured Launch
                    </div>
                  </div>
                </div>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Structured Launch Console
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                  Select a structured launch model, review it, define project architecture, set
                  liquidity, review pricing, and move from creation into Screener, RioExplorer, and
                  discovery flow.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className={pill("slate")}>Network: spherio-1</span>
                  <span className={pill("neutral")}>Decimals: 6</span>
                  <span className={pill("gold")}>Institutional Prime</span>
                  <span className={pill("emerald")}>Screener-ready</span>
                  <span className={pill("violet")}>Framework-driven</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:w-[430px] xl:grid-cols-1">
                <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Wallet</div>
                    <div className={`mt-1 font-semibold ${primeRioLightAddress ? "text-emerald-100" : "text-white"}`}>
                      {primeRioLightAddress ? "RioLight connected" : "Not connected"}
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-400">
                      {primeRioLightAddress
                        ? `${primeRioLightAddress.slice(0, 12)}…${primeRioLightAddress.slice(-8)}`
                        : "Connect RioLight to create Prime projects"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handlePrimeRioLightConnect}
                      disabled={primeRioLightConnecting}
                      className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {primeRioLightConnecting
                        ? "Connecting..."
                        : primeRioLightAddress
                          ? "Refresh signer"
                          : "Connect RioLight"}
                    </button>

                    {primeRioLightAddress ? (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(primeRioLightAddress);
                          setPrimeRequestStatus({
                            tone: "success",
                            title: "Signer copied",
                            body: "RioLight signer address copied to clipboard.",
                          });
                        }}
                        className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
                      >
                        Copy signer
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[24px] border border-amber-400/18 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))] px-5 py-4">
                  <div className={sectionEyebrow()}>Prime framing</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <div>Template reviewed before lock-in</div>
                    <div>Liquidity reviewed before launch</div>
                    <div>Curated, issuer-grade project flow</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={card("px-6 py-5")}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className={sectionEyebrow()}>Prime lifecycle</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  Create → LP → Screener → Trade → RioEx → RioExplorer
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  Structured lifecycle rail for Prime issuance.
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Lifecycle progression
                </div>
                <div className="mt-1 text-2xl font-bold text-amber-300">
                  {lifecycle.progressPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mt-5 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(245,158,11,0.96),rgba(217,119,6,0.96),rgba(56,189,248,0.88))]"
                style={{ width: `${Math.min(lifecycle.progressPercent, 100)}%` }}
              />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {lifecycle.steps.map((step) => {
                const isCompleted = step.status === "complete";
                const isActive = step.status === "active";
                const isOptional = step.status === "optional";

                return (
                  <div
                    key={step.key}
                    className={`rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition ${
                      isCompleted
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                        : isActive
                          ? "border-sky-400/28 bg-sky-500/10 text-sky-200"
                          : isOptional
                            ? "border-fuchsia-400/25 bg-fuchsia-500/8 text-fuchsia-200"
                            : "border-white/10 bg-white/[0.03] text-slate-400"
                    }`}
                  >
                    {normalizePrimeLifecycleLabel(step.label)}
                  </div>
                );
              })}
            </div>

            {surfaceLoading ? (
              <div className="mt-4 text-sm text-slate-400">Loading authority state...</div>
            ) : null}
            {surfaceError ? (
              <div className="mt-4 text-sm text-rose-300">{surfaceError}</div>
            ) : null}
          </section>

          <section className="grid gap-6">
            <div className={`${card()} order-2 border-cyan-300/18 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.10),transparent_32%),radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.12),transparent_34%),linear-gradient(135deg,rgba(9,20,38,0.78),rgba(13,17,34,0.86))] shadow-[0_26px_100px_-72px_rgba(34,211,238,0.78)] backdrop-blur-md`}>
              <div className="mb-5">
                <div className={sectionEyebrow()}>Project positioning</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Choose Your Prime Project Niche
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                  Prime Projects start with a clear creation rail, then use niches to shape
                  identity, trust posture, liquidity, discovery, and market positioning.
                </p>
              </div>

              <div className="mt-6 rounded-[22px] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(6,16,30,0.92),rgba(12,16,34,0.92))] p-4 shadow-[0_18px_70px_-52px_rgba(34,211,238,0.75)]">
                <div className="mb-4 text-center">
                  <div className="text-[12px] font-black uppercase tracking-[0.24em] text-amber-300">
                    Select launch universe
                  </div>
                  <h3 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-white md:text-3xl">
                    Select the project universe before choosing a niche
                  </h3>
                  <p className="mx-auto mt-1 max-w-4xl text-[13px] font-bold leading-6 text-slate-300">
                    Choose Core Launch or AI Ecosystem first. The selected universe controls which niche framework opens below.
                  </p>
                </div>

                <div className="mb-3 flex justify-end">
                  <div className="rounded-xl border border-cyan-300/18 bg-cyan-400/8 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-100">
                    Family selector
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedNicheFamily("core")}
                    className={`group relative w-full max-w-[220px] overflow-hidden rounded-[14px] border px-3 py-2 text-center transition hover:-translate-y-0.5 ${
                      selectedNicheFamily === "core"
                        ? "border-amber-300/85 bg-[linear-gradient(135deg,rgba(245,158,11,0.32),rgba(180,83,9,0.18),rgba(9,14,26,0.96))] shadow-[0_0_0_1px_rgba(245,158,11,0.18)_inset,0_14px_34px_-24px_rgba(245,158,11,0.88)]"
                        : "border-orange-300/28 bg-[linear-gradient(135deg,rgba(79,45,12,0.52),rgba(9,14,26,0.95))] hover:border-orange-300/50 hover:bg-orange-500/[0.09]"
                    }`}
                  >
                    <div className="absolute -right-8 -top-10 h-16 w-16 rounded-full bg-orange-400/18 blur-2xl" />
                    <div className="relative flex flex-col items-center justify-center">
                      <div className="inline-flex rounded-full border border-orange-300/35 bg-orange-500/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.16em] text-orange-200">
                        Prime Core Launch Niches
                      </div>

                      <h3 className="mt-1 text-[18px] font-extrabold tracking-[-0.04em] text-white text-center">
                        Core Launch
                      </h3>

                      <div className="mt-1 rounded-md border border-orange-300/25 bg-orange-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-orange-100">
                        {selectedNicheFamily === "core" ? "Active" : "Open"}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedNicheFamily("ai_ecosystem")}
                    className={`group relative w-full max-w-[220px] overflow-hidden rounded-[14px] border px-3 py-2 text-center transition hover:-translate-y-0.5 ${
                      selectedNicheFamily === "ai_ecosystem"
                        ? "border-cyan-300/88 bg-[linear-gradient(135deg,rgba(34,211,238,0.34),rgba(59,130,246,0.18),rgba(124,58,237,0.14),rgba(9,14,26,0.96))] shadow-[0_0_0_1px_rgba(34,211,238,0.18)_inset,0_14px_34px_-24px_rgba(34,211,238,0.88)]"
                        : "border-sky-300/28 bg-[linear-gradient(135deg,rgba(7,47,65,0.56),rgba(9,14,26,0.95))] hover:border-sky-300/52 hover:bg-sky-500/[0.09]"
                    }`}
                  >
                    <div className="absolute -right-8 -top-10 h-16 w-16 rounded-full bg-cyan-400/20 blur-2xl" />
                    <div className="absolute -left-8 bottom-[-28px] h-14 w-14 rounded-full bg-violet-500/12 blur-2xl" />

                    <div className="relative flex flex-col items-center justify-center">
                      <div className="inline-flex rounded-full border border-sky-300/35 bg-sky-500/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.16em] text-sky-200">
                        Prime AI Ecosystem Niches
                      </div>

                      <h3 className="mt-1 text-[18px] font-extrabold tracking-[-0.04em] text-white text-center">
                        AI Ecosystem
                      </h3>

                      <div className="mt-1 rounded-md border border-sky-300/25 bg-sky-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-sky-100">
                        {selectedNicheFamily === "ai_ecosystem" ? "Active" : "Open"}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {selectedNicheFamily === "core" ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {templates.map((framework) => {
                    const isPreview = framework.id === selectedFramework?.id;
                    const isLocked = framework.id === lockedFramework?.id;
                    const accent = templateAccent(framework);

                    return (
                      <div
                        key={framework.id}
                        className={`group relative overflow-hidden rounded-[24px] border p-5 transition before:absolute before:inset-y-5 before:left-0 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-cyan-300 before:via-fuchsia-300 before:to-amber-300 before:opacity-70 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-46px_rgba(34,211,238,0.8)] ${
                          isLocked
                            ? `${accent.selected} bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(245,158,11,0.10),rgba(15,23,42,0.74))] shadow-[0_0_34px_-20px_rgba(245,158,11,0.95)]`
                            : `${accent.shell} bg-[linear-gradient(135deg,rgba(15,30,52,0.70),rgba(20,18,42,0.58),rgba(8,13,24,0.82))]`
                        }`}
                      >
                        <div className={`absolute right-[-24px] top-[-24px] h-24 w-24 rounded-full blur-2xl ${accent.glow}`} />
                        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.075),transparent_28%,transparent_72%,rgba(255,255,255,0.035))] opacity-80" />

                        <div className="relative">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-lg font-semibold text-white">{framework.name}</div>
                            <span className={pill(accent.pillTone)}>{framework.category}</span>
                          </div>

                          <p className="mt-3 text-sm leading-7 text-slate-300">
                            {framework.description}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className={pill("neutral")}>
                              {framework.launchModel.slice(0, 22)}
                              {framework.launchModel.length > 22 ? "…" : ""}
                            </span>

                            {isLocked && !lockedAiNiche ? <span className={pill("gold")}>In use</span> : null}
                            {isPreview && !isLocked ? <span className={pill("slate")}>Preview</span> : null}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openTemplateReview(framework.id)}
                              className={actionButton(false)}
                            >
                              Review model
                            </button>

                            {!isLocked || lockedAiNiche ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedNicheFamily("core");
                                  setLockedAiNicheId(null);
                                  setSelectedFrameworkId(framework.id);
                                  setLockedFrameworkId(framework.id);
                                  setProjectCategory(framework.name);
                                }}
                                className={actionButton(true)}
                              >
                                Use niche
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {AI_ECOSYSTEM_NICHES.map((niche) => {
                    const isLocked = niche.id === lockedAiNiche?.id;

                    return (
                      <div
                        key={niche.id}
                        className={`group relative overflow-hidden rounded-[24px] border p-5 transition before:absolute before:inset-y-5 before:left-0 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-cyan-300 before:via-fuchsia-300 before:to-amber-300 before:opacity-70 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-46px_rgba(34,211,238,0.8)] ${
                          isLocked
                            ? "border-cyan-300/46 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(168,85,247,0.12),rgba(15,23,42,0.76))] shadow-[0_0_34px_-20px_rgba(34,211,238,0.95)]"
                            : "border-cyan-300/18 bg-[linear-gradient(135deg,rgba(15,30,52,0.70),rgba(20,18,42,0.58),rgba(8,13,24,0.82))]"
                        }`}
                      >
                        <div className="absolute right-[-24px] top-[-24px] h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />
                        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.075),transparent_28%,transparent_72%,rgba(255,255,255,0.035))] opacity-80" />

                        <div className="relative">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-lg font-semibold text-white">{niche.title}</div>
                            <span className={pill("cyan")}>{niche.badge}</span>
                          </div>

                          <p className="mt-3 text-sm leading-7 text-slate-300">
                            {niche.description}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className={pill("neutral")}>{niche.category}</span>
                            {(niche.chips || niche.tags || []).slice(0, 2).map((chip) => (
                              <span key={chip} className={pill("neutral")}>{chip}</span>
                            ))}
                            {isLocked ? <span className={pill("gold")}>In use</span> : null}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openAiNicheReview(niche.id)}
                              className={actionButton(false)}
                            >
                              Review model
                            </button>

                            {!isLocked ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedNicheFamily("ai_ecosystem");
                                  setLockedAiNicheId(niche.id);
                                  setProjectCategory(niche.title);
                                  setProjectIdea(
                                    (current) =>
                                      current ||
                                      niche.description ||
                                      niche.launchModel ||
                                      `${niche.title} project`,
                                  );
                                  setSelectedCreatorUtilities((current) =>
                                    Array.from(new Set([...current, ...niche.recommendedUtilities])),
                                  );
                                }}
                                className={actionButton(true)}
                              >
                                Use AI niche
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 rounded-[26px] border border-white/10 bg-black/20 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className={sectionEyebrow()}>Prime Creator Utility Suite</div>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      Select project utilities
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                      Choose add-on utilities that can evolve the Prime launch into a website,
                      agent layer, marketplace, education portal, data product, dashboard, or verified project surface.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-cyan-300/18 bg-cyan-400/8 px-4 py-3 text-xs leading-5 text-cyan-100/80">
                    {lockedAiNiche
                      ? `Recommended utilities loaded for ${lockedAiNiche.title}.`
                      : "Select an AI niche to auto-suggest utilities."}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {PRIME_CREATOR_UTILITY_SUITE.map((utility) => {
                    const active = selectedCreatorUtilities.includes(utility.id);
                    const recommended = recommendedUtilityIds.has(utility.id);

                    return (
                      <button
                        key={utility.id}
                        type="button"
                        onClick={() => toggleCreatorUtility(utility.id)}
                        className={`rounded-[20px] border p-4 text-left transition ${
                          active
                            ? "border-cyan-300/42 bg-cyan-500/[0.12]"
                            : recommended
                              ? "border-amber-300/28 bg-amber-500/[0.08] hover:bg-amber-500/[0.11]"
                              : "border-white/10 bg-white/[0.035] hover:bg-white/[0.055]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-bold text-white">{utility.title}</div>
                          <span className={pill(active ? "cyan" : recommended ? "gold" : "neutral")}>
                            {active ? "Selected" : recommended ? "Recommended" : "Optional"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {utility.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`${card("relative overflow-hidden")} order-1 mx-auto w-full max-w-5xl border-cyan-300/35 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.24),transparent_34%),radial-gradient(circle_at_100%_4%,rgba(168,85,247,0.28),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(245,158,11,0.16),transparent_34%),linear-gradient(135deg,rgba(8,20,38,0.88),rgba(30,18,56,0.78)_48%,rgba(5,12,24,0.92))] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_42px_-14px_rgba(34,211,238,0.92),0_0_80px_-22px_rgba(168,85,247,0.82),0_36px_140px_-70px_rgba(245,158,11,0.72)] backdrop-blur-xl before:absolute before:inset-x-10 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-cyan-200/80 before:to-transparent after:absolute after:inset-y-10 after:right-0 after:w-px after:bg-gradient-to-b after:from-transparent after:via-fuchsia-300/70 after:to-transparent`}>
              <div className={`absolute left-1/2 top-0 h-44 w-44 -translate-x-1/2 rounded-full blur-3xl ${lockedAccent.glow}`} />
              <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-cyan-400/16 blur-[96px]" />
              <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-fuchsia-500/16 blur-[96px]" />
              <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-amber-400/12 blur-[72px]" />
              <div className="absolute inset-0 rounded-[34px] bg-[linear-gradient(115deg,rgba(255,255,255,0.10),transparent_22%,transparent_70%,rgba(255,255,255,0.06))] pointer-events-none" />

              <div className="relative">
                <div className="text-center">
                  <div className={sectionEyebrow()}>Prime command rail</div>
                  <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">
                    Create Prime Project
                  </h2>
                  <p className="mx-auto mt-3 max-w-[720px] text-sm leading-7 text-slate-400">
                    Launch a structured on-chain project with a canonical SPO-20 asset, creator-defined supply,
                    Prime liquidity grade, RioExplorer proof, and a direct path into Screener and RioEx trading.
                  </p>
                </div>

                <div className={`mt-6 rounded-[24px] border border-cyan-300/20 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_54px_-42px_rgba(34,211,238,0.75)] backdrop-blur-md ${lockedAccent.shell}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={pill(lockedAccent.pillTone)}>{activePrimeNicheName}</span>
                    <span className={pill("neutral")}>{activePrimeNicheCategory}</span>
                    {lockedFramework?.id === "hybrid" && hybridLabel ? (
                      <span className={pill("violet")}>{hybridLabel}</span>
                    ) : null}
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-300">
                    {activePrimeNicheModel ||
                      "Review and lock a Prime niche before creating the token."}
                  </div>
                </div>

                <div className="mt-7 rounded-[26px] border border-cyan-300/24 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(245,158,11,0.14),transparent_36%),linear-gradient(135deg,rgba(9,24,43,0.74),rgba(20,18,48,0.76)_52%,rgba(6,13,27,0.88))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_28px_90px_-62px_rgba(34,211,238,0.82)] backdrop-blur-md">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200/80">
                        Prime Liquidity Grade
                      </div>
                      <h3 className="mt-2 text-xl font-bold tracking-[-0.02em] text-white">
                        Choose project liquidity before launch
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        Prime requires a clear liquidity posture. The selected grade carries into the auto-liquidity step after project creation.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-xs leading-5 text-slate-300">
                      Auto-liquidity opens after creation with this grade already selected.
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    {PRIME_LIQUIDITY_GRADES.map((grade) => {
                      const active = selectedLiquidityGrade === grade.id;
                      const tone = primeLiquidityGradeTone(grade.id, active);

                      return (
                        <button
                          key={grade.id}
                          type="button"
                          onClick={() => setSelectedLiquidityGrade(grade.id)}
                          className={`rounded-[22px] border p-4 text-left transition ${tone.card}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-black text-white">
                                {grade.title}
                              </div>
                              <div className={`mt-1 text-lg font-extrabold ${tone.range}`}>
                                {grade.range}
                              </div>
                            </div>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${tone.badge}`}>
                              {active ? "Selected" : "Choose"}
                            </span>
                          </div>

                          <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${tone.label}`}>
                            {grade.badge}
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-400">
                            {grade.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-7 rounded-[28px] border border-fuchsia-300/30 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_100%_0%,rgba(217,70,239,0.20),transparent_34%),linear-gradient(135deg,rgba(11,28,48,0.74),rgba(38,20,64,0.70)_54%,rgba(8,13,25,0.88))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_92px_-54px_rgba(217,70,239,0.88)] backdrop-blur-md">
                  <div className="text-center">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-amber-200/80">
                      Prime project essentials
                    </div>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">
                      Name it. Ticker it. Set supply. Launch.
                    </h3>
                    <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      Keep the first step simple. Advanced project details, logo, disclosures, and liquidity preferences remain available below.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[1.35fr_0.75fr_0.9fr]">
                    <div>
                      {fieldLabel("Prime Project name")}
                      <input
                        className={`${inputClass()} h-14 text-base font-bold`}
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        placeholder={`e.g. ${lockedFramework?.name ?? "Prime"} Network`}
                      />
                    </div>

                    <div>
                      {fieldLabel("Ticker")}
                      <input
                        className={`${inputClass()} h-14 text-base font-black uppercase tracking-[0.08em]`}
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        placeholder="e.g. PRIME"
                      />
                    </div>

                    <div>
                      {fieldLabel("Total supply")}
                      <input
                        className={`${inputClass()} h-14 text-base font-bold`}
                        value={totalSupply}
                        onChange={(e) => setTotalSupply(e.target.value)}
                        placeholder="e.g. 1000000"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <span className={pill("gold")}>No forced reserve</span>
                    <span className={pill("cyan")}>SPO-20 asset</span>
                    <span className={pill("emerald")}>RioExplorer proof</span>
                    <span className={pill("violet")}>RioEx-ready path</span>
                  </div>
                </div>

                <details className="mt-7 rounded-[26px] border border-white/12 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md">
                  <summary className="cursor-pointer select-none text-sm font-extrabold uppercase tracking-[0.18em] text-slate-300">
                    Advanced project details
                  </summary>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    {fieldLabel("Project category")}
                    <input
                      className={inputClass()}
                      value={projectCategory}
                      onChange={(e) => setProjectCategory(e.target.value)}
                      placeholder="e.g. Governance, creator, asset-backed"
                    />
                  </div>

                  <div>
                    {fieldLabel("Selected framework")}
                    <input
                      className={inputClass()}
                      value={lockedFramework?.name ?? ""}
                      readOnly
                    />
                  </div>

                  <div className="md:col-span-2">
                    {fieldLabel("Describe what you are building")}
                    <textarea
                      className={textAreaClass()}
                      value={projectIdea}
                      onChange={(e) => setProjectIdea(e.target.value)}
                      placeholder={`Describe the product, audience, trust requirements, and intended market path for ${lockedFramework?.name ?? "this"} Prime launch.`}
                    />
                  </div>

                  <div>
                    {fieldLabel("Liquidity base asset")}
                    <div className="mt-2 flex gap-2">
                      {(["RIO", "RUSD"] as PrimeLiquidityBase[]).map((item) => {
                        const allowed = lockedFramework?.defaultLiquidityBases.includes(item) ?? false;
                        const active = liquidityBase === item;

                        return (
                          <button
                            key={item}
                            type="button"
                            disabled={!allowed}
                            onClick={() => setLiquidityBase(item)}
                            className={`h-12 flex-1 rounded-2xl border text-sm font-semibold transition ${
                              active
                                ? "border-amber-400/45 bg-amber-500/10 text-white"
                                : "border-white/10 bg-[#060a14] text-slate-300"
                            } ${!allowed ? "opacity-40" : ""}`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    {fieldLabel("Liquidity mode")}
                    <select
                      className={inputClass()}
                      value={liquidityMode}
                      onChange={(e) => setLiquidityMode(e.target.value as PrimeLiquidityMode)}
                    >
                      <option value="manual">Manual</option>
                      <option value="guided">Guided</option>
                      <option value="deferred">Deferred</option>
                    </select>
                  </div>

                  <div>
                    {fieldLabel("Prime Project name")}
                    <input
                      className={inputClass()}
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder={`e.g. ${lockedFramework?.name ?? "Prime"} Network`}
                    />
                  </div>

                  <div>
                    {fieldLabel("Ticker")}
                    <input
                      className={inputClass()}
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g. SPRM"
                    />
                  </div>

                  <div>
                    {fieldLabel("Total supply (tokens)")}
                    <input
                      className={inputClass()}
                      value={totalSupply}
                      onChange={(e) => setTotalSupply(e.target.value)}
                      placeholder="e.g. 1000000"
                    />
                  </div>

                  <div>
                    {fieldLabel("Decimals (fixed)")}
                    <input className={inputClass()} value="6" readOnly />
                  </div>

                  <div className="md:col-span-2">
                    {fieldLabel("Project statement")}
                    <textarea
                      className={textAreaClass()}
                      value={projectStatement}
                      onChange={(e) => setProjectStatement(e.target.value)}
                      placeholder="Provide the public issuer statement, utility framing, and launch disclosures."
                    />
                  </div>

                  <div className="md:col-span-2">
                    {fieldLabel("Project logo")}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#060a14] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-slate-500">No logo</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-300">
                          {logoFileName || "Upload PNG, JPG, WEBP, or SVG"}
                        </div>
                      </div>

                      <button type="button" onClick={handleLogoPick} className={actionButton(false)}>
                        Choose file
                      </button>
                    </div>
                  </div>
                </div>

                </details>

                <div className="mt-7 rounded-2xl border border-fuchsia-300/35 bg-[linear-gradient(90deg,rgba(217,70,239,0.12),rgba(34,211,238,0.08),rgba(245,158,11,0.10))] p-4 text-sm text-slate-200 shadow-[0_0_30px_-14px_rgba(217,70,239,0.9)] backdrop-blur-md">
                  {loadingQuote ? (
                    "Loading Prime fee..."
                  ) : quote ? (
                    <>
                      Creation fee: <span className="font-semibold text-white">${quote.feeUsd}</span>
                      <span className="text-slate-400"> — RIO today; RUSD, USDT, USDC, USD/GBP card rails planned</span>
                    </>
                  ) : (
                    quoteError || "Fee unavailable"
                  )}
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <button type="button" className={actionButton(false)}>Reviewed</button>
                  <button type="button" className={actionButton(false)}>Curated</button>
                  <button type="button" className={actionButton(false)}>Discovery-ready</button>
                  <button type="button" className={actionButton(false)}>Liquidity-aware</button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!lockedFramework || isSubmitting}
                    className={actionButton(true)}
                  >
                    {isSubmitting ? "Creating RioLight Approval..." : "Create Prime Project"}
                  </button>
                </div>

                <div className={`mt-7 rounded-[26px] border p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
                  isPrimeLiquidityPanelOpen
                    ? "border-emerald-300/34 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.20),transparent_32%),radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.12),transparent_34%),linear-gradient(135deg,rgba(8,34,31,0.78),rgba(5,12,22,0.92))]"
                    : "border-cyan-300/16 bg-[linear-gradient(135deg,rgba(15,30,52,0.56),rgba(20,18,42,0.50),rgba(5,12,22,0.78))]"
                }`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-200/80">
                        Prime Auto-Liquidity
                      </div>
                      <h3 className="mt-2 text-xl font-bold tracking-[-0.02em] text-white">
                        {primeAutoLiquidity
                          ? "Liquidity handoff ready"
                          : "Create Prime project first"}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        {primeAutoLiquidity
                          ? "Your Prime project is selected. Confirm liquidity with RioLight to make the token Pool, Screener, Trade, and RioExplorer ready."
                          : "After creation, this section opens automatically with the new token already selected and the chosen liquidity grade carried forward."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-xs leading-5 text-slate-300">
                      Max two RioLight confirmations: creation, then liquidity.
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                        Selected Token
                      </div>
                      <div className="mt-1 break-all text-sm font-bold text-white">
                        {primeAutoLiquidity
                          ? `${primeAutoLiquidity.projectName} (${primeAutoLiquidity.symbol})`
                          : "Pending project creation"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                        Liquidity Grade
                      </div>
                      <div className="mt-1 text-sm font-bold text-amber-100">
                        {PRIME_LIQUIDITY_GRADES.find((g) => g.id === selectedLiquidityGrade)?.title || "Senior Minister Liquidity"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                        Base Asset
                      </div>
                      <div className="mt-1 text-sm font-bold text-cyan-100">
                        {liquidityBase} · {liquidityMode}
                      </div>
                    </div>
                  </div>

                  {primeAutoLiquidity ? (
                    <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-black/24 p-4">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-200/70">
                        Token selected
                      </div>
                      <div className="mt-2 break-all font-mono text-sm text-cyan-100">
                        {primeAutoLiquidity.tokenAddress}
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                        <button
                          type="button"
                          onClick={handlePrimeLiquidityConfirm}
                          className={actionButton(true)}
                        >
                          Confirm Liquidity
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(primeAutoLiquidity.lpPositionId || primeAutoLiquidity.tokenAddress);
                            setPrimeRequestStatus({
                              tone: "success",
                              title: "Copied",
                              body: primeAutoLiquidity.lpPositionId
                                ? "LP position copied to clipboard."
                                : "Prime project address copied to clipboard.",
                            });
                          }}
                          className={actionButton(false)}
                        >
                          Copy LP / Token
                        </button>

                        <Link href={primeAutoLiquidity.poolUrl || "/riodex/pools"} className={actionButton(false)}>
                          Open Pool
                        </Link>

                        <Link href={primeAutoLiquidity.screenerUrl || "/createtoken/pump/board"} className={actionButton(false)}>
                          Screener
                        </Link>

                        <Link href={primeAutoLiquidity.explorerUrl || `/rioexplorer/spo20/${primeAutoLiquidity.tokenAddress}`} className={actionButton(false)}>
                          RioExplorer
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                      Waiting for Prime project creation. No refresh or redirect required.
                    </div>
                  )}
                </div>

                  {primeRequestStatus ? (
                    <div
                      className={`mt-5 rounded-2xl border p-4 ${
                        primeRequestStatus.tone === "success"
                          ? "border-emerald-400/30 bg-emerald-500/10"
                          : "border-rose-400/30 bg-rose-500/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
                            Prime request status
                          </div>
                          <div className="mt-2 text-base font-semibold text-white">
                            {primeRequestStatus.title}
                          </div>
                          <p className="mt-2 text-sm leading-7 text-slate-200">
                            {primeRequestStatus.body}
                          </p>
                        </div>

                          {primeRawError ? (
                            <details className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 text-left">
                              <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.16em] text-amber-100/80">
                                Developer detail
                              </summary>
                              <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-amber-50/75">
                                {primeRawError}
                              </pre>
                            </details>
                          ) : null}

                        <button
                          type="button"
                          onClick={() => setPrimeRequestStatus(null)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ) : null}

                {success ? (
                  <div className="mt-6 rounded-[28px] border border-emerald-500/25 bg-[linear-gradient(180deg,rgba(6,78,59,0.38),rgba(6,46,33,0.46))] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)]">
                    <h3 className="text-lg font-semibold text-white">Token created</h3>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Token contract address
                      </div>
                      <div className="mt-2 break-all text-sm text-slate-100">
                        {success.tokenAddress}
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Template package
                      </div>

                      <div className="mt-3 grid gap-3 text-sm text-slate-200">
                        <div className="flex items-center justify-between gap-4">
                          <span>Niche</span>
                          <span className="font-semibold text-white">
                            {featuredNicheName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Framework family</span>
                          <span className="font-semibold text-white">
                            {featuredNicheCategory}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>AI outputs</span>
                          <span className="font-semibold text-white">
                            {success.aiOutputs?.length ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Power-ups</span>
                          <span className="font-semibold text-white">
                            {success.powerUps?.length ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Disclosures</span>
                          <span className="font-semibold text-white">
                            {success.requiredDisclosures?.length ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Fee routing
                      </div>
                      <div className="mt-3 grid gap-3 text-sm text-slate-200">
                        <div className="flex items-center justify-between gap-4">
                          <span>Fee paid</span>
                          <span className="font-semibold text-white">
                            {success.feePaidRio} RIO
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Fee reference</span>
                          <span className="font-semibold text-white">
                            ${success.feeUsdReference}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Treasury recipient</span>
                          <span className="break-all text-right font-semibold text-white">
                            {success.feeRecipient}
                          </span>
                        </div>
                      </div>
                    </div>

                    {metadataPackage ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                          Future market metadata package
                        </div>
                        <div className="mt-3 text-sm leading-7 text-slate-300">
                          This launch now carries niche identity, AI outputs, power-ups, liquidity
                          guidance, disclosures, and review sections forward for future RioEx,
                          tracker, and listing workflows.
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={handleCopyContract}
                        className={actionButton(false)}
                      >
                        {copyState === "copied" ? "Copied" : "Copy contract"}
                      </button>

                      <a href={success.liquidityUrl} className={actionButton(false)}>
                        Add liquidity
                      </a>

                      <a href={success.screenerUrl} className={actionButton(false)}>
                        Open in Screener
                      </a>

                      <a href={success.explorerUrl} className={actionButton(false)}>
                        Open in RioExplorer
                      </a>

                      {metadataPackage?.rioExProfilePreviewUrl ? (
                        <a
                          href={metadataPackage.rioExProfilePreviewUrl.replace(
                            "/api/rioex/assets/",
                            "/rioex/assets/",
                          )}
                          className={actionButton(true)}
                        >
                          Open RioEx Asset Profile
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <div className={card()}>
              <div className={sectionEyebrow()}>Allocation architecture</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Supply structure</h3>
              <div className="mt-4 space-y-3">
                {(lockedFramework?.allocationDefaults ?? []).map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={card()}>
              <div className={sectionEyebrow()}>Trust architecture</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Credibility controls</h3>
              <div className="mt-4 space-y-3">
                {(lockedFramework?.trustDefaults ?? []).map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={card()}>
              <div className={sectionEyebrow()}>Market readiness</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Discovery path</h3>
              <div className="mt-4 space-y-3">
                {(lockedFramework?.readinessDefaults ?? []).map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className={card()}>
              <div className={sectionEyebrow()}>Prime standards</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Issuer-grade creation path</h3>
              <div className="mt-4 grid gap-3">
                {[
                  "Choose niche before lock-in",
                  "Explicit liquidity structure",
                  "Fee tier visible before creation",
                  "Discovery and Screener actions surfaced after issuance",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={card("border-amber-400/15")}>
              <div className={sectionEyebrow()}>Navigation</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Launcher family</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/createtoken" className={actionButton(false)}>
                  CreateToken gateway
                </Link>
                <Link href="/createtoken/pump" className={actionButton(false)}>
                  Pump.live
                </Link>
                <button type="button" className={actionButton(true)}>
                  Prime
                </button>
              </div>

              <div className="mt-6 text-sm leading-7 text-slate-400">
                Prime now follows the same authority-shaped surface pattern as Pump, with
                treasury-aware creation, lifecycle truth, and stronger market handoff posture.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
