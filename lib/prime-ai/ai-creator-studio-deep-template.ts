import type { DeepNicheTemplate } from "./deep-niche-template";

export const AI_CREATOR_STUDIO_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "ai_creator_studio",
  title: "AI Creator Studio Intelligence Platform",
  publicPositioning:
    "A creator-owned AI content and brand studio for creators, influencers, educators, marketers, podcasters, writers, course builders, social media teams, and businesses.",
  creatorPromise:
    "Prime lets a creator launch their own AI creator studio, content engine, brand assistant, campaign workspace, script generator, or creator monetization platform without building the full stack from scratch.",
  userPromise:
    "Users can define brand voice, plan content, generate scripts, build campaigns, repurpose content, prepare launch assets, analyze audience fit, and produce creator-ready content packages.",
  audiences: [
    {
      title: "Content creators",
      description: "Plan videos, posts, scripts, newsletters, captions, thumbnails, hooks, and content calendars.",
    },
    {
      title: "Educators and course creators",
      description: "Turn expertise into lessons, course outlines, teaching scripts, learning assets, and community content.",
    },
    {
      title: "Brands and marketers",
      description: "Create campaigns, launch plans, social media strategies, ad copy, and brand messaging.",
    },
    {
      title: "Podcasters and media teams",
      description: "Generate episode outlines, show notes, clips, titles, descriptions, and repurposed content.",
    },
  ],
  creatorSetup: [
    {
      title: "Creator market",
      description: "The creator chooses the audience the studio serves.",
      options: ["YouTubers", "TikTok creators", "Educators", "Podcasters", "Writers", "Brands", "Agencies", "Coaches"],
    },
    {
      title: "Content workflow",
      description: "The creator chooses the main production workflow.",
      options: ["Script writing", "Content calendar", "Campaign builder", "Brand voice", "Course content", "Podcast production", "Repurposing"],
    },
    {
      title: "Output channels",
      description: "The creator chooses where content is prepared for.",
      options: ["YouTube", "TikTok", "Instagram", "X/Twitter", "LinkedIn", "Newsletter", "Podcast", "Blog", "Course"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides how users access the creator tools.",
      options: ["Free", "Subscription", "Usage credits", "Token-gated", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Enter creator goal",
      description: "User describes the brand, content goal, audience, platform, tone, and campaign objective.",
    },
    {
      step: "02",
      title: "Build brand context",
      description: "The runtime structures brand voice, audience persona, value proposition, content pillars, and positioning.",
    },
    {
      step: "03",
      title: "Plan content strategy",
      description: "The app creates content pillars, calendar, campaign themes, hooks, formats, and platform strategy.",
    },
    {
      step: "04",
      title: "Generate creator assets",
      description: "The system produces scripts, captions, outlines, newsletters, hooks, episode notes, and launch copy.",
    },
    {
      step: "05",
      title: "Repurpose and optimize",
      description: "The runtime turns one content idea into multiple formats and optimizes for channel, audience, and tone.",
    },
    {
      step: "06",
      title: "Generate creator package",
      description: "The app outputs a full content package with assets, schedule, audience notes, and monetization suggestions.",
    },
  ],
  deepModules: [
    {
      title: "Brand Voice Builder",
      purpose: "Define tone, audience, promise, personality, language style, and content boundaries.",
      outputs: ["brand_voice", "audience_persona", "messaging_rules"],
    },
    {
      title: "Content Strategy Planner",
      purpose: "Create content pillars, calendar, formats, platform focus, and campaign direction.",
      outputs: ["content_pillars", "calendar_plan", "platform_strategy"],
    },
    {
      title: "Script and Story Engine",
      purpose: "Generate hooks, scripts, outlines, story arcs, CTA, and retention structure.",
      outputs: ["script", "hook_variants", "story_arc"],
    },
    {
      title: "Campaign Builder",
      purpose: "Plan launch campaigns, promotional angles, email/social sequences, and conversion assets.",
      outputs: ["campaign_plan", "launch_assets", "conversion_copy"],
    },
    {
      title: "Content Repurposing Engine",
      purpose: "Turn one idea into shorts, threads, posts, newsletters, clips, carousels, and summaries.",
      outputs: ["repurposed_assets", "channel_variants", "posting_sequence"],
    },
    {
      title: "Audience Fit Analyst",
      purpose: "Check whether content matches audience need, tone, channel expectations, and creator positioning.",
      outputs: ["audience_fit_score", "tone_notes", "optimization_flags"],
    },
    {
      title: "Creator Monetization Planner",
      purpose: "Suggest creator products, subscriptions, sponsorship assets, course offers, and funnel ideas.",
      outputs: ["monetization_plan", "offer_ideas", "funnel_notes"],
    },
    {
      title: "Creator Package Generator",
      purpose: "Generate a full creator-ready package with content, schedule, campaign notes, and next actions.",
      outputs: ["creator_package", "schedule", "next_actions"],
    },
  ],
  accessModels: [
    {
      title: "Public creator assistant",
      description: "Anyone can generate basic scripts, captions, hooks, and content ideas.",
    },
    {
      title: "Subscription creator studio",
      description: "Users pay for saved brand voice, campaigns, calendars, repurposing, and creator packages.",
    },
    {
      title: "Usage-credit content generation",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced content packages and campaigns.",
    },
    {
      title: "Agency / team workspace",
      description: "Teams and agencies manage multiple brands, clients, campaigns, and creator calendars.",
    },
  ],
  rioMindNexusRole: [
    "Act as the creator intelligence engine behind the AI Creator Studio.",
    "Structure brand identity, audience, content pillars, and campaign objectives.",
    "Generate scripts, assets, calendars, launch plans, and repurposed formats.",
    "Analyze audience fit, tone, channel alignment, and monetization opportunities.",
    "Produce creator packages with assumptions, limitations, and next-action recommendations.",
    "Support future subscriptions, creator workspaces, brand memory, and usage-credit rails.",
  ],
  proofAndVerification: [
    "Generated content should be reviewed before publishing.",
    "Brand, legal, copyright, sponsorship, and platform-policy risks require human review.",
    "The system should not claim guaranteed virality, revenue, or audience growth.",
    "Sensitive claims, endorsements, and regulated topics require verification and disclosure.",
  ],
};
