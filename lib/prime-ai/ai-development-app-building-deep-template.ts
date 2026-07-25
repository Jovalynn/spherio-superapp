import type { DeepNicheTemplate } from "./deep-niche-template";

export const AI_DEVELOPMENT_APP_BUILDING_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "ai_development_app_building",
  title: "AI Development & App Building Intelligence Platform",
  publicPositioning:
    "A creator-owned AI app-building platform for no-code founders, developers, startups, businesses, and creators who want to turn ideas into structured product blueprints, app architecture, codebase plans, API workflows, and deployment readiness.",
  creatorPromise:
    "Prime lets a creator launch their own AI app builder, no-code studio, software product generator, startup builder, or developer platform without building the entire product infrastructure from scratch.",
  userPromise:
    "Users enter an app idea, audience, features, data needs, AI requirements, and launch target. The app turns the idea into a product blueprint, architecture plan, frontend/backend/database map, API route plan, deployment checklist, and development roadmap.",
  audiences: [
    {
      title: "Non-technical founders",
      description: "Turn business ideas into structured app plans without needing to understand code first.",
    },
    {
      title: "Developers and builders",
      description: "Use architecture planning, API maps, database models, and deployment checklists to speed up development.",
    },
    {
      title: "Startups and SMEs",
      description: "Plan internal tools, CRM, marketplaces, school portals, e-commerce apps, AI assistants, and workflow systems.",
    },
    {
      title: "AI product creators",
      description: "Create AI-powered apps, agents, model-routing tools, prompt workspaces, and usage-credit systems.",
    },
  ],
  creatorSetup: [
    {
      title: "Builder market",
      description: "The creator chooses the type of users their app builder serves.",
      options: ["Founders", "Developers", "SMEs", "Students", "Agencies", "Creators", "Enterprises"],
    },
    {
      title: "App categories",
      description: "The creator chooses what users can build.",
      options: ["Chatbot", "Marketplace", "CRM", "School portal", "Healthcare app", "E-commerce", "AI agent", "Dashboard"],
    },
    {
      title: "Development depth",
      description: "The creator chooses how deep the builder output should go.",
      options: ["Product blueprint", "Frontend plan", "Backend plan", "Database plan", "API map", "Deployment plan", "Security checklist"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides how users access the app-building utility.",
      options: ["Free", "Subscription", "Token-gated", "Usage credits", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Enter app idea",
      description: "User describes the product they want to build, the audience, and the problem it solves.",
    },
    {
      step: "02",
      title: "Build product blueprint",
      description: "The runtime converts the idea into product goal, users, modules, features, and success criteria.",
    },
    {
      step: "03",
      title: "Generate architecture",
      description: "The app creates frontend, backend, database, API, AI, and deployment architecture.",
    },
    {
      step: "04",
      title: "Plan codebase",
      description: "The system proposes file structure, services, schemas, API routes, and integration points.",
    },
    {
      step: "05",
      title: "Review risks",
      description: "The runtime flags security, scaling, data, billing, AI, and deployment risks.",
    },
    {
      step: "06",
      title: "Generate launch roadmap",
      description: "The app outputs MVP plan, build phases, deployment checklist, and next actions.",
    },
  ],
  deepModules: [
    {
      title: "Problem-to-Product Mapper",
      purpose: "Transform raw app ideas into a clear product concept with audience, problem, promise, and value flow.",
      outputs: ["product_brief", "audience_profile", "value_proposition"],
    },
    {
      title: "Feature Decomposition Engine",
      purpose: "Break the product into modules, user flows, roles, permissions, and core features.",
      outputs: ["feature_map", "user_flows", "role_matrix"],
    },
    {
      title: "Architecture Planner",
      purpose: "Design frontend, backend, database, API, AI, payment, auth, and deployment structure.",
      outputs: ["system_architecture", "service_map", "integration_plan"],
    },
    {
      title: "Codebase Planner",
      purpose: "Generate codebase structure, app routes, components, services, database tables, and API handlers.",
      outputs: ["folder_structure", "route_plan", "schema_plan"],
    },
    {
      title: "AI Model Router Planner",
      purpose: "Plan how RioMind Nexus, model routers, agents, prompts, and usage credits plug into the app.",
      outputs: ["model_router_plan", "agent_hooks", "usage_credit_logic"],
    },
    {
      title: "Security and Compliance Checklist",
      purpose: "Identify security, privacy, billing, authentication, API, and data-protection risks.",
      outputs: ["security_checklist", "risk_flags", "compliance_notes"],
    },
    {
      title: "Deployment Readiness Engine",
      purpose: "Prepare environment variables, Docker, cloud, monitoring, CI/CD, domain, and production checklist.",
      outputs: ["deployment_checklist", "environment_plan", "monitoring_plan"],
    },
    {
      title: "Build Roadmap Generator",
      purpose: "Produce MVP phases, build priorities, team tasks, timelines, and next recommended actions.",
      outputs: ["mvp_plan", "phase_roadmap", "task_breakdown"],
    },
  ],
  accessModels: [
    {
      title: "Public app builder",
      description: "Anyone can generate basic product blueprints and app ideas.",
    },
    {
      title: "Subscription builder studio",
      description: "Users pay for deeper architecture, codebase plans, deployment checks, and saved projects.",
    },
    {
      title: "Usage-credit app generation",
      description: "Users spend credits or tokens for advanced generation, AI routing, and deployment packages.",
    },
    {
      title: "Developer / agency access",
      description: "Teams, agencies, and developers manage multiple app projects and client blueprints.",
    },
  ],
  rioMindNexusRole: [
    "Act as the product architect behind the AI app builder.",
    "Convert vague app ideas into structured product plans.",
    "Design frontend, backend, database, API, AI, auth, payment, and deployment architecture.",
    "Detect technical risks, missing requirements, data issues, and scaling problems.",
    "Generate build roadmap, codebase plan, and developer handoff package.",
    "Support future implementation through RioMind Nexus developer and agent workflows.",
  ],
  proofAndVerification: [
    "Generated architecture must be reviewed by developers before production deployment.",
    "AI-generated codebase plans do not guarantee secure or bug-free software.",
    "Payment, healthcare, legal, financial, and sensitive data apps require special compliance review.",
    "Deployment plans must show assumptions, environment needs, and production limitations.",
  ],
};
