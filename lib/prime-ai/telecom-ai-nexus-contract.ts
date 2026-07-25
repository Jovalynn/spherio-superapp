import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const TELECOM_AI_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "telecom_ai",
  nicheTitle: "Telecom AI Intelligence Platform",
  rioMindNexusRole: "RioMind Nexus will act as the telecom intelligence layer. It will plan network workflows, analyze coverage, support subscribers, route field operations, plan IoT/eSIM provisioning, review billing, assess service assurance, and generate telecom operations reports.",
  nexusHooks: ["network_planning_assistant","coverage_signal_analyst","subscriber_support_engine","field_operations_planner","iot_esim_provisioning_planner","billing_plan_analyst","service_assurance_reviewer","telecom_operations_reporter"],
  inputSchema: [
    { key: "telecom_goal", label: "Telecom goal", type: "textarea", required: true, helper: "Describe network, subscriber, coverage, billing, provisioning, or field problem.", examples: ["Plan coverage", "Triage eSIM issue", "Prepare field visit"] },
    { key: "service_model", label: "Service model", type: "text", required: true, helper: "Network or service model.", examples: ["Mobile", "Fiber", "ISP", "IoT", "eSIM"] },
    { key: "location_or_scope", label: "Location or scope", type: "text", required: false, helper: "Area, site, subscriber group, device group, or service scope.", examples: ["Lagos", "Enterprise branch", "IoT fleet"] },
    { key: "current_issue", label: "Current issue", type: "textarea", required: false, helper: "Fault, outage, billing issue, coverage issue, or provisioning blocker.", examples: ["Weak signal", "SIM not active", "Billing dispute"] },
    { key: "target_output", label: "Target output", type: "textarea", required: true, helper: "What should be generated.", examples: ["Coverage plan", "Field checklist", "Subscriber response", "Operations report"] }
  ],
  workflowActions: [
    { id: "map_service_context", label: "Map Service Context", purpose: "Structure network, subscriber, device, service, location, and constraints." },
    { id: "analyze_network_coverage", label: "Analyze Network/Coverage", purpose: "Review coverage, signal, capacity, service quality, and assumptions.", requiresDiagnosis: true },
    { id: "support_subscriber", label: "Support Subscriber", purpose: "Triage SIM/eSIM, device, billing, service, and escalation path.", requiresDiagnosis: true },
    { id: "plan_field_provisioning", label: "Plan Field/Provisioning", purpose: "Prepare field task, installation, repair, activation, and provisioning checklist.", requiresDiagnosis: true },
    { id: "review_assurance_billing", label: "Review Assurance/Billing", purpose: "Check SLA, incidents, plans, usage, billing, and customer impact.", requiresDiagnosis: true },
    { id: "generate_telecom_report", label: "Generate Telecom Report", purpose: "Produce telecom workflow, risk notes, assumptions, and next actions.", requiresDiagnosis: true }
  ],
  expectedOutputs: [
    { key: "service_context", label: "Service Context", description: "Network, subscriber, device, location, service model, and constraints." },
    { key: "coverage_review", label: "Coverage Review", description: "Signal, capacity, dead zone, service quality, and assumption notes." },
    { key: "subscriber_support_summary", label: "Subscriber Support Summary", description: "Issue triage, response, escalation path, and support notes." },
    { key: "field_provisioning_plan", label: "Field/Provisioning Plan", description: "Technician workflow, site checklist, activation notes, and repair steps." },
    { key: "assurance_billing_review", label: "Assurance/Billing Review", description: "SLA, incident, usage, billing, plan-fit, and dispute notes." },
    { key: "privacy_access_notes", label: "Privacy/Access Notes", description: "Subscriber data, device data, billing data, and access-control requirements." },
    { key: "telecom_operations_report", label: "Telecom Operations Report", description: "Final telecom report with assumptions, risks, review points, and next actions." }
  ],
  verificationLayer: [
    { title: "Operator review", rule: "Telecom outputs require operator or qualified engineering review before deployment." },
    { title: "Measured vs assumed data", rule: "Coverage and signal analysis must separate measured data from assumptions." },
    { title: "No guarantee", rule: "The system must not guarantee coverage, uptime, compliance, or service restoration." },
    { title: "Subscriber privacy", rule: "Subscriber, billing, SIM/eSIM, and device data require privacy and access controls." }
  ],
  accessModel: [
    { id: "public_telecom_assistant", label: "Public telecom assistant", description: "Basic support, planning, and service workflow notes." },
    { id: "subscription_telecom_workspace", label: "Subscription telecom workspace", description: "Saved operations, support workflows, field plans, and reports." },
    { id: "usage_credit_telecom_engine", label: "Usage-credit telecom engine", description: "Advanced reviews using credits, RIO, RUSD, USDT, or USDC." },
    { id: "operator_team_workspace", label: "Operator/team workspace", description: "Subscribers, field operations, provisioning, incidents, and telecom reports." }
  ]
});
