import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const AI_SOCIAL_PLATFORM_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "ai_social_platform",
  nicheTitle: "AI Social Platform Intelligence System",
  rioMindNexusRole:
    "RioMind Nexus will act as the community intelligence and moderation engine behind the AI Social Platform. It will structure community goals, plan social workflows, generate engagement content, evaluate moderation risk, analyze community health, and support subscriptions, rewards, and monetization.",
  nexusHooks: [
    "community_blueprint_builder",
    "social_feed_group_planner",
    "content_engagement_engine",
    "ai_moderation_planner",
    "community_health_analyst",
    "reputation_reward_planner",
    "subscription_access_engine",
    "social_intelligence_reporter",
  ],
  inputSchema: [
    {
      key: "community_goal",
      label: "Community goal",
      type: "textarea",
      required: true,
      helper: "Describe the social platform, community, or group to create.",
      examples: ["Create a paid community for AI founders", "Launch a student learning network", "Build a creator fan community"],
    },
    {
      key: "target_members",
      label: "Target members",
      type: "text",
      required: true,
      helper: "Who the community is for.",
      examples: ["Creators", "Students", "Crypto builders", "Small business owners", "DAO members"],
    },
    {
      key: "community_features",
      label: "Community features",
      type: "textarea",
      required: true,
      helper: "Main social features needed.",
      examples: ["Feed, groups, comments, creator posts, moderation, subscriptions, rewards"],
    },
    {
      key: "moderation_rules",
      label: "Moderation rules",
      type: "textarea",
      required: false,
      helper: "Rules, safety expectations, prohibited behavior, and escalation needs.",
      examples: ["No spam, no harassment, no scams, human review for reported posts"],
    },
    {
      key: "access_model",
      label: "Access model",
      type: "text",
      required: false,
      helper: "How members join or pay.",
      examples: ["Free", "Subscription", "Token-gated", "Verified members", "Paid creator channel"],
    },
  ],
  workflowActions: [
    {
      id: "build_community_blueprint",
      label: "Build Community Blueprint",
      purpose: "Define purpose, audience, channels, roles, rules, onboarding, and member journey.",
    },
    {
      id: "plan_social_structure",
      label: "Plan Social Structure",
      purpose: "Design feed, groups, profiles, content categories, and interaction flows.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_engagement_plan",
      label: "Generate Engagement Plan",
      purpose: "Create content prompts, campaigns, events, challenges, and posting rhythm.",
      requiresDiagnosis: true,
    },
    {
      id: "configure_moderation",
      label: "Configure Moderation",
      purpose: "Define safety categories, abuse signals, rule enforcement, and escalation path.",
      requiresDiagnosis: true,
    },
    {
      id: "analyze_community_health",
      label: "Analyze Community Health",
      purpose: "Assess engagement, sentiment, retention, toxicity, spam, churn, and growth quality.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_social_report",
      label: "Generate Social Report",
      purpose: "Produce blueprint, moderation policy, health report, monetization plan, and next actions.",
      requiresDiagnosis: true,
    },
  ],
  expectedOutputs: [
    {
      key: "community_blueprint",
      label: "Community Blueprint",
      description: "Purpose, audience, channels, roles, rules, onboarding, and member journey.",
    },
    {
      key: "social_structure",
      label: "Social Structure",
      description: "Feed logic, groups, profiles, content categories, and interaction surfaces.",
    },
    {
      key: "engagement_plan",
      label: "Engagement Plan",
      description: "Post prompts, campaigns, events, challenges, and publishing rhythm.",
    },
    {
      key: "moderation_policy",
      label: "Moderation Policy",
      description: "Rules, abuse flags, safety thresholds, review queue, and escalation workflow.",
    },
    {
      key: "community_health_report",
      label: "Community Health Report",
      description: "Engagement quality, retention, sentiment, toxicity, spam, churn, and growth signals.",
    },
    {
      key: "monetization_plan",
      label: "Monetization Plan",
      description: "Subscriptions, token-gating, creator tips, community rewards, and access tiers.",
    },
    {
      key: "social_intelligence_report",
      label: "Social Intelligence Report",
      description: "Full community package with safety posture, growth actions, assumptions, and next steps.",
    },
  ],
  verificationLayer: [
    {
      title: "Moderation transparency",
      rule: "AI moderation decisions should be explainable and allow human review where appropriate.",
    },
    {
      title: "Safety handling",
      rule: "Harassment, abuse, scams, hate, sensitive claims, and regulated content require safety workflows.",
    },
    {
      title: "No growth guarantees",
      rule: "The system must not guarantee virality, community growth, revenue, or engagement outcomes.",
    },
    {
      title: "Reward and subscription integrity",
      rule: "Subscriptions, rewards, and creator payouts require transparent terms and anti-abuse rules.",
    },
  ],
  accessModel: [
    {
      id: "public_access",
      label: "Public community",
      description: "Anyone can join and engage under moderation rules.",
    },
    {
      id: "subscription_access",
      label: "Subscription community",
      description: "Members pay for premium groups, creator channels, events, and content.",
    },
    {
      id: "token_gated_access",
      label: "Token-gated community",
      description: "Access is based on creator token, RIO, RUSD, USDT, USDC, or verified wallet status.",
    },
    {
      id: "creator_brand_workspace",
      label: "Creator / brand workspace",
      description: "Creators and brands manage audiences, content, moderation, rewards, and analytics.",
    },
  ],
});
