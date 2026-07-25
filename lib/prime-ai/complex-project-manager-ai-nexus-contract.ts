import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const COMPLEX_PROJECT_MANAGER_AI_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "complex_project_manager_ai",
  nicheTitle: "Complex Project Manager AI Intelligence Platform",
  rioMindNexusRole: "RioMind Nexus will act as the complex project command intelligence layer. It will map scope, roadmaps, milestones, dependencies, risks, resources, governance, execution posture, and generate project command reports.",
  nexusHooks: ["project_scope_architect","roadmap_milestone_planner","dependency_mapper","risk_escalation_engine","resource_budget_planner","execution_tracker","governance_reporting_assistant","project_command_reporter"],
  inputSchema: [
    { key: "project_objective", label: "Project objective", type: "textarea", required: true, helper: "Describe goal, scope, deadline, teams, and expected outcome.", examples: ["Launch mainnet", "Build SaaS MVP", "Deploy enterprise system"] },
    { key: "teams_or_stakeholders", label: "Teams or stakeholders", type: "textarea", required: true, helper: "People, teams, departments, vendors, or decision makers.", examples: ["Engineering, design, legal, ops"] },
    { key: "timeline", label: "Timeline", type: "text", required: false, helper: "Deadline, phases, sprint length, or target date.", examples: ["8 weeks", "Q3", "Before launch"] },
    { key: "constraints_risks", label: "Constraints and risks", type: "textarea", required: false, helper: "Budget, blockers, dependencies, resource gaps, or governance constraints.", examples: ["Small team, security audit, dependency on API"] },
    { key: "target_output", label: "Target output", type: "textarea", required: true, helper: "What should be generated.", examples: ["Roadmap", "Risk report", "Milestone plan", "Board update"] }
  ],
  workflowActions: [
    { id: "map_project_scope", label: "Map Project Scope", purpose: "Define scope, stakeholders, deliverables, constraints, and success criteria." },
    { id: "plan_roadmap_milestones", label: "Plan Roadmap/Milestones", purpose: "Build phases, milestones, deadlines, release logic, and review cadence.", requiresDiagnosis: true },
    { id: "map_dependencies", label: "Map Dependencies", purpose: "Identify blockers, owners, handoffs, sequencing, and critical path.", requiresDiagnosis: true },
    { id: "review_risk_resources", label: "Review Risk/Resources", purpose: "Assess schedule, budget, team capacity, technical risk, and mitigation.", requiresDiagnosis: true },
    { id: "prepare_governance_report", label: "Prepare Governance Report", purpose: "Create decision log, approvals, escalation path, and leadership summary.", requiresDiagnosis: true },
    { id: "generate_project_report", label: "Generate Project Report", purpose: "Produce command report with risks, dependencies, posture, and next actions.", requiresDiagnosis: true }
  ],
  expectedOutputs: [
    { key: "scope_map", label: "Scope Map", description: "Objectives, stakeholders, deliverables, constraints, and success criteria." },
    { key: "roadmap_milestones", label: "Roadmap/Milestones", description: "Phases, milestones, deadlines, release plan, and review cadence." },
    { key: "dependency_map", label: "Dependency Map", description: "Dependencies, blockers, owners, handoffs, sequencing, and critical path." },
    { key: "risk_resource_review", label: "Risk/Resource Review", description: "Schedule risk, budget posture, capacity gaps, technical risk, and mitigation." },
    { key: "governance_package", label: "Governance Package", description: "Decision log, approvals, escalation path, audit trail, and leadership summary." },
    { key: "execution_status", label: "Execution Status", description: "Progress, owners, blockers, deliverables, QA, and launch readiness." },
    { key: "project_command_report", label: "Project Command Report", description: "Final command report with assumptions, limitations, risks, and next actions." }
  ],
  verificationLayer: [
    { title: "Stakeholder review", rule: "Project plans require stakeholder review before execution." },
    { title: "Qualified review boundary", rule: "Budget, legal, compliance, HR, and high-impact decisions require qualified review." },
    { title: "No delivery guarantee", rule: "The system must not guarantee delivery, funding, revenue, deadlines, or resource availability." },
    { title: "Assumption disclosure", rule: "Assumptions, risks, dependencies, and missing information must be clearly disclosed." }
  ],
  accessModel: [
    { id: "public_project_planner", label: "Public project planner", description: "Basic roadmaps, task plans, and milestone outlines." },
    { id: "subscription_project_workspace", label: "Subscription project workspace", description: "Saved projects, dependencies, reports, and execution dashboards." },
    { id: "usage_credit_project_intelligence", label: "Usage-credit project intelligence", description: "Advanced project reviews using credits, RIO, RUSD, USDT, or USDC." },
    { id: "enterprise_pmo_workspace", label: "Enterprise PMO workspace", description: "Portfolios, governance, approvals, budgets, risks, and reports." }
  ]
});
