import type { DeepNicheTemplate } from "./deep-niche-template";

export const ENTERPRISE_AI_AUTOMATION_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "enterprise_ai_automation",
  title: "Enterprise AI Automation Intelligence Platform",
  publicPositioning:
    "A creator-owned enterprise automation platform for business workflows, SOPs, customer support, document routing, approvals, compliance, operations, analytics, and AI-powered process intelligence.",
  creatorPromise:
    "Prime lets a creator launch their own enterprise AI automation platform, workflow automation hub, business operations assistant, support automation system, or process intelligence workspace without building the full stack from scratch.",
  userPromise:
    "Businesses can define processes, map departments, automate workflows, generate SOPs, route documents, support customers, review risks, track approvals, and produce enterprise intelligence reports.",
  audiences: [
    {
      title: "Small and medium businesses",
      description: "Automate daily operations, customer support, reporting, approvals, and internal workflows.",
    },
    {
      title: "Enterprise teams",
      description: "Structure department workflows, SOPs, escalation rules, document routing, and audit trails.",
    },
    {
      title: "Operations managers",
      description: "Analyze bottlenecks, handoffs, task ownership, process gaps, and automation opportunities.",
    },
    {
      title: "Support and compliance teams",
      description: "Use AI for customer support routing, policy checks, compliance notes, and review queues.",
    },
  ],
  creatorSetup: [
    {
      title: "Business segment",
      description: "The creator chooses the businesses or teams the automation platform serves.",
      options: ["SMEs", "Enterprise teams", "Customer support", "HR", "Finance ops", "Legal ops", "Healthcare admin", "Education admin"],
    },
    {
      title: "Automation workflow",
      description: "The creator chooses the core automation use case.",
      options: ["SOP generation", "Workflow automation", "Document routing", "Customer support", "Approval flows", "Compliance review", "Reporting"],
    },
    {
      title: "Operational depth",
      description: "The creator chooses how deep automation should go.",
      options: ["Process map", "Task routing", "Approval chain", "Policy check", "Audit log", "Dashboard", "AI assistant"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides how businesses access the system.",
      options: ["Free trial", "Subscription", "Usage credits", "Team seats", "Enterprise contract", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Enter business process",
      description: "User describes the business workflow, department, task, documents, approvals, and automation goal.",
    },
    {
      step: "02",
      title: "Map workflow",
      description: "The runtime identifies process steps, owners, dependencies, bottlenecks, and required decisions.",
    },
    {
      step: "03",
      title: "Design automation",
      description: "The app proposes routing logic, SOPs, AI assistant actions, approval rules, and escalation paths.",
    },
    {
      step: "04",
      title: "Review risk and compliance",
      description: "The system flags sensitive data, approval risk, policy gaps, audit needs, and human-review points.",
    },
    {
      step: "05",
      title: "Generate operating package",
      description: "The runtime produces SOPs, task map, document flow, approval checklist, and monitoring plan.",
    },
    {
      step: "06",
      title: "Track and report",
      description: "The app outputs automation readiness, process health, bottlenecks, risk notes, and next actions.",
    },
  ],
  deepModules: [
    {
      title: "Business Process Mapper",
      purpose: "Convert a business process into steps, owners, dependencies, inputs, outputs, and decision points.",
      outputs: ["process_map", "owner_matrix", "dependency_map"],
    },
    {
      title: "Workflow Automation Designer",
      purpose: "Design routing rules, triggers, task assignments, approval chains, and escalation logic.",
      outputs: ["automation_flow", "routing_rules", "approval_chain"],
    },
    {
      title: "SOP Generator",
      purpose: "Generate standard operating procedures, role instructions, checklists, and handoff rules.",
      outputs: ["sop_document", "role_instructions", "handoff_checklist"],
    },
    {
      title: "Document Intelligence Router",
      purpose: "Classify documents, extract required fields, route for approval, and flag missing information.",
      outputs: ["document_route", "field_requirements", "missing_info_flags"],
    },
    {
      title: "Customer Support Automation Planner",
      purpose: "Design AI support triage, response templates, escalation rules, and human handoff.",
      outputs: ["support_flow", "response_templates", "escalation_rules"],
    },
    {
      title: "Compliance and Risk Reviewer",
      purpose: "Flag sensitive data, policy requirements, approval gaps, audit needs, and human-review rules.",
      outputs: ["risk_flags", "compliance_notes", "human_review_points"],
    },
    {
      title: "Operational Analytics Engine",
      purpose: "Track bottlenecks, task delay, volume, SLA posture, owner load, and process health.",
      outputs: ["operations_dashboard", "bottleneck_report", "sla_summary"],
    },
    {
      title: "Enterprise Automation Report",
      purpose: "Generate automation blueprint, SOP package, risk review, deployment plan, and next actions.",
      outputs: ["automation_report", "deployment_plan", "next_actions"],
    },
  ],
  accessModels: [
    {
      title: "Public business assistant",
      description: "Anyone can generate basic SOPs, workflow maps, and automation ideas.",
    },
    {
      title: "Subscription automation workspace",
      description: "Businesses pay for saved workflows, SOPs, support automation, dashboards, and reports.",
    },
    {
      title: "Usage-credit automation engine",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced workflows and enterprise reports.",
    },
    {
      title: "Enterprise team workspace",
      description: "Teams manage roles, approvals, workflows, documents, audit logs, and AI assistants.",
    },
  ],
  rioMindNexusRole: [
    "Act as the business process and automation intelligence engine behind Enterprise AI Automation.",
    "Map workflows, departments, task ownership, dependencies, bottlenecks, and approval chains.",
    "Generate SOPs, routing logic, support automation, document flows, and operational reports.",
    "Analyze compliance risk, sensitive data, policy gaps, audit needs, and human-review points.",
    "Support future enterprise workspaces, business memory, usage-credit rails, and automation orchestration.",
    "Generate enterprise intelligence reports with assumptions, limitations, and next-action recommendations.",
  ],
  proofAndVerification: [
    "Enterprise automation outputs require human review before operational deployment.",
    "Compliance, legal, HR, finance, healthcare, and sensitive processes require qualified review.",
    "AI support automation should not replace required human approval for high-impact decisions.",
    "Audit logs, access rules, and data-handling limits must be transparent before production use.",
  ],
};
