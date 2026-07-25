import type { DeepNicheTemplate } from "./deep-niche-template";

export const COMPLEX_PROJECT_MANAGER_AI_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "complex_project_manager_ai",
  title: "Complex Project Manager AI Intelligence Platform",
  publicPositioning: "A creator-owned project command platform for roadmap planning, milestone control, dependency mapping, risk analysis, multi-team execution, budget/resource posture, delivery reporting, and strategic governance.",
  creatorPromise: "Prime lets a creator launch a serious project command center, PMO assistant, execution tracker, roadmap planner, delivery intelligence platform, or multi-team operations workspace.",
  userPromise: "Teams can structure complex projects, map milestones, assign workstreams, detect risks, track dependencies, plan resources, review execution posture, and generate board-ready project reports.",
  audiences: [
    { title: "Founders and operators", description: "Turn complex goals into roadmaps, milestones, risks, and execution plans." },
    { title: "Project managers and PMOs", description: "Coordinate multi-team projects, dependencies, owners, budgets, and delivery reports." },
    { title: "Engineering/product teams", description: "Plan releases, sprints, blockers, technical dependencies, QA, and launch readiness." },
    { title: "Enterprise teams", description: "Control governance, approvals, resources, compliance, reporting, and delivery posture." }
  ],
  creatorSetup: [
    { title: "Project focus", description: "Choose the project category.", options: ["Startup", "Software", "Infrastructure", "Enterprise", "Research", "Operations", "Transformation"] },
    { title: "Workflow type", description: "Choose the main workflow.", options: ["Roadmap", "Milestones", "Dependencies", "Risk review", "Budget/resource", "Delivery report"] },
    { title: "Execution model", description: "Choose management style.", options: ["Agile", "Waterfall", "Hybrid", "PMO", "Founder-led", "Enterprise governance"] },
    { title: "Access", description: "Choose monetization.", options: ["Free", "Subscription", "Usage credits", "Team license", "RIO/RUSD", "USDT/USDC"] }
  ],
  userWorkflow: [
    { step: "01", title: "Enter project objective", description: "User describes project goal, deadline, teams, constraints, scope, and desired outcome." },
    { step: "02", title: "Map workstreams", description: "Runtime structures phases, milestones, owners, tasks, dependencies, resources, and blockers." },
    { step: "03", title: "Analyze risk and delivery posture", description: "App reviews schedule risk, dependency risk, resource gaps, budget pressure, and governance needs." },
    { step: "04", title: "Generate execution plan", description: "System creates roadmap, milestone plan, sprint/release plan, owners, and review cadence." },
    { step: "05", title: "Track decisions and escalation", description: "Runtime marks decisions, approvals, blockers, escalations, and next leadership actions." },
    { step: "06", title: "Generate project command report", description: "App outputs delivery report, risks, dependencies, assumptions, and next actions." }
  ],
  deepModules: [
    { title: "Project Scope Architect", purpose: "Define objectives, scope, constraints, deliverables, stakeholders, and success criteria.", outputs: ["scope_map", "stakeholders", "success_criteria"] },
    { title: "Roadmap and Milestone Planner", purpose: "Build phases, milestones, deadlines, release plan, review cadence, and completion logic.", outputs: ["roadmap", "milestones", "review_cadence"] },
    { title: "Dependency Mapper", purpose: "Identify dependencies, blockers, owners, handoffs, sequencing, and critical path.", outputs: ["dependency_map", "critical_path", "blocker_list"] },
    { title: "Risk and Escalation Engine", purpose: "Flag schedule, budget, resource, technical, compliance, and governance risks.", outputs: ["risk_register", "escalation_path", "mitigation_plan"] },
    { title: "Resource and Budget Planner", purpose: "Plan team capacity, cost posture, resource gaps, burn pressure, and allocation.", outputs: ["resource_plan", "budget_notes", "capacity_flags"] },
    { title: "Execution Tracker", purpose: "Track progress, decisions, blockers, owners, deliverables, QA, and launch readiness.", outputs: ["execution_status", "decision_log", "launch_readiness"] },
    { title: "Governance and Reporting Assistant", purpose: "Prepare board updates, PMO reports, approvals, audit trail, and leadership summaries.", outputs: ["governance_report", "approval_notes", "board_summary"] },
    { title: "Project Command Report", purpose: "Generate command report with roadmap, risks, dependencies, posture, and next actions.", outputs: ["project_report", "risk_flags", "next_actions"] }
  ],
  accessModels: [
    { title: "Public project planner", description: "Anyone can generate basic roadmaps, task plans, and milestone outlines." },
    { title: "Subscription project workspace", description: "Users pay for saved projects, dependencies, reports, and execution dashboards." },
    { title: "Usage-credit project intelligence", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced project reviews." },
    { title: "Enterprise PMO workspace", description: "Teams manage portfolios, governance, approvals, budgets, risks, and reports." }
  ],
  rioMindNexusRole: [
    "Act as the complex project command intelligence layer behind Complex Project Manager AI.",
    "Map scope, roadmaps, milestones, dependencies, risks, resources, governance, and delivery posture.",
    "Generate project command reports with assumptions, limitations, risks, escalation paths, and next actions."
  ],
  proofAndVerification: [
    "Project plans require stakeholder review before execution.",
    "Budget, legal, compliance, HR, and high-impact decisions require qualified review.",
    "The system must not guarantee delivery, funding, revenue, deadlines, or resource availability.",
    "Assumptions, risks, dependencies, and missing information must be clearly disclosed."
  ]
};
