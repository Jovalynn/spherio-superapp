import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const DEVELOPER_AI_ECOSYSTEM_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "developer_ai_ecosystem",
  nicheTitle: "Developer AI Ecosystem Intelligence Platform",
  rioMindNexusRole: "RioMind Nexus will act as the developer intelligence layer. It will plan architecture, review code, debug issues, generate tests, prepare SDK docs, review DevOps readiness, assess security, and generate engineering reports.",
  nexusHooks: ["architecture_planner","code_review_engine","debugging_assistant","test_generator","sdk_docs_builder","devops_readiness_reviewer","security_reviewer","engineering_report_generator"],
  inputSchema: [
    { key: "build_goal", label: "Build goal", type: "textarea", required: true, helper: "Describe app, repo, bug, SDK, deployment, or engineering task.", examples: ["Build a dashboard", "Debug API route", "Create SDK docs"] },
    { key: "stack", label: "Stack", type: "text", required: true, helper: "Tech stack.", examples: ["Next.js, Node, Postgres", "CosmWasm, Rust"] },
    { key: "current_issue", label: "Current issue", type: "textarea", required: false, helper: "Bug, blocker, requirement, or risk.", examples: ["Build fails", "Need auth", "API is slow"] },
    { key: "target_output", label: "Target output", type: "textarea", required: true, helper: "Desired output.", examples: ["Architecture plan", "Fix plan", "Tests", "Docs"] },
    { key: "constraints", label: "Constraints", type: "textarea", required: false, helper: "Runtime, security, budget, deadline, or deployment constraints.", examples: ["Docker only", "No secrets", "Production-safe"] }
  ],
  workflowActions: [
    { id: "plan_architecture", label: "Plan Architecture", purpose: "Map frontend, backend, database, APIs, workers, and integrations." },
    { id: "review_code", label: "Review Code", purpose: "Review bugs, maintainability, security, and dependency risk.", requiresDiagnosis: true },
    { id: "debug_issue", label: "Debug Issue", purpose: "Analyze symptoms, root cause, and fix path.", requiresDiagnosis: true },
    { id: "generate_tests", label: "Generate Tests", purpose: "Create unit, integration, e2e, and regression test plan.", requiresDiagnosis: true },
    { id: "prepare_docs_devops", label: "Prepare Docs/DevOps", purpose: "Generate docs, SDK examples, deployment checklist, and rollback plan.", requiresDiagnosis: true },
    { id: "generate_engineering_report", label: "Generate Engineering Report", purpose: "Produce build package, risks, tasks, and next actions.", requiresDiagnosis: true }
  ],
  expectedOutputs: [
    { key: "architecture_plan", label: "Architecture Plan", description: "Service map, data model, APIs, workers, and integration points." },
    { key: "code_review", label: "Code Review", description: "Bug flags, maintainability issues, security notes, and fix suggestions." },
    { key: "debug_plan", label: "Debug Plan", description: "Symptoms, root cause, likely fix path, and verification steps." },
    { key: "test_plan", label: "Test Plan", description: "Unit, integration, e2e, regression, and acceptance tests." },
    { key: "docs_devops_package", label: "Docs/DevOps Package", description: "SDK docs, API examples, deployment checklist, and rollback notes." },
    { key: "security_review", label: "Security Review", description: "Secrets, dependencies, auth, input handling, and hardening notes." },
    { key: "engineering_report", label: "Engineering Report", description: "Final build package, assumptions, risks, review points, and next actions." }
  ],
  verificationLayer: [
    { title: "Human engineering review", rule: "Generated code and architecture must be reviewed before production use." },
    { title: "Security review", rule: "Security-sensitive changes require qualified review." },
    { title: "No bug-free guarantee", rule: "The system must not guarantee bug-free or production-ready code." },
    { title: "Secret safety", rule: "Secrets, credentials, keys, and private data must not be exposed." }
  ],
  accessModel: [
    { id: "public_dev_assistant", label: "Public dev assistant", description: "Basic plans, docs, and debugging help." },
    { id: "subscription_workspace", label: "Subscription dev workspace", description: "Saved projects, repo analysis, tests, and docs." },
    { id: "usage_credit_engine", label: "Usage-credit engineering engine", description: "Advanced reviews using credits, RIO, RUSD, USDT, or USDC." },
    { id: "team_workspace", label: "Team developer workspace", description: "Repos, tasks, reviews, releases, SDKs, and security checks." }
  ]
});
