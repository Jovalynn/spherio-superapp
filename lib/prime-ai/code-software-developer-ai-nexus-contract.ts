import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const CODE_SOFTWARE_DEVELOPER_AI_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "code_software_developer_ai",
  nicheTitle: "Code & Software Developer AI Intelligence Platform",
  rioMindNexusRole: "RioMind Nexus will act as the hands-on software engineering intelligence layer. It will reason over codebases, diagnose bugs, plan refactors, design APIs and schemas, generate tests, review security, assess performance, debug deployment, and generate engineering reports.",
  nexusHooks: ["codebase_reasoning_engine","bug_diagnosis_assistant","refactor_planner","api_schema_designer","test_generation_engine","security_review_engine","performance_deployment_reviewer","software_engineering_reporter"],
  inputSchema: [
    { key: "code_problem", label: "Code problem", type: "textarea", required: true, helper: "Bug, feature, build error, API, schema, refactor, or software task.", examples: ["Fix build error", "Design API route", "Refactor component"] },
    { key: "stack", label: "Stack", type: "text", required: true, helper: "Technology stack.", examples: ["Next.js, TypeScript, Postgres", "Node, Docker", "Rust, CosmWasm"] },
    { key: "code_context", label: "Code context", type: "textarea", required: true, helper: "Relevant files, error, logs, current behavior, expected behavior, or architecture.", examples: ["page.tsx fails typecheck", "API returns null", "Docker build error"] },
    { key: "constraints", label: "Constraints", type: "textarea", required: false, helper: "Production, security, migration, compatibility, or deployment constraints.", examples: ["No regression", "Docker-first", "Preserve UI", "No secrets"] },
    { key: "target_output", label: "Target output", type: "textarea", required: true, helper: "What should be generated.", examples: ["Fix plan", "Patch steps", "Test plan", "Security review", "Full implementation report"] }
  ],
  workflowActions: [
    { id: "map_code_context", label: "Map Code Context", purpose: "Structure files, stack, error, data flow, state flow, dependencies, and constraints." },
    { id: "diagnose_bug_or_build", label: "Diagnose Bug/Build", purpose: "Analyze symptoms, root cause, broken contracts, type errors, and fix path.", requiresDiagnosis: true },
    { id: "plan_refactor_api_schema", label: "Plan Refactor/API/Schema", purpose: "Design refactor, API contract, schema, migration, validation, and compatibility plan.", requiresDiagnosis: true },
    { id: "generate_tests_validation", label: "Generate Tests/Validation", purpose: "Create unit, integration, e2e, regression, smoke, and acceptance checks.", requiresDiagnosis: true },
    { id: "review_security_deployment", label: "Review Security/Deployment", purpose: "Check auth, secrets, dependencies, performance, Docker, env, rollback, and release safety.", requiresDiagnosis: true },
    { id: "generate_software_report", label: "Generate Software Report", purpose: "Produce implementation report with code plan, tests, risks, validation, and next actions.", requiresDiagnosis: true }
  ],
  expectedOutputs: [
    { key: "code_context_map", label: "Code Context Map", description: "Files, imports, stack, data flow, state flow, dependencies, and assumptions." },
    { key: "bug_diagnosis", label: "Bug Diagnosis", description: "Symptoms, root cause, broken contracts, likely fix path, and verification steps." },
    { key: "implementation_plan", label: "Implementation Plan", description: "File changes, API/schema plan, refactor steps, migration notes, and rollback." },
    { key: "test_validation_plan", label: "Test/Validation Plan", description: "Unit, integration, e2e, regression, smoke, and acceptance checks." },
    { key: "security_deployment_review", label: "Security/Deployment Review", description: "Auth, secrets, dependencies, performance, Docker, env, release, and rollback risks." },
    { key: "code_quality_notes", label: "Code Quality Notes", description: "Maintainability, type safety, modularity, regression risk, and architecture fit." },
    { key: "software_engineering_report", label: "Software Engineering Report", description: "Final engineering package with assumptions, limitations, risks, validation, and next actions." }
  ],
  verificationLayer: [
    { title: "Developer review", rule: "Generated code and patches require developer review before production use." },
    { title: "Security boundary", rule: "Security-sensitive changes require qualified security review." },
    { title: "No bug-free guarantee", rule: "The system must not guarantee bug-free, secure, or production-ready software." },
    { title: "Secret safety", rule: "Secrets, credentials, keys, private code, and sensitive data must not be exposed." }
  ],
  accessModel: [
    { id: "public_coding_assistant", label: "Public coding assistant", description: "Basic code reasoning, bug notes, and test ideas." },
    { id: "subscription_coding_workspace", label: "Subscription coding workspace", description: "Saved projects, code reviews, refactors, tests, and reports." },
    { id: "usage_credit_code_engine", label: "Usage-credit code engine", description: "Advanced code analysis using credits, RIO, RUSD, USDT, or USDC." },
    { id: "team_engineering_workspace", label: "Team engineering workspace", description: "Repos, reviews, implementation plans, QA, security, and deployment reports." }
  ]
});
