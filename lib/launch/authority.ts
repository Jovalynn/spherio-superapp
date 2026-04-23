import {
  buildPumpProtectionState,
  getDefaultPumpProtectionInput,
} from "@/lib/pump/protection";
import { buildPumpGraduationState } from "@/lib/pump/graduation";
import { getPumpEconomicsPolicy } from "@/lib/pump/economics";

export type LaunchLifecycleStep =
  | "create"
  | "bonding_curve"
  | "auto_lp"
  | "lp"
  | "screener"
  | "trade"
  | "rioex"
  | "prime_upgrade"
  | "cmc_gecko";

export type LaunchRailType = "pump" | "prime";

export type LaunchCardAccent =
  | "aqua"
  | "sunset"
  | "violet"
  | "gold"
  | "mint"
  | "amber"
  | "slate"
  | "emerald";

export type LaunchCardTrend = "hot" | "watch" | "ready";

export type LaunchStepStatus = "complete" | "active" | "pending" | "optional";

export type LaunchCardState = {
  id: string;
  rail: LaunchRailType;
  tokenAddress: string;
  tokenName: string;
  symbol: string;
  logoUrl?: string;
  ageLabel: string;
  marketCapUsd: number;
  progressPercent: number;
  trend: LaunchCardTrend;
  accent: LaunchCardAccent;
};

export type LaunchLifecycleState = {
  rail: LaunchRailType;
  progressPercent: number;
  steps: {
    key: LaunchLifecycleStep;
    label: string;
    status: LaunchStepStatus;
  }[];
};

export type PumpProtectionAuthorityState = {
  summary: string;
  next: string;
  antiSniper: "Enabled" | "Disabled";
  antiRug: "Verified" | "Unverified";
  integrityScore: number;
  creatorLockedLiquidityPercent: number;
};

export type PumpGraduationAuthorityState = {
  stageLabel: string;
  progressPercent: number;
  summary: string;
  next: string;
  holdersCurrent: number;
  holdersTarget: number;
  momentumCurrent: number;
  momentumTarget: number;
  graduationTargetUsdMin: number;
  graduationTargetUsdMax: number;
  lpTargetUsd: number;
  usdRemainingToGraduate: number;
  lpActivationLabel: string;
  lpActivationReady: boolean;
};

export type PumpLaunchOutputAuthorityState = {
  routeLabel: string;
  economicsLabel: string;
  baseAsset: "RIO";
};

export type PumpHolderPressureAuthorityState = {
  liquidityPoolPercent: number;
  topWalletLabel: string;
  topWalletPercent: number;
};

export type PumpParticipantAuthorityRow = {
  id: string;
  wallet: string;
  displayWallet: string;
  side: "buy" | "sell" | "hold" | "lp";
  amount: number;
  amountDenom: string;
  curvePercent: number;
  earlyFloatPercent: number;
  bondingPercent: number;
  timeLabel: string;
};

export type PumpChartRange = "15m" | "1d" | "2d" | "5d" | "1w" | "1mo" | "5mo" | "1y";

export type PumpChartPoint = {
  t: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  marketCap: number;
};

