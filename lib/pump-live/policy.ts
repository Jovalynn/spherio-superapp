import { SPHERIO_TREASURY_MULTISIG } from "@/lib/protocol/treasury";
export const PUMP_LIVE_POLICY_VERSION = "pump_live_v1";

export const PUMP_LIVE_POLICY = {
  version: PUMP_LIVE_POLICY_VERSION,
  product: "pump.live",
  network: {
    chainId: "spherio-1",
    settlementDenom: "urio",
    feeDenom: "urio",
    displayReferenceAsset: "RUSD",
    feesPaidIn: "RIO",
    feesDisplayedIn: "RUSD-equivalent"
  },
  supply: {
    displayTotalSupply: "1000000000",
    maxSupplyBaseUnits: "1000000000000000",
    decimals: 6,
    bondingAllocationTokens: "800000000",
    bondingAllocationBaseUnits: "800000000000000",
    graduationLiquidityTokens: "200000000",
    graduationLiquidityBaseUnits: "200000000000000",
    creatorAllocationDefaultBps: 0,
    protocolAllocationDefaultBps: 0
  },
  fees: {
    feeAsset: "urio",
    displayDenomination: "RUSD",
    buyFeeBps: 100,
    sellFeeBps: 100,
    protocolFeeRecipient: SPHERIO_TREASURY_MULTISIG,
    creatorFeeBps: 0,
    creatorFeeRecipient: null
  },
  graduation: {
    enabled: true,
    initialStatus: "bonding",
    stateMachine: ["bonding", "graduating", "graduated"],
    triggerType: "market_cap_or_reserve",
    targetMarketCapRusd: "65000.000000",
    graduationQuoteValueRusd: "15000.000000",
    targetCurveRioReserveRusd: "15000.000000",
    seedQuoteAsset: "urio",
    oraclePair: "RIO/RUSD",
    requiresOracleQuote: true,
    autoCreateRioDexPair: true,
    rioDexFactory: "rio1nkp9nq5uval4uguef0hgea28sedmzs8vxhu6xqz890ddsxywm3eqsuyvu0",
    postGraduationTradingSurface: "riodex",
    postGraduationCurveDisabled: true
  },
  liquiditySeeding: {
    enabled: true,
    seedSource: "bonding_curve_reserve",
    seedQuoteAsset: "urio",
    seedQuoteValueRusd: "15000.000000",
    reservedTokenLiquidityBaseUnits: "200000000000000",
    lockLpTokens: true,
    lpOwner: "protocol_locked",
    lpLockDurationSeconds: 31536000,
    lpLockDurationLabel: "1 year"
  },
  creatorIncentives: {
    enabled: true,
    rewardSource: "graduation_surplus_only",
    rewardThresholdUnit: "RIO market cap measured as RUSD-equivalent via RIO/RUSD valuation",
    payoutSettlement: "80% stable/RUSD-equivalent value and 20% RIO",
    neverFromRequiredLiquidity: true,
    requiresLpSeedProof: true,
    requiresAntiAbuseClearance: true,
    instantPostGraduationPayoutAllowed: false,
    baseRewardBps: 500,
    milestoneRewards: [
      {
        name: "market_cap_250k",
        conditionType: "rio_market_cap_rusd_equivalent",
        thresholdRusdEquivalent: "250000.000000",
        rewardBps: 250,
        sustainDays: 3,
        organicBuyersMin: 200,
        organicBuyersTarget: 250,
        requiresLpSeedProof: true,
        requiresAntiAbuseClearance: true
      },
      {
        name: "market_cap_500k",
        conditionType: "rio_market_cap_rusd_equivalent",
        thresholdRusdEquivalent: "500000.000000",
        rewardBps: 250,
        sustainDays: 4,
        organicBuyersMin: 250,
        organicBuyersTarget: 400,
        requiresLpSeedProof: true,
        requiresAntiAbuseClearance: true
      },
      {
        name: "market_cap_1m",
        conditionType: "rio_market_cap_rusd_equivalent",
        thresholdRusdEquivalent: "1000000.000000",
        rewardBps: 250,
        rewardPercent: 2.5,
        sustainDays: 4,
        requiredSwaps: 1000,
        organicBuyersMin: 600,
        organicBuyersTarget: 1000,
        requiresLpSeedProof: true,
        requiresAntiAbuseClearance: true
      }
    ],
    maxTotalCreatorRewardBps: 1000,
    vesting: {
      enabled: true,
      immediateReleaseBps: 5000,
      delayedReleaseBps: 5000,
      delayedReleaseSeconds: 604800,
      delayedReleaseLabel: "7 days",
      forfeitIfEmergencyFlagged: true
    }
  },
  userIncentives: {
    enabled: true,
    type: "voluntary_lock_rewards",
    rewardAccounting: "points_first",
    nonLockingUsers: {
      canTradeNormally: true,
      penaltyEnabled: false
    },
    lockOptions: [
      {
        lockPeriodSeconds: 604800,
        label: "7 days",
        pointsMultiplierBps: 10500,
        multiplier: "1.05x"
      },
      {
        lockPeriodSeconds: 1209600,
        label: "14 days",
        pointsMultiplierBps: 11500,
        multiplier: "1.15x"
      },
      {
        lockPeriodSeconds: 2592000,
        label: "30 days",
        pointsMultiplierBps: 13500,
        multiplier: "1.35x"
      },
      {
        lockPeriodSeconds: 7776000,
        label: "90 days",
        pointsMultiplierBps: 17500,
        multiplier: "1.75x"
      }
    ],
    possibleRewards: [
      "pump_live_points",
      "fee_rebates",
      "holder_badges",
      "future_launch_eligibility",
      "creator_campaign_rewards"
    ]
  },
  safetyControls: {
    antiSniper: {
      enabled: true,
      launchProtectionBlocks: 10,
      maxBuyPerTxDuringLaunchTokens: "1000000",
      maxWalletDuringLaunchTokens: "5000000",
      sameBlockSellBlocked: true,
      oneTradePerWalletPerBlock: true
    },
    bulkBuyProtection: {
      enabled: true,
      rollingWindowSeconds: 600,
      maxWalletAccumulationDuringWindowTokens: "10000000",
      repeatedBuyCooldownSeconds: 5
    },
    mevProtection: {
      enabled: true,
      requiredSlippageBps: true,
      defaultMaxSlippageBps: 500,
      maxPriceImpactBps: 1000,
      sameBlockBuySellBlocked: true,
      commitRevealForLargeBuys: {
        enabled: false,
        futureUpgrade: true
      }
    },
    antiRug: {
      enabled: true,
      requiredLiquiditySeedFirst: true,
      lpLockRequired: true,
      lpLockDurationSeconds: 31536000,
      creatorRewardVestingRequired: true,
      ownerCanWithdrawRequiredLiquidity: false,
      ownerCanMintAfterLaunch: false,
      ownerCanChangeFeesAfterLaunch: false,
      ownerCanDisableSells: false,
      emergencyPause: {
        enabled: true,
        allowedOnlyForExploitResponse: true,
        requiresPublicReason: true
      }
    }
  },
  disclosures: {
    launcherWarning: true,
    noGuaranteeWarning: true,
    liquidityLockStatus: true,
    creatorAllocation: true,
    feeBreakdown: true,
    surplusPolicy: true,
    userLockRewards: true,
    safetyControls: true
  }
} as const;

export type PumpLivePolicy = typeof PUMP_LIVE_POLICY;

export function getPumpLivePolicy(): PumpLivePolicy {
  return PUMP_LIVE_POLICY;
}
