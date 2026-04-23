export type PrimeTone = "gold" | "dark" | "green" | "violet";
export type PrimeLiquidityBase = "RIO" | "RUSD";
export type PrimeLiquidityMode = "manual" | "guided" | "deferred";
export type PrimeFeeTier = "standard" | "advanced" | "premium" | "hybrid";

export type PrimeReviewSection = {
  id: string;
  title: string;
  items: string[];
};

export type PrimeTemplate = {
  id: string;
  name: string;
  category: string;
  tone: PrimeTone;
  description: string;
  launchModel: string;
  aiContext: string;

  defaultLiquidityBases: PrimeLiquidityBase[];
  defaultLiquidityMode: PrimeLiquidityMode;
  feeTier: PrimeFeeTier;

  allocationDefaults: string[];
  trustDefaults: string[];
  readinessDefaults: string[];

  screenerLabel: string;
  successActions: string[];

  // ✅ NEW (non-breaking additions)
  aiOutputs?: string[];
  powerUps?: string[];
  liquidityGuidance?: string[];
  requiredDisclosures?: string[];
  reviewSections?: PrimeReviewSection[];
};

export const PRIME_TREASURY_RECIPIENT =
  "rio1nnhxsa49cc5e9vyxj6r6s3hwlkymcrletx7wch";
