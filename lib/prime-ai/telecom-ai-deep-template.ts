import type { DeepNicheTemplate } from "./deep-niche-template";

export const TELECOM_AI_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "telecom_ai",
  title: "Telecom AI Intelligence Platform",
  publicPositioning: "A creator-owned telecom intelligence platform for network planning, signal analysis, subscriber operations, coverage mapping, IoT/eSIM support, billing workflows, field operations, and telecom service automation.",
  creatorPromise: "Prime lets a creator launch a telecom AI assistant, network planning workspace, subscriber-support system, field-ops tool, IoT/eSIM service desk, or telecom analytics platform.",
  userPromise: "Telecom teams can plan networks, document coverage, analyze service issues, support subscribers, manage field tasks, prepare rollout plans, and generate telecom operations reports.",
  audiences: [
    { title: "Telecom operators", description: "Plan coverage, service rollout, subscriber workflows, field operations, and network support." },
    { title: "Field engineers", description: "Document site checks, faults, signal issues, installations, and maintenance tasks." },
    { title: "IoT/eSIM providers", description: "Support provisioning workflows, device lifecycle, connectivity plans, and customer operations." },
    { title: "Customer support teams", description: "Triage service issues, billing questions, SIM/eSIM requests, and escalation paths." }
  ],
  creatorSetup: [
    { title: "Telecom focus", description: "Choose the telecom category.", options: ["Network planning", "Coverage", "Subscriber support", "Field ops", "IoT/eSIM", "Billing", "Service assurance"] },
    { title: "Workflow type", description: "Choose the main workflow.", options: ["Coverage plan", "Fault triage", "Field task", "Provisioning", "Billing support", "Rollout plan"] },
    { title: "Service model", description: "Choose network/service model.", options: ["Mobile", "Fiber", "ISP", "IoT", "eSIM", "Enterprise telecom", "Hybrid"] },
    { title: "Access", description: "Choose monetization.", options: ["Free", "Subscription", "Usage credits", "RIO/RUSD", "USDT/USDC"] }
  ],
  userWorkflow: [
    { step: "01", title: "Enter telecom goal", description: "User describes network, subscriber, coverage, provisioning, billing, field, or service problem." },
    { step: "02", title: "Map service context", description: "Runtime structures location, subscriber, device, network type, service plan, issue type, and constraints." },
    { step: "03", title: "Analyze operation", description: "App reviews coverage, fault, capacity, provisioning, customer support, billing, and escalation posture." },
    { step: "04", title: "Generate workflow plan", description: "System creates field plan, subscriber response, provisioning checklist, or rollout workflow." },
    { step: "05", title: "Review assurance", description: "Runtime checks SLA, risk, compliance, service impact, data quality, and escalation needs." },
    { step: "06", title: "Generate telecom report", description: "App outputs operations report, risk flags, assumptions, and next actions." }
  ],
  deepModules: [
    { title: "Network Planning Assistant", purpose: "Plan coverage, sites, capacity, routing, backhaul, rollout zones, and service readiness.", outputs: ["network_plan", "coverage_notes", "rollout_steps"] },
    { title: "Coverage and Signal Analyst", purpose: "Review signal issues, dead zones, terrain assumptions, capacity pressure, and service quality.", outputs: ["coverage_review", "signal_flags", "service_quality_notes"] },
    { title: "Subscriber Support Engine", purpose: "Triage SIM/eSIM, account, billing, service, device, and connectivity issues.", outputs: ["support_summary", "triage_path", "escalation_notes"] },
    { title: "Field Operations Planner", purpose: "Prepare site visit, installation, repair, maintenance, and technician task workflows.", outputs: ["field_task_plan", "site_checklist", "technician_notes"] },
    { title: "IoT/eSIM Provisioning Planner", purpose: "Plan device activation, profile provisioning, lifecycle, connectivity, and support workflow.", outputs: ["provisioning_plan", "device_lifecycle", "activation_notes"] },
    { title: "Billing and Plan Analyst", purpose: "Review pricing plans, usage, billing disputes, subscription state, and customer plan fit.", outputs: ["billing_review", "plan_fit", "dispute_notes"] },
    { title: "Service Assurance Reviewer", purpose: "Check SLA, incidents, fault patterns, customer impact, outage notes, and escalation paths.", outputs: ["assurance_report", "sla_flags", "incident_notes"] },
    { title: "Telecom Operations Report", purpose: "Generate telecom report with workflow, risks, assumptions, review points, and next actions.", outputs: ["telecom_report", "risk_flags", "next_actions"] }
  ],
  accessModels: [
    { title: "Public telecom assistant", description: "Anyone can generate basic support, planning, and service workflow notes." },
    { title: "Subscription telecom workspace", description: "Users pay for saved operations, support workflows, field plans, and reports." },
    { title: "Usage-credit telecom engine", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced telecom reviews." },
    { title: "Operator/team workspace", description: "Teams manage subscribers, field operations, provisioning, incidents, and telecom reports." }
  ],
  rioMindNexusRole: [
    "Act as the telecom intelligence layer behind Telecom AI.",
    "Analyze network planning, coverage, subscriber support, field operations, IoT/eSIM provisioning, billing, and service assurance.",
    "Generate telecom operations reports with assumptions, limitations, risk flags, and next actions."
  ],
  proofAndVerification: [
    "Telecom outputs require operator or qualified engineering review before deployment.",
    "Network coverage and signal analysis must separate measured data from assumptions.",
    "The system must not guarantee coverage, uptime, compliance, or service restoration.",
    "Subscriber, billing, SIM/eSIM, and device data require privacy and access controls."
  ]
};
