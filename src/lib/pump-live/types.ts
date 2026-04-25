export type PumpLiveStatus = "bonding" | "graduating" | "graduated" | "failed";

export type PumpLiveRoute = "pump_live" | "riodex";

export type PumpLiveAmount = {
  display?: string;
  baseUnits?: string;
  denom?: string;
};

export type PumpLiveTokenSummary = {
  tokenAddress: string;
  name?: string;
  symbol?: string;
  logoUri?: string | null;
  creator?: string | null;
  status: PumpLiveStatus;
  route: PumpLiveRoute;
  riodexPairAddress?: string | null;
  createdTxHash?: string | null;
  createdBlockHeight?: number | null;
};

export type PumpLiveGraduationState = {
  enabled: boolean;
  status: PumpLiveStatus;
  targetMarketCapRusd: string;
  targetCurveRioReserveRusd: string;
  graduationQuoteValueRusd: string;
  graduationQuoteAsset: "urio";
  pairQuoteDisplayAsset: "RUSD";
  autoCreateRioDexPair: boolean;
  rioDexFactory: string;
  postGraduationCurveDisabled: boolean;
  postGraduationTradingSurface: "riodex";
  liquiditySeeded: boolean;
  lpLocked: boolean;
  lpLockDurationSeconds: number;
  lpOwner: "protocol_locked";
  pairAddress?: string | null;
  reserveValueRusd?: string | null;
  marketCapRusd?: string | null;
  seededTokenAmount?: string | null;
  seededUrioAmount?: string | null;
};

export type PumpLiveCreatorIncentives = {
  enabled: boolean;
  rewardSource: "graduation_surplus_only";
  neverFromRequiredLiquidity: boolean;
  baseRewardBps: number;
  milestoneRewards: Array<{
    name: string;
    conditionType: "market_cap_rusd";
    thresholdRusd: string;
    rewardBps: number;
    achieved?: boolean;
  }>;
  maxTotalCreatorRewardBps: number;
  vesting: {
    enabled: boolean;
    immediateReleaseBps: number;
    delayedReleaseBps: number;
    delayedReleaseSeconds: number;
    forfeitIfEmergencyFlagged: boolean;
  };
  rewardStatus?: "none" | "vesting" | "vested" | "claimed" | "forfeited";
  surplusUrio?: string | null;
  creatorRewardUrio?: string | null;
  vestedImmediateUrio?: string | null;
  vestedDelayedUrio?: string | null;
  unlockTime?: string | null;
};

export type PumpLiveUserLockOption = {
  lockPeriodSeconds: number;
  label: string;
  pointsMultiplierBps: number;
};

export type PumpLiveUserIncentives = {
  enabled: boolean;
  type: "voluntary_lock_rewards";
  rewardAccounting: "points_first";
  lockOptions: PumpLiveUserLockOption[];
  nonLockingUsers: {
    canTradeNormally: boolean;
    penaltyEnabled: boolean;
  };
  possibleRewards: string[];
};

export type PumpLiveSafetyControls = {
  antiSniper: {
    enabled: boolean;
    launchProtectionBlocks: number;
    maxBuyPerTxDuringLaunch: PumpLiveAmount;
    maxWalletDuringLaunch: PumpLiveAmount;
    sameBlockSellBlocked: boolean;
    oneTradePerWalletPerBlock: boolean;
  };
  bulkBuyProtection: {
    enabled: boolean;
    rollingWindowSeconds: number;
    maxWalletAccumulationDuringWindow: PumpLiveAmount;
    repeatedBuyCooldownSeconds: number;
  };
  mevProtection: {
    enabled: boolean;
    requiredSlippageBps: boolean;
    defaultMaxSlippageBps: number;
    maxPriceImpactBps: number;
    sameBlockBuySellBlocked: boolean;
    commitRevealForLargeBuys: {
      enabled: boolean;
      futureUpgrade: boolean;
    };
  };
  antiRug: {
    enabled: boolean;
    creatorAllocationDefaultBps: number;
    requiredLiquiditySeedFirst: boolean;
    lpLockRequired: boolean;
    lpLockDurationSeconds: number;
    creatorRewardVestingRequired: boolean;
    ownerCanWithdrawRequiredLiquidity: boolean;
    ownerCanMintAfterLaunch: boolean;
    ownerCanChangeFeesAfterLaunch: boolean;
    ownerCanDisableSells: boolean;
    emergencyPause: {
      enabled: boolean;
      allowedOnlyForExploitResponse: boolean;
      requiresPublicReason: boolean;
    };
  };
};

export type PumpLiveDisclosureFlags = {
  showLauncherWarning: boolean;
  showNoGuaranteeWarning: boolean;
  showLiquidityLockStatus: boolean;
  showCreatorAllocation: boolean;
  showFeeBreakdown: boolean;
  showSurplusPolicy: boolean;
  showUserLockRewards: boolean;
  showSafetyControls: boolean;
};

export type PumpLiveMarketView = {
  token: PumpLiveTokenSummary;
  graduation: PumpLiveGraduationState;
  creatorIncentives: PumpLiveCreatorIncentives;
  userIncentives: PumpLiveUserIncentives;
  safetyControls: PumpLiveSafetyControls;
  disclosures: PumpLiveDisclosureFlags;
};

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function formatSecondsAsDays(seconds: number): string {
  const days = seconds / 86400;
  if (Number.isInteger(days)) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${days.toFixed(2)} days`;
}

export function isPumpLiveGraduated(status: PumpLiveStatus): boolean {
  return status === "graduated";
}

export function getPumpLiveRouteLabel(route: PumpLiveRoute): string {
  if (route === "riodex") return "RioDex";
  return "Pump.live";
}

export function getPumpLiveStatusLabel(status: PumpLiveStatus): string {
  switch (status) {
    case "bonding":
      return "Bonding";
    case "graduating":
      return "Graduating";
    case "graduated":
      return "Graduated";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}


/**
 * Compatibility types for Pump.live UI panels.
 * These flat fields support the current UI components while the richer
 * canonical model remains PumpLiveMarketView.
 */
export type PumpLivePanelLockOption = PumpLiveUserLockOption & {
  seconds: number;
  multiplier: string;
};

export type PumpLivePanelCreatorReward = {
  baseRewardPct: number;
  milestone250kPct: number;
  milestone500kPct: number;
  maxRewardPct: number;
  vestingLabel: string;
};

export type PumpLivePanelSafety = {
  antiSniper: boolean;
  launchProtectionBlocks: number;
  bulkBuyProtection: boolean;
  maxWalletLaunchTokens: string;
  mevProtection: boolean;
  antiRug: boolean;
  lpLockRequired: boolean;
};

export type PumpLiveMarket = PumpLiveMarketView & {
  status: PumpLiveStatus;
  graduationProgressPct: number;
  requiredGraduationRUSD: number;
  reserveValueRUSD: number;
  riodexPairAddress?: string | null;
  creatorReward: PumpLivePanelCreatorReward;
  userLocks: PumpLivePanelLockOption[];
  safety: PumpLivePanelSafety;
};
