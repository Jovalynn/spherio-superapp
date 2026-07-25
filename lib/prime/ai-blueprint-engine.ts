export type PrimeAiBlueprintInput = {
  nicheId?: string | null;
  nicheTitle?: string | null;
  nicheCategory?: string | null;
  creatorUtilities?: string[];
  creatorUtilityLabels?: string[];
};

export type PrimeAiBlueprint = {
  id: string;
  title: string;
  summary: string;
  frontendPages: string[];
  apiRoutes: string[];
  databaseTables: string[];
  userRoles: string[];
  rioMindNexusHooks: string[];
  buildPhases: string[];
  disclosures: string[];
};

const DEFAULT_BLUEPRINT: PrimeAiBlueprint = {
  id: "generic_ai_prime_project",
  title: "Generic AI Prime Project Blueprint",
  summary:
    "A structured AI project blueprint for Prime launches that require a public product surface, usage tracking, project metadata, utility modules, and RioMind Nexus readiness.",
  frontendPages: [
    "/project",
    "/project/dashboard",
    "/project/settings",
    "/project/analytics",
  ],
  apiRoutes: [
    "/api/project/profile",
    "/api/project/usage",
    "/api/project/utilities",
    "/api/project/analytics",
  ],
  databaseTables: [
    "prime_ai_projects",
    "prime_ai_project_modules",
    "prime_ai_usage_events",
    "prime_ai_project_activity",
  ],
  userRoles: ["creator", "user", "admin"],
  rioMindNexusHooks: [
    "Project context registration",
    "AI utility recommendation",
    "Usage summary generation",
    "Creator workflow assistance",
  ],
  buildPhases: [
    "Define project profile and utility model",
    "Create public project surface",
    "Add usage and activity tracking",
    "Connect selected utilities",
    "Expose proof in Prime and RioExplorer",
  ],
  disclosures: [
    "AI outputs may be inaccurate and require human review.",
    "Project creators are responsible for claims, compliance, and user-facing promises.",
  ],
};

