import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const AI_BUSINESS_LAUNCH_HUB_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "ai_business_launch_hub",
  nicheTitle: "AI Business Launch Hub Intelligence Platform",
  rioMindNexusRole: "RioMind Nexus will act as the business launch intelligence layer. It will structure ideas, map business models, validate markets, generate pitch decks, landing pages, CRM workflows, marketing campaigns, operations plans, and business launch reports.",
  nexusHooks: ["business_model_architect","market_validation_analyst","pitch_deck_generator","landing_page_builder","crm_sales_workflow","marketing_campaign_planner","operations_planner","business_launch_reporter"],
  inputSchema: [
    { key: "business_idea", label: "Business idea", type: "textarea", required: true, helper: "Describe product, service, startup, or business concept.", examples: ["Launch CRM for small shops", "Create SaaS tool", "Start e-commerce brand"] },
    { key: "target_customer", label: "Target customer", type: "text", required: true, helper: "Who the business serves.", examples: ["Small businesses", "Students", "Creators"] },
    { key: "launch_stage", label: "Launch stage", type: "text", required: true, helper: "Current stage.", examples: ["Idea", "MVP", "Pre-launch", "Revenue"] },
    { key: "constraints", label: "Constraints", type: "textarea", required: false, helper: "Budget, time, team, market, or regulatory constraints.", examples: ["Small budget", "No team", "Need launch in 30 days"] },
    { key: "target_output", label: "Target output", type: "textarea", required: true, helper: "What should be generated.", examples: ["Business plan", "Pitch deck", "Landing page", "CRM workflow"] }
  ],
  workflowActions: [
    { id: "map_business_model", label: "Map Business Model", purpose: "Define customer, value proposition, revenue, costs, channels, and offer." },
    { id: "validate_market", label: "Validate Market", purpose: "Review problem, market, competition, pricing, risks, and validation gaps.", requiresDiagnosis: true },
    { id: "generate_pitch_deck", label: "Generate Pitch Deck", purpose: "Create pitch story, slide plan, investor notes, and ask.", requiresDiagnosis: true },
    { id: "build_launch_assets", label: "Build Launch Assets", purpose: "Create landing page, campaign, CRM, and launch checklist.", requiresDiagnosis: true },
    { id: "plan_operations", label: "Plan Operations", purpose: "Generate SOPs, team roles, support flow, and dashboard plan.", requiresDiagnosis: true },
    { id: "generate_business_report", label: "Generate Business Report", purpose: "Produce launch package, risks, assumptions, and next actions.", requiresDiagnosis: true }
  ],
  expectedOutputs: [
    { key: "business_model", label: "Business Model", description: "Customer, value proposition, offer, revenue, costs, and channels." },
    { key: "market_validation", label: "Market Validation", description: "Competition, demand, pricing, validation gaps, and risk flags." },
    { key: "pitch_deck", label: "Pitch Deck", description: "Slide plan, story, investor notes, roadmap, and ask." },
    { key: "launch_assets", label: "Launch Assets", description: "Landing page copy, CRM workflow, campaign plan, and checklist." },
    { key: "operations_plan", label: "Operations Plan", description: "SOPs, team roles, support flow, and dashboard metrics." },
    { key: "risk_review", label: "Risk Review", description: "Assumptions, financial/legal/tax/investment review notes, and limitations." },
    { key: "business_launch_report", label: "Business Launch Report", description: "Complete launch package with next actions and review points." }
  ],
  verificationLayer: [
    { title: "Human business review", rule: "Business outputs should be reviewed before execution." },
    { title: "Qualified advice boundary", rule: "Financial, legal, tax, investment, and employment claims require qualified review." },
    { title: "No guaranteed outcomes", rule: "The system must not guarantee revenue, funding, growth, customers, or profitability." },
    { title: "Assumption disclosure", rule: "Pitch, market, and financial assumptions must be clearly labeled as assumptions." }
  ],
  accessModel: [
    { id: "public_business_assistant", label: "Public business assistant", description: "Basic plans, ideas, and launch checklists." },
    { id: "subscription_workspace", label: "Subscription launch workspace", description: "Saved projects, CRM, pitch decks, landing pages, and reports." },
    { id: "usage_credit_launch_engine", label: "Usage-credit launch engine", description: "Advanced launch packages using credits, RIO, RUSD, USDT, or USDC." },
    { id: "agency_team_workspace", label: "Agency/team workspace", description: "Clients, campaigns, launch assets, CRM, and operations." }
  ]
});
