import type { DeepNicheTemplate } from "./deep-niche-template";

export const CODE_SOFTWARE_DEVELOPER_AI_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "code_software_developer_ai",
  title: "Code & Software Developer AI Intelligence Platform",
  publicPositioning: "A creator-owned software engineering intelligence platform for codebase reasoning, bug fixing, refactoring, API design, database/schema planning, test generation, security review, performance analysis, and deployment debugging.",
  creatorPromise: "Prime lets a creator launch a hands-on coding assistant, software engineering copilot, bug-fix lab, code review workspace, full-stack builder, or secure development intelligence platform.",
  userPromise: "Developers can analyze code, fix bugs, plan architecture, refactor files, generate tests, review APIs, design schemas, inspect security, optimize performance, and prepare implementation reports.",
  audiences: [
    { title: "Software developers", description: "Debug code, refactor files, generate tests, review architecture, and prepare implementation plans." },
    { title: "Full-stack teams", description: "Coordinate frontend, backend, database, APIs, auth, deployment, and QA workflows." },
    { title: "Security-conscious builders", description: "Review dependencies, auth, secrets, input handling, access control, and attack surfaces." },
    { title: "Startup engineering teams", description: "Move from product requirement to build plan, tasks, code review, tests, and deployment readiness." }
  ],
  creatorSetup: [
    { title: "Developer focus", description: "Choose the coding category.", options: ["Bug fixing", "Refactoring", "Full-stack build", "API design", "Database schema", "Tests", "Security review"] },
    { title: "Workflow type", description: "Choose the main workflow.", options: ["Code review", "Fix plan", "Refactor plan", "Test plan", "API/schema plan", "Security check"] },
    { title: "Stack model", description: "Choose technology stack.", options: ["Next.js", "Node.js", "React", "Postgres", "Docker", "Cosmos", "Rust", "Python"] },
    { title: "Access", description: "Choose monetization.", options: ["Free", "Subscription", "Usage credits", "Team license", "RIO/RUSD", "USDT/USDC"] }
  ],
  userWorkflow: [
    { step: "01", title: "Enter code problem", description: "User describes bug, feature, file, API, schema, build error, or software task." },
    { step: "02", title: "Map code context", description: "Runtime structures files, stack, error, dependencies, data flow, state flow, and constraints." },
    { step: "03", title: "Analyze implementation risk", description: "App reviews bug cause, regressions, security risk, type safety, tests, performance, and deployment risk." },
    { step: "04", title: "Generate fix or build plan", description: "System creates patch strategy, file changes, test plan, validation steps, and rollback notes." },
    { step: "05", title: "Review code quality", description: "Runtime checks maintainability, architecture fit, API contract, database impact, and security posture." },
    { step: "06", title: "Generate engineering report", description: "App outputs fix plan, implementation plan, tests, risks, assumptions, and next actions." }
  ],
  deepModules: [
    { title: "Codebase Reasoning Engine", purpose: "Map files, imports, state flow, data flow, APIs, database touchpoints, and runtime assumptions.", outputs: ["code_context", "flow_map", "assumptions"] },
    { title: "Bug Diagnosis Assistant", purpose: "Analyze errors, stack traces, symptoms, root causes, broken contracts, and likely fix paths.", outputs: ["bug_diagnosis", "root_cause", "fix_path"] },
    { title: "Refactor Planner", purpose: "Plan safe refactors, component splits, type cleanup, module boundaries, and regression controls.", outputs: ["refactor_plan", "file_changes", "regression_notes"] },
    { title: "API and Schema Designer", purpose: "Design API routes, request/response contracts, database schema, indexes, migrations, and validation.", outputs: ["api_contract", "schema_plan", "migration_notes"] },
    { title: "Test Generation Engine", purpose: "Create unit, integration, e2e, regression, smoke, and acceptance test plans.", outputs: ["test_plan", "test_cases", "acceptance_checks"] },
    { title: "Security Review Engine", purpose: "Review auth, permissions, input validation, secrets, dependencies, access control, and attack surface.", outputs: ["security_review", "risk_flags", "hardening_steps"] },
    { title: "Performance and Deployment Reviewer", purpose: "Analyze build, runtime, database, caching, bundle, Docker, environment, and deployment risks.", outputs: ["performance_notes", "deployment_flags", "rollback_plan"] },
    { title: "Software Engineering Report", purpose: "Generate implementation report with code plan, tests, risks, validation, and next actions.", outputs: ["engineering_report", "risk_flags", "next_actions"] }
  ],
  accessModels: [
    { title: "Public coding assistant", description: "Anyone can generate basic code reasoning, bug notes, and test ideas." },
    { title: "Subscription coding workspace", description: "Users pay for saved projects, code reviews, refactors, tests, and reports." },
    { title: "Usage-credit code engine", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced code analysis." },
    { title: "Team engineering workspace", description: "Teams manage repos, reviews, implementation plans, QA, security, and deployment reports." }
  ],
  rioMindNexusRole: [
    "Act as the hands-on code and software engineering intelligence layer behind Code & Software Developer AI.",
    "Analyze codebases, diagnose bugs, plan refactors, design APIs/schemas, generate tests, review security, assess performance, and prepare deployment plans.",
    "Generate engineering reports with assumptions, limitations, validation steps, risk flags, and next actions."
  ],
  proofAndVerification: [
    "Generated code and patches require developer review before production use.",
    "Security-sensitive changes require qualified security review.",
    "The system must not guarantee bug-free, secure, or production-ready software.",
    "Secrets, credentials, keys, private code, and sensitive data must not be exposed."
  ]
};