const BLUEPRINTS: Record<string, PrimeAiBlueprint> = {
  ai_development_app_building: {
    id: "ai_development_app_building",
    title: "AI Development & App Building Blueprint",
    summary:
      "A no-code and developer-facing AI platform for creating apps, routing AI models, metering usage, and deploying AI-powered products.",
    frontendPages: [
      "/ai-builder",
      "/ai-builder/templates",
      "/ai-builder/workspace",
      "/ai-builder/deployments",
      "/ai-builder/usage",
      "/ai-builder/api-keys",
    ],
    apiRoutes: [
      "/api/ai-builder/templates",
      "/api/ai-builder/projects",
      "/api/ai-builder/model-routes",
      "/api/ai-builder/usage",
      "/api/ai-builder/deployments",
      "/api/ai-builder/credits",
    ],
    databaseTables: [
      "ai_builder_projects",
      "ai_builder_templates",
      "ai_model_routes",
      "ai_usage_credits",
      "ai_deployments",
      "ai_builder_events",
    ],
    userRoles: ["creator", "developer", "workspace_user", "admin"],
    rioMindNexusHooks: [
      "Prompt-to-app assistant",
      "Model routing advisor",
      "App architecture generator",
      "Usage and credit summarizer",
      "Deployment checklist assistant",
    ],
    buildPhases: [
      "Template gallery and project workspace",
      "Model router and usage metering",
      "Credit deduction and deployment records",
      "Developer API keys and app export",
      "RioMind Nexus assistant integration",
    ],
    disclosures: [
      "Generated applications require review before production use.",
      "AI model outputs may vary by provider and prompt quality.",
      "API usage should be metered and rate-limited.",
    ],
  },

  ai_agent_marketplace: {
    id: "ai_agent_marketplace",
    title: "AI Agent Marketplace Blueprint",
    summary:
      "A marketplace for publishing, buying, renting, installing, executing, and monetizing AI agents and agent workflows.",
    frontendPages: [
      "/agents",
      "/agents/[agentId]",
      "/agents/install",
      "/agents/publisher",
      "/agents/runs",
      "/agents/revenue",
    ],
    apiRoutes: [
      "/api/agents",
      "/api/agents/[agentId]",
      "/api/agents/install",
      "/api/agents/run",
      "/api/agents/reviews",
      "/api/agents/revenue",
    ],
    databaseTables: [
      "ai_agents",
      "ai_agent_publishers",
      "ai_agent_installs",
      "ai_agent_runs",
      "ai_agent_reviews",
      "ai_agent_revenue",
    ],
    userRoles: ["buyer", "publisher", "agent_operator", "admin"],
    rioMindNexusHooks: [
      "Agent recommendation",
      "Agent capability review",
      "Workflow execution assistant",
      "Publisher onboarding assistant",
      "Agent safety summary",
    ],
    buildPhases: [
      "Agent catalog and publisher profile",
      "Install/rent/buy workflows",
      "Agent execution logs",
      "Reviews and safety metadata",
      "Publisher revenue and payout records",
    ],
    disclosures: [
      "Agent outputs are not guaranteed.",
      "Autonomous agent actions require user approval where risk exists.",
      "Agent publishers must disclose capabilities and limitations.",
    ],
  },

  student_ai_platform: {
    id: "student_ai_platform",
    title: "Student AI Platform Blueprint",
    summary:
      "A student learning platform for AI tutoring, notes, flashcards, exam preparation, progress tracking, and certification proof.",
    frontendPages: [
      "/learn",
      "/learn/tutor",
      "/learn/notes",
      "/learn/flashcards",
      "/learn/exam-prep",
      "/learn/certifications",
    ],
    apiRoutes: [
      "/api/learn/tutor",
      "/api/learn/notes",
      "/api/learn/flashcards",
      "/api/learn/progress",
      "/api/learn/certifications",
      "/api/learn/scholarships",
    ],
    databaseTables: [
      "learning_courses",
      "learning_sessions",
      "tutor_threads",
      "flashcards",
      "student_progress",
      "learning_certifications",
    ],
    userRoles: ["student", "teacher", "creator", "admin"],
    rioMindNexusHooks: [
      "AI tutor assistant",
      "Study-plan generator",
      "Exam-prep assistant",
      "Flashcard generator",
      "Certification summary assistant",
    ],
    buildPhases: [
      "Student dashboard and subject selection",
      "Tutor chat and study notes",
      "Flashcards and exam prep",
      "Progress tracking and certification proof",
      "Scholarship/support module",
    ],
    disclosures: [
      "Educational assistance is not a substitute for official instruction.",
      "No cheating or exam impersonation support.",
      "Generated study materials should be checked by the learner or instructor.",
    ],
  },

  science_virtual_lab: {
    id: "science_virtual_lab",
    title: "Science & Virtual Lab Blueprint",
    summary:
      "A virtual STEM laboratory for simulations, scientific calculators, experiment templates, datasets, lab reports, and guided research workflows.",
    frontendPages: [
      "/labs",
      "/labs/physics",
      "/labs/chemistry",
      "/labs/biology",
      "/labs/engineering",
      "/labs/reports",
    ],
    apiRoutes: [
      "/api/labs/experiments",
      "/api/labs/simulations",
      "/api/labs/datasets",
      "/api/labs/reports",
      "/api/labs/models",
    ],
    databaseTables: [
      "virtual_labs",
      "lab_experiments",
      "lab_simulations",
      "lab_datasets",
      "lab_reports",
      "scientific_models",
    ],
    userRoles: ["student", "researcher", "instructor", "admin"],
    rioMindNexusHooks: [
      "Experiment explainer",
      "Simulation setup assistant",
      "Lab report assistant",
      "Scientific model interpreter",
      "Dataset guidance assistant",
    ],
    buildPhases: [
      "Lab catalog and experiment selector",
      "Simulation canvas and result panel",
      "Dataset registry",
      "Report generation",
      "Certification/proof layer",
    ],
    disclosures: [
      "Simulations are educational approximations unless validated.",
      "Scientific outputs require human review.",
      "Dataset sources should be disclosed.",
    ],
  },

  research_economy: {
    id: "research_economy",
    title: "Research Economy Blueprint",
    summary:
      "A research coordination network for proposals, grants, peer review, publications, citations, datasets, and reputation.",
    frontendPages: [
      "/research",
      "/research/proposals",
      "/research/grants",
      "/research/reviews",
      "/research/publications",
      "/research/profiles",
    ],
    apiRoutes: [
      "/api/research/proposals",
      "/api/research/grants",
      "/api/research/reviews",
      "/api/research/citations",
      "/api/research/publications",
      "/api/research/profiles",
    ],
    databaseTables: [
      "research_profiles",
      "research_proposals",
      "research_grants",
      "research_reviews",
      "research_citations",
      "research_publications",
    ],
    userRoles: ["researcher", "reviewer", "grant_admin", "institution", "admin"],
    rioMindNexusHooks: [
      "Proposal drafting assistant",
      "Literature review assistant",
      "Citation formatter",
      "Peer review summarizer",
      "Grant evaluation assistant",
    ],
    buildPhases: [
      "Research profiles and proposal builder",
      "Grant board and funding workflow",
      "Peer review workflow",
      "Publication and citation records",
      "Reputation and proof layer",
    ],
    disclosures: [
      "Research claims require evidence and citation support.",
      "Peer review should remain transparent and accountable.",
      "Funding decisions require governance or administrator review.",
    ],
  },

  data_marketplace: {
    id: "data_marketplace",
    title: "Data Marketplace Blueprint",
    summary:
      "A dataset marketplace for upload, licensing, provenance, quality review, access control, contributor rewards, and enterprise subscriptions.",
    frontendPages: [
      "/data",
      "/data/upload",
      "/data/[datasetId]",
      "/data/licenses",
      "/data/purchases",
      "/data/contributor",
    ],
    apiRoutes: [
      "/api/data/datasets",
      "/api/data/upload",
      "/api/data/licenses",
      "/api/data/purchases",
      "/api/data/provenance",
      "/api/data/quality-reviews",
    ],
    databaseTables: [
      "datasets",
      "dataset_licenses",
      "dataset_contributors",
      "dataset_purchases",
      "dataset_provenance",
      "dataset_quality_reviews",
    ],
    userRoles: ["buyer", "contributor", "reviewer", "enterprise_admin", "admin"],
    rioMindNexusHooks: [
      "Dataset summary assistant",
      "License explanation assistant",
      "Quality review assistant",
      "Data buyer recommendation",
      "Contributor onboarding assistant",
    ],
    buildPhases: [
      "Dataset catalog and upload flow",
      "Licensing and access control",
      "Provenance and quality review",
      "Purchase/subscription records",
      "Enterprise data access",
    ],
    disclosures: [
      "Dataset ownership and licensing must be clear.",
      "Privacy-sensitive data requires compliance review.",
      "Data quality should be verified before critical use.",
    ],
  },

  ai_trading_intelligence: {
    id: "ai_trading_intelligence",
    title: "AI Trading Intelligence Blueprint",
    summary:
      "A trading intelligence platform for market signals, strategy marketplace, portfolio tools, backtesting, and risk scoring.",
    frontendPages: [
      "/trading-ai",
      "/trading-ai/signals",
      "/trading-ai/strategies",
      "/trading-ai/backtests",
      "/trading-ai/portfolio",
      "/trading-ai/risk",
    ],
    apiRoutes: [
      "/api/trading-ai/signals",
      "/api/trading-ai/strategies",
      "/api/trading-ai/backtests",
      "/api/trading-ai/portfolio",
      "/api/trading-ai/risk-scores",
    ],
    databaseTables: [
      "trading_strategies",
      "trading_signals",
      "strategy_backtests",
      "trading_portfolios",
      "risk_scores",
      "trading_subscriptions",
    ],
    userRoles: ["trader", "strategy_publisher", "analyst", "admin"],
    rioMindNexusHooks: [
      "Market analysis assistant",
      "Strategy explainer",
      "Risk summary assistant",
      "Portfolio review assistant",
      "Backtest interpretation assistant",
    ],
    buildPhases: [
      "Trading dashboard and signal cards",
      "Strategy marketplace",
      "Backtesting records",
      "Portfolio and risk scoring",
      "Subscription and alert workflow",
    ],
    disclosures: [
      "Not financial advice.",
      "No profit guarantee.",
      "Trading involves risk and users are responsible for decisions.",
    ],
  },

  ai_creator_studio: {
    id: "ai_creator_studio",
    title: "AI Creator Studio Blueprint",
    summary:
      "A creator workspace for scripts, podcasts, blogs, courses, e-books, social campaigns, templates, and export workflows.",
    frontendPages: [
      "/creator-ai",
      "/creator-ai/workspace",
      "/creator-ai/templates",
      "/creator-ai/campaigns",
      "/creator-ai/exports",
      "/creator-ai/subscriptions",
    ],
    apiRoutes: [
      "/api/creator-ai/jobs",
      "/api/creator-ai/templates",
      "/api/creator-ai/campaigns",
      "/api/creator-ai/exports",
      "/api/creator-ai/subscriptions",
    ],
    databaseTables: [
      "creator_projects",
      "creator_templates",
      "content_jobs",
      "creator_campaigns",
      "creator_exports",
      "creator_subscriptions",
    ],
    userRoles: ["creator", "brand_manager", "subscriber", "admin"],
    rioMindNexusHooks: [
      "Content workflow assistant",
      "Script generator",
      "Campaign planner",
      "Brand voice assistant",
      "Export formatter",
    ],
    buildPhases: [
      "Creator workspace and templates",
      "Content generation jobs",
      "Campaign calendar",
      "Export/publishing workflow",
      "Subscription and marketplace layer",
    ],
    disclosures: [
      "Creators are responsible for copyright and content claims.",
      "AI-generated content should be reviewed before publishing.",
      "Platform moderation rules apply.",
    ],
  },

  ai_social_platform: {
    id: "ai_social_platform",
    title: "AI Social Platform Blueprint",
    summary:
      "An AI-powered social platform for profiles, content feeds, creator rewards, engagement tracking, moderation, and governance.",
    frontendPages: [
      "/social-ai",
      "/social-ai/feed",
      "/social-ai/creators",
      "/social-ai/communities",
      "/social-ai/rewards",
      "/social-ai/moderation",
    ],
    apiRoutes: [
      "/api/social-ai/posts",
      "/api/social-ai/engagements",
      "/api/social-ai/rewards",
      "/api/social-ai/communities",
      "/api/social-ai/moderation",
    ],
    databaseTables: [
      "social_posts",
      "social_creators",
      "social_engagements",
      "social_rewards",
      "social_communities",
      "moderation_events",
    ],
    userRoles: ["user", "creator", "moderator", "admin"],
    rioMindNexusHooks: [
      "Content moderation assistant",
      "Creator growth assistant",
      "Engagement summary assistant",
      "Community governance assistant",
      "Reward risk detector",
    ],
    buildPhases: [
      "Profiles and feed",
      "Creator/community spaces",
      "Engagement tracking",
      "Reward logic and anti-abuse controls",
      "Moderation and governance",
    ],
    disclosures: [
      "Reward farming and spam controls are required.",
      "Community rules must be visible.",
      "AI moderation should support, not replace, human review.",
    ],
  },

  enterprise_ai_automation: {
    id: "enterprise_ai_automation",
    title: "Enterprise AI Automation Blueprint",
    summary:
      "A B2B automation platform for organizations, workflows, support agents, document intelligence, audits, and service plans.",
    frontendPages: [
      "/enterprise-ai",
      "/enterprise-ai/workflows",
      "/enterprise-ai/agents",
      "/enterprise-ai/documents",
      "/enterprise-ai/reports",
      "/enterprise-ai/settings",
    ],
    apiRoutes: [
      "/api/enterprise-ai/organizations",
      "/api/enterprise-ai/workflows",
      "/api/enterprise-ai/automations",
      "/api/enterprise-ai/audit-logs",
      "/api/enterprise-ai/service-plans",
    ],
    databaseTables: [
      "enterprise_organizations",
      "enterprise_workflows",
      "enterprise_automations",
      "enterprise_audit_logs",
      "enterprise_service_plans",
      "enterprise_users",
    ],
    userRoles: ["organization_admin", "operator", "viewer", "support_agent", "admin"],
    rioMindNexusHooks: [
      "Workflow builder assistant",
      "Document summary assistant",
      "Customer support agent",
      "Audit summary assistant",
      "Automation recommendation engine",
    ],
    buildPhases: [
      "Organization accounts and RBAC",
      "Workflow builder",
      "Automation execution records",
      "Audit logs and reports",
      "Service plans and billing",
    ],
    disclosures: [
      "Business data should be handled with privacy controls.",
      "Automations require approval for sensitive operations.",
      "Service levels and limits should be clearly stated.",
    ],
  },

  healthcare_medical_ai: {
    id: "healthcare_medical_ai",
    title: "Healthcare & Medical AI Blueprint",
    summary:
      "A high-compliance AI healthcare/research platform for provider profiles, research cases, consent records, data access, and audit logs.",
    frontendPages: [
      "/health-ai",
      "/health-ai/research",
      "/health-ai/providers",
      "/health-ai/data-access",
      "/health-ai/compliance",
      "/health-ai/audit",
    ],
    apiRoutes: [
      "/api/health-ai/providers",
      "/api/health-ai/research-cases",
      "/api/health-ai/consent",
      "/api/health-ai/data-access",
      "/api/health-ai/compliance-reviews",
      "/api/health-ai/audit-logs",
    ],
    databaseTables: [
      "health_providers",
      "health_research_cases",
      "health_consent_records",
      "health_data_access",
      "health_audit_logs",
      "health_compliance_reviews",
    ],
    userRoles: ["patient_user", "provider", "researcher", "compliance_reviewer", "admin"],
    rioMindNexusHooks: [
      "Medical literature summary assistant",
      "Provider workflow assistant",
      "Research collaboration assistant",
      "Compliance checklist assistant",
      "Patient-safe explanation assistant",
    ],
    buildPhases: [
      "Compliance-first public pages",
      "Provider/research profiles",
      "Consent and access records",
      "Audit logs and review workflow",
      "Medical research collaboration tools",
    ],
    disclosures: [
      "Not a doctor or emergency service.",
      "No diagnosis guarantee.",
      "Health data requires privacy and compliance review.",
    ],
  },

  ai_freelance_work_marketplace: {
    id: "ai_freelance_work_marketplace",
    title: "AI Freelance & Work Marketplace Blueprint",
    summary:
      "A work marketplace for jobs, offers, escrow, disputes, reviews, freelancer profiles, and AI specialist services.",
    frontendPages: [
      "/work-ai",
      "/work-ai/jobs",
      "/work-ai/freelancers",
      "/work-ai/services",
      "/work-ai/escrow",
      "/work-ai/disputes",
    ],
    apiRoutes: [
      "/api/work-ai/jobs",
      "/api/work-ai/offers",
      "/api/work-ai/escrows",
      "/api/work-ai/disputes",
      "/api/work-ai/reviews",
      "/api/work-ai/profiles",
    ],
    databaseTables: [
      "work_jobs",
      "work_offers",
      "work_escrows",
      "work_disputes",
      "work_reviews",
      "freelancer_profiles",
    ],
    userRoles: ["client", "freelancer", "dispute_reviewer", "admin"],
    rioMindNexusHooks: [
      "Job description assistant",
      "Freelancer matching assistant",
      "Escrow summary assistant",
      "Dispute review assistant",
      "Reputation summary assistant",
    ],
    buildPhases: [
      "Job board and profiles",
      "Offers and service listings",
      "Escrow/payment records",
      "Reviews and reputation",
      "Dispute workflow",
    ],
    disclosures: [
      "Escrow terms must be clear.",
      "Service delivery is creator/freelancer responsibility.",
      "Disputes require transparent review rules.",
    ],
  },

  developer_ai_ecosystem: {
    id: "developer_ai_ecosystem",
    title: "Developer AI Ecosystem Blueprint",
    summary:
      "A developer platform for SDKs, APIs, API keys, bug bounties, grants, deployments, and app templates.",
    frontendPages: [
      "/dev-ai",
      "/dev-ai/docs",
      "/dev-ai/api-keys",
      "/dev-ai/sdk",
      "/dev-ai/bounties",
      "/dev-ai/deployments",
    ],
    apiRoutes: [
      "/api/dev-ai/developers",
      "/api/dev-ai/api-keys",
      "/api/dev-ai/sdk-downloads",
      "/api/dev-ai/bounties",
      "/api/dev-ai/grants",
      "/api/dev-ai/deployments",
    ],
    databaseTables: [
      "developer_profiles",
      "developer_api_keys",
      "sdk_downloads",
      "developer_bounties",
      "developer_grants",
      "developer_deployments",
    ],
    userRoles: ["developer", "maintainer", "bounty_reviewer", "admin"],
    rioMindNexusHooks: [
      "SDK assistant",
      "API integration assistant",
      "Bug bounty assistant",
      "Deployment guide assistant",
      "Code review assistant",
    ],
    buildPhases: [
      "Developer docs and portal",
      "API key and usage metering",
      "SDK download tracking",
      "Bounties and grants",
      "Deployment console",
    ],
    disclosures: [
      "API limits and terms must be clear.",
      "SDK license should be disclosed.",
      "Bounty rules must be transparent.",
    ],
  },

  ai_business_launch_hub: {
    id: "ai_business_launch_hub",
    title: "AI Business Launch Hub Blueprint",
    summary:
      "A one-click business app generator for CRM, school portals, e-commerce, support agents, sales automation, and workflows.",
    frontendPages: [
      "/business-ai",
      "/business-ai/templates",
      "/business-ai/apps",
      "/business-ai/preview",
      "/business-ai/support",
      "/business-ai/billing",
    ],
    apiRoutes: [
      "/api/business-ai/templates",
      "/api/business-ai/generated-apps",
      "/api/business-ai/deployments",
      "/api/business-ai/support-agents",
      "/api/business-ai/subscriptions",
    ],
    databaseTables: [
      "business_templates",
      "business_generated_apps",
      "business_deployments",
      "business_subscriptions",
      "business_support_agents",
    ],
    userRoles: ["business_owner", "operator", "customer_support", "admin"],
    rioMindNexusHooks: [
      "Business app generator",
      "CRM setup assistant",
      "Support agent builder",
      "Sales workflow assistant",
      "Website/app copy assistant",
    ],
    buildPhases: [
      "Template selector",
      "Generated app preview",
      "Deployment metadata",
      "Support agent and CRM modules",
      "Subscriptions and billing",
    ],
    disclosures: [
      "Generated apps require review before business use.",
      "Data handling and customer privacy must be clear.",
      "Template limitations should be disclosed.",
    ],
  },

  ai_education_research_ecosystem: {
    id: "ai_education_research_ecosystem",
    title: "AI Education & Research Ecosystem Blueprint",
    summary:
      "A full AI ecosystem for students, research, agents, datasets, credentials, grants, labs, and developer AI apps.",
    frontendPages: [
      "/ai-ecosystem",
      "/ai-ecosystem/learning",
      "/ai-ecosystem/research",
      "/ai-ecosystem/agents",
      "/ai-ecosystem/data",
      "/ai-ecosystem/credentials",
      "/ai-ecosystem/developers",
    ],
    apiRoutes: [
      "/api/ai-ecosystem/learning",
      "/api/ai-ecosystem/research",
      "/api/ai-ecosystem/agents",
      "/api/ai-ecosystem/datasets",
      "/api/ai-ecosystem/credentials",
      "/api/ai-ecosystem/grants",
      "/api/ai-ecosystem/developer-apps",
    ],
    databaseTables: [
      "ecosystem_learning",
      "ecosystem_research",
      "ecosystem_agents",
      "ecosystem_datasets",
      "ecosystem_credentials",
      "ecosystem_grants",
      "ecosystem_developer_apps",
    ],
    userRoles: ["student", "researcher", "developer", "agent_publisher", "institution", "admin"],
    rioMindNexusHooks: [
      "Unified ecosystem assistant",
      "Student tutor",
      "Research assistant",
      "Agent marketplace assistant",
      "Dataset assistant",
      "Credential proof assistant",
      "Developer app assistant",
    ],
    buildPhases: [
      "Multi-module dashboard",
      "Learning and research modules",
      "Agent and data marketplaces",
      "Credentials and grants",
      "Developer app marketplace",
      "RioMind Nexus orchestration",
    ],
    disclosures: [
      "AI outputs must be reviewed.",
      "Academic integrity rules apply.",
      "Research, data, and credential claims require proof.",
    ],
  },
};

export function getPrimeAiBlueprint(input: PrimeAiBlueprintInput): PrimeAiBlueprint {
  const id = String(input.nicheId || "").trim();
  const base = BLUEPRINTS[id] || {
    ...DEFAULT_BLUEPRINT,
    id: id || DEFAULT_BLUEPRINT.id,
    title: input.nicheTitle
      ? `${input.nicheTitle} Blueprint`
      : DEFAULT_BLUEPRINT.title,
  };

  const utilityLabels = input.creatorUtilityLabels || [];

  return {
    ...base,
    summary: utilityLabels.length
      ? `${base.summary} Selected creator utilities: ${utilityLabels.join(", ")}.`
      : base.summary,
  };
}
