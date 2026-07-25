import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const AI_PERSONAL_WORK_MARKETPLACE_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "ai_personal_work_marketplace",
  nicheTitle: "AI Personal & Work Marketplace Intelligence Platform",
  rioMindNexusRole:
    "RioMind Nexus will act as the productivity and work orchestration layer behind AI Personal & Work Marketplace. It will map tasks, prioritize work, route personal admin, match services, build templates, prepare communications, analyze productivity, and generate work-output reports.",
  nexusHooks: [
    "task_priority_mapper",
    "work_plan_generator",
    "personal_admin_router",
    "service_matching_engine",
    "template_workflow_builder",
    "meeting_communication_assistant",
    "productivity_analytics_engine",
    "work_output_package_generator",
  ],
  inputSchema: [
    { key: "work_goal", label: "Work or personal goal", type: "textarea", required: true, helper: "Describe the task, project, life-admin need, or service request.", examples: ["Plan my week", "Prepare a client proposal", "Organize personal documents"] },
    { key: "user_context", label: "User context", type: "text", required: true, helper: "Who is using the workflow.", examples: ["Professional", "Freelancer", "Parent", "Team lead", "Service provider"] },
    { key: "deadline_or_timeline", label: "Deadline or timeline", type: "text", required: false, helper: "When this needs to be completed.", examples: ["Today", "This week", "Before Friday", "Monthly workflow"] },
    { key: "constraints_or_blockers", label: "Constraints or blockers", type: "textarea", required: false, helper: "Known blockers, dependencies, budget, missing information, or constraints.", examples: ["Need manager approval", "Limited time", "Missing client data"] },
    { key: "desired_output", label: "Desired output", type: "textarea", required: true, helper: "What the user wants produced.", examples: ["Task plan", "Checklist", "Template", "Email draft", "Service match", "Report"] },
  ],
  workflowActions: [
    { id: "map_priorities", label: "Map Priorities", purpose: "Identify tasks, urgency, importance, dependencies, blockers, and timeline." },
    { id: "generate_work_plan", label: "Generate Work Plan", purpose: "Create milestones, checklist, schedule, deliverables, and execution steps.", requiresDiagnosis: true },
    { id: "route_personal_admin", label: "Route Personal Admin", purpose: "Organize documents, reminders, errands, forms, and follow-up actions.", requiresDiagnosis: true },
    { id: "match_service_or_template", label: "Match Service or Template", purpose: "Recommend service, productivity agent, template, or marketplace package.", requiresDiagnosis: true },
    { id: "prepare_communication", label: "Prepare Communication", purpose: "Generate email, agenda, notes, follow-up, or decision log.", requiresDiagnosis: true },
    { id: "generate_work_report", label: "Generate Work Report", purpose: "Produce work package, priority map, review points, and next actions.", requiresDiagnosis: true },
  ],
  expectedOutputs: [
    { key: "priority_map", label: "Priority Map", description: "Tasks, urgency, importance, dependencies, blockers, and timeline." },
    { key: "work_plan", label: "Work Plan", description: "Execution plan, milestones, checklist, deliverables, and schedule." },
    { key: "admin_route", label: "Personal Admin Route", description: "Documents, reminders, forms, errands, and follow-up steps." },
    { key: "service_matches", label: "Service Matches", description: "Recommended providers, agents, templates, or productivity packages." },
    { key: "communication_package", label: "Communication Package", description: "Agenda, email draft, summary, follow-up, or decision log." },
    { key: "productivity_analysis", label: "Productivity Analysis", description: "Bottlenecks, completion risk, workload signals, and focus recommendations." },
    { key: "work_output_report", label: "Work Output Report", description: "Complete package with assumptions, review points, and next actions." },
  ],
  verificationLayer: [
    { title: "Human review", rule: "Generated work plans and templates should be reviewed before professional use." },
    { title: "Qualified advice boundary", rule: "Legal, financial, medical, HR, tax, and high-impact work requires qualified human review." },
    { title: "No guaranteed outcomes", rule: "The system must not guarantee job outcomes, productivity results, client acquisition, or income." },
    { title: "Marketplace integrity", rule: "Services require transparent scope, pricing, delivery terms, dispute rules, and quality controls." },
  ],
  accessModel: [
    { id: "public_productivity", label: "Public productivity assistant", description: "Anyone can generate basic plans, checklists, and templates." },
    { id: "subscription_workspace", label: "Subscription productivity workspace", description: "Users pay for saved workspaces, advanced planning, templates, and reports." },
    { id: "usage_credit_marketplace", label: "Usage-credit work marketplace", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced workflows." },
    { id: "team_service_workspace", label: "Team and service-provider workspace", description: "Teams and providers manage tasks, projects, deliverables, clients, and service orders." },
  ],
});
