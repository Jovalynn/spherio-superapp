import { getPumpEconomicsPolicy } from "@/lib/pump/economics";

export type PumpGraduationStage =
  | "momentum"
  | "watch"
  | "ready"
  | "graduated";

export type PumpGraduationInput = {
  tokenAddress: string;
  symbol: string;
  launchRail?: "pump.live";
  baseAsset?: "RIO";
  totalSupply?: string;

  holders?: number;
  watchers?: number;
  momentumScore?: number;
  communityScore?: number;

  liquidityCommittedRio?: number;
  realBaseReserveRio?: number;
  volume24hUsd?: number;
};

export type PumpGraduationState = {
  tokenAddress: string;
  symbol: string;
  launchRail: "pump.live";
  standard: "SPO-20";
  baseAsset: "RIO";

  stage: PumpGraduationStage;
  stageLabel: string;
  progressPercent: number;
  graduationReady: boolean;
  graduationTarget: "lp_activation";
  lpActivationReady: boolean;

  metrics: {
    holders: number;
    watchers: number;
    momentumScore: number;
    communityScore: number;
    liquidityCommittedRio: number;
    realBaseReserveRio: number;
    volume24hUsd: number;
  };

  requirements: {
    minHolders: number;
    minMomentumScore: number;
    graduationTargetUsd: number;
    graduationTargetUsdMin: number;
    graduationTargetUsdMax: number;
    lpTargetUsd: number;
    graduationTargetRio: number;
    graduationTargetRioMin: number;
    graduationTargetRioMax: number;
    lpTargetRio: number;
  };

  remaining: {
    holders: number;
    momentumScore: number;
    liquidityCommittedRio: number;
    realBaseReserveRio: number;
  };

  narrative: {
    summary: string;
    nextAction: string;
    lpActivationLabel: string;
  };
};

const DEFAULT_RIO_PRICE_USD = 1;

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildPumpGraduationState(
  input: PumpGraduationInput,
): PumpGraduationState {
  const economics = getPumpEconomicsPolicy();

  const holders = Math.max(0, input.holders ?? 0);
  const watchers = Math.max(0, input.watchers ?? 0);
  const momentumScore = Math.max(0, Math.min(100, input.momentumScore ?? 18));
  const communityScore = Math.max(0, Math.min(100, input.communityScore ?? 24));
  const liquidityCommittedRio = Math.max(0, input.liquidityCommittedRio ?? 0);
  const realBaseReserveRio = Math.max(0, input.realBaseReserveRio ?? 0);
  const volume24hUsd = Math.max(0, input.volume24hUsd ?? 0);

  const minHolders = economics.minHolders;
  const minMomentumScore = economics.minMomentumScore;

  const graduationTargetUsd = economics.graduationTargetUsd;
  const graduationTargetUsdMin = economics.graduationTargetUsdMin;
  const graduationTargetUsdMax = economics.graduationTargetUsdMax;
  const lpTargetUsd = economics.lpTargetUsd;

  const graduationTargetRio = graduationTargetUsd / DEFAULT_RIO_PRICE_USD;
  const graduationTargetRioMin = graduationTargetUsdMin / DEFAULT_RIO_PRICE_USD;
  const graduationTargetRioMax = graduationTargetUsdMax / DEFAULT_RIO_PRICE_USD;
  const lpTargetRio = lpTargetUsd / DEFAULT_RIO_PRICE_USD;

  const holderProgress = (holders / Math.max(minHolders, 1)) * 100;
  const momentumProgress = (momentumScore / Math.max(minMomentumScore, 1)) * 100;
  const reserveProgress = (realBaseReserveRio / Math.max(graduationTargetRio, 1)) * 100;

  const rawProgress = average([
    holderProgress,
    momentumProgress,
    reserveProgress,
  ]);

  const progressPercent = clampPercent(rawProgress);

  const graduationReady =
    holders >= minHolders &&
    momentumScore >= minMomentumScore &&
    realBaseReserveRio >= graduationTargetRioMin;

  const lpActivationReady =
    graduationReady && liquidityCommittedRio >= lpTargetRio;

  const remainingHolders = Math.max(0, minHolders - holders);
  const remainingMomentumScore = Math.max(0, minMomentumScore - momentumScore);
  const remainingLiquidityCommittedRio = Math.max(0, lpTargetRio - liquidityCommittedRio);
  const remainingRealBaseReserveRio = Math.max(0, graduationTargetRioMin - realBaseReserveRio);

  let stage: PumpGraduationStage = "momentum";
  let stageLabel = "Momentum";
  let summary =
    "Launch is building early attention but has not yet reached graduation posture.";
  let nextAction =
    "Continue building holder distribution, momentum, and on-curve reserve toward LP activation.";
  let lpActivationLabel = "LP not ready";

  if (progressPercent >= 35) {
    stage = "watch";
    stageLabel = "Watch";
    summary =
      "Launch is gaining traction and should be monitored closely for graduation readiness.";
    nextAction =
      "Improve holder count, strengthen momentum, and move reserve formation toward the graduation band.";
    lpActivationLabel = "LP monitoring";
  }

  if (progressPercent >= 70 || graduationReady) {
    stage = "ready";
    stageLabel = "Ready";
    summary =
      "Launch is approaching graduation posture and can prepare for LP activation handoff.";
    nextAction =
      "Confirm LP capital, finalize market handoff, and prepare Screener / Trade / RioEx activation.";
    lpActivationLabel = lpActivationReady ? "LP ready" : "LP staging";
  }

  if (graduationReady) {
    stage = "graduated";
    stageLabel = "Graduated";
    summary =
      "Launch has reached graduation readiness and can move into LP activation and market exposure.";
    nextAction =
      "Activate liquidity, open Screener and Trade surfaces, and surface the asset in RioEx.";
    lpActivationLabel = lpActivationReady ? "LP activation ready" : "LP capital pending";
  }

  return {
    tokenAddress: input.tokenAddress,
    symbol: input.symbol,
    launchRail: input.launchRail ?? "pump.live",
    standard: "SPO-20",
    baseAsset: input.baseAsset ?? "RIO",
    stage,
    stageLabel,
    progressPercent,
    graduationReady,
    graduationTarget: "lp_activation",
    lpActivationReady,
    metrics: {
      holders,
      watchers,
      momentumScore,
      communityScore,
      liquidityCommittedRio,
      realBaseReserveRio,
      volume24hUsd,
    },
    requirements: {
      minHolders,
      minMomentumScore,
      graduationTargetUsd,
      graduationTargetUsdMin,
      graduationTargetUsdMax,
      lpTargetUsd,
      graduationTargetRio,
      graduationTargetRioMin,
      graduationTargetRioMax,
      lpTargetRio,
    },
    remaining: {
      holders: remainingHolders,
      momentumScore: remainingMomentumScore,
      liquidityCommittedRio: remainingLiquidityCommittedRio,
      realBaseReserveRio: remainingRealBaseReserveRio,
    },
    narrative: {
      summary,
      nextAction,
      lpActivationLabel,
    },
  };
}
