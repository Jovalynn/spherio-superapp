import type { DeepNicheTemplate } from "./deep-niche-template";

export const AI_SOCIAL_PLATFORM_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "ai_social_platform",
  title: "AI Social Platform Intelligence System",
  publicPositioning:
    "A creator-owned AI social and community platform for creator communities, niche networks, moderated groups, social content, subscriptions, engagement rewards, and community intelligence.",
  creatorPromise:
    "Prime lets a creator launch their own AI-powered social platform, niche community, creator network, member forum, subscription group, or social engagement system without building the full stack from scratch.",
  userPromise:
    "Users can create communities, define rules, generate posts, moderate discussions, plan engagement, analyze community health, manage subscriptions, and build safe social experiences.",
  audiences: [
    {
      title: "Community creators",
      description: "Launch niche communities, member spaces, creator channels, and engagement systems.",
    },
    {
      title: "Social platform builders",
      description: "Build feeds, groups, profiles, moderation workflows, reputation systems, and subscriptions.",
    },
    {
      title: "Brands and organizations",
      description: "Run customer communities, product communities, ambassador groups, and announcement hubs.",
    },
    {
      title: "Moderators and community managers",
      description: "Use moderation queues, abuse detection, community health signals, and engagement reports.",
    },
  ],
  creatorSetup: [
    {
      title: "Community type",
      description: "The creator chooses the social experience they want to launch.",
      options: ["Creator community", "Niche social network", "Paid group", "Forum", "Brand community", "Learning community", "DAO/community hub"],
    },
    {
      title: "Social workflow",
      description: "The creator chooses the primary social workflow.",
      options: ["Feed", "Groups", "Posts", "Comments", "Moderation", "Subscriptions", "Rewards", "Creator channels"],
    },
    {
      title: "Trust and safety model",
      description: "The creator chooses how the community is protected.",
      options: ["Manual moderation", "AI moderation", "Verified members", "Reputation scoring", "Abuse flags", "Token-gated access"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides how users access and monetize the platform.",
      options: ["Free", "Subscription", "Token-gated", "Creator tips", "Community rewards", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Define community goal",
      description: "User describes the community, audience, rules, access model, and engagement objective.",
    },
    {
      step: "02",
      title: "Build community structure",
      description: "The runtime creates channels, groups, roles, rules, onboarding flow, and member journey.",
    },
    {
      step: "03",
      title: "Plan content and engagement",
      description: "The app proposes post formats, prompts, campaigns, events, challenges, and content rhythm.",
    },
    {
      step: "04",
      title: "Configure moderation",
      description: "The system defines moderation rules, abuse signals, safety thresholds, and escalation workflows.",
    },
    {
      step: "05",
      title: "Analyze community health",
      description: "The runtime reviews engagement, toxicity risk, churn signals, member sentiment, and growth quality.",
    },
    {
      step: "06",
      title: "Generate social platform package",
      description: "The app outputs community blueprint, engagement plan, moderation policy, access model, and next actions.",
    },
  ],
  deepModules: [
    {
      title: "Community Blueprint Builder",
      purpose: "Define community purpose, audience, channels, roles, rules, and member journey.",
      outputs: ["community_blueprint", "role_map", "member_journey"],
    },
    {
      title: "Social Feed and Group Planner",
      purpose: "Design feed logic, group structure, content categories, profiles, and interaction surfaces.",
      outputs: ["feed_plan", "group_structure", "interaction_map"],
    },
    {
      title: "Content and Engagement Engine",
      purpose: "Generate posts, prompts, campaigns, events, challenges, and engagement rhythm.",
      outputs: ["content_plan", "engagement_campaigns", "posting_prompts"],
    },
    {
      title: "AI Moderation Planner",
      purpose: "Define safety categories, abuse signals, rule enforcement, review queue, and escalation path.",
      outputs: ["moderation_policy", "abuse_flags", "escalation_rules"],
    },
    {
      title: "Community Health Analyst",
      purpose: "Assess engagement quality, retention, sentiment, toxicity, spam, churn, and growth signals.",
      outputs: ["health_score", "sentiment_notes", "retention_flags"],
    },
    {
      title: "Reputation and Reward Planner",
      purpose: "Design reputation levels, creator rewards, member badges, contribution scores, and incentives.",
      outputs: ["reputation_model", "reward_rules", "badge_system"],
    },
    {
      title: "Subscription and Access Engine",
      purpose: "Plan free/paid tiers, token-gated groups, subscriptions, tips, and creator monetization.",
      outputs: ["access_tiers", "subscription_plan", "monetization_rules"],
    },
    {
      title: "Social Intelligence Report",
      purpose: "Generate community status, safety posture, growth plan, engagement actions, and next steps.",
      outputs: ["community_report", "safety_summary", "growth_actions"],
    },
  ],
  accessModels: [
    {
      title: "Public social community",
      description: "Anyone can join, post, and engage under moderation rules.",
    },
    {
      title: "Subscription community",
      description: "Members pay monthly or yearly for premium groups, creator channels, events, and content.",
    },
    {
      title: "Token-gated community",
      description: "Access is based on creator token, RIO, RUSD, USDT, USDC, or verified wallet status.",
    },
    {
      title: "Creator / brand workspace",
      description: "Creators and brands manage audiences, content, moderation, rewards, and social analytics.",
    },
  ],
  rioMindNexusRole: [
    "Act as the community intelligence and moderation engine behind the AI Social Platform.",
    "Structure community goals, roles, channels, rules, and engagement flows.",
    "Generate social content prompts, campaigns, events, and onboarding journeys.",
    "Analyze moderation risk, abuse signals, toxicity, spam, member sentiment, and community health.",
    "Support subscriptions, token-gated access, reputation, rewards, and creator monetization.",
    "Generate social intelligence reports with assumptions, safety notes, and next-action recommendations.",
  ],
  proofAndVerification: [
    "Moderation decisions should be explainable and allow human review where appropriate.",
    "Community health metrics should not overclaim sentiment, safety, or growth certainty.",
    "Sensitive content, harassment, abuse, scams, and regulated claims require safety handling.",
    "Subscriptions, rewards, and creator payouts require transparent terms and anti-abuse rules.",
  ],
};
