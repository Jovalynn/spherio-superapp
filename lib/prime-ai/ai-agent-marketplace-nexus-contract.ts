import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const AI_AGENT_MARKETPLACE_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "ai_agent_marketplace",
  nicheTitle: "AI Agent Marketplace Intelligence Platform",
  rioMindNexusRole:
    "RioMind Nexus will act as the agent orchestration brain behind the AI Agent Marketplace. It will match tasks to agents, evaluate capabilities and risks, route executions, generate traces, meter usage, and support publisher monetization.",
  nexusHooks: [
    "agent_discovery_agent",
    "capability_analyzer",
    "agent_safety_evaluator",
    "install_runtime_manager",
    "workflow_execution_router",
    "publisher_revenue_engine",
    "marketplace_trust_layer",
    "agent_output_reporter",
  ],
  inputSchema: [
    {
      key: "agent_task",
      label: "Agent task",
      type: "textarea",
      required: true,
      helper: "Describe the problem, job, or workflow the user wants an agent to solve.",
      examples: ["Summarize legal documents", "Run customer support responses", "Analyze market data"],
    },
    {
      key: "agent_category",
      label: "Agent category",
      type: "select",
      required: true,
      helper: "The type of agent needed.",
      examples: ["Education", "Trading", "Research", "Marketing", "Coding", "Business automation"],
    },
    {
      key: "execution_mode",
      label: "Execution mode",
      type: "select",
      required: true,
      helper: "How the user wants to use the agent.",
      examples: ["Run once", "Install", "Rent", "Subscribe", "Team workflow"],
    },
    {
      key: "risk_level",
      label: "Risk level",
      type: "select",
      required: false,
      helper: "Whether the task is low-risk, sensitive, regulated, or requires human review.",
      examples: ["Low risk", "Sensitive", "Regulated", "Human review required"],
    },
    {
      key: "budget_or_credits",
      label: "Budget or usage credits",
      type: "text",
      required: false,
      helper: "The user's available budget, subscription, or usage-credit limit.",
      examples: ["Free", "10 credits", "Monthly subscription", "RIO payment"],
    },
  ],
  workflowActions: [
    {
      id: "discover_agents",
      label: "Discover Agents",
      purpose: "Recommend suitable agents based on task, category, risk, and execution mode.",
    },
    {
      id: "analyze_capability",
      label: "Analyze Capability",
      purpose: "Explain what selected agents can do, what tools they need, and where they are limited.",
      requiresDiagnosis: true,
    },
    {
      id: "evaluate_safety",
      label: "Evaluate Safety",
      purpose: "Check permissions, sensitive actions, risk level, and human-review requirements.",
      requiresDiagnosis: true,
    },
    {
      id: "run_agent_workflow",
      label: "Run Agent Workflow",
      purpose: "Prepare future Nexus execution route and agent run trace.",
      requiresDiagnosis: true,
    },
    {
      id: "calculate_usage_revenue",
      label: "Calculate Usage and Revenue",
      purpose: "Estimate usage credits, publisher revenue, and marketplace fee posture.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_agent_report",
      label: "Generate Agent Report",
      purpose: "Produce structured output, confidence, limitations, and next actions.",
      requiresDiagnosis: true,
    },
  ],
  expectedOutputs: [
    {
      key: "agent_matches",
      label: "Agent Matches",
      description: "Recommended agents ranked by capability, category, risk, and fit.",
    },
    {
      key: "capability_profile",
      label: "Capability Profile",
      description: "What the agent can do, tools required, limitations, and use cases.",
    },
    {
      key: "safety_review",
      label: "Safety Review",
      description: "Risk flags, permission concerns, sensitive task warnings, and human-review needs.",
    },
    {
      key: "execution_plan",
      label: "Execution Plan",
      description: "How Nexus would route the workflow through agents, tools, prompts, and model routers.",
    },
    {
      key: "usage_metering",
      label: "Usage Metering",
      description: "Estimated credits, run cost, subscription model, and publisher revenue logic.",
    },
    {
      key: "agent_output_report",
      label: "Agent Output Report",
      description: "Result structure, assumptions, confidence, limitations, and next actions.",
    },
    {
      key: "publisher_dashboard",
      label: "Publisher Dashboard",
      description: "Agent listings, installs, runs, ratings, feedback, and revenue summary.",
    },
  ],
  verificationLayer: [
    {
      title: "Agent limitation",
      rule: "Agent outputs should show assumptions, limitations, and confidence level.",
    },
    {
      title: "Sensitive task review",
      rule: "Sensitive, regulated, or high-impact tasks require human review and safety constraints.",
    },
    {
      title: "Publisher verification",
      rule: "Agent publishers should follow verification, abuse monitoring, and reputation rules.",
    },
    {
      title: "Execution transparency",
      rule: "Agent runs should show execution plan, tools used, permissions, and output trace where possible.",
    },
  ],
  accessModel: [
    {
      id: "public_access",
      label: "Public marketplace",
      description: "Anyone can browse and use limited free agents.",
    },
    {
      id: "subscription_access",
      label: "Subscription marketplace",
      description: "Users subscribe for premium agents, saved runs, and higher usage.",
    },
    {
      id: "usage_credit_access",
      label: "Usage-credit agent runs",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC per agent run.",
    },
    {
      id: "publisher_access",
      label: "Verified publisher access",
      description: "Approved publishers list and monetize agents.",
    },
  ],
});
