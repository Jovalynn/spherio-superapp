import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const AI_CREATOR_STUDIO_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "ai_creator_studio",
  nicheTitle: "AI Creator Studio Intelligence Platform",
  rioMindNexusRole:
    "RioMind Nexus will act as the creator intelligence engine behind the AI Creator Studio. It will build brand context, plan content strategy, generate creator assets, repurpose content, analyze audience fit, and produce creator packages.",
  nexusHooks: [
    "brand_voice_builder",
    "content_strategy_planner",
    "script_story_engine",
    "campaign_builder",
    "content_repurposing_engine",
    "audience_fit_analyst",
    "creator_monetization_planner",
    "creator_package_generator",
  ],
  inputSchema: [
    {
      key: "creator_goal",
      label: "Creator goal",
      type: "textarea",
      required: true,
      helper: "Describe what the creator wants to produce or achieve.",
      examples: ["Launch a YouTube education channel", "Create a product launch campaign", "Plan podcast content"],
    },
    {
      key: "target_audience",
      label: "Target audience",
      type: "text",
      required: true,
      helper: "Who the content is for.",
      examples: ["Students", "Small business owners", "Crypto beginners", "Fitness audience"],
    },
    {
      key: "platforms",
      label: "Platforms",
      type: "text",
      required: true,
      helper: "Where the content will be published.",
      examples: ["YouTube, TikTok", "LinkedIn, Newsletter", "Podcast, Blog"],
    },
    {
      key: "brand_voice",
      label: "Brand voice",
      type: "textarea",
      required: false,
      helper: "Tone, style, personality, or messaging rules.",
      examples: ["Professional and warm", "Bold and playful", "Institutional and premium"],
    },
    {
      key: "content_assets_needed",
      label: "Content assets needed",
      type: "textarea",
      required: true,
      helper: "The assets the creator wants.",
      examples: ["Scripts, captions, thumbnails, content calendar", "Campaign copy, launch emails"],
    },
  ],
  workflowActions: [
    {
      id: "build_brand_context",
      label: "Build Brand Context",
      purpose: "Define audience, tone, value proposition, pillars, and content boundaries.",
    },
    {
      id: "plan_content_strategy",
      label: "Plan Content Strategy",
      purpose: "Create content pillars, calendar, campaign themes, formats, and platform strategy.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_creator_assets",
      label: "Generate Creator Assets",
      purpose: "Produce scripts, captions, hooks, outlines, newsletters, episode notes, and launch copy.",
      requiresDiagnosis: true,
    },
    {
      id: "repurpose_content",
      label: "Repurpose Content",
      purpose: "Turn one idea into platform-specific posts, shorts, threads, carousels, and summaries.",
      requiresDiagnosis: true,
    },
    {
      id: "analyze_audience_fit",
      label: "Analyze Audience Fit",
      purpose: "Check tone, platform alignment, audience need, CTA, and optimization opportunities.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_creator_package",
      label: "Generate Creator Package",
      purpose: "Produce full content package, schedule, monetization suggestions, and next actions.",
      requiresDiagnosis: true,
    },
  ],
  expectedOutputs: [
    {
      key: "brand_context",
      label: "Brand Context",
      description: "Brand voice, audience persona, content pillars, value proposition, and messaging rules.",
    },
    {
      key: "content_strategy",
      label: "Content Strategy",
      description: "Platform plan, calendar, content pillars, campaign themes, and formats.",
    },
    {
      key: "creator_assets",
      label: "Creator Assets",
      description: "Scripts, hooks, captions, outlines, newsletters, episode notes, and launch copy.",
    },
    {
      key: "repurposed_content",
      label: "Repurposed Content",
      description: "Platform-specific content variants from one original idea.",
    },
    {
      key: "audience_fit_report",
      label: "Audience Fit Report",
      description: "Tone match, platform fit, audience need, optimization flags, and CTA notes.",
    },
    {
      key: "monetization_plan",
      label: "Monetization Plan",
      description: "Offer ideas, subscription logic, sponsorship assets, course/product funnel notes.",
    },
    {
      key: "creator_package",
      label: "Creator Package",
      description: "Ready-to-use content package with assets, schedule, assumptions, and next actions.",
    },
  ],
  verificationLayer: [
    {
      title: "Human publishing review",
      rule: "Generated content should be reviewed before publishing.",
    },
    {
      title: "Copyright and platform policy",
      rule: "Copyright, brand, sponsorship, and platform-policy risks require review.",
    },
    {
      title: "No guaranteed growth",
      rule: "The system must not claim guaranteed virality, revenue, or audience growth.",
    },
    {
      title: "Sensitive claims",
      rule: "Sensitive claims, endorsements, regulated topics, and factual assertions require verification.",
    },
  ],
  accessModel: [
    {
      id: "public_access",
      label: "Public creator assistant",
      description: "Anyone can generate basic hooks, captions, scripts, and content ideas.",
    },
    {
      id: "subscription_access",
      label: "Subscription creator studio",
      description: "Users pay for saved brand voice, campaigns, calendars, repurposing, and packages.",
    },
    {
      id: "usage_credit_access",
      label: "Usage-credit content generation",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced creator packages.",
    },
    {
      id: "agency_workspace",
      label: "Agency / team workspace",
      description: "Teams manage multiple brands, campaigns, clients, and creator calendars.",
    },
  ],
});
