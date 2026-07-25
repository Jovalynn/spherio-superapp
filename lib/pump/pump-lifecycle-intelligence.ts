// lib/pump/pump-lifecycle-intelligence.ts

export type PumpLifecyclePhase =
  | "bonding_curve"
  | "graduation"
  | "creator_reward";

export type PumpLifecycleStage =
  | "draft"
  | "bonding_curve_live"
  | "bonding_curve_threshold_reached"
  | "graduation_pending"
  | "graduated_liquidity_seeded"
  | "lp_burned"
  | "market_live"
  | "reward_tracking"
  | "reward_stage_one_eligible"
  | "reward_stage_one_paid"
  | "reward_stage_two_eligible"
  | "reward_stage_two_paid"
  | "reward_stage_three_eligible"
  | "reward_stage_three_paid"
  | "reward_blocked";

export type PumpRewardPayoutAsset = "stable" | "rio" | "hybrid";

export type PumpRiskFlag =
  | "insufficient_unique_buyers"
  | "market_cap_not_sustained"
  | "low_liquidity"
  | "wash_trading_suspected"
  | "sniper_activity_detected"
  | "wallet_cluster_concentration"
  | "creator_self_buy_suspected"
  | "volume_concentration_high"
  | "holder_concentration_high"
  | "lp_burn_not_confirmed"
  | "indexer_data_incomplete";

export type PumpIndexerRequirement =
  | "bonding_curve_trades"
  | "graduation_event"
  | "pool_reserves"
  | "lp_mint_event"
  | "lp_burn_or_dead_wallet_transfer"
  | "holder_balances"
  | "swap_volume"
  | "market_cap_snapshots"
  | "unique_buyer_counts"
  | "wallet_cluster_analysis"
  | "creator_linked_wallet_analysis"
  | "reward_payout_events";

export type PumpRewardStage = {
  id: "stage_one" | "stage_two" | "stage_three";
  label: string;
  milestoneMarketCapUsd: number;
  sustainDays: number;
  rewardPercentOfRemainingFunds: number;
  payoutAsset: PumpRewardPayoutAsset;
  stableWeightPercent: number;
  rioWeightPercent: number;
  eligible: boolean;
  paid: boolean;
  blocked: boolean;
  reason: string;
};

export type PumpHealthScore = {
  total: number;
  liquidityStability: number;
  holderDistribution: number;
  organicVolume: number;
  lowBotActivity: number;
  marketCapSustainability: number;
  explanation: string;
};

export type PumpLifecycleInput = {
  tokenName?: string | null;
  tokenSymbol?: string | null;
  creatorAddress?: string | null;

  stage?: PumpLifecycleStage | null;

  bondingCurveLive?: boolean;
  bondingCurveProgressPercent?: number | null;
  bondingCurveRaisedStableEquivalent?: number | null;
  graduationThresholdReached?: boolean;

  liquiditySeeded?: boolean;
  liquiditySeedStableEquivalent?: number | null;
  lpBurnedOrDeadWalleted?: boolean;

  marketCapUsd?: number | null;
  marketCapSustainDays250k?: number | null;
  marketCapSustainDays500k?: number | null;
  marketCapSustainDays1m?: number | null;
  liquidityUsd?: number | null;
  uniqueBuyers?: number | null;
  tradeCount?: number | null;
  buyCount?: number | null;
  sellCount?: number | null;
  holderCount?: number | null;
  suspiciousVolumeRatio?: number | null;
  sniperScore?: number | null;
  walletClusterRiskScore?: number | null;
  creatorSelfBuyRiskScore?: number | null;
  topHolderConcentrationPercent?: number | null;

  rewardStageOnePaid?: boolean;
  rewardStageTwoPaid?: boolean;
  rewardStageThreePaid?: boolean;

  indexerReady?: boolean;
};

