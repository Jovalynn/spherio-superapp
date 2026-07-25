import type { DeepNicheTemplate } from "./deep-niche-template";

export const AI_AGENT_MARKETPLACE_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "ai_agent_marketplace",
  title: "AI Agent Marketplace Intelligence Platform",
  publicPositioning:
    "A creator-owned AI agent marketplace for browsing, publishing, renting, installing, running, rating, and monetizing specialized AI agents and automated workflows.",
  creatorPromise:
    "Prime lets a creator launch their own AI agent marketplace, automation store, workflow marketplace, or specialist agent platform without building the full marketplace stack from scratch.",
  userPromise:
    "Users can discover agents, inspect capabilities, install or rent agents, run workflows, review outputs, and track usage while publishers monetize agent utilities.",
  audiences: [
    {
      title: "Agent users",
      description: "Browse and install agents for education, trading, research, marketing, coding, business, and automation.",
    },
    {
      title: "Agent publishers",
      description: "Publish specialized agents, define capabilities, price usage, and earn from installs or runs.",
    },
    {
      title: "Businesses and teams",
      description: "Use vetted agents for customer support, sales, research, document workflows, and operations.",
    },
    {
      title: "Developers and AI builders",
      description: "Create agent workflows, execution tools, API integrations, and monetized automation packages.",
    },
  ],
  creatorSetup: [
    {
      title: "Marketplace category",
      description: "The creator chooses the agent economy they want to launch.",
      options: ["Education agents", "Trading agents", "Research agents", "Marketing agents", "Coding agents", "Healthcare agents", "Business automation"],
    },
    {
      title: "Agent publishing model",
      description: "The creator decides who can publish agents.",
      options: ["Open publishing", "Verified publishers", "Curated marketplace", "Institution-only", "Developer-only"],
    },
    {
      title: "Execution model",
      description: "The creator chooses how agents are used.",
      options: ["Install agent", "Rent agent", "Run once", "Subscribe", "Workflow bundle", "Team access"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides how users pay and how publishers earn.",
      options: ["Free agents", "Usage credits", "Subscription", "Revenue share", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Describe agent need",
      description: "User explains the task, problem, or workflow they want an agent to solve.",
    },
    {
      step: "02",
      title: "Discover matching agents",
      description: "The marketplace recommends agents based on capability, category, risk, rating, and usage model.",
    },
    {
      step: "03",
      title: "Inspect capability and safety",
      description: "User reviews agent purpose, tools, limitations, permissions, pricing, and publisher status.",
    },
    {
      step: "04",
      title: "Install or run agent",
      description: "User installs, rents, subscribes, or runs the agent for a specific workflow.",
    },
    {
      step: "05",
      title: "Review execution output",
      description: "The app shows result, execution trace, confidence, limitations, and next actions.",
    },
    {
      step: "06",
      title: "Rate, reuse, or monetize",
      description: "Users rate agents while publishers track revenue, runs, feedback, and marketplace performance.",
    },
  ],
  deepModules: [
    {
      title: "Agent Discovery Engine",
      purpose: "Match user tasks to suitable agents using category, capability, risk, price, and publisher profile.",
      outputs: ["agent_matches", "ranking_reason", "recommended_agent"],
    },
    {
      title: "Agent Capability Analyzer",
      purpose: "Explain what an agent can do, what tools it uses, and what limitations apply.",
      outputs: ["capability_profile", "tool_map", "limitation_notes"],
    },
    {
      title: "Agent Safety Evaluator",
      purpose: "Check permissions, sensitive actions, regulated use cases, and human-review needs.",
      outputs: ["safety_score", "risk_flags", "human_review_rules"],
    },
    {
      title: "Install and Runtime Manager",
      purpose: "Manage install, rent, subscription, workspace activation, and run sessions.",
      outputs: ["install_record", "runtime_session", "usage_state"],
    },
    {
      title: "Workflow Execution Router",
      purpose: "Route agent tasks through future RioMind Nexus agents, tools, prompts, and model routers.",
      outputs: ["execution_plan", "agent_trace", "tool_sequence"],
    },
    {
      title: "Publisher Revenue Engine",
      purpose: "Track pricing, usage credits, revenue share, publisher payouts, and agent performance.",
      outputs: ["revenue_summary", "usage_meter", "publisher_dashboard"],
    },
    {
      title: "Marketplace Trust Layer",
      purpose: "Show ratings, verification, abuse flags, publisher reputation, and proof of safe use.",
      outputs: ["trust_profile", "rating_summary", "abuse_flags"],
    },
    {
      title: "Agent Output Report",
      purpose: "Produce structured result, assumptions, limitation notes, confidence, and next actions.",
      outputs: ["agent_result", "confidence_profile", "next_actions"],
    },
  ],
  accessModels: [
    {
      title: "Public agent marketplace",
      description: "Anyone can browse and use free or limited agents.",
    },
    {
      title: "Subscription agent marketplace",
      description: "Users subscribe for premium agents, saved runs, team workflows, and higher usage.",
    },
    {
      title: "Usage-credit agent economy",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC per agent run or workflow.",
    },
    {
      title: "Verified publisher marketplace",
      description: "Approved publishers monetize agent listings, installs, subscriptions, and runs.",
    },
  ],
  rioMindNexusRole: [
    "Act as the agent orchestration brain behind the marketplace.",
    "Match user problems to suitable agents.",
    "Evaluate agent capability, risk, permissions, and limitations.",
    "Route agent runs through future Nexus specialist agents, tools, model routers, and workflow memory.",
    "Generate execution traces, output reports, and next-action recommendations.",
    "Support publisher revenue, marketplace trust, and usage metering.",
  ],
  proofAndVerification: [
    "Agent outputs should show assumptions, limitations, and confidence level.",
    "Sensitive or regulated tasks require human review and safety constraints.",
    "Agent publishers should have verification and abuse-monitoring rules.",
    "Autonomous execution must not be represented as guaranteed outcome or professional advice.",
  ],
};
