"use client";

import { useEffect, useMemo, useState } from "react";

type DiscoverSort = "trending" | "progress" | "marketCap" | "new";
type ChartRange = "15m" | "1d" | "2d" | "5d" | "1w" | "1mo" | "5mo" | "1y";
type ChartMode = "candles" | "line" | "string" | "area";

type PumpBoardRow = {
  rank: number;
  tokenAddress: string;
  tokenName: string;
  symbol: string;
  launchRail: "pump.live";
  standard: "SPO-20";
  baseAsset: "RIO";
  stage: "momentum" | "watch" | "ready" | "graduated";
  stageLabel: string;
  progressPercent: number;
  impliedMarketCapRio: number;
  effectivePriceRio: number;
  participantCount: number;
  watcherCount: number;
  momentumScore: number;
  earlyFloatPercent: number;
  volume24hRio: number;
  liquidityCommittedRio: number;
  trendDirection: "up" | "flat" | "down";
  createdAtLabel: string;
  score: number;
};

type PumpBoardResponse = {
  ok: boolean;
  error?: string;
  board?: PumpBoardRow[];
};

type PumpQuoteResponse = {
  ok: boolean;
  error?: string;
  quote?: {
    side: "buy" | "sell";
    tokenAddress: string;
    symbol: string;
    amountIn: number;
    amountInDenom: string;
    feeAmount: number;
    feeDenom: string;
    feeRecipient?: string;
    curveFeeBps?: number;
    netAmountIn?: number;
    netAmountOut?: number;
    estimatedAmountOut: number;
    estimatedAmountOutDenom: string;
    effectivePriceRio: number;
    impliedMarketCapRio: number;
    progressPercent: number;
    curveState: string;
  };
};

type PumpExecuteResponse = {
  ok: boolean;
  error?: string;
  execution?: {
    status: string;
    side: "buy" | "sell";
    tokenAddress: string;
    symbol: string;
    txHash: string;
    amountIn: number;
    amountInDenom: string;
    feeAmount: number;
    feeDenom: string;
    feeRecipient?: string;
    curveFeeBps?: number;
    netAmountIn?: number;
    amountOut: number;
    amountOutDenom: string;
    effectivePriceRio: number;
    impliedMarketCapRio: number;
    progressPercent: number;
    curveState: string;
    message: string;
  };
};

type LaunchCardAccent =
  | "aqua"
  | "sunset"
  | "violet"
  | "gold"
  | "mint"
  | "amber"
  | "slate"
  | "emerald";

type LaunchCardTrend = "hot" | "watch" | "ready";