export type PumpLifecycleResult = {
  phase: PumpLifecyclePhase;
  stage: PumpLifecycleStage;
  title: string;
  subtitle: string;

  bondingCurve: {
    live: boolean;
    tradingStatus:
      | "not_live"
      | "awaiting_first_trade"
      | "active_trading"
      | "graduation_threshold_reached";
    progressPercent: number;
    raisedStableEquivalent: number;
    graduationTargetStableEquivalent: number;
    remainingToGraduationStableEquivalent: number;
    tradeCount: number;
    buyCount: number;
    sellCount: number;
    uniqueBuyers: number;
    graduationThresholdReached: boolean;
    explanation: string;
  };

  graduation: {
    pending: boolean;
    liquiditySeeded: boolean;
    liquiditySeedStableEquivalent: number;
    lpBurnedOrDeadWalleted: boolean;
    explanation: string;
  };

  rewards: {
    rewardPoolBaseStableEquivalent: number;
    remainingAfterSeedStableEquivalent: number;
    creatorRewardReserveStableEquivalent: number;
    ecosystemDevelopmentReserveStableEquivalent: number;
    totalConfiguredRewardPercent: number;
    stages: PumpRewardStage[];
    explanation: string;
  };

  health: PumpHealthScore;
  riskFlags: PumpRiskFlag[];
  indexerRequirements: PumpIndexerRequirement[];

  nextAction: {
    label: string;
    disabled: boolean;
    reason: string;
  };

  creatorFacingExplanation: string;
  publicFacingExplanation: string;
};

export const PUMP_DEFAULT_GRADUATION_TARGET_STABLE_EQUIVALENT = 65_000;
export const PUMP_DEFAULT_GRADUATION_SEED_STABLE_EQUIVALENT = 15_000;

export const PUMP_REWARD_STAGE_ONE_MARKET_CAP_USD = 250_000;
export const PUMP_REWARD_STAGE_TWO_MARKET_CAP_USD = 500_000;
export const PUMP_REWARD_STAGE_THREE_MARKET_CAP_USD = 1_000_000;

export const PUMP_REWARD_SUSTAIN_DAYS = 4;

export const PUMP_REWARD_STAGE_ONE_PERCENT = 5;
export const PUMP_REWARD_STAGE_TWO_PERCENT = 5;
export const PUMP_REWARD_STAGE_THREE_PERCENT = 2.5;

export const PUMP_REWARD_STAGE_ONE_SUSTAIN_DAYS = 3;
export const PUMP_REWARD_STAGE_TWO_SUSTAIN_DAYS = 4;
export const PUMP_REWARD_STAGE_THREE_MIN_SWAPS = 1000;

export const PUMP_REWARD_STABLE_WEIGHT_PERCENT = 80;
export const PUMP_REWARD_RIO_WEIGHT_PERCENT = 20;

export const PUMP_MIN_UNIQUE_BUYERS_STAGE_ONE = 200;
export const PUMP_TARGET_UNIQUE_BUYERS_STAGE_ONE = 250;
export const PUMP_MIN_UNIQUE_BUYERS_STAGE_TWO = 250;
export const PUMP_TARGET_UNIQUE_BUYERS_STAGE_TWO = 400;
export const PUMP_MIN_UNIQUE_BUYERS_STAGE_THREE = 600;
export const PUMP_TARGET_UNIQUE_BUYERS_STAGE_THREE = 1_000;

export const PUMP_MAX_SUSPICIOUS_VOLUME_RATIO = 0.2;
export const PUMP_MAX_SNIPER_SCORE = 0.35;
export const PUMP_MAX_WALLET_CLUSTER_RISK_SCORE = 0.35;
export const PUMP_MAX_CREATOR_SELF_BUY_RISK_SCORE = 0.15;
export const PUMP_MAX_TOP_HOLDER_CONCENTRATION_PERCENT = 35;

