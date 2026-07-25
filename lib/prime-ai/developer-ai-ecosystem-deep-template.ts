import type { DeepNicheTemplate } from "./deep-niche-template";

export const DEVELOPER_AI_ECOSYSTEM_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "developer_ai_ecosystem",
  title: "Developer AI Ecosystem Intelligence Platform",
  publicPositioning: "A creator-owned developer AI platform for app planning, architecture, code review, debugging, tests, SDKs, docs, DevOps, and security review.",
  creatorPromise: "Prime lets a creator launch a developer AI ecosystem, coding assistant, SDK workspace, app builder, debugging lab, or DevOps intelligence hub.",
  userPromise: "Developers can plan apps, generate architecture, review code, debug issues, create tests, prepare SDKs, write docs, assess security, and prepare deployment packages.",
  audiences: [
    { title: "Developers", description: "Plan features, review code, debug errors, generate tests, and prepare releases." },
    { title: "Startup teams", description: "Turn product ideas into MVP architecture, repo tasks, and launch checklists." },
    { title: "SDK/API teams", description: "Create SDK docs, API examples, integration guides, and developer onboarding." },
    { title: "DevOps/security teams", description: "Review CI/CD, environments, secrets, dependencies, and deployment readiness." }
  ],
  creatorSetup: [
    { title: "Developer focus", description: "Choose the developer market.", options: ["Web apps", "Blockchain", "SDK/API", "DevOps", "Security", "AI apps"] },
    { title: "Workflow type", description: "Choose the main workflow.", options: ["Architecture", "Code review", "Debugging", "Tests", "Docs", "Deployment"] },
    { title: "User level", description: "Choose the user level.", options: ["Beginner", "Builder", "Senior dev", "Team", "Enterprise"] },
    { title: "Access", description: "Choose monetization.", options: ["Free", "Subscription", "Usage credits", "RIO/RUSD", "USDT/USDC"] }
  ],
  userWorkflow: [
    { step: "01", title: "Enter build goal", description: "Describe app, repo, bug, SDK, deployment, or engineering task." },
    { step: "02", title: "Map architecture", description: "Structure frontend, backend, database, APIs, workers, and integrations." },
    { step: "03", title: "Analyze code", description: "Review bugs, security issues, dependencies, tests, and maintainability." },
    { step: "04", title: "Generate assets", description: "Create code plan, tests, docs, SDK examples, and deployment checklist." },
    { step: "05", title: "Review readiness", description: "Check security, DevOps, environment, observability, and release risk." },
    { step: "06", title: "Generate engineering report", description: "Output architecture, tasks, risks, review notes, and next actions." }
  ],
  deepModules: [
    { title: "Architecture Planner", purpose: "Plan frontend, backend, database, APIs, workers, and integrations.", outputs: ["architecture_plan", "service_map", "data_model"] },
    { title: "Code Review Engine", purpose: "Review code quality, bugs, maintainability, and security posture.", outputs: ["review_notes", "bug_flags", "security_flags"] },
    { title: "Debugging Assistant", purpose: "Diagnose errors, stack traces, broken flows, and runtime issues.", outputs: ["debug_path", "root_cause", "fix_plan"] },
    { title: "Test Generator", purpose: "Create unit, integration, e2e, and regression test plans.", outputs: ["test_plan", "test_cases", "coverage_notes"] },
    { title: "SDK and Docs Builder", purpose: "Generate SDK examples, API docs, guides, and onboarding steps.", outputs: ["sdk_notes", "api_docs", "usage_examples"] },
    { title: "DevOps Readiness Reviewer", purpose: "Check env, CI/CD, secrets, monitoring, deployment, and rollback.", outputs: ["devops_checklist", "deployment_risks", "rollback_plan"] },
    { title: "Security Reviewer", purpose: "Check dependencies, auth, input handling, secrets, and attack surfaces.", outputs: ["security_review", "dependency_flags", "hardening_steps"] },
    { title: "Engineering Report Generator", purpose: "Produce build package, task list, risks, and next actions.", outputs: ["engineering_report", "task_list", "next_actions"] }
  ],
  accessModels: [
    { title: "Public dev assistant", description: "Anyone can generate basic plans, docs, and debugging help." },
    { title: "Subscription dev workspace", description: "Users pay for saved projects, repo analysis, tests, and docs." },
    { title: "Usage-credit engineering engine", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced reviews." },
    { title: "Team developer workspace", description: "Teams manage repos, tasks, reviews, releases, SDKs, and security checks." }
  ],
  rioMindNexusRole: [
    "Act as the developer intelligence layer behind Developer AI Ecosystem.",
    "Plan architecture, review code, debug issues, generate tests, build docs, review DevOps, and assess security.",
    "Generate engineering reports with assumptions, limitations, review points, and next actions."
  ],
  proofAndVerification: [
    "Generated code and architecture must be reviewed before production use.",
    "Security-sensitive changes require qualified review.",
    "The system must not guarantee bug-free, secure, or production-ready code.",
    "Secrets, credentials, keys, and private data must not be exposed."
  ]
};