function enrichTemplate(template: PrimeTemplate): PrimeTemplate {
  return {
    ...template,
    aiOutputs: template.aiOutputs ?? [],
    powerUps: template.powerUps ?? [],
    liquidityGuidance: template.liquidityGuidance ?? [],
    requiredDisclosures: template.requiredDisclosures ?? [],

    reviewSections:
      template.reviewSections ??
      [
        {
          id: "allocation",
          title: "Allocation defaults",
          items: template.allocationDefaults,
        },
        {
          id: "trust",
          title: "Trust defaults",
          items: template.trustDefaults,
        },
        {
          id: "readiness",
          title: "Readiness expectations",
          items: template.readinessDefaults,
        },
      ],
  };
}
export const PRIME_TEMPLATES: PrimeTemplate[] = ([
  {
    id: "community",
    name: "Community",
    category: "Social launch",
    tone: "dark",
    description: "Membership, culture, and community-aligned issuance.",
    launchModel:
      "Community-first launch with broad public participation and gradual trust formation.",
    aiContext:
      "Generate a community token plan with culture, participation, incentives, and safe launch structure.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "guided",
    feeTier: "standard",
    allocationDefaults: [
      "Public/community heavy",
      "Small treasury reserve",
      "Contributor vesting",
      "Ecosystem reserve",
    ],
    trustDefaults: [
      "Wallet caps enabled",
      "Liquidity lock recommended",
      "Mint disabled",
      "Monitoring enabled",
    ],
    readinessDefaults: [
      "Community traction",
      "Holder spread",
      "Volume consistency",
      "Graduation behavior clean",
    ],
    screenerLabel: "Community",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
  },
  {
    


    id: "utility",
    name: "Utility",
    category: "Protocol utility",
    tone: "gold",
    description: "Access, product function, and network usage alignment.",
    launchModel:
      "Structured utility-led launch for projects that require clearer product alignment, stronger usage framing, tighter disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate a utility-led launch structure with explicit product function, access logic, supply discipline, allocation clarity, trust controls, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "guided",
    feeTier: "advanced",
    allocationDefaults: [
      "Product reserve",
      "Public utility allocation",
      "Team vesting",
      "Growth reserve",
    ],
    trustDefaults: [
      "No extra mint by default",
      "Admin minimized",
      "Utility disclosures",
      "Liquidity discipline",
    ],
    readinessDefaults: [
      "Product clarity",
      "Usage case evidence",
      "Liquidity quality",
      "Long-term utility posture",
    ],
    screenerLabel: "Utility",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
       aiOutputs: [
      "Utility design",
      "Supply distribution outline",
      "Access and usage mapping",
      "Token role summary",
      "Suggested roadmap",
      "Graduation readiness prompts",
    ],
    powerUps: [
      "Usage-first launch framing",
      "Product-aligned positioning",
      "Guided liquidity discipline",
      "Trust-first public review",
      "Ecosystem utility route",
    ],
    liquidityGuidance: [
      "RIO is preferred when ecosystem alignment and long-horizon Spherio adoption matter most.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "Guided liquidity should remain the default for utility launches unless the issuer has a stronger treasury or market-making structure.",
      "Utility launches should preserve disciplined float, visible product relevance, and a deliberate transition into RioEx and RioDex.",
    ],
    requiredDisclosures: [
      "What the token does inside the product or protocol.",
      "What the token does not do.",
      "Allocation, float, vesting, and access posture.",
      "Liquidity base selection rationale.",
      "Admin, mint, upgrade, and monitoring posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],
 },
 {
    id: "governance",
    name: "Governance",
    category: "DAO / voting",
    tone: "dark",
    description: "Voting power, treasury participation, and protocol stewardship.",
    launchModel:
      "Structured governance-led launch for projects that require clearer voting design, treasury participation logic, stronger disclosure standards, and a more deliberate path into public market discovery.",
    aiContext:
      "Generate a governance-led launch structure with explicit voting rights, treasury participation, allocation fairness, vesting discipline, trust controls, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "manual",
    feeTier: "advanced",
    allocationDefaults: [
      "Treasury reserve",
      "Community governance allocation",
      "Contributor vesting",
      "Strategic reserve",
    ],
    trustDefaults: [
      "Voting transparency",
      "Treasury visibility",
      "Vesting required",
      "Whale cap advised",
    ],
    readinessDefaults: [
      "Governance docs",
      "Treasury clarity",
      "Voting rationale",
      "Holder quality",
    ],
    screenerLabel: "Governance",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
     aiOutputs: [
      "Governance structure",
      "Voting rights outline",
      "Treasury participation summary",
      "Distribution fairness prompts",
      "Vesting and unlock posture",
      "Market readiness prompts",
    ],
    powerUps: [
      "Governance-first launch framing",
      "Treasury participation posture",
      "Manual liquidity discipline",
      "Voting transparency emphasis",
      "Holder-quality positioning",
    ],
    liquidityGuidance: [
      "Manual liquidity should remain mandatory for governance-led launches.",
      "RIO is preferred when governance is intended to remain strongly ecosystem-native and long-horizon in orientation.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "Governance launches should preserve disciplined float, emphasize holder quality, and move into RioEx and RioDex only with clear voting and treasury disclosures.",
    ],
    requiredDisclosures: [
      "What governance rights the token grants.",
      "Treasury role and participation logic.",
      "Allocation fairness, float, vesting, and control posture.",
      "Liquidity base selection rationale.",
      "Admin, upgrade, monitoring, and voting-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],
  },
  {
    id: "treasury",
    name: "Treasury",
    category: "Capital structure",
    tone: "gold",
    description: "Reserve-led issuance with disciplined allocation framing.",
    launchModel:
      "Structured treasury-led launch for projects that require clearer reserve framing, tighter capital discipline, stronger disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate a treasury-led launch structure with explicit reserve policy, float discipline, vesting and maturity design, capital allocation logic, disclosure depth, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "manual",
    feeTier: "premium",
    allocationDefaults: [
      "Treasury-majority reserve",
      "Public float",
      "Contributor vesting",
      "Contingency reserve",
    ],
    trustDefaults: [
      "Reserve disclosure",
      "Lock schedules",
      "Admin clarity",
      "Monitoring enabled",
    ],
    readinessDefaults: [
      "Treasury policy",
      "Reserve transparency",
      "Maturity profile",
      "Liquidity sufficiency",
    ],
    screenerLabel: "Treasury",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
      aiOutputs: [
      "Treasury structure",
      "Reserve and float breakdown",
      "Capital allocation outline",
      "Vesting and maturity profile",
      "Disclosure package summary",
      "Market readiness prompts",
    ],
     powerUps: [
      "Reserve-first launch framing",
      "Treasury visibility posture",
      "Manual liquidity discipline",
      "Institutional disclosure standard",
      "Capital-structure leadership",
    ],
    liquidityGuidance: [
      "Manual liquidity should remain mandatory for treasury-led launches.",
      "RIO is preferred when treasury strategy is ecosystem-native, strategic, and long-horizon in orientation.",
      "RUSD is appropriate when reserve optics, pricing clarity, or more conservative public framing matter most.",
      "Treasury launches should preserve disciplined float, visible reserve logic, and a deliberate transition into RioEx, RioDex, and broader market discovery.",
    ],
     requiredDisclosures: [
      "Treasury mandate and reserve purpose.",
      "Public float versus treasury-held allocation.",
      "Vesting, lock, and maturity schedule.",
      "Liquidity base selection rationale.",
      "Admin, reserve-control, monitoring, and disclosure posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],
  },
  {
    id: "revenue-linked",
    name: "Revenue-linked",
    category: "Cashflow design",
    tone: "green",
    description: "Business or protocol models tied to revenue participation logic.",
    launchModel:
      "Structured revenue-aware launch for projects that require clearer disclosure standards, tighter business-readability, stronger trust posture, and a more disciplined path into public market discovery.",
    aiContext:
      "Generate a revenue-linked launch structure with explicit business logic, disclosure depth, treasury and operations framing, float discipline, risk posture, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "manual",
    feeTier: "premium",
    allocationDefaults: [
      "Public allocation",
      "Treasury reserve",
      "Ops reserve",
      "Team vesting",
    ],
    trustDefaults: [
      "Disclosure-heavy",
      "No misleading yield claims",
      "Treasury transparency",
      "Behavior monitoring",
    ],
    readinessDefaults: [
      "Business clarity",
      "Revenue logic",
      "Disclosure quality",
      "Risk posture",
    ],
    screenerLabel: "Revenue",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
     aiOutputs: [
      "Revenue linkage framing",
      "Disclosure package outline",
      "Treasury and ops split summary",
      "Distribution structure prompts",
      "Risk posture summary",
      "Market readiness prompts",
    ],
     powerUps: [
      "Disclosure-first launch framing",
      "Revenue-readability posture",
      "Manual liquidity discipline",
      "Treasury and operations visibility",
      "Risk-sensitive institutional review",
    ],
    liquidityGuidance: [
      "Manual liquidity should remain mandatory for revenue-linked launches.",
      "RUSD is preferred when business readability, pricing clarity, or more conservative public framing matter most.",
      "RIO can be used when ecosystem alignment is strategically important and disclosures are strong enough to support that positioning.",
      "Revenue-linked launches should preserve disciplined float, avoid exaggerated business signaling, and transition into RioEx and RioDex with clear public disclosure posture.",
    ],
    requiredDisclosures: [
      "What the revenue linkage actually means.",
      "What holders should and should not expect from that linkage.",
      "Treasury, operations, float, and vesting posture.",
      "Liquidity base selection rationale.",
      "Admin, monitoring, and disclosure-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],
  },
  {
    id: "asset-backed",
    name: "Asset-backed",
    category: "Collateralized",
    tone: "gold",
    description: "Structured issuance for real-world or reserve-backed positioning.",
    launchModel:
       "Structured collateral-aware launch for projects that require stronger reserve framing, clearer disclosure standards, tighter trust posture, and a more disciplined route into public market discovery.",
    aiContext:
       "Generate an asset-backed launch structure with explicit reserve framing, collateral boundaries, issuer controls, disclosure depth, float discipline, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RUSD", "RIO"],
    defaultLiquidityMode: "manual",
    feeTier: "premium",
    allocationDefaults: [
      "Reserve/collateral allocation",
      "Public float",
      "Treasury reserve",
      "Issuer vesting",
    ],
    trustDefaults: [
      "Transparency heavy",
      "Collateral stance",
      "Monitoring required",
      "Admin stance disclosed",
    ],
    readinessDefaults: [
      "Reserve evidence",
      "Disclosure quality",
      "Liquidity readiness",
      "Trust score focus",
    ],
    screenerLabel: "Asset-backed",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
     aiOutputs: [
      "Collateral framing summary",
      "Reserve and backing outline",
      "Float and issuer allocation prompts",
      "Disclosure package structure",
      "Trust and transparency posture",
      "Market readiness prompts",
    ],
       powerUps: [
      "Collateral-aware launch framing",
      "Reserve-first trust posture",
      "Manual liquidity discipline",
      "Disclosure-heavy institutional review",
      "Asset-backing visibility layer",
    ],
       liquidityGuidance: [
      "Manual liquidity should remain mandatory for asset-backed launches.",
      "RUSD is preferred when reserve optics, pricing clarity, or stability framing are central to the launch.",
      "RIO can be used when the issuer wants stronger Spherio-native positioning without weakening reserve disclosures.",
      "Asset-backed launches should preserve disciplined float, avoid overstating backing, and move into RioEx and RioDex only with clear public disclosure posture.",
    ],
      requiredDisclosures: [
      "What reserve or backing support actually exists.",
      "What is and is not collateralized.",
      "Issuer allocation, float, vesting, and treasury posture.",
      "Liquidity base selection rationale.",
      "Admin, monitoring, reserve-control, and disclosure posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],
  },
  {
    id: "nft",
    name: "NFT",
    category: "Collection layer",
    tone: "violet",
    description:
      "Token architecture for NFT ecosystems, access, and collection utility.",
    launchModel:
      "Structured NFT-led launch for projects that require clearer collection utility, stronger creator-community framing, tighter disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate an NFT-led launch structure with explicit collection utility, creator-community alignment, allocation discipline, trust controls, disclosure depth, holder-quality framing, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "guided",
    feeTier: "standard",
    allocationDefaults: [
      "Community allocation",
      "Creator reserve",
      "Ecosystem rewards",
      "Ops reserve",
    ],
    trustDefaults: [
      "Creator disclosures",
      "Wallet caps",
      "Monitoring enabled",
      "Clear utility framing",
    ],
    aiOutputs: [
      "NFT launch structure",
      "Collection and community framing",
      "Allocation and holder-quality prompts",
      "Trust and disclosure summary",
      "Utility-readiness signals",
      "Market readiness prompts",
    ],   
    powerUps: [
      "Collection-first launch framing",
      "Creator and community visibility",
      "Guided liquidity discipline",
      "Trust-first public review",
      "Utility-readiness positioning",
    ],
    liquidityGuidance: [
      "Guided liquidity should remain the default for NFT-led launches unless the issuer has a stronger treasury or market-making structure.",
      "RIO is preferred when ecosystem alignment and long-horizon Spherio positioning matter most.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "NFT launches should preserve disciplined float, visible collection relevance, and a deliberate transition into RioEx and RioDex.",
    ], 
    requiredDisclosures: [
      "What the token does inside the collection or NFT ecosystem.",
      "What the token does not do.",
      "Allocation, float, vesting, reserve, and creator posture.",
      "Liquidity base selection rationale.",
      "Admin, mint, upgrade, monitoring, and trust-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],
    readinessDefaults: [
      "Collection roadmap",
      "Utility clarity",
      "Holder quality",
      "Community traction",
    ],
    screenerLabel: "NFT",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
  },
  {
    id: "dao",
    name: "DAO",
    category: "Collective structure",
    tone: "dark",
    description:
      "Treasury, governance, and membership issuance for organized collectives.",
    launchModel:
      "Structured DAO-led launch for collectives that require clearer membership logic, treasury coordination, stronger governance posture, tighter disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate a DAO-led launch structure with explicit membership design, governance rights, treasury coordination, allocation fairness, vesting discipline, trust controls, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "manual",
    feeTier: "advanced",
    allocationDefaults: [
      "DAO treasury",
      "Community membership allocation",
      "Contributor vesting",
      "Strategic reserve",
    ],
    trustDefaults: [
      "Treasury disclosure",
      "Governance transparency",
      "Vesting required",
      "Caps recommended",
    ],
    readinessDefaults: [
      "DAO documentation",
      "Treasury plan",
      "Governance posture",
      "Holder dispersion",
    ],
    aiOutputs: [
      "DAO launch structure",
      "Membership and governance framing",
      "Treasury coordination summary",
      "Allocation fairness prompts",
      "Vesting and control posture",
      "Market readiness prompts",
    ],
    powerUps: [
      "Collective-first launch framing",
      "Treasury coordination posture",
      "Manual liquidity discipline",
      "Governance and membership visibility",
      "Institutional DAO review",
    ],
    liquidityGuidance: [
      "Manual liquidity should remain mandatory for DAO-led launches.",
      "RIO is preferred when the DAO is ecosystem-native, strategic, and long-horizon in orientation.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "DAO launches should preserve disciplined float, emphasize member quality, and move into RioEx and RioDex only with clear treasury and governance disclosures.",
    ],
    requiredDisclosures: [
      "What membership and governance rights the token grants.",
      "Treasury coordination and control logic.",
      "Allocation, float, vesting, and reserve posture.",
      "Liquidity base selection rationale.",
      "Admin, monitoring, governance, and treasury-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],
    screenerLabel: "DAO",   
      successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
  },
  {
    id: "ai",
    name: "AI",
    category: "Agent / infra",
    tone: "green",
    description:
      "AI products, agent ecosystems, compute, or model utility issuance.",
    launchModel:
      "Structured AI-led launch for products that require clearer agent or infrastructure utility, stronger usage framing, tighter disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate an AI-led launch structure with explicit agent or infrastructure utility, allocation discipline, trust controls, disclosure depth, product-readiness signals, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "guided",
    feeTier: "advanced",
    allocationDefaults: [
      "Public utility allocation",
      "Infra reserve",
      "Contributor vesting",
      "Growth reserve",
    ],
    trustDefaults: [
      "Utility clarity",
      "No hype-only posture",
      "Monitoring enabled",
      "Supply discipline",
    ],
    aiOutputs: [
      "AI launch structure",
      "Agent or infrastructure utility framing",
      "Allocation discipline prompts",
      "Trust and disclosure summary",
      "Product-readiness signals",
      "Market readiness prompts",
    ],   
    powerUps: [
      "AI-utility launch framing",
      "Infrastructure and agent visibility",
      "Guided liquidity discipline",
      "Trust-first public review",
      "Product-readiness positioning",
    ],
     liquidityGuidance: [
      "Guided liquidity should remain the default for AI-led launches unless the issuer has a stronger treasury or market-making structure.",
      "RIO is preferred when ecosystem alignment and long-horizon Spherio positioning matter most.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "AI launches should preserve disciplined float, visible product relevance, and a deliberate transition into RioEx and RioDex.",
    ],
    requiredDisclosures: [
      "What the token does inside the AI product, agent, or infrastructure stack.",
      "What the token does not do.",
      "Allocation, float, vesting, and utility posture.",
      "Liquidity base selection rationale.",
      "Admin, mint, upgrade, monitoring, and trust-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],   
    readinessDefaults: [
      "Product evidence",
      "Utility clarity",
      "Market narrative maturity",
      "Trust posture",
    ],
    screenerLabel: "AI",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
  },
  {
    id: "gaming",
    name: "Gaming",
    category: "Economy design",
    tone: "violet",
    description:
      "In-game economies, emissions discipline, and player-aligned utility.",
    launchModel:
      "Structured gaming-led launch for projects that require clearer in-game utility, stronger economy discipline, tighter disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate a gaming-led launch structure with explicit in-game utility, reward and emission discipline, allocation clarity, trust controls, player-aligned economy framing, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "guided",
    feeTier: "advanced",
    allocationDefaults: [
      "Player/community pool",
      "Treasury reserve",
      "Dev vesting",
      "Reward reserve",
    ],
    trustDefaults: [
      "Emission discipline",
      "Locking posture",
      "Whale controls",
      "Monitoring enabled",
    ],
    aiOutputs: [
      "Gaming launch structure",
      "In-game economy framing",
      "Reward and emission prompts",
      "Trust and disclosure summary",
      "Player-aligned utility signals",
      "Market readiness prompts",
    ],   
    powerUps: [
      "Game-economy launch framing",
      "Player and reward visibility",
      "Guided liquidity discipline",
      "Trust-first public review",
      "Economy-readiness positioning",
    ],   
    liquidityGuidance: [
      "Guided liquidity should remain the default for gaming-led launches unless the issuer has a stronger treasury or market-making structure.",
      "RIO is preferred when ecosystem alignment and long-horizon Spherio positioning matter most.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "Gaming launches should preserve disciplined float, visible in-product relevance, and a deliberate transition into RioEx and RioDex.",
    ], 
    requiredDisclosures: [
      "What the token does inside the game or participation economy.",
      "What the token does not do.",
      "Allocation, float, vesting, reserve, and reward posture.",
      "Liquidity base selection rationale.",
      "Admin, mint, upgrade, monitoring, and trust-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],
    readinessDefaults: [
      "Game utility",
      "Emissions clarity",
      "Economy balance",
      "Participation quality",
    ],
    screenerLabel: "Gaming",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    category: "Audience token",
    tone: "dark",
    description:
      "Creator memberships, perks, drops, and fan participation models.",
    launchModel:
      "Structured creator-led launch for projects that require clearer audience utility, stronger perk framing, tighter disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate a creator-led launch structure with explicit audience utility, perk design, allocation discipline, trust controls, disclosure depth, holder-quality framing, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "guided",
    feeTier: "standard",
    allocationDefaults: [
      "Community/fan allocation",
      "Creator reserve",
      "Treasury reserve",
      "Growth reserve",
    ],
    trustDefaults: [
      "Creator transparency",
      "Wallet limits",
      "Behavior monitoring",
      "Utility clarity",
    ],
    aiOutputs: [
      "Creator launch structure",
      "Audience and perk framing",
      "Allocation and holder-quality prompts",
      "Trust and disclosure summary",
      "Utility-readiness signals",
      "Market readiness prompts",
    ],
    powerUps: [
      "Creator-first launch framing",
      "Audience and perk visibility",
      "Guided liquidity discipline",
      "Trust-first public review",
      "Community-quality positioning",
    ],   
    liquidityGuidance: [
      "Guided liquidity should remain the default for creator-led launches unless the issuer has a stronger treasury or market-making structure.",
      "RIO is preferred when ecosystem alignment and long-horizon Spherio positioning matter most.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "Creator launches should preserve disciplined float, visible audience relevance, and a deliberate transition into RioEx and RioDex.",
    ],   
    requiredDisclosures: [
      "What perks, access, or audience utility the token provides.",
      "What the token does not provide.",
      "Allocation, float, vesting, reserve, and creator posture.",
      "Liquidity base selection rationale.",
      "Admin, mint, upgrade, monitoring, and trust-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],   
    readinessDefaults: [
      "Audience size",
      "Perk clarity",
      "Roadmap quality",
      "Trust posture",
    ],
    screenerLabel: "Creator",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
  },
  {
    id: "defi",
    name: "DeFi",
    category: "Financial layer",
    tone: "green",
    description:
      "Exchange, staking, liquidity, or financial protocol token structures.",
    launchModel:
      "Structured DeFi-led launch for protocols that require clearer incentive design, stronger liquidity discipline, tighter disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate a DeFi-led launch structure with explicit incentive logic, liquidity planning, governance posture, allocation discipline, trust controls, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "manual",
    feeTier: "premium",
    allocationDefaults: [
      "Liquidity reserve",
      "Community allocation",
      "Treasury reserve",
      "Contributor vesting",
    ],
    trustDefaults: [
      "Liquidity lock strongly advised",
      "Admin stance disclosed",
      "Monitoring enabled",
      "Whale controls",
    ],
    aiOutputs: [
      "DeFi launch structure",
      "Incentive and liquidity framing",
      "Governance posture summary",
      "Allocation discipline prompts",
      "Trust and disclosure summary",
      "Market readiness prompts",
    ],   
   powerUps: [
      "DeFi protocol launch framing",
      "Liquidity-first discipline",
      "Governance and incentive visibility",
      "Trust-first public review",
      "Protocol-readiness positioning",
    ], 
    liquidityGuidance: [
      "Manual liquidity should remain mandatory for DeFi-led launches.",
      "RIO is preferred when protocol alignment and long-horizon Spherio positioning matter most.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "DeFi launches should preserve disciplined float, visible incentive logic, and a deliberate transition into RioEx and RioDex.",
    ],  
    requiredDisclosures: [
      "What the token does inside the DeFi protocol.",
      "How incentives, governance, or liquidity logic actually work.",
      "Allocation, float, vesting, and reserve posture.",
      "Liquidity base selection rationale.",
      "Admin, upgrade, monitoring, and trust-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],  
   readinessDefaults: [
      "Liquidity sufficiency",
      "Protocol docs",
      "Trust posture",
      "Volume quality",
    ],
    screenerLabel: "DeFi",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    category: "Network layer",
    tone: "gold",
    description:
      "Utility for services, bandwidth, compute, tooling, or network coordination.",
    launchModel:
      "Structured infrastructure-led launch for projects that require clearer network or service utility, stronger reserve discipline, tighter disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate an infrastructure-led launch structure with explicit service utility, reserve logic, allocation discipline, trust controls, disclosure depth, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "manual",
    feeTier: "advanced",
    allocationDefaults: [
      "Network reserve",
      "Public utility allocation",
      "Contributor vesting",
      "Treasury reserve",
    ],
    trustDefaults: [
      "Utility clarity",
      "Supply discipline",
      "Transparency posture",
      "Monitoring enabled",
    ],
    aiOutputs: [
      "Infrastructure launch structure",
      "Network and service utility framing",
      "Reserve and allocation prompts",
      "Trust and disclosure summary",
      "Utility-readiness signals",
      "Market readiness prompts",
    ],   
    powerUps: [
      "Infrastructure-first launch framing",
      "Network and service visibility",
      "Manual liquidity discipline",
      "Trust-first public review",
      "Utility-readiness positioning",
    ],   
    liquidityGuidance: [
      "Manual liquidity should remain mandatory for infrastructure-led launches.",
      "RIO is preferred when network alignment and long-horizon Spherio positioning matter most.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "Infrastructure launches should preserve disciplined float, visible service relevance, and a deliberate transition into RioEx and RioDex.",
    ],   
    requiredDisclosures: [
      "What the token does inside the network, service, or tooling stack.",
      "What the token does not do.",
      "Allocation, float, vesting, reserve, and utility posture.",
      "Liquidity base selection rationale.",
      "Admin, mint, upgrade, monitoring, and trust-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],   
    readinessDefaults: [
      "Service relevance",
      "Utility proof",
      "Liquidity quality",
      "Trust readiness",
    ],
    screenerLabel: "Infrastructure",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
  },
  {
    id: "marketplace",
    name: "Marketplace",
    category: "Commerce",
    tone: "dark",
    description:
      "Commercial and marketplace incentives, settlement, or fee design.",
    launchModel:
      "Structured marketplace-led launch for projects that require clearer commerce utility, stronger settlement framing, tighter disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate a marketplace-led launch structure with explicit commerce or settlement utility, allocation discipline, trust controls, disclosure depth, participation logic, and staged market-readiness requirements.",   
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "guided",
    feeTier: "advanced",
    allocationDefaults: [
      "Marketplace reserve",
      "Community allocation",
      "Treasury reserve",
      "Growth reserve",
    ],
    trustDefaults: [
      "Commerce disclosures",
      "Supply discipline",
      "Monitoring enabled",
      "Clear utility framing",
    ],
    aiOutputs: [
      "Marketplace launch structure",
      "Commerce and settlement framing",
      "Participation and allocation prompts",
      "Trust and disclosure summary",
      "Utility-readiness signals",
      "Market readiness prompts",
    ],   
    powerUps: [
      "Marketplace-first launch framing",
      "Commerce and settlement visibility",
      "Guided liquidity discipline",
      "Trust-first public review",
      "Participation-readiness positioning",
    ],
     liquidityGuidance: [
      "Guided liquidity should remain the default for marketplace-led launches unless the issuer has a stronger treasury or market-making structure.",
      "RIO is preferred when ecosystem alignment and long-horizon Spherio positioning matter most.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "Marketplace launches should preserve disciplined float, visible commerce relevance, and a deliberate transition into RioEx and RioDex.",
    ],  
    requiredDisclosures: [
      "What the token does inside the marketplace, commerce, or settlement flow.",
      "What the token does not do.",
      "Allocation, float, vesting, reserve, and utility posture.",
      "Liquidity base selection rationale.",
      "Admin, mint, upgrade, monitoring, and trust-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],   
    readinessDefaults: [
      "Marketplace utility",
      "Settlement logic",
      "Participation quality",
      "Discovery readiness",
    ],
    screenerLabel: "Marketplace",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
  },
  {
    id: "membership",
    name: "Membership",
    category: "Access",
    tone: "violet",
    description:
      "Private access, gated benefits, and community membership structures.",
    launchModel:
      "Structured membership-led launch for projects that require clearer access utility, stronger benefit framing, tighter disclosure standards, and a more deliberate route into public market discovery.",
    aiContext:
      "Generate a membership-led launch structure with explicit access logic, benefit design, allocation discipline, trust controls, disclosure depth, holder-quality framing, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "guided",
    feeTier: "standard",
    allocationDefaults: [
      "Community/member allocation",
      "Treasury reserve",
      "Ops reserve",
      "Creator/team vesting",
    ],
    trustDefaults: [
      "Utility clarity",
      "Caps enabled",
      "No misleading claims",
      "Monitoring enabled",
    ],
    aiOutputs: [
      "Membership launch structure",
      "Access and benefit framing",
      "Allocation and holder-quality prompts",
      "Trust and disclosure summary",
      "Utility-readiness signals",
      "Market readiness prompts",
    ],   
    powerUps: [
      "Membership-first launch framing",
      "Access and benefit visibility",
      "Guided liquidity discipline",
      "Trust-first public review",
      "Holder-quality positioning",
    ],    
    liquidityGuidance: [
      "Guided liquidity should remain the default for membership-led launches unless the issuer has a stronger treasury or market-making structure.",
      "RIO is preferred when ecosystem alignment and long-horizon Spherio positioning matter most.",
      "RUSD is appropriate when pricing clarity or more conservative public framing matters more than ecosystem signaling.",
      "Membership launches should preserve disciplined float, visible access relevance, and a deliberate transition into RioEx and RioDex.",
    ],    
    requiredDisclosures: [
      "What access, benefits, or gated utility the token provides.",
      "What the token does not provide.",
      "Allocation, float, vesting, reserve, and access posture.",
      "Liquidity base selection rationale.",
      "Admin, mint, upgrade, monitoring, and trust-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],    
    readinessDefaults: [
      "Access clarity",
      "Benefit roadmap",
      "Holder dispersion",
      "Market maturity",
    ],
    screenerLabel: "Membership",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
  },
  {
    id: "hybrid",
    name: "Hybrid",
    category: "Structured mix",
    tone: "gold",
    description:
      "Approved combinations for more advanced launch architecture.",
    launchModel:
      "Advanced structured launch for projects that require an approved multi-framework architecture, stronger review discipline, tighter disclosure standards, and a more deliberate path into market discovery.",
    aiContext:
      "Generate a hybrid launch structure from approved framework combinations with explicit rationale, allocation discipline, trust controls, disclosure depth, and staged market-readiness requirements.",
    defaultLiquidityBases: ["RIO", "RUSD"],
    defaultLiquidityMode: "manual",
    feeTier: "hybrid",
    allocationDefaults: [
      "Custom mix allocation",
      "Treasury reserve",
      "Public float",
      "Vesting required",
    ],
    trustDefaults: [
      "Review-heavy",
      "Hybrid disclosure",
      "Monitoring enabled",
      "Trust controls mandatory",
    ],
    readinessDefaults: [
      "Framework fit",
      "Disclosure quality",
      "Liquidity quality",
      "Graduation readiness",
    ],
    screenerLabel: "Hybrid",
    successActions: [
      "copy_contract",
      "open_screener",
      "open_explorer",
      "add_liquidity",
      "continue_to_market",
    ],
      aiOutputs: [
      "Hybrid launch architecture",
      "Framework-mix rationale",
      "Allocation and float prompts",
      "Trust and review posture summary",
      "Disclosure package structure",
      "Market readiness prompts",
    ],
        powerUps: [
      "Approved framework stacking",
      "Flagship review posture",
      "Manual liquidity discipline",
      "Disclosure-heavy institutional framing",
      "Advanced issuance architecture",
    ],
       liquidityGuidance: [
      "Manual liquidity should remain mandatory for hybrid launches.",
      "RIO is preferred when the hybrid structure is ecosystem-native, strategic, and long-horizon in orientation.",
      "RUSD is appropriate when the launch requires stronger price clarity, reserve optics, or more conservative public framing.",
      "Hybrid launches should preserve disciplined float, stronger review checkpoints, and a deliberate transition into RioEx, RioDex, and broader market visibility.",
    ],
      requiredDisclosures: [
      "Which approved frameworks are being combined.",
      "Why the selected framework mix is necessary for the project.",
      "Allocation, float, vesting, treasury, and control posture.",
      "Liquidity base selection rationale.",
      "Admin, monitoring, governance, and trust-control posture.",
      "Expected route into RioEx, RioDex, and broader market discovery.",
    ],
 },
] as PrimeTemplate[]).map(enrichTemplate);

export function getPrimeTemplateById(templateId: string): PrimeTemplate | undefined {
  return PRIME_TEMPLATES.find((template) => template.id === templateId);
}
