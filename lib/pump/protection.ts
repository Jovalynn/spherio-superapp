export type PumpProtectionInput = {
  tokenAddress: string;
  symbol: string;
  launchRail?: "pump.live";
  maxWalletPercent?: number;
  maxTxPercent?: number;
  cooldownSeconds?: number;
  earlyPhaseBlocks?: number;
  sniperTaxBps?: number;
  botRiskScore?: number;
  mevRiskScore?: number;
  creatorLockedLiquidityPercent?: number;
  creatorCanRemoveLiquidity?: boolean;
  poolVerified?: boolean;
  renouncedMint?: boolean;
  upgradeabilityRestricted?: boolean;
};

export type PumpProtectionState = {
  tokenAddress: string;
  symbol: string;
  launchRail: "pump.live";
  controls: {
    maxWalletPercent: number;
    maxTxPercent: number;
    cooldownSeconds: number;
    earlyPhaseBlocks: number;
    sniperTaxBps: number;
  };
  risk: {
    botRiskScore: number;
    mevRiskScore: number;
    integrityScore: number;
  };
  liquidity: {
    creatorLockedLiquidityPercent: number;
    creatorCanRemoveLiquidity: boolean;
    poolVerified: boolean;
  };
  issuer: {
    renouncedMint: boolean;
    upgradeabilityRestricted: boolean;
  };
  status: {
    antiSniperEnabled: boolean;
    antiBotMonitoringEnabled: boolean;
    mevProtectionRequired: boolean;
    antiRugProtected: boolean;
    launchIntegrityReady: boolean;
  };
  narrative: {
    summary: string;
    nextAction: string;
  };
};