function num(value: number | null | undefined, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function determineStage(input: PumpLifecycleInput): PumpLifecycleStage {
  if (input.stage) return input.stage;

  if (input.rewardStageThreePaid) return "reward_stage_three_paid";
  if (input.rewardStageTwoPaid) return "reward_stage_two_paid";
  if (input.rewardStageOnePaid) return "reward_stage_one_paid";

  if (input.lpBurnedOrDeadWalleted && input.liquiditySeeded) {
    return "reward_tracking";
  }

  if (input.liquiditySeeded) return "graduated_liquidity_seeded";

  if (input.graduationThresholdReached) return "graduation_pending";

  if (input.bondingCurveLive) return "bonding_curve_live";

  return "draft";
}

function determinePhase(stage: PumpLifecycleStage): PumpLifecyclePhase {
  if (
    stage === "draft" ||
    stage === "bonding_curve_live" ||
    stage === "bonding_curve_threshold_reached"
  ) {
    return "bonding_curve";
  }

  if (
    stage === "graduation_pending" ||
    stage === "graduated_liquidity_seeded" ||
    stage === "lp_burned" ||
    stage === "market_live"
  ) {
    return "graduation";
  }

  return "creator_reward";
}

function buildRiskFlags(input: PumpLifecycleInput): PumpRiskFlag[] {
  const flags: PumpRiskFlag[] = [];

  if (input.indexerReady === false) flags.push("indexer_data_incomplete");

  if (num(input.uniqueBuyers) > 0 && num(input.uniqueBuyers) < PUMP_MIN_UNIQUE_BUYERS_STAGE_ONE) {
    flags.push("insufficient_unique_buyers");
  }

  if (num(input.liquidityUsd) > 0 && num(input.liquidityUsd) < 50_000) {
    flags.push("low_liquidity");
  }

  if (num(input.suspiciousVolumeRatio) > PUMP_MAX_SUSPICIOUS_VOLUME_RATIO) {
    flags.push("wash_trading_suspected");
  }

  if (num(input.sniperScore) > PUMP_MAX_SNIPER_SCORE) {
    flags.push("sniper_activity_detected");
  }

  if (num(input.walletClusterRiskScore) > PUMP_MAX_WALLET_CLUSTER_RISK_SCORE) {
    flags.push("wallet_cluster_concentration");
  }

  if (num(input.creatorSelfBuyRiskScore) > PUMP_MAX_CREATOR_SELF_BUY_RISK_SCORE) {
    flags.push("creator_self_buy_suspected");
  }

  if (num(input.topHolderConcentrationPercent) > PUMP_MAX_TOP_HOLDER_CONCENTRATION_PERCENT) {
    flags.push("holder_concentration_high");
  }

  if (input.liquiditySeeded && !input.lpBurnedOrDeadWalleted) {
    flags.push("lp_burn_not_confirmed");
  }

  return flags;
}

function calculateHealthScore(input: PumpLifecycleInput, riskFlags: PumpRiskFlag[]): PumpHealthScore {
  const liquidityUsd = num(input.liquidityUsd);
  const uniqueBuyers = num(input.uniqueBuyers);
  const suspiciousVolumeRatio = num(input.suspiciousVolumeRatio);
  const sniperScore = num(input.sniperScore);
  const topHolderConcentration = num(input.topHolderConcentrationPercent);
  const marketCapUsd = num(input.marketCapUsd);
  const tradeCount = num(input.tradeCount);
  const buyCount = num(input.buyCount);
  const sellCount = num(input.sellCount);
  const holderCount = num(input.holderCount);

  const hasIndexedMarketData =
    liquidityUsd > 0 ||
    uniqueBuyers > 0 ||
    marketCapUsd > 0 ||
    tradeCount > 0 ||
    buyCount > 0 ||
    sellCount > 0 ||
    holderCount > 0;

  if (!hasIndexedMarketData) {
    return {
      total: 0,
      liquidityStability: 0,
      holderDistribution: 0,
      organicVolume: 0,
      lowBotActivity: 0,
      marketCapSustainability: 0,
      explanation:
        "Awaiting indexed market data. Health remains 0/100 until real trading, holder, liquidity, and proof data exist.",
    };
  }

  const liquidityStability = clamp((liquidityUsd / 100_000) * 20, 0, 20);
  const holderDistribution =
    topHolderConcentration > 0
      ? clamp(20 - (topHolderConcentration / 100) * 20, 0, 20)
      : 0;
  const organicVolume =
    tradeCount > 0 || buyCount > 0 || sellCount > 0
      ? clamp(20 - suspiciousVolumeRatio * 100, 0, 20)
      : 0;
  const lowBotActivity =
    tradeCount > 0 || buyCount > 0 || sellCount > 0
      ? clamp(20 - sniperScore * 60, 0, 20)
      : 0;
  const marketCapSustainability = clamp((uniqueBuyers / PUMP_TARGET_UNIQUE_BUYERS_STAGE_THREE) * 20, 0, 20);

  const total = Math.round(
    liquidityStability +
      holderDistribution +
      organicVolume +
      lowBotActivity +
      marketCapSustainability,
  );

  return {
    total,
    liquidityStability: Math.round(liquidityStability),
    holderDistribution: Math.round(holderDistribution),
    organicVolume: Math.round(organicVolume),
    lowBotActivity: Math.round(lowBotActivity),
    marketCapSustainability: Math.round(marketCapSustainability),
    explanation:
      riskFlags.length > 0
        ? "Market health is being reduced by detected risk flags."
        : "Market health is based on real indexed market activity and proof data.",
  };
}

function rewardEligibility(input: {
  input: PumpLifecycleInput;
  stage: "stage_one" | "stage_two" | "stage_three";
  marketCapTarget: number;
  minUniqueBuyers: number;
  minSustainDays: number;
  minTradeCount?: number;
  riskFlags: PumpRiskFlag[];
  alreadyPaid: boolean;
}): { eligible: boolean; blocked: boolean; reason: string } {
  const marketCapUsd = num(input.input.marketCapUsd);
  const sustainDays =
    input.stage === "stage_one"
      ? num(input.input.marketCapSustainDays250k)
      : input.stage === "stage_two"
        ? num(input.input.marketCapSustainDays500k)
        : num(input.input.marketCapSustainDays1m);

  if (input.alreadyPaid) {
    return {
      eligible: false,
      blocked: false,
      reason: "Reward stage has already been paid.",
    };
  }

  if (!input.input.liquiditySeeded || !input.input.lpBurnedOrDeadWalleted) {
    return {
      eligible: false,
      blocked: true,
      reason: "Reward locked until protocol LP seed and LP proof are complete.",
    };
  }

  if (marketCapUsd < input.marketCapTarget) {
    return {
      eligible: false,
      blocked: false,
      reason: `Market cap has not reached ${input.marketCapTarget.toLocaleString()} USD.`,
    };
  }

  if (sustainDays < input.minSustainDays) {
    return {
      eligible: false,
      blocked: false,
      reason: `Market cap must sustain for ${input.minSustainDays} days.`,
    };
  }

  if (input.minTradeCount && num(input.input.tradeCount) < input.minTradeCount) {
    return {
      eligible: false,
      blocked: false,
      reason: `Swap threshold is not met. Required: ${input.minTradeCount.toLocaleString()} swaps.`,
    };
  }

  if (num(input.input.uniqueBuyers) < input.minUniqueBuyers) {
    return {
      eligible: false,
      blocked: false,
      reason: `Organic buyer threshold is not met. Required: ${input.minUniqueBuyers.toLocaleString()} unique buyers.`,
    };
  }

  const blockingFlags: PumpRiskFlag[] = [
    "wash_trading_suspected",
    "wallet_cluster_concentration",
    "creator_self_buy_suspected",
    "holder_concentration_high",
    "lp_burn_not_confirmed",
    "indexer_data_incomplete",
  ];

  const activeBlockingFlags = input.riskFlags.filter((flag) =>
    blockingFlags.includes(flag),
  );

  if (activeBlockingFlags.length > 0) {
    return {
      eligible: false,
      blocked: true,
      reason: `Reward blocked by risk flags: ${activeBlockingFlags.join(", ")}.`,
    };
  }

  return {
    eligible: true,
    blocked: false,
    reason: "Reward stage is eligible based on current indexed sustainability metrics.",
  };
}

function getBondingCurveTradingStatus(input: PumpLifecycleInput):
  | "not_live"
  | "awaiting_first_trade"
  | "active_trading"
  | "graduation_threshold_reached" {
  if (!input.bondingCurveLive) return "not_live";
  if (input.graduationThresholdReached) return "graduation_threshold_reached";

  const raised = num(input.bondingCurveRaisedStableEquivalent);
  const progress = num(input.bondingCurveProgressPercent);

  if (raised <= 0 && progress <= 0) return "awaiting_first_trade";

  return "active_trading";
}

export function getPumpLifecycleIntelligence(
  input: PumpLifecycleInput = {},
): PumpLifecycleResult {
  const stage = determineStage(input);
  const phase = determinePhase(stage);

  const seed = num(
    input.liquiditySeedStableEquivalent,
    PUMP_DEFAULT_GRADUATION_SEED_STABLE_EQUIVALENT,
  );

  const raised = num(input.bondingCurveRaisedStableEquivalent);
  const graduationTarget = PUMP_DEFAULT_GRADUATION_TARGET_STABLE_EQUIVALENT;
  const remainingToGraduation = Math.max(graduationTarget - raised, 0);
  const remainingAfterSeed = Math.max(raised - seed, 0);
  const totalConfiguredRewardPercent =
    PUMP_REWARD_STAGE_ONE_PERCENT +
    PUMP_REWARD_STAGE_TWO_PERCENT +
    PUMP_REWARD_STAGE_THREE_PERCENT;
  const creatorRewardReserve =
    remainingAfterSeed * (totalConfiguredRewardPercent / 100);
  const ecosystemDevelopmentReserve = Math.max(
    remainingAfterSeed - creatorRewardReserve,
    0,
  );

  const riskFlags = buildRiskFlags(input);
  const health = calculateHealthScore(input, riskFlags);

  const stageOneCheck = rewardEligibility({
    input,
    stage: "stage_one",
    marketCapTarget: PUMP_REWARD_STAGE_ONE_MARKET_CAP_USD,
    minUniqueBuyers: PUMP_MIN_UNIQUE_BUYERS_STAGE_ONE,
    minSustainDays: PUMP_REWARD_STAGE_ONE_SUSTAIN_DAYS,
    riskFlags,
    alreadyPaid: Boolean(input.rewardStageOnePaid),
  });

  const stageTwoCheck = rewardEligibility({
    input,
    stage: "stage_two",
    marketCapTarget: PUMP_REWARD_STAGE_TWO_MARKET_CAP_USD,
    minUniqueBuyers: PUMP_MIN_UNIQUE_BUYERS_STAGE_TWO,
    minSustainDays: PUMP_REWARD_STAGE_TWO_SUSTAIN_DAYS,
    riskFlags,
    alreadyPaid: Boolean(input.rewardStageTwoPaid),
  });

  const stageThreeCheck = rewardEligibility({
    input,
    stage: "stage_three",
    marketCapTarget: PUMP_REWARD_STAGE_THREE_MARKET_CAP_USD,
    minUniqueBuyers: PUMP_MIN_UNIQUE_BUYERS_STAGE_THREE,
    minSustainDays: PUMP_REWARD_STAGE_TWO_SUSTAIN_DAYS,
    minTradeCount: PUMP_REWARD_STAGE_THREE_MIN_SWAPS,
    riskFlags,
    alreadyPaid: Boolean(input.rewardStageThreePaid),
  });

  const rewards: PumpRewardStage[] = [
    {
      id: "stage_one",
      label: "Stage 1 Creator Reward",
      milestoneMarketCapUsd: PUMP_REWARD_STAGE_ONE_MARKET_CAP_USD,
      sustainDays: PUMP_REWARD_STAGE_ONE_SUSTAIN_DAYS,
      rewardPercentOfRemainingFunds: PUMP_REWARD_STAGE_ONE_PERCENT,
      payoutAsset: "hybrid",
      stableWeightPercent: PUMP_REWARD_STABLE_WEIGHT_PERCENT,
      rioWeightPercent: PUMP_REWARD_RIO_WEIGHT_PERCENT,
      eligible: stageOneCheck.eligible,
      paid: Boolean(input.rewardStageOnePaid),
      blocked: stageOneCheck.blocked,
      reason: "250K RUSD-equivalent market cap, 3-day sustainability, 200–250 organic buyers, LP proof, and risk checks required.",
    },
    {
      id: "stage_two",
      label: "Stage 2 Creator Reward",
      milestoneMarketCapUsd: PUMP_REWARD_STAGE_TWO_MARKET_CAP_USD,
      sustainDays: PUMP_REWARD_STAGE_TWO_SUSTAIN_DAYS,
      rewardPercentOfRemainingFunds: PUMP_REWARD_STAGE_TWO_PERCENT,
      payoutAsset: "hybrid",
      stableWeightPercent: PUMP_REWARD_STABLE_WEIGHT_PERCENT,
      rioWeightPercent: PUMP_REWARD_RIO_WEIGHT_PERCENT,
      eligible: stageTwoCheck.eligible,
      paid: Boolean(input.rewardStageTwoPaid),
      blocked: stageTwoCheck.blocked,
      reason: "500K RUSD-equivalent market cap, 4-day sustainability, 250–400 organic buyers, LP proof, and risk checks required.",
    },
    {
      id: "stage_three",
      label: "Stage 3 Creator Reward",
      milestoneMarketCapUsd: PUMP_REWARD_STAGE_THREE_MARKET_CAP_USD,
      sustainDays: PUMP_REWARD_STAGE_TWO_SUSTAIN_DAYS,
      rewardPercentOfRemainingFunds: PUMP_REWARD_STAGE_THREE_PERCENT,
      payoutAsset: "hybrid",
      stableWeightPercent: PUMP_REWARD_STABLE_WEIGHT_PERCENT,
      rioWeightPercent: PUMP_REWARD_RIO_WEIGHT_PERCENT,
      eligible: stageThreeCheck.eligible,
      paid: Boolean(input.rewardStageThreePaid),
      blocked: stageThreeCheck.blocked,
      reason: "1M RUSD-equivalent market cap, around 1,000 swaps, 600–1,000 organic buyers, LP proof, and strict risk checks required.",
    },
  ];

  const titleByStage: Record<PumpLifecycleStage, string> = {
    draft: "Pump Draft",
    bonding_curve_live: "Bonding Curve Live",
    bonding_curve_threshold_reached: "Bonding Curve Threshold Reached",
    graduation_pending: "Graduation Pending",
    graduated_liquidity_seeded: "Graduation Liquidity Seeded",
    lp_burned: "Protocol LP Burned",
    market_live: "Market Live",
    reward_tracking: "Creator Reward Tracking",
    reward_stage_one_eligible: "Stage 1 Reward Eligible",
    reward_stage_one_paid: "Stage 1 Reward Paid",
    reward_stage_two_eligible: "Stage 2 Reward Eligible",
    reward_stage_two_paid: "Stage 2 Reward Paid",
    reward_stage_three_eligible: "Stage 3 Reward Eligible",
    reward_stage_three_paid: "Stage 3 Reward Paid",
    reward_blocked: "Creator Reward Blocked",
  };

  const nextAction =
    phase === "bonding_curve"
      ? {
          label: "Continue Bonding Curve",
          disabled: false,
          reason: "The token is still in the bonding curve lifecycle.",
        }
      : phase === "graduation"
        ? {
            label: input.liquiditySeeded ? "Verify LP Burn" : "Prepare Graduation Seed",
            disabled: false,
            reason:
              "Graduation requires protocol liquidity seed and LP burn/dead-wallet proof.",
          }
        : rewards.some((reward) => reward.eligible)
          ? {
              label: "Prepare Creator Reward Payout",
              disabled: false,
              reason:
                "At least one creator reward stage is eligible based on indexed metrics.",
            }
          : {
              label: "Continue Reward Tracking",
              disabled: false,
              reason:
                "Creator reward is still tracking market sustainability and risk conditions.",
            };

  return {
    phase,
    stage,
    title: titleByStage[stage],
    subtitle:
      "Pump lifecycle intelligence tracks bonding curve progress, graduation liquidity, LP burn proof, market health, and creator reward eligibility.",

    bondingCurve: {
      live: Boolean(input.bondingCurveLive),
      tradingStatus: getBondingCurveTradingStatus(input),
      progressPercent: clamp(num(input.bondingCurveProgressPercent)),
      raisedStableEquivalent: raised,
      graduationTargetStableEquivalent: graduationTarget,
      remainingToGraduationStableEquivalent: remainingToGraduation,
      tradeCount: Math.max(0, Math.round(num(input.tradeCount))),
      buyCount: Math.max(0, Math.round(num(input.buyCount))),
      sellCount: Math.max(0, Math.round(num(input.sellCount))),
      uniqueBuyers: Math.max(0, Math.round(num(input.uniqueBuyers))),
      graduationThresholdReached: Boolean(input.graduationThresholdReached),
      explanation:
        "Bonding curve metrics should come from indexed buy/sell activity and curve state.",
    },

    graduation: {
      pending:
        stage === "graduation_pending" ||
        stage === "bonding_curve_threshold_reached",
      liquiditySeeded: Boolean(input.liquiditySeeded),
      liquiditySeedStableEquivalent: seed,
      lpBurnedOrDeadWalleted: Boolean(input.lpBurnedOrDeadWalleted),
      explanation:
        "Graduation uses protocol-seeded liquidity, then requires LP burn/dead-wallet proof before market integrity is complete.",
    },

    rewards: {
      rewardPoolBaseStableEquivalent: remainingAfterSeed,
      remainingAfterSeedStableEquivalent: remainingAfterSeed,
      creatorRewardReserveStableEquivalent: creatorRewardReserve,
      ecosystemDevelopmentReserveStableEquivalent: ecosystemDevelopmentReserve,
      totalConfiguredRewardPercent,
      stages: rewards,
      explanation:
        "Creator rewards are calculated from funds remaining after protocol LP seed. Reward payout is 80% stable asset and 20% RIO. No reward unlocks before LP seed/proof, market sustainability, organic buyer thresholds, and anti-manipulation checks. The remaining ecosystem development reserve supports protocol sustainability, liquidity operations, analytics, safety systems, market infrastructure, and ecosystem growth.",
    },

    health,
    riskFlags,
    indexerRequirements: [
      "bonding_curve_trades",
      "graduation_event",
      "pool_reserves",
      "lp_mint_event",
      "lp_burn_or_dead_wallet_transfer",
      "holder_balances",
      "swap_volume",
      "market_cap_snapshots",
      "unique_buyer_counts",
      "wallet_cluster_analysis",
      "creator_linked_wallet_analysis",
      "reward_payout_events",
    ],

    nextAction,

    creatorFacingExplanation:
      "Creator rewards are not automatic at graduation. They unlock only after market cap, duration, organic buyer, LP proof, and anti-manipulation checks pass.",

    publicFacingExplanation:
      "This Pump market is evaluated through indexed lifecycle data, including bonding curve activity, graduation liquidity, LP burn proof, market health, and manipulation risk.",
  };
}