type LaunchCardState = {
  id: string;
  rail: "pump" | "prime";
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

type LaunchLifecycleStep = {
  key: string;
  label: string;
  status: "complete" | "active" | "pending" | "optional";
};

type LaunchLifecycleState = {
  rail: "pump" | "prime";
  progressPercent: number;
  steps: LaunchLifecycleStep[];
};

type PumpProtectionAuthorityState = {
  summary: string;
  next: string;
  antiSniper: "Enabled" | "Disabled";
  antiRug: "Verified" | "Unverified";
  integrityScore: number;
  creatorLockedLiquidityPercent: number;
};

type PumpGraduationAuthorityState = {
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
};

type PumpLaunchOutputAuthorityState = {
  routeLabel: string;
  economicsLabel: string;
  baseAsset: "RIO";
};

type PumpHolderPressureAuthorityState = {
  liquidityPoolPercent: number;
  topWalletLabel: string;
  topWalletPercent: number;
};

type PumpParticipantAuthorityRow = {
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

type PumpChartPoint = {
  t: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  marketCap: number;
};

type PumpChartRangeState = {
  range: ChartRange;
  points: PumpChartPoint[];
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type PumpChartAuthorityState = {
  defaultRange: ChartRange;
  ranges: Record<ChartRange, PumpChartRangeState>;
};

type PumpSocialPulseState = {
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

type PumpLaunchSurfaceState = {
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

type PumpLaunchSurfaceResponse = {
  ok: boolean;
  error?: string;
  state?: PumpLaunchSurfaceState;
  source?: string;
};

function shell() {
  return "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_20%),radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.06),transparent_16%),linear-gradient(180deg,#030612_0%,#060b18_42%,#04070d_100%)] text-white";
}

function terminalCard(extra = "") {
  return `rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,34,0.92),rgba(7,12,24,0.96))] shadow-[0_24px_80px_-38px_rgba(0,0,0,0.9)] backdrop-blur-xl ${extra}`;
}

function glassCard(extra = "") {
  return `rounded-[20px] border border-white/10 bg-white/[0.035] backdrop-blur-xl ${extra}`;
}

function pill(kind: "pink" | "cyan" | "amber" | "emerald" | "neutral" = "neutral") {
  const styles = {
    pink: "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200",
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    neutral: "border-white/10 bg-white/[0.04] text-white/75",
  };

  return `inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${styles[kind]}`;
}

function actionButton(primary = false) {
  return primary
    ? "inline-flex h-10 items-center justify-center rounded-2xl border border-fuchsia-400/28 bg-[linear-gradient(90deg,rgba(217,70,239,0.22),rgba(34,211,238,0.16))] px-4 text-sm font-semibold text-white hover:translate-y-[-1px]"
    : "inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-medium text-white/88 hover:bg-white/[0.07]";
}

function sectionEyebrow() {
  return "text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-300/80";
}

function statCard(extra = "") {
  return `rounded-[16px] border border-white/10 bg-white/[0.03] p-3 ${extra}`;
}

function formatNumber(value: number, max = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
  }).format(value);
}

function compactMoney(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}

function stagePill(stage: PumpBoardRow["stage"]) {
  if (stage === "graduated") return pill("amber");
  if (stage === "ready") return pill("cyan");
  if (stage === "watch") return pill("pink");
  return pill("neutral");
}

function trendTone(direction: PumpBoardRow["trendDirection"]) {
  if (direction === "up") return "text-emerald-300";
  if (direction === "down") return "text-rose-300";
  return "text-amber-300";
}

function progressWidthFromStage(stage: PumpBoardRow["stage"]) {
  if (stage === "graduated") return "100%";
  if (stage === "ready") return "76%";
  if (stage === "watch") return "48%";
  return "28%";
}

const chartToolIcons = ["+", "/", "=", "~", "⌁", "T", "☺", "⌗", "⊕", "∩", "✎", "◉"];
const ranges: ChartRange[] = ["15m", "1d", "2d", "5d", "1w", "1mo", "5mo", "1y"];
const modes: ChartMode[] = ["candles", "line", "string", "area"];

function mapAuthorityTrendToDirection(trend: LaunchCardTrend): "up" | "flat" | "down" {
  if (trend === "hot") return "up";
  if (trend === "ready") return "up";
  return "flat";
}

function mapAuthorityCardToBoardRow(card: LaunchCardState, rank = 1): PumpBoardRow {
  const stage =
    card.trend === "ready"
      ? "ready"
      : card.trend === "hot"
        ? "watch"
        : "momentum";

  return {
    rank,
    tokenAddress: card.tokenAddress,
    tokenName: card.tokenName,
    symbol: card.symbol,
    launchRail: "pump.live",
    standard: "SPO-20",
    baseAsset: "RIO",
    stage,
    stageLabel:
      stage === "ready" ? "Graduation Watch" : stage === "watch" ? "Building Demand" : "Momentum",
    progressPercent: card.progressPercent,
    impliedMarketCapRio: card.marketCapUsd,
    effectivePriceRio: Math.max(card.marketCapUsd / 1_000_000_000, 0.000001),
    participantCount: 120,
    watcherCount: 80,
    momentumScore: card.trend === "hot" ? 82 : card.trend === "ready" ? 76 : 58,
    earlyFloatPercent: 1.25,
    volume24hRio: Math.max(card.marketCapUsd * 0.08, 100),
    liquidityCommittedRio: Math.max(card.marketCapUsd * 0.03, 75),
    trendDirection: mapAuthorityTrendToDirection(card.trend),
    createdAtLabel: card.ageLabel,
    score: card.progressPercent,
  };
}

export default function PumpBoardPage() {
  const [sort, setSort] = useState<DiscoverSort>("trending");
  const [rows, setRows] = useState<PumpBoardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [surfaceState, setSurfaceState] = useState<PumpLaunchSurfaceState | null>(null);
  const [surfaceLoading, setSurfaceLoading] = useState(true);
  const [surfaceError, setSurfaceError] = useState<string | null>(null);

  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [buyRioIn, setBuyRioIn] = useState("0.5");
  const [sellTokenIn, setSellTokenIn] = useState("250000");
  const [buyQuote, setBuyQuote] = useState<PumpQuoteResponse["quote"] | null>(null);
  const [sellQuote, setSellQuote] = useState<PumpQuoteResponse["quote"] | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionNotice, setExecutionNotice] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);

  const [chartRange, setChartRange] = useState<ChartRange>("1d");
  const [chartMode, setChartMode] = useState<ChartMode>("line");

  async function fetchBoard(nextSort: DiscoverSort) {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/pump/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sort: nextSort,
          limit: 8,
          symbol: "PUMP",
          totalSupply: 1_000_000_000,
        }),
      });

      const data = (await response.json()) as PumpBoardResponse;

      if (!response.ok || !data.ok || !data.board) {
        throw new Error(data.error || "Failed to load Pump board.");
      }

      setRows(data.board);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load Pump board.";
      setError(message);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSurfaceState() {
    try {
      setSurfaceLoading(true);
      setSurfaceError(null);

      const response = await fetch("/api/launches/pump", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as PumpLaunchSurfaceResponse;

      if (!response.ok || !data.ok || !data.state) {
        throw new Error(data.error || "Failed to load Pump surface state.");
      }

      setSurfaceState(data.state);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load Pump surface state.";
      setSurfaceError(message);
      setSurfaceState(null);
    } finally {
      setSurfaceLoading(false);
    }
  }

  useEffect(() => {
    void fetchBoard(sort);
  }, [sort]);

  useEffect(() => {
    void fetchSurfaceState();
  }, []);

  const leader = useMemo(() => {
    if (surfaceState?.apexLeader) {
      return mapAuthorityCardToBoardRow(surfaceState.apexLeader, 1);
    }
    return rows[0] || null;
  }, [surfaceState, rows]);

  const rankedRows = useMemo(() => {
    if (!rows.length) return [];
    if (!surfaceState?.apexLeader) return rows;

    const apexAddress = surfaceState.apexLeader.tokenAddress;
    const existing = rows.find((row) => row.tokenAddress === apexAddress);

    if (existing) {
      return rows.map((row, index) => ({ ...row, rank: index + 1 }));
    }

    const apexRow = mapAuthorityCardToBoardRow(surfaceState.apexLeader, 1);
    const remainder = rows.slice(0, 7).map((row, index) => ({ ...row, rank: index + 2 }));
    return [apexRow, ...remainder];
  }, [rows, surfaceState]);

  async function fetchPumpQuote(side: "buy" | "sell", amount: string) {
    if (!leader) return;

    const normalizedAmount = amount.trim();
    if (!normalizedAmount || Number(normalizedAmount) <= 0) {
      if (side === "buy") setBuyQuote(null);
      else setSellQuote(null);
      return;
    }

    try {
      setIsLoadingQuote(true);
      setQuoteError(null);

      const response = await fetch("/api/pump/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side,
          amount: normalizedAmount,
          tokenAddress: leader.tokenAddress,
          symbol: leader.symbol,
          totalSupply: 1_000_000_000,
        }),
      });

      const data = (await response.json()) as PumpQuoteResponse;

      if (!response.ok || !data.ok || !data.quote) {
        throw new Error(data.error || "Failed to fetch quote.");
      }

      if (side === "buy") setBuyQuote(data.quote);
      else setSellQuote(data.quote);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch quote.";
      setQuoteError(message);
      if (side === "buy") setBuyQuote(null);
      else setSellQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  }

  async function executePumpTrade(side: "buy" | "sell") {
    if (!leader) return;

    const amount = side === "buy" ? buyRioIn : sellTokenIn;
    const normalizedAmount = amount.trim();

    if (!normalizedAmount || Number(normalizedAmount) <= 0) {
      setExecutionError("Amount must be greater than zero.");
      return;
    }

    try {
      setIsExecutingTrade(true);
      setExecutionError(null);
      setExecutionNotice(null);
      setLastTxHash(null);

      const response = await fetch("/api/pump/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side,
          amount: normalizedAmount,
          tokenAddress: leader.tokenAddress,
          symbol: leader.symbol,
          totalSupply: 1_000_000_000,
          previewOnly: true,
        }),
      });

      const data = (await response.json()) as PumpExecuteResponse;

      if (!response.ok || !data.ok || !data.execution) {
        throw new Error(data.error || "Execution failed.");
      }

      setExecutionNotice(data.execution.message);
      setLastTxHash(data.execution.txHash);

      await fetchPumpQuote("buy", buyRioIn);
      await fetchPumpQuote("sell", sellTokenIn);
      await fetchBoard(sort);
      await fetchSurfaceState();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed.";
      setExecutionError(message);
    } finally {
      setIsExecutingTrade(false);
    }
  }

  useEffect(() => {
    if (leader) void fetchPumpQuote("buy", buyRioIn);
  }, [leader?.tokenAddress, leader?.symbol, buyRioIn]);

  useEffect(() => {
    if (leader) void fetchPumpQuote("sell", sellTokenIn);
  }, [leader?.tokenAddress, leader?.symbol, sellTokenIn]);

  const lifecycle = surfaceState?.lifecycle ?? {
    rail: "pump" as const,
    progressPercent: leader?.progressPercent || 0,
    steps: [],
  };

  const newlyLaunched = surfaceState?.newlyLaunched ?? [];
  const protection = surfaceState?.protection;
  const graduation = surfaceState?.graduation;
  const launchOutput = surfaceState?.launchOutput;
  const holderPressure = surfaceState?.holderPressure;
  const participants = surfaceState?.participants ?? [];
  const authorityChart = surfaceState?.chart;
  const selectedChart = authorityChart?.ranges[chartRange];
  const chartPoints = selectedChart?.points ?? [];
  const social = surfaceState?.social;

  const chartPath = useMemo(() => {
    if (!chartPoints.length) return "";

    const min = Math.min(...chartPoints.map((p) => p.close));
    const max = Math.max(...chartPoints.map((p) => p.close));
    const spread = Math.max(max - min, 1);

    return chartPoints
      .map((point, index) => {
        const x = 40 + (index * (930 / Math.max(chartPoints.length - 1, 1)));
        const y = 410 - ((point.close - min) / spread) * 340;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartPoints]);

  const chartAreaPath = useMemo(() => {
    if (!chartPoints.length || !chartPath) return "";
    const lastX = 40 + ((chartPoints.length - 1) * (930 / Math.max(chartPoints.length - 1, 1)));
    return `${chartPath} L ${lastX} 440 L 40 440 Z`;
  }, [chartPath, chartPoints]);

  const leaderStats = useMemo(() => {
    if (!leader) return null;

    return {
      marketCap: compactMoney(selectedChart?.close ?? leader.impliedMarketCapRio),
      volume24h: compactMoney(selectedChart?.volume ?? leader.volume24hRio),
      liquidityCommitted: compactMoney(leader.liquidityCommittedRio),
      price: leader.effectivePriceRio.toFixed(8),
      creatorHandle: `rio1${leader.tokenAddress.slice(4, 10)}...`,
      ath: compactMoney(selectedChart?.high ?? leader.impliedMarketCapRio * 1.19),
    };
  }, [leader, selectedChart]);

  return (
    <main className={shell()}>
      <div className="mx-auto max-w-[1580px] p-3 sm:p-4">
        <div className="space-y-3">
          <div className={terminalCard("p-5")}>
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-4xl">
                <div className={sectionEyebrow()}>Pump.live</div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Discovery Board
                </h1>
                <div className="mt-3 text-sm text-white/68">
                  Live-ranked momentum launches across the Pump.live rail. Track curve progression,
                  market cap, participants, watchers, integrity, graduation, trade state, and market activity.
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={pill("pink")}>Momentum</span>
                  <span className={pill("cyan")}>Graduation Watch</span>
                  <span className={pill("amber")}>Discovery</span>
                  <span className={pill("emerald")}>RIO Market</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSort("trending")}
                  className={sort === "trending" ? actionButton(true) : actionButton(false)}
                >
                  Trending
                </button>
                <button
                  type="button"
                  onClick={() => setSort("progress")}
                  className={sort === "progress" ? actionButton(true) : actionButton(false)}
                >
                  Progress
                </button>
                <button
                  type="button"
                  onClick={() => setSort("marketCap")}
                  className={sort === "marketCap" ? actionButton(true) : actionButton(false)}
                >
                  Market Cap
                </button>
                <button
                  type="button"
                  onClick={() => setSort("new")}
                  className={sort === "new" ? actionButton(true) : actionButton(false)}
                >
                  New
                </button>
              </div>
            </div>
          </div>

          <div className={terminalCard("p-4")}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className={sectionEyebrow()}>Pump lifecycle</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  Create → Bonding Curve → Auto LP → Screener → Trade → RioEx
                </div>
                <div className="mt-1 text-sm text-white/62">
                  Discovery now reads the same authority-shaped lifecycle rail as Pump.
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Lifecycle progression
                </div>
                <div className="mt-1 text-2xl font-bold text-cyan-300">
                  {lifecycle.progressPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mt-5 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.98),rgba(168,85,247,0.96),rgba(251,191,36,0.92))]"
                style={{ width: `${Math.min(lifecycle.progressPercent, 100)}%` }}
              />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
              {lifecycle.steps.map((step) => {
                const isCompleted = step.status === "complete";
                const isActive = step.status === "active";
                const isOptional = step.status === "optional";

                return (
                  <div
                    key={step.key}
                    className={`rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition ${
                      isCompleted
                        ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
                        : isActive
                          ? "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200"
                          : isOptional
                            ? "border-amber-400/25 bg-amber-500/8 text-amber-200"
                            : "border-white/10 bg-white/[0.03] text-white/58"
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>

            {surfaceLoading ? <div className="mt-4 text-sm text-white/55">Loading authority state...</div> : null}
            {surfaceError ? <div className="mt-4 text-sm text-rose-300">{surfaceError}</div> : null}
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-3">
              <div className={terminalCard("p-4")}>
                {leader ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-fuchsia-400/22 bg-[linear-gradient(180deg,rgba(217,70,239,0.18),rgba(34,211,238,0.08))] text-xl font-bold text-white">
                          {leader.symbol.slice(0, 2)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-2xl font-semibold text-white">
                              {leader.tokenName}
                            </div>
                            <span className={pill("cyan")}>{leader.symbol}</span>
                            <span className={stagePill(leader.stage)}>{leader.stageLabel}</span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/58">
                            <span>{leader.tokenAddress}</span>
                            <span>{leader.createdAtLabel}</span>
                            <span>{leader.baseAsset}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={actionButton(false)}>
                          Share
                        </button>
                        <button type="button" className={actionButton(false)}>
                          {leader.tokenAddress.slice(0, 4)}...{leader.tokenAddress.slice(-5)}
                        </button>
                        <button type="button" className={actionButton(true)}>
                          Trade
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className={sectionEyebrow()}>Launch Progression</div>
                          <div className="mt-2 text-xl font-semibold text-white">
                            Create → LP → Screener → Trade → RioEx
                          </div>
                        </div>
                        <span className={stagePill(leader.stage)}>{leader.stage}</span>
                      </div>

                      <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(217,70,239,0.92),rgba(34,211,238,0.88),rgba(245,158,11,0.85))]"
                          style={{ width: lifecycle.steps.length ? `${Math.min(lifecycle.progressPercent, 100)}%` : progressWidthFromStage(leader.stage) }}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-5">
                        {(lifecycle.steps.length
                          ? lifecycle.steps.slice(0, 5).map((step) => step.label)
                          : ["Create", "Momentum", "Graduate", "LP", "Market"]
                        ).map((item, index) => (
                          <div
                            key={item}
                            className={`rounded-2xl border px-4 py-3 text-sm ${
                              lifecycle.steps.length
                                ? index <= lifecycle.steps.findIndex((step) => step.status === "active")
                                  ? "border-fuchsia-400/24 bg-fuchsia-500/10 text-white"
                                  : "border-white/10 bg-white/[0.03] text-white/65"
                                : index <= 1
                                  ? "border-fuchsia-400/24 bg-fuchsia-500/10 text-white"
                                  : "border-white/10 bg-white/[0.03] text-white/65"
                            }`}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(5,9,20,0.92),rgba(8,12,22,0.98))] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className={sectionEyebrow()}>Market Cap</div>
                          <div className="mt-2 text-3xl font-semibold text-white">
                            {leaderStats?.marketCap} RIO
                          </div>
                          <div className={`mt-1 text-sm ${trendTone(leader.trendDirection)}`}>
                            +0 ({leader.trendDirection === "up" ? "+strong" : leader.trendDirection === "down" ? "-cooling" : "stable"}) 24hr
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mx-auto h-2 w-[280px] rounded-full bg-white/15">
                            <div
                              className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.4),rgba(134,239,172,0.9))]"
                              style={{ width: "28%" }}
                            />
                          </div>
                          <div className="mt-2 text-sm text-white/82">
                            ATH {leaderStats?.ath} RIO
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-white/86">
                        <span className={chartRange === "1d" ? "text-white" : "text-white/78"}>24h</span>
                        <span className="text-white/78">Trade Display</span>
                        <span className="text-white/78">Hide All Bubbles</span>
                        <span className={chartMode === "line" ? "text-white" : "text-white/78"}>
                          Price / MCap
                        </span>
                        <span className="text-emerald-300">USD / SOL</span>
                      </div>

                      <div className="mt-4 grid gap-3 xl:grid-cols-[52px_minmax(0,1fr)]">
                        <div className="rounded-[18px] border border-white/8 bg-black/10 p-2">
                          <div className="flex flex-col gap-2">
                            {chartToolIcons.map((icon) => (
                              <button
                                key={icon}
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.02] text-xs text-white/70 hover:bg-white/[0.05]"
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-[14px] border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/86">
                            <span className="font-medium">
                              {leader.symbol}/{leader.baseAsset} Market Cap (USD)
                            </span>{" "}
                            · {chartRange} · Pump ·{" "}
                            <span className="text-cyan-300">
                              O {compactMoney(selectedChart?.open ?? leader.impliedMarketCapRio)}
                            </span>{" "}
                            <span className="text-rose-300">
                              H {compactMoney(selectedChart?.high ?? leader.impliedMarketCapRio)}
                            </span>{" "}
                            <span className="text-white">
                              L {compactMoney(selectedChart?.low ?? leader.impliedMarketCapRio)}
                            </span>{" "}
                            <span className="text-white">
                              C {compactMoney(selectedChart?.close ?? leader.impliedMarketCapRio)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {ranges.map((range) => (
                              <button
                                key={range}
                                type="button"
                                onClick={() => setChartRange(range)}
                                className={chartRange === range ? actionButton(true) : actionButton(false)}
                              >
                                {range}
                              </button>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {modes.map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setChartMode(mode)}
                                className={chartMode === mode ? actionButton(true) : actionButton(false)}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>

                          <div className="relative h-[480px] overflow-hidden rounded-[18px] border border-white/8 bg-[radial-gradient(circle_at_20%_0%,rgba(217,70,239,0.08),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.06),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0.00))]">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />

                            <svg viewBox="0 0 1000 480" className="absolute inset-0 h-full w-full">
                              {chartMode === "candles" && chartPoints.length
                                ? chartPoints.map((point, index) => {
                                    const min = Math.min(...chartPoints.map((p) => p.low));
                                    const max = Math.max(...chartPoints.map((p) => p.high));
                                    const spread = Math.max(max - min, 1);
                                    const x = 60 + (index * (860 / Math.max(chartPoints.length - 1, 1)));
                                    const openY = 410 - ((point.open - min) / spread) * 340;
                                    const closeY = 410 - ((point.close - min) / spread) * 340;
                                    const highY = 410 - ((point.high - min) / spread) * 340;
                                    const lowY = 410 - ((point.low - min) / spread) * 340;
                                    const top = Math.min(openY, closeY);
                                    const height = Math.max(Math.abs(closeY - openY), 8);
                                    const bullish = point.close >= point.open;

                                    return (
                                      <g key={point.t}>
                                        <line
                                          x1={x}
                                          y1={highY}
                                          x2={x}
                                          y2={lowY}
                                          stroke={bullish ? "rgba(34,211,238,0.85)" : "rgba(217,70,239,0.85)"}
                                          strokeWidth="3"
                                        />
                                        <rect
                                          x={x - 15}
                                          y={top}
                                          width="30"
                                          height={height}
                                          fill={bullish ? "rgba(34,211,238,0.85)" : "rgba(217,70,239,0.85)"}
                                        />
                                      </g>
                                    );
                                  })
                                : null}

                              {chartMode === "area" && chartAreaPath ? (
                                <>
                                  <path d={chartAreaPath} fill="rgba(34,211,238,0.18)" />
                                  <path d={chartPath} fill="none" stroke="rgba(34,211,238,0.92)" strokeWidth="3" />
                                </>
                              ) : null}

                              {(chartMode === "line" || chartMode === "string") && chartPath ? (
                                <path
                                  d={chartPath}
                                  fill="none"
                                  stroke="rgba(34,211,238,0.92)"
                                  strokeWidth={chartMode === "string" ? "2" : "3"}
                                  strokeDasharray={chartMode === "string" ? "6 6" : undefined}
                                />
                              ) : null}
                            </svg>

                            <div className="absolute right-4 top-3 text-xs text-white/52">
                              {compactMoney(selectedChart?.high ?? leader.impliedMarketCapRio)}
                            </div>
                            <div className="absolute right-4 bottom-28 text-xs text-white/52">
                              {compactMoney(selectedChart?.low ?? leader.impliedMarketCapRio)}
                            </div>
                            <div className="absolute bottom-3 left-4 flex gap-3 text-xs text-white/65">
                              {chartPoints.map((p) => (
                                <span key={p.t}>{p.t}</span>
                              ))}
                            </div>
                            <div className="absolute bottom-3 right-4 flex gap-3 text-xs text-white/65">
                              <span>20:18:17 UTC</span>
                              <span>%</span>
                              <span>log</span>
                              <span className="text-cyan-300">auto</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-5">
                        <div className={statCard("py-4")}>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Vol {chartRange}</div>
                          <div className="mt-2 text-base font-semibold text-white">
                            {leaderStats?.volume24h} RIO
                          </div>
                        </div>
                        <div className={statCard("py-4")}>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Price</div>
                          <div className="mt-2 text-base font-semibold text-white">
                            {leaderStats?.price} RIO
                          </div>
                        </div>
                        <div className={statCard("py-4")}>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Open</div>
                          <div className="mt-2 text-base font-semibold text-white">
                            {compactMoney(selectedChart?.open ?? leader.impliedMarketCapRio)}
                          </div>
                        </div>
                        <div className={statCard("py-4")}>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">High</div>
                          <div className="mt-2 text-base font-semibold text-white">
                            {compactMoney(selectedChart?.high ?? leader.impliedMarketCapRio)}
                          </div>
                        </div>
                        <div className={statCard("py-4")}>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Low</div>
                          <div className="mt-2 text-base font-semibold text-white">
                            {compactMoney(selectedChart?.low ?? leader.impliedMarketCapRio)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
                      <div className={glassCard("p-4")}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className={sectionEyebrow()}>Trade</div>
                            <div className="mt-2 text-base font-semibold text-white">Buy / Sell</div>
                          </div>
                          <span className={pill("pink")}>Curve Active</span>
                        </div>

                        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
                          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1">
                            <button
                              type="button"
                              onClick={() => setTradeSide("buy")}
                              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                tradeSide === "buy" ? "bg-emerald-400 text-slate-950" : "text-white/70"
                              }`}
                            >
                              Buy
                            </button>
                            <button
                              type="button"
                              onClick={() => setTradeSide("sell")}
                              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                tradeSide === "sell" ? "bg-amber-400 text-slate-950" : "text-white/70"
                              }`}
                            >
                              Sell
                            </button>
                          </div>

                          {tradeSide === "buy" ? (
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0a0f1c] px-4 py-3">
                                <input
                                  className="min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-slate-500"
                                  value={buyRioIn}
                                  onChange={(e) => setBuyRioIn(e.target.value)}
                                  placeholder="0.0"
                                />
                                <span className="text-sm font-semibold text-white/80">RIO</span>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => setBuyRioIn("0.1")} className={actionButton(false)}>0.1 RIO</button>
                                <button type="button" onClick={() => setBuyRioIn("0.5")} className={actionButton(false)}>0.5 RIO</button>
                                <button type="button" onClick={() => setBuyRioIn("1")} className={actionButton(false)}>1 RIO</button>
                                <button type="button" onClick={() => setBuyRioIn("5")} className={actionButton(false)}>Max</button>
                              </div>

                              <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/72">
                                {isLoadingQuote
                                  ? "Loading quote..."
                                  : buyQuote
                                    ? `Est. ${formatNumber(Math.round(buyQuote.estimatedAmountOut))} ${buyQuote.estimatedAmountOutDenom}`
                                    : "Enter amount"}
                              </div>

                              {buyQuote ? (
                                <div className="text-xs text-white/50">
                                  Fee {buyQuote.feeAmount} {buyQuote.feeDenom} · Price {buyQuote.effectivePriceRio} RIO
                                </div>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => executePumpTrade("buy")}
                                disabled={isExecutingTrade}
                                className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                              >
                                {isExecutingTrade ? "Buying..." : "Buy"}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0a0f1c] px-4 py-3">
                                <input
                                  className="min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-slate-500"
                                  value={sellTokenIn}
                                  onChange={(e) => setSellTokenIn(e.target.value)}
                                  placeholder="0.0"
                                />
                                <span className="text-sm font-semibold text-white/80">{leader.symbol}</span>
                              </div>

                              <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/72">
                                {isLoadingQuote
                                  ? "Loading quote..."
                                  : sellQuote
                                    ? `Est. ${sellQuote.estimatedAmountOut.toFixed(2)} ${sellQuote.estimatedAmountOutDenom}`
                                    : "Enter amount"}
                              </div>

                              {sellQuote ? (
                                <div className="text-xs text-white/50">
                                  Fee {sellQuote.feeAmount} {sellQuote.feeDenom} · Price {sellQuote.effectivePriceRio} RIO
                                </div>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => executePumpTrade("sell")}
                                disabled={isExecutingTrade}
                                className="w-full rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                              >
                                {isExecutingTrade ? "Selling..." : "Sell"}
                              </button>
                            </div>
                          )}

                          {quoteError ? <div className="mt-3 text-xs text-rose-300">{quoteError}</div> : null}
                          {executionError ? <div className="mt-2 text-xs text-rose-300">{executionError}</div> : null}
                          {executionNotice ? <div className="mt-2 text-xs text-emerald-300">{executionNotice}</div> : null}
                          {lastTxHash ? <div className="mt-1 text-xs text-white/45">Tx {lastTxHash}</div> : null}
                        </div>
                      </div>

                      <div className={glassCard("p-4")}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className={sectionEyebrow()}>Launch Output</div>
                            <div className="mt-2 text-xl font-semibold text-white">
                              {leader.tokenName}
                            </div>
                            <div className="mt-1 break-all text-xs text-white/55">
                              {leader.tokenAddress}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className={pill("pink")}>{leader.launchRail}</span>
                            <span className={pill("cyan")}>{leader.standard}</span>
                            <span className={pill("amber")}>{leader.baseAsset}</span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 xl:grid-cols-3">
                          <div className={glassCard("p-3")}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Route</div>
                            <div className="mt-2 text-sm text-white/75">
                              {launchOutput?.routeLabel || "Pump.live"}
                            </div>
                          </div>
                          <div className={glassCard("p-3")}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Economics</div>
                            <div className="mt-2 text-sm text-white/75">
                              {launchOutput?.economicsLabel || "$60,000–$65,000 / $15,000"}
                            </div>
                          </div>
                          <div className={glassCard("p-3")}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Base</div>
                            <div className="mt-2 text-sm text-white/75">
                              {launchOutput?.baseAsset || "RIO"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-5">
                          <a href="/liquidity" className={actionButton(false)}>Add LP</a>
                          <a href="/createtoken/pump/board" className={actionButton(false)}>Discovery</a>
                          <a href="/createtoken/pump/board" className={actionButton(true)}>Trade</a>
                          <a href="/rioex" className={actionButton(false)}>RioEx</a>
                          <a href="/createtoken/pump" className={actionButton(false)}>Preview</a>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-sm text-white/60">
                    {isLoading || surfaceLoading ? "Loading discovery leader..." : "No discovery leader available."}
                  </div>
                )}
              </div>

              <div className={terminalCard("p-4")}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className={sectionEyebrow()}>Board</div>
                    <div className="mt-2 text-lg font-semibold text-white">Ranked Launches</div>
                  </div>
                  <span className={pill("neutral")}>{rankedRows.length} listed</span>
                </div>

                <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10">
                  <div className="grid grid-cols-[72px_1.4fr_0.9fr_0.8fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-3 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                    <div>Rank</div>
                    <div>Asset</div>
                    <div>MCap</div>
                    <div>Curve %</div>
                    <div>Watchers</div>
                    <div>Momentum</div>
                    <div>Stage</div>
                    <div>Age</div>
                  </div>

                  <div className="divide-y divide-white/8">
                    {isLoading ? (
                      <div className="px-4 py-10 text-sm text-white/50">Loading Pump board...</div>
                    ) : error ? (
                      <div className="px-4 py-10 text-sm text-rose-300">{error}</div>
                    ) : (
                      rankedRows.map((row) => (
                        <button
                          key={row.tokenAddress}
                          type="button"
                          onClick={() =>
                            setRows((prev) => {
                              const next = [...prev];
                              const idx = next.findIndex((x) => x.tokenAddress === row.tokenAddress);
                              if (idx > 0) {
                                const [picked] = next.splice(idx, 1);
                                next.unshift(picked);
                                return next.map((item, index) => ({ ...item, rank: index + 1 }));
                              }
                              return prev;
                            })
                          }
                          className="grid w-full grid-cols-[72px_1.4fr_0.9fr_0.8fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-3 px-4 py-4 text-left text-sm hover:bg-white/[0.03]"
                        >
                          <div className="flex items-center">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-semibold text-white">
                              {row.rank}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-400/18 bg-fuchsia-500/10 text-xs font-bold text-white">
                                {row.symbol.slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-white">{row.tokenName}</div>
                                <div className="truncate text-xs text-white/48">{row.symbol}</div>
                              </div>
                            </div>
                          </div>

                          <div className="text-white/84">{compactMoney(row.impliedMarketCapRio)} RIO</div>
                          <div className="text-cyan-300">{row.progressPercent.toFixed(2)}%</div>
                          <div className="text-white/78">{formatNumber(row.watcherCount)}</div>
                          <div className="text-white/84">{row.momentumScore.toFixed(2)}</div>
                          <div><span className={stagePill(row.stage)}>{row.stage}</span></div>
                          <div className="text-white/52">{row.createdAtLabel}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className={terminalCard("p-4")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={sectionEyebrow()}>Participants</div>
                    <div className="mt-2 text-base font-semibold text-white">Indexed Curve Activity</div>
                  </div>
                  <button type="button" className={actionButton(false)}>Authority</button>
                </div>

                <div className="mt-4 space-y-3">
                  {participants.length ? (
                    participants.map((participant) => (
                      <div key={participant.id} className={glassCard("p-3")}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">
                              {participant.displayWallet}
                            </div>
                            <div className="mt-1 text-xs text-white/52">
                              {participant.side.toUpperCase()} · {participant.timeLabel}
                            </div>
                          </div>
                          <span
                            className={pill(
                              participant.side === "buy"
                                ? "emerald"
                                : participant.side === "sell"
                                  ? "amber"
                                  : participant.side === "lp"
                                    ? "cyan"
                                    : "neutral",
                            )}
                          >
                            {participant.side}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className={statCard("py-2")}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Amount</div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {compactMoney(participant.amount)} {participant.amountDenom}
                            </div>
                          </div>
                          <div className={statCard("py-2")}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Curve %</div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {participant.curvePercent.toFixed(2)}%
                            </div>
                          </div>
                          <div className={statCard("py-2")}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Early Float</div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {participant.earlyFloatPercent.toFixed(2)}%
                            </div>
                          </div>
                          <div className={statCard("py-2")}>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Bonding %</div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {participant.bondingPercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={glassCard("p-3")}>
                      <div className="text-sm text-white/84">No indexed participants available yet.</div>
                    </div>
                  )}
                </div>
              </div>

              <div className={terminalCard("p-4")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={sectionEyebrow()}>Integrity</div>
                    <div className="mt-2 text-base font-semibold text-white">Protection Status</div>
                  </div>
                  <span className={pill("amber")}>Guarded</span>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className={statCard()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Summary</div>
                    <div className="mt-2 text-sm text-white/84">
                      {protection?.summary || "Protection summary unavailable."}
                    </div>
                  </div>

                  <div className={statCard()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Next</div>
                    <div className="mt-2 text-sm text-white/84">
                      {protection?.next || "Protection next-step unavailable."}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={statCard()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Anti-Sniper</div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {protection?.antiSniper || "—"}
                      </div>
                    </div>
                    <div className={statCard()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Anti-Rug</div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {protection?.antiRug || "—"}
                      </div>
                    </div>
                    <div className={statCard()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Score</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {protection?.integrityScore ?? "—"}
                      </div>
                    </div>
                    <div className={statCard()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Liquidity</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {protection ? `${protection.creatorLockedLiquidityPercent}%` : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={terminalCard("p-4")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={sectionEyebrow()}>Graduation</div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {graduation?.stageLabel || leader?.stageLabel || "Building Momentum"}
                    </div>
                  </div>
                  <span className={stagePill(leader?.stage || "momentum")}>
                    {graduation ? `${graduation.progressPercent.toFixed(2)}%` : leader ? `${leader.progressPercent.toFixed(2)}%` : "—"}
                  </span>
                </div>

                <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(217,70,239,0.9),rgba(34,211,238,0.85),rgba(245,158,11,0.8))]"
                    style={{ width: `${Math.min(graduation?.progressPercent || leader?.progressPercent || 0, 100)}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-sm text-white/70">
                  <span>{graduation ? `${graduation.progressPercent.toFixed(2)}%` : leader ? `${leader.progressPercent.toFixed(2)}%` : "0.00%"} on curve</span>
                  <span>{graduation ? `$${compactMoney(graduation.usdRemainingToGraduate)} to graduate` : "$35,625 to graduate"}</span>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className={statCard()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Summary</div>
                    <div className="mt-2 text-sm text-white/84">
                      {graduation?.summary || "Graduation summary unavailable."}
                    </div>
                  </div>

                  <div className={statCard()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Next</div>
                    <div className="mt-2 text-sm text-white/84">
                      {graduation?.next || "Graduation next-step unavailable."}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className={statCard()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Holders</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {graduation ? `${graduation.holdersCurrent}/${graduation.holdersTarget}` : "12/180"}
                    </div>
                  </div>
                  <div className={statCard()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Momentum</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {graduation ? `${graduation.momentumCurrent}/${graduation.momentumTarget}` : "20/70"}
                    </div>
                  </div>
                  <div className={statCard()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Policy</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {graduation
                        ? `$${compactMoney(graduation.graduationTargetUsdMin)}–$${compactMoney(graduation.graduationTargetUsdMax)}`
                        : "$60,000–$65,000"}
                    </div>
                  </div>
                  <div className={statCard()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">LP</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {graduation ? `$${compactMoney(graduation.lpTargetUsd)}` : "$15,000"}
                    </div>
                  </div>
                </div>
              </div>

              <div className={terminalCard("p-4")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={sectionEyebrow()}>Chat</div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {social?.chatTitle || `${leader?.symbol || "Token"} chat`}
                    </div>
                  </div>
                  <button type="button" className={actionButton(false)}>Join chat</button>
                </div>

                <div className="mt-2 text-sm text-white/68">
                  {social?.chatPrompt || "Chat with others"}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={pill(social?.watchIntensity === "high" ? "amber" : social?.watchIntensity === "building" ? "cyan" : "neutral")}>
                    {social?.watchIntensity || "low"} watch
                  </span>
                  <span className={pill("pink")}>{social?.narrativePhase || "forming"}</span>
                </div>
              </div>

              <div className={terminalCard("p-4")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={sectionEyebrow()}>Get Notified</div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {social?.notificationTitle || "Notification Surface"}
                    </div>
                  </div>
                  <button type="button" className={actionButton(false)}>Find out more</button>
                </div>

                <div className="mt-2 text-sm text-white/68">
                  {social?.notificationPrompt || "Get mobile app for coin notifications."}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className={statCard("py-3")}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Buy Pressure</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {social?.buyPressureLabel || "Unavailable"}
                    </div>
                  </div>
                  <div className={statCard("py-3")}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Sell Pressure</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {social?.sellPressureLabel || "Unavailable"}
                    </div>
                  </div>
                  <div className={statCard("py-3")}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">LP Attention</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {social?.lpAttentionLabel || "Unavailable"}
                    </div>
                  </div>
                </div>
              </div>

              <div className={terminalCard("p-4")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={sectionEyebrow()}>Top Holders</div>
                    <div className="mt-2 text-base font-semibold text-white">Holder Pressure</div>
                  </div>
                  <button type="button" className={actionButton(false)}>Bubble map</button>
                </div>

                <div className="mt-4 space-y-3">
                  <div className={statCard()}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-white/72">Liquidity pool</span>
                      <span className="font-semibold text-white">
                        {holderPressure ? `${holderPressure.liquidityPoolPercent.toFixed(2)}%` : "98.99%"}
                      </span>
                    </div>
                  </div>

                  <div className={statCard()}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-white/72">{holderPressure?.topWalletLabel || "Top wallet"}</span>
                      <span className="font-semibold text-white">
                        {holderPressure ? `${holderPressure.topWalletPercent.toFixed(2)}%` : "1.01%"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={terminalCard("p-4")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={sectionEyebrow()}>Newly Launched</div>
                    <div className="mt-2 text-base font-semibold text-white">Authority Surface</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {newlyLaunched.length ? (
                    newlyLaunched.map((item) => (
                      <div key={item.id} className={glassCard("p-3")}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{item.tokenName}</div>
                            <div className="mt-1 text-xs text-white/52">{item.symbol} · {item.ageLabel}</div>
                          </div>
                          <span className={pill(item.trend === "ready" ? "cyan" : item.trend === "hot" ? "amber" : "pink")}>
                            {item.trend}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={glassCard("p-3")}>
                      <div className="text-sm text-white/84">
                        No newly launched authority rows available yet.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={terminalCard("p-4")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={sectionEyebrow()}>Signals</div>
                    <div className="mt-2 text-base font-semibold text-white">Social Pulse</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className={glassCard("p-3")}>
                    <div className="text-sm text-white/84">
                      {social?.sentimentSummary || "Social pulse unavailable."}
                    </div>
                  </div>

                  {(social?.speculationNotes ?? []).length ? (
                    social!.speculationNotes.map((note) => (
                      <div key={note} className={glassCard("p-3")}>
                        <div className="text-sm text-white/84">{note}</div>
                      </div>
                    ))
                  ) : (
                    <div className={glassCard("p-3")}>
                      <div className="text-sm text-white/84">
                        No speculation notes available yet.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
