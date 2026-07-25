import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const AI_DEVELOPMENT_APP_BUILDING_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "ai_development_app_building",
  nicheTitle: "AI Development & App Building Intelligence Platform",
  rioMindNexusRole:
    "RioMind Nexus will act as the product architect, app planner, codebase strategist, AI model-router planner, security reviewer, and deployment readiness analyst behind the AI Development & App Building project.",
  nexusHooks: [
    "product_architect_agent",
    "feature_decomposition_agent",
    "architecture_planner",
    "codebase_planner",
    "api_route_designer",
    "database_schema_designer",
    "model_router_planner",
    "security_risk_reviewer",
    "deployment_readiness_agent",
    "mvp_roadmap_generator",
  ],
  inputSchema: [
    {
      key: "app_idea",
      label: "App idea",
      type: "textarea",
      required: true,
      helper: "Describe what the user wants to build.",
      examples: ["Build a school portal", "Create an AI customer support chatbot", "Build a marketplace for tutors"],
    },
    {
      key: "target_users",
      label: "Target users",
      type: "text",
      required: true,
      helper: "Who will use the app?",
      examples: ["Students and teachers", "Small businesses", "Healthcare clinics", "Crypto traders"],
    },
    {
      key: "core_features",
      label: "Core features",
      type: "textarea",
      required: true,
      helper: "The key features the app must include.",
      examples: ["Login, dashboard, payments, chat, admin panel", "Course upload, exams, reports"],
    },
    {
      key: "ai_requirements",
      label: "AI requirements",
      type: "textarea",
      required: false,
      helper: "What AI should do inside the app.",
      examples: ["Answer questions", "Generate reports", "Route agents", "Analyze documents"],
    },
    {
      key: "launch_target",
      label: "Launch target",
      type: "text",
      required: false,
      helper: "How the user wants to launch or deploy.",
      examples: ["MVP in 30 days", "Production-ready SaaS", "Internal company tool"],
    },
  ],
  workflowActions: [
    {
      id: "build_product_blueprint",
      label: "Build Product Blueprint",
      purpose: "Turn the app idea into product goal, user profile, module list, and value proposition.",
    },
    {
      id: "generate_architecture",
      label: "Generate Architecture",
      purpose: "Create frontend, backend, database, API, AI, auth, payment, and deployment architecture.",
      requiresDiagnosis: true,
    },
    {
      id: "plan_codebase",
      label: "Plan Codebase",
      purpose: "Generate folder structure, routes, services, schemas, and integration points.",
      requiresDiagnosis: true,
    },
    {
      id: "design_ai_layer",
      label: "Design AI Layer",
      purpose: "Plan model routing, agents, prompts, usage credits, and RioMind Nexus integration.",
      requiresDiagnosis: true,
    },
    {
      id: "review_risks",
      label: "Review Risks",
      purpose: "Flag security, data, scaling, billing, privacy, and compliance risks.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_build_roadmap",
      label: "Generate Build Roadmap",
      purpose: "Create MVP phases, task breakdown, deployment checklist, and next actions.",
      requiresDiagnosis: true,
    },
  ],
  expectedOutputs: [
    {
      key: "product_blueprint",
      label: "Product Blueprint",
      description: "Problem, audience, value proposition, modules, and user flows.",
    },
    {
      key: "architecture_plan",
      label: "Architecture Plan",
      description: "Frontend, backend, database, API, AI, auth, payment, and deployment architecture.",
    },
    {
      key: "codebase_plan",
      label: "Codebase Plan",
      description: "Folder structure, routes, components, services, schemas, and workers.",
    },
    {
      key: "ai_layer_plan",
      label: "AI Layer Plan",
      description: "Nexus hooks, model routing, agents, prompts, usage credits, and output structure.",
    },
    {
      key: "risk_review",
      label: "Risk Review",
      description: "Security, scaling, data, billing, AI, compliance, and deployment risk flags.",
    },
    {
      key: "deployment_plan",
      label: "Deployment Plan",
      description: "Environment, Docker/cloud, CI/CD, monitoring, domain, and production checklist.",
    },
    {
      key: "build_roadmap",
      label: "Build Roadmap",
      description: "MVP phases, tasks, dependencies, and next recommended actions.",
    },
  ],
  verificationLayer: [
    {
      title: "Developer review",
      rule: "Generated app plans and codebase structures must be reviewed by qualified developers before production.",
    },
    {
      title: "Security review",
      rule: "Authentication, payment, data, and API systems require security review.",
    },
    {
      title: "Compliance review",
      rule: "Healthcare, legal, finance, education, and sensitive data apps require domain-specific compliance review.",
    },
    {
      title: "Deployment assumptions",
      rule: "Deployment plans must state assumptions, cloud dependencies, environment variables, and operational limits.",
    },
  ],
  accessModel: [
    {
      id: "public_access",
      label: "Public app builder",
      description: "Anyone can generate simple app ideas and basic product blueprints.",
    },
    {
      id: "subscription_access",
      label: "Subscription builder studio",
      description: "Users pay for advanced architecture, codebase plans, saved projects, and deployment reviews.",
    },
    {
      id: "usage_credit_access",
      label: "Usage-credit generation",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for deeper generations and packages.",
    },
    {
      id: "developer_agency_access",
      label: "Developer / agency access",
      description: "Teams and agencies manage client projects, blueprints, and technical handoffs.",
    },
  ],
});