export type PumpChartRangeState = {
  range: PumpChartRange;
  points: PumpChartPoint[];
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PumpChartAuthorityState = {
  defaultRange: PumpChartRange;
  ranges: Record<PumpChartRange, PumpChartRangeState>;
};

export type PumpSocialPulseState = {
  watchIntensity: "low" | "building" | "high";
  narrativePhase: "forming" | "accelerating" | "breakout";
  chatTitle: string;
  chatPrompt: string;
  notificationTitle: string;
  notificationPrompt: string;
  sentimentSummary: string;
  buyPressureLabel: string;
  sellPressureLabel: string;
  lpAttentionLabel: string;
  speculationNotes: string[];
};

export type PumpLaunchSurfaceState = {
  apexLeader: LaunchCardState | null;
  newlyLaunched: LaunchCardState[];
  monitorCards: LaunchCardState[];
  lifecycle: LaunchLifecycleState;
  protection: PumpProtectionAuthorityState;
  graduation: PumpGraduationAuthorityState;
  launchOutput: PumpLaunchOutputAuthorityState;
  holderPressure: PumpHolderPressureAuthorityState;
  participants: PumpParticipantAuthorityRow[];
  chart: PumpChartAuthorityState;
  social: PumpSocialPulseState;
};

export type PrimeFeaturedNicheState = {
  id: string;
  name: string;
  category: string;
};

export type PrimeLaunchSurfaceState = {
  featuredNiche: PrimeFeaturedNicheState | null;
  lifecycle: LaunchLifecycleState;
};

function buildPumpLifecycle(progressPercent: number): LaunchLifecycleState {
  return {
    rail: "pump",
    progressPercent,
    steps: [
      { key: "create", label: "Create", status: "complete" },
      { key: "bonding_curve", label: "Bonding Curve", status: "active" },
      { key: "auto_lp", label: "Auto LP", status: "pending" },
      { key: "screener", label: "Screener", status: "pending" },
      { key: "trade", label: "Trade", status: "pending" },
      { key: "rioex", label: "RioEx", status: "pending" },
      { key: "prime_upgrade", label: "Prime Upgrade", status: "optional" },
      { key: "cmc_gecko", label: "CMC/Gecko", status: "pending" },
    ],
  };
}

function buildPrimeLifecycle(progressPercent: number): LaunchLifecycleState {
  return {
    rail: "prime",
    progressPercent,
    steps: [
      { key: "create", label: "Create", status: "active" },
      { key: "lp", label: "LP", status: "pending" },
      { key: "screener", label: "Screener", status: "pending" },
      { key: "trade", label: "Trade", status: "pending" },
      { key: "rioex", label: "RioEx", status: "pending" },
      { key: "cmc_gecko", label: "CMC/Gecko", status: "pending" },
    ],
  };
}

function makePoints(
  labels: string[],
  closes: number[],
  baseVolume: number,
): PumpChartPoint[] {
  return labels.map((label, index) => {
    const close = closes[index];
    const prev = closes[Math.max(index - 1, 0)];
    const open = index === 0 ? close * 0.985 : prev;
    const high = Math.max(open, close) * 1.035;
    const low = Math.min(open, close) * 0.965;
    const volume = baseVolume * (1 + index * 0.18);
    const marketCap = close;

    return {
      t: label,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Number(volume.toFixed(2)),
      marketCap: Number(marketCap.toFixed(2)),
    };
  });
}

function rangeState(range: PumpChartRange, labels: string[], closes: number[], baseVolume: number): PumpChartRangeState {
  const points = makePoints(labels, closes, baseVolume);
  const highs = points.map((p) => p.high);
  const lows = points.map((p) => p.low);

  return {
    range,
    points,
    open: points[0]?.open ?? 0,
    high: Math.max(...highs),
    low: Math.min(...lows),
    close: points[points.length - 1]?.close ?? 0,
    volume: Number(points.reduce((sum, p) => sum + p.volume, 0).toFixed(2)),
  };
}

function buildPumpChartAuthorityState(baseClose: number): PumpChartAuthorityState {
  return {
    defaultRange: "1d",
    ranges: {
      "15m": rangeState("15m", ["00", "03", "06", "09", "12", "15"], [
        baseClose * 0.92,
        baseClose * 0.95,
        baseClose * 0.96,
        baseClose * 0.98,
        baseClose * 0.99,
        baseClose,
      ], 1800),
      "1d": rangeState("1d", ["01", "05", "09", "13", "17", "21"], [
        baseClose * 0.74,
        baseClose * 0.79,
        baseClose * 0.84,
        baseClose * 0.89,
        baseClose * 0.95,
        baseClose,
      ], 4600),
      "2d": rangeState("2d", ["D1-A", "D1-B", "D1-C", "D2-A", "D2-B", "D2-C"], [
        baseClose * 0.69,
        baseClose * 0.73,
        baseClose * 0.78,
        baseClose * 0.84,
        baseClose * 0.92,
        baseClose,
      ], 5200),
      "5d": rangeState("5d", ["D1", "D2", "D3", "D4", "D5", "Now"], [
        baseClose * 0.58,
        baseClose * 0.63,
        baseClose * 0.71,
        baseClose * 0.82,
        baseClose * 0.91,
        baseClose,
      ], 7000),
      "1w": rangeState("1w", ["W1", "W2", "W3", "W4", "W5", "Now"], [
        baseClose * 0.55,
        baseClose * 0.60,
        baseClose * 0.68,
        baseClose * 0.77,
        baseClose * 0.89,
        baseClose,
      ], 8800),
      "1mo": rangeState("1mo", ["M1", "M2", "M3", "M4", "M5", "Now"], [
        baseClose * 0.42,
        baseClose * 0.51,
        baseClose * 0.59,
        baseClose * 0.73,
        baseClose * 0.88,
        baseClose,
      ], 11000),
      "5mo": rangeState("5mo", ["P1", "P2", "P3", "P4", "P5", "Now"], [
        baseClose * 0.30,
        baseClose * 0.39,
        baseClose * 0.52,
        baseClose * 0.67,
        baseClose * 0.85,
        baseClose,
      ], 13500),
      "1y": rangeState("1y", ["Q1", "Q2", "Q3", "Q4", "Q5", "Now"], [
        baseClose * 0.22,
        baseClose * 0.32,
        baseClose * 0.46,
        baseClose * 0.63,
        baseClose * 0.82,
        baseClose,
      ], 16000),
    },
  };
}

export function getPumpLaunchSurfaceState(): PumpLaunchSurfaceState {
  const economics = getPumpEconomicsPolicy();

  const monitorCards: LaunchCardState[] = [
    {
      id: "pumpx",
      rail: "pump",
      tokenAddress: "rio1pumpxmonitor0001",
      tokenName: "PUMPX Momentum",
      symbol: "PUMPX",
      ageLabel: "3m",
      marketCapUsd: 707580,
      progressPercent: 19.03,
      trend: "hot",
      accent: "aqua",
    },
    {
      id: "rush",
      rail: "pump",
      tokenAddress: "rio1rushmonitor0002",
      tokenName: "PUMPRUSH",
      symbol: "RUSH",
      ageLabel: "13m",
      marketCapUsd: 583650,
      progressPercent: 14.08,
      trend: "watch",
      accent: "sunset",
    },
    {
      id: "edge",
      rail: "pump",
      tokenAddress: "rio1edgemonitor0003",
      tokenName: "PUMPEDGE",
      symbol: "EDGE",
      ageLabel: "9m",
      marketCapUsd: 621740,
      progressPercent: 15.51,
      trend: "watch",
      accent: "violet",
    },
    {
      id: "mint",
      rail: "pump",
      tokenAddress: "rio1mintmonitor0004",
      tokenName: "PUMPMINT",
      symbol: "MINT",
      ageLabel: "19m",
      marketCapUsd: 533020,
      progressPercent: 12.76,
      trend: "watch",
      accent: "gold",
    },
  ];

  const apexLeader = [...monitorCards].sort((a, b) => b.marketCapUsd - a.marketCapUsd)[0] ?? null;

  const newlyLaunched = [
    {
      id: "new-pump",
      rail: "pump" as const,
      tokenAddress: "rio1newpump000000001",
      tokenName: "PUMP",
      symbol: "PUMP",
      ageLabel: "9m",
      marketCapUsd: 2400,
      progressPercent: 8,
      trend: "watch" as const,
      accent: "mint" as const,
    },
  ];

  const protectionPolicy = buildPumpProtectionState(
    getDefaultPumpProtectionInput({
      tokenAddress: apexLeader?.tokenAddress || "rio1pumpxmonitor0001",
      symbol: apexLeader?.symbol || "PUMPX",
    }),
  );

  const graduationPolicy = buildPumpGraduationState({
    tokenAddress: apexLeader?.tokenAddress || "rio1pumpxmonitor0001",
    symbol: apexLeader?.symbol || "PUMPX",
    launchRail: "pump.live",
    baseAsset: economics.defaultBaseAsset,
    holders: 12,
    watchers: 38,
    momentumScore: 20,
    communityScore: 24,
    liquidityCommittedRio: 8_500,
    realBaseReserveRio: 24_375,
    volume24hUsd: 12_800,
  });

  return {
    apexLeader,
    newlyLaunched,
    monitorCards,
    lifecycle: buildPumpLifecycle(apexLeader?.progressPercent ?? 8),
    protection: {
      summary: protectionPolicy.narrative.summary,
      next: protectionPolicy.narrative.nextAction,
      antiSniper: protectionPolicy.status.antiSniperEnabled ? "Enabled" : "Disabled",
      antiRug: protectionPolicy.status.antiRugProtected ? "Verified" : "Unverified",
      integrityScore: protectionPolicy.risk.integrityScore,
      creatorLockedLiquidityPercent:
        protectionPolicy.liquidity.creatorLockedLiquidityPercent,
    },
    graduation: {
      stageLabel: graduationPolicy.stageLabel,
      progressPercent: graduationPolicy.progressPercent,
      summary: graduationPolicy.narrative.summary,
      next: graduationPolicy.narrative.nextAction,
      holdersCurrent: graduationPolicy.metrics.holders,
      holdersTarget: graduationPolicy.requirements.minHolders,
      momentumCurrent: graduationPolicy.metrics.momentumScore,
      momentumTarget: graduationPolicy.requirements.minMomentumScore,
      graduationTargetUsdMin: graduationPolicy.requirements.graduationTargetUsdMin,
      graduationTargetUsdMax: graduationPolicy.requirements.graduationTargetUsdMax,
      lpTargetUsd: graduationPolicy.requirements.lpTargetUsd,
      usdRemainingToGraduate:
        graduationPolicy.remaining.realBaseReserveRio,
      lpActivationLabel: graduationPolicy.narrative.lpActivationLabel,
      lpActivationReady: graduationPolicy.lpActivationReady,
    },
    launchOutput: {
      routeLabel: "Pump.live",
      economicsLabel: `$${economics.graduationTargetUsdMin.toLocaleString()}–$${economics.graduationTargetUsdMax.toLocaleString()} / $${economics.lpTargetUsd.toLocaleString()}`,
      baseAsset: "RIO",
    },
    holderPressure: {
      liquidityPoolPercent: 98.99,
      topWalletLabel: "rio1pumpx...",
      topWalletPercent: 1.01,
    },
    participants: [
      {
        id: "p1",
        wallet: "rio1pumpxwallet0001",
        displayWallet: "rio1pumpx...0001",
        side: "buy",
        amount: 18500,
        amountDenom: "RIO",
        curvePercent: 19.03,
        earlyFloatPercent: 0.42,
        bondingPercent: 12.8,
        timeLabel: "3m",
      },
      {
        id: "p2",
        wallet: "rio1rushwallet0002",
        displayWallet: "rio1rush...0002",
        side: "buy",
        amount: 12240,
        amountDenom: "RIO",
        curvePercent: 14.08,
        earlyFloatPercent: 0.31,
        bondingPercent: 9.5,
        timeLabel: "8m",
      },
      {
        id: "p3",
        wallet: "rio1edgewallet0003",
        displayWallet: "rio1edge...0003",
        side: "lp",
        amount: 7600,
        amountDenom: "RIO",
        curvePercent: 15.51,
        earlyFloatPercent: 0.21,
        bondingPercent: 8.1,
        timeLabel: "11m",
      },
      {
        id: "p4",
        wallet: "rio1mintwallet0004",
        displayWallet: "rio1mint...0004",
        side: "hold",
        amount: 5100,
        amountDenom: "RIO",
        curvePercent: 12.76,
        earlyFloatPercent: 0.18,
        bondingPercent: 6.2,
        timeLabel: "17m",
      },
    ],
    chart: buildPumpChartAuthorityState(apexLeader?.marketCapUsd ?? 707580),
    social: {
      watchIntensity: "high",
      narrativePhase: "accelerating",
      chatTitle: `${apexLeader?.symbol || "PUMP"} chat`,
      chatPrompt: "Live trader chatter is building around graduation timing, whale entries, and LP readiness.",
      notificationTitle: "Notification Surface",
      notificationPrompt: "Get mobile alerts for watch spikes, curve acceleration, LP activation, and near-graduation moves.",
      sentimentSummary:
        "Narrative momentum is building. Watchers are rotating from curiosity into active speculation around curve completion.",
      buyPressureLabel: "Buy pressure dominant",
      sellPressureLabel: "Sell pressure contained",
      lpAttentionLabel: graduationPolicy.lpActivationReady ? "LP activation ready" : "LP attention rising",
      speculationNotes: [
        "Watch intensity is rising as apex market cap separates from the rest of the board.",
        "Speculators are increasingly framing the leader as the next graduation candidate.",
        graduationPolicy.lpActivationReady
          ? "Liquidity activation can proceed into market exposure."
          : "LP-oriented participants are beginning to cluster around the upper-momentum names.",
      ],
    },
  };
}

export function getPrimeLaunchSurfaceState(): PrimeLaunchSurfaceState {
  return {
    featuredNiche: {
      id: "community",
      name: "Community",
      category: "Social Launch",
    },
    lifecycle: buildPrimeLifecycle(8),
  };
}
