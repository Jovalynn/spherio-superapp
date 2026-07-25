import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const CLOUD_AI_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "cloud_ai",
  nicheTitle: "Cloud AI Intelligence Platform",
  rioMindNexusRole: "RioMind Nexus will act as the cloud intelligence layer. It will plan architecture, review DevOps, assess Kubernetes, analyze security, optimize cost, design observability, plan disaster recovery, and generate cloud operations reports.",
  nexusHooks: ["cloud_architecture_planner","devops_deployment_reviewer","kubernetes_advisor","cloud_security_analyzer","cost_optimization_engine","observability_planner","disaster_recovery_planner","cloud_operations_reporter"],
  inputSchema: [
    { key: "cloud_goal", label: "Cloud goal", type: "textarea", required: true, helper: "Describe app, workload, deployment, security, cost, or reliability goal.", examples: ["Deploy Next.js app", "Reduce AWS cost", "Design Kubernetes cluster"] },
    { key: "cloud_stack", label: "Cloud stack", type: "text", required: true, helper: "Cloud/provider stack.", examples: ["AWS", "Cloudflare + Docker", "Kubernetes", "Azure"] },
    { key: "current_issue", label: "Current issue", type: "textarea", required: false, helper: "Risk, blocker, scaling, cost, or deployment issue.", examples: ["High cost", "No monitoring", "Secrets risk"] },
    { key: "target_output", label: "Target output", type: "textarea", required: true, helper: "What should be generated.", examples: ["Architecture plan", "Cost review", "Security checklist"] },
    { key: "constraints", label: "Constraints", type: "textarea", required: false, helper: "Budget, uptime, region, compliance, deadline, or tooling constraints.", examples: ["Low budget", "Docker only", "Cloudflare DNS"] }
  ],
  workflowActions: [
    { id: "map_cloud_architecture", label: "Map Cloud Architecture", purpose: "Plan services, compute, database, storage, network, domains, and regions." },
    { id: "review_devops_kubernetes", label: "Review DevOps/Kubernetes", purpose: "Review CI/CD, Docker, Kubernetes, secrets, rollback, and deployment safety.", requiresDiagnosis: true },
    { id: "analyze_security_cost", label: "Analyze Security/Cost", purpose: "Check IAM, secrets, exposure, spend, idle resources, and cost optimization.", requiresDiagnosis: true },
    { id: "plan_observability", label: "Plan Observability", purpose: "Design metrics, logs, traces, alerts, dashboards, and SLOs.", requiresDiagnosis: true },
    { id: "plan_disaster_recovery", label: "Plan Disaster Recovery", purpose: "Create backup, restore, failover, RPO/RTO, incident response, and runbook plan.", requiresDiagnosis: true },
    { id: "generate_cloud_report", label: "Generate Cloud Report", purpose: "Produce cloud architecture, risks, cost notes, readiness, and next actions.", requiresDiagnosis: true }
  ],
  expectedOutputs: [
    { key: "architecture_plan", label: "Architecture Plan", description: "Service map, compute, database, storage, network, domains, and regions." },
    { key: "devops_review", label: "DevOps Review", description: "CI/CD, Docker, environments, secrets, rollback, and release safety." },
    { key: "security_review", label: "Security Review", description: "IAM, secrets, network exposure, policies, encryption, and hardening." },
    { key: "cost_report", label: "Cost Report", description: "Spend drivers, waste flags, scaling policy, and optimization plan." },
    { key: "observability_plan", label: "Observability Plan", description: "Metrics, logs, alerts, dashboards, SLOs, and incident visibility." },
    { key: "disaster_recovery_plan", label: "Disaster Recovery Plan", description: "Backup, restore, failover, RPO/RTO, runbooks, and incident response." },
    { key: "cloud_operations_report", label: "Cloud Operations Report", description: "Final cloud report with risks, assumptions, review points, and next actions." }
  ],
  verificationLayer: [
    { title: "Human engineering review", rule: "Cloud outputs require human engineering review before production deployment." },
    { title: "Security/compliance boundary", rule: "Security and compliance-sensitive changes require qualified review." },
    { title: "No guarantee", rule: "The system must not guarantee zero downtime, zero cost waste, or complete security." },
    { title: "Secret safety", rule: "Secrets, credentials, keys, and private infrastructure data must not be exposed." }
  ],
  accessModel: [
    { id: "public_cloud_assistant", label: "Public cloud assistant", description: "Basic architecture and deployment guidance." },
    { id: "subscription_cloud_workspace", label: "Subscription cloud workspace", description: "Saved infrastructure, monitoring plans, cost reports, and reviews." },
    { id: "usage_credit_cloud_engine", label: "Usage-credit cloud engine", description: "Advanced reviews using credits, RIO, RUSD, USDT, or USDC." },
    { id: "team_operations_workspace", label: "Team operations workspace", description: "Deployments, incidents, costs, security, and cloud reports." }
  ]
});
