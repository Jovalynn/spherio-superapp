import type { DeepNicheTemplate } from "./deep-niche-template";

export const CLOUD_AI_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "cloud_ai",
  title: "Cloud AI Intelligence Platform",
  publicPositioning: "A creator-owned cloud intelligence platform for infrastructure design, DevOps, Kubernetes, observability, security, cost optimization, scaling, disaster recovery, and deployment readiness.",
  creatorPromise: "Prime lets a creator launch a cloud AI terminal, DevOps assistant, infrastructure planner, cost analyst, Kubernetes advisor, or cloud security workspace.",
  userPromise: "Teams can plan cloud architecture, review infrastructure, optimize costs, detect risks, prepare deployments, monitor services, and generate cloud operations reports.",
  audiences: [
    { title: "Cloud engineers", description: "Plan infrastructure, networking, compute, storage, databases, observability, and deployment flows." },
    { title: "DevOps teams", description: "Review CI/CD, Docker, Kubernetes, secrets, logs, monitoring, and rollback posture." },
    { title: "SaaS teams", description: "Design production architecture, reduce cost, and prepare scalable launch systems." },
    { title: "Security teams", description: "Assess access, policy, incident response, backup, compliance, and cloud risks." }
  ],
  creatorSetup: [
    { title: "Cloud focus", description: "Choose the infrastructure category.", options: ["Architecture", "DevOps", "Kubernetes", "Security", "Cost", "Monitoring", "Disaster recovery"] },
    { title: "Workflow type", description: "Choose the main workflow.", options: ["Infra design", "Cost review", "Security review", "Deployment plan", "Incident plan", "Scaling review"] },
    { title: "Cloud model", description: "Choose deployment model.", options: ["AWS", "GCP", "Azure", "Cloudflare", "Docker", "Kubernetes", "Hybrid"] },
    { title: "Access", description: "Choose monetization.", options: ["Free", "Subscription", "Usage credits", "RIO/RUSD", "USDT/USDC"] }
  ],
  userWorkflow: [
    { step: "01", title: "Enter cloud goal", description: "User describes application, workload, deployment, cost, scaling, security, or reliability problem." },
    { step: "02", title: "Map architecture", description: "Runtime structures services, regions, network, compute, storage, database, cache, queues, and domains." },
    { step: "03", title: "Analyze risk", description: "App reviews security, cost, scaling, failure points, secrets, access, monitoring, and backup posture." },
    { step: "04", title: "Generate deployment plan", description: "System creates infra plan, CI/CD steps, environment checklist, monitoring plan, and rollback path." },
    { step: "05", title: "Review operations readiness", description: "Runtime checks logs, metrics, alerts, incident response, disaster recovery, and runbooks." },
    { step: "06", title: "Generate cloud report", description: "App outputs architecture, risks, costs, deployment checklist, and next actions." }
  ],
  deepModules: [
    { title: "Cloud Architecture Planner", purpose: "Plan services, network, compute, database, storage, cache, queues, domains, and regions.", outputs: ["architecture_plan", "service_map", "network_notes"] },
    { title: "DevOps Deployment Reviewer", purpose: "Review Docker, CI/CD, environments, secrets, build flow, rollback, and release safety.", outputs: ["deployment_review", "rollback_plan", "env_flags"] },
    { title: "Kubernetes Advisor", purpose: "Review clusters, pods, services, ingress, scaling, resources, and operational posture.", outputs: ["k8s_review", "scaling_notes", "resource_flags"] },
    { title: "Cloud Security Analyzer", purpose: "Check IAM, secrets, network exposure, access policies, encryption, and attack surface.", outputs: ["security_review", "iam_flags", "hardening_steps"] },
    { title: "Cost Optimization Engine", purpose: "Analyze spend drivers, idle resources, scaling policy, storage, traffic, and reserved capacity.", outputs: ["cost_report", "waste_flags", "optimization_plan"] },
    { title: "Observability Planner", purpose: "Design metrics, logs, traces, alerts, dashboards, SLOs, and incident visibility.", outputs: ["observability_plan", "alert_rules", "dashboard_notes"] },
    { title: "Disaster Recovery Planner", purpose: "Plan backup, restore, failover, RPO/RTO, incident response, and runbooks.", outputs: ["dr_plan", "backup_policy", "incident_runbook"] },
    { title: "Cloud Operations Report", purpose: "Generate cloud report with architecture, risks, costs, readiness, and next actions.", outputs: ["cloud_report", "risk_flags", "next_actions"] }
  ],
  accessModels: [
    { title: "Public cloud assistant", description: "Anyone can generate basic architecture and deployment guidance." },
    { title: "Subscription cloud workspace", description: "Users pay for saved infrastructure, monitoring plans, cost reports, and reviews." },
    { title: "Usage-credit cloud engine", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced reviews." },
    { title: "Team operations workspace", description: "Teams manage deployments, incidents, costs, security, and cloud reports." }
  ],
  rioMindNexusRole: [
    "Act as the cloud intelligence layer behind Cloud AI.",
    "Analyze infrastructure, DevOps, Kubernetes, security, observability, cost, scaling, and disaster recovery.",
    "Generate cloud operations reports with assumptions, limitations, risk flags, and next actions."
  ],
  proofAndVerification: [
    "Cloud outputs require human engineering review before production deployment.",
    "Security and compliance-sensitive changes require qualified review.",
    "The system must not guarantee zero downtime, zero cost waste, or complete security.",
    "Secrets, credentials, keys, and private infrastructure data must not be exposed."
  ]
};