export type PumpTradeProtectionEvaluation = {
  blocked: boolean;
  messages: string[];
  warnings: string[];
  enforcement: {
    antiSniperHardBlock: boolean;
    antiBotHardBlock: boolean;
    priceImpactHardBlock: boolean;
    antiRugWarning: boolean;
    launchIntegrityWarning: boolean;
    mevWarning: boolean;
  };
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function getDefaultPumpProtectionInput(
  params: Pick<PumpProtectionInput, "tokenAddress" | "symbol">,
): PumpProtectionInput {
  return {
    tokenAddress: params.tokenAddress,
    symbol: params.symbol,
    launchRail: "pump.live",
    maxWalletPercent: 2,
    maxTxPercent: 1,
    cooldownSeconds: 15,
    earlyPhaseBlocks: 50,
    sniperTaxBps: 800,
    botRiskScore: 30,
    mevRiskScore: 35,
    creatorLockedLiquidityPercent: 85,
    creatorCanRemoveLiquidity: false,
    poolVerified: false,
    renouncedMint: false,
    upgradeabilityRestricted: true,
  };
}

export function buildPumpProtectionState(
  input: PumpProtectionInput,
): PumpProtectionState {
  const maxWalletPercent = clamp(input.maxWalletPercent ?? 2, 0.1, 100);
  const maxTxPercent = clamp(input.maxTxPercent ?? 1, 0.05, 100);
  const cooldownSeconds = clamp(input.cooldownSeconds ?? 15, 0, 3600);
  const earlyPhaseBlocks = clamp(input.earlyPhaseBlocks ?? 50, 0, 100000);
  const sniperTaxBps = clamp(input.sniperTaxBps ?? 800, 0, 5000);

  const botRiskScore = clamp(input.botRiskScore ?? 30, 0, 100);
  const mevRiskScore = clamp(input.mevRiskScore ?? 35, 0, 100);

  const creatorLockedLiquidityPercent = clamp(
    input.creatorLockedLiquidityPercent ?? 85,
    0,
    100,
  );
  const creatorCanRemoveLiquidity = input.creatorCanRemoveLiquidity ?? false;
  const poolVerified = input.poolVerified ?? false;
  const renouncedMint = input.renouncedMint ?? false;
  const upgradeabilityRestricted = input.upgradeabilityRestricted ?? true;

  const antiSniperEnabled =
    maxWalletPercent <= 5 &&
    maxTxPercent <= 2 &&
    cooldownSeconds >= 5 &&
    earlyPhaseBlocks > 0;

  const antiBotMonitoringEnabled = botRiskScore <= 60;
  const mevProtectionRequired = mevRiskScore >= 25;

  const antiRugProtected =
    creatorLockedLiquidityPercent >= 80 &&
    !creatorCanRemoveLiquidity &&
    poolVerified;

  let integrityScore =
    (antiSniperEnabled ? 25 : 8) +
    (antiBotMonitoringEnabled ? 15 : 5) +
    (mevProtectionRequired ? 15 : 8) +
    (antiRugProtected ? 30 : 10) +
    (renouncedMint ? 8 : 3) +
    (upgradeabilityRestricted ? 7 : 2);

  integrityScore = clamp(integrityScore, 0, 100);

  const launchIntegrityReady =
    antiSniperEnabled &&
    antiBotMonitoringEnabled &&
    antiRugProtected &&
    upgradeabilityRestricted;

  let summary =
    "Pump launch has baseline protections but still needs stronger launch-integrity controls.";
  let nextAction =
    "Tighten wallet and transaction caps, verify the pool, and ensure liquidity removal is restricted.";

  if (launchIntegrityReady) {
    summary =
      "Pump launch is operating with strong anti-sniper, anti-rug, and launch-integrity protections.";
    nextAction =
      "Maintain monitoring, enforce fair-launch rules, and proceed toward graduation with verified liquidity controls.";
  } else if (integrityScore >= 70) {
    summary =
      "Pump launch protections are strong, but one or two launch-integrity controls still need to be finalized.";
    nextAction =
      "Finalize pool verification and confirm issuer/liquidity restrictions before scaling market exposure.";
  }

  return {
    tokenAddress: input.tokenAddress,
    symbol: input.symbol,
    launchRail: input.launchRail ?? "pump.live",
    controls: {
      maxWalletPercent: round2(maxWalletPercent),
      maxTxPercent: round2(maxTxPercent),
      cooldownSeconds: Math.round(cooldownSeconds),
      earlyPhaseBlocks: Math.round(earlyPhaseBlocks),
      sniperTaxBps: Math.round(sniperTaxBps),
    },
    risk: {
      botRiskScore: round2(botRiskScore),
      mevRiskScore: round2(mevRiskScore),
      integrityScore: round2(integrityScore),
    },
    liquidity: {
      creatorLockedLiquidityPercent: round2(creatorLockedLiquidityPercent),
      creatorCanRemoveLiquidity,
      poolVerified,
    },
    issuer: {
      renouncedMint,
      upgradeabilityRestricted,
    },
    status: {
      antiSniperEnabled,
      antiBotMonitoringEnabled,
      mevProtectionRequired,
      antiRugProtected,
      launchIntegrityReady,
    },
    narrative: {
      summary,
      nextAction,
    },
  };
}

export function evaluatePumpTradeProtection(params: {
  protection: PumpProtectionState;
  priceImpactBps: number;
  maxPriceImpactBps: number;
}): PumpTradeProtectionEvaluation {
  const { protection, priceImpactBps, maxPriceImpactBps } = params;

  const messages: string[] = [];
  const warnings: string[] = [];

  const antiSniperHardBlock = !protection.status.antiSniperEnabled;
  const antiBotHardBlock = !protection.status.antiBotMonitoringEnabled;
  const priceImpactHardBlock = Math.abs(priceImpactBps) > maxPriceImpactBps;

  const antiRugWarning = !protection.status.antiRugProtected;
  const launchIntegrityWarning = !protection.status.launchIntegrityReady;
  const mevWarning = protection.status.mevProtectionRequired;

  if (antiSniperHardBlock) {
    messages.push("Protection hard block: anti-sniper controls are not active.");
  }

  if (antiBotHardBlock) {
    messages.push("Protection hard block: bot-risk posture is above allowed threshold.");
  }

  if (priceImpactHardBlock) {
    messages.push(
      `Protection hard block: price impact ${round2(Math.abs(priceImpactBps))} bps exceeds max ${round2(maxPriceImpactBps)} bps.`,
    );
  }

  if (antiRugWarning) {
    warnings.push("Protection warning: anti-rug posture is not fully verified yet.");
  }

  if (launchIntegrityWarning) {
    warnings.push("Protection warning: launch-integrity readiness is not fully complete yet.");
  }

  if (mevWarning) {
    warnings.push("Protection warning: MEV protection monitoring remains required.");
  }

  return {
    blocked: antiSniperHardBlock || antiBotHardBlock || priceImpactHardBlock,
    messages,
    warnings,
    enforcement: {
      antiSniperHardBlock,
      antiBotHardBlock,
      priceImpactHardBlock,
      antiRugWarning,
      launchIntegrityWarning,
      mevWarning,
    },
  };
}
