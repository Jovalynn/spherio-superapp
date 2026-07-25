"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { executeRioLightPumpTrade } from "@/lib/riolight";
import { executeSpherioRioLightAction } from "@/lib/riolight/execution";
import {
  createRioLightGlobalHandoverIntent,
  rioLightExplorerProofHref,
} from "@/lib/riolight/handover";
import { RioLightPortfolioPanel } from "@/components/riolight/RioLightPortfolioPanel";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveLaunchLifecycle } from "@/lib/launch/resolveLaunchLifecycle";

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
  pairAddress?: string | null;
  reserveLabel?: string | null;
  liquidityStatus?: string | null;
  graduationStatus?: string | null;
  routes?: {
    trade: string;
    pool: string | null;
    screener: string;
    explorer: string;
  };
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

type LaunchCardAccent = "aqua" | "sunset" | "violet" | "gold" | "mint" | "amber" | "slate" | "emerald";
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

type PumpIndexedTraderRow = {
  tokenAddress: string;
  wallet: string;
  rioBought: number;
  rioSold: number;
  netRio: number;
  buyUrio: string;
  sellUrio: string;
  tokenBoughtBase: string;
  tokenSoldBase: string;
  buyCount: number;
  sellCount: number;
  tradeCount: number;
  buyContributionPct: number;
  sellContributionPct: number;
  lastActivityAt: string | null;
  lastActivityHeight: number | null;
};

type PumpIndexedTraderSummary = {
  totalBuyRio: number;
  totalSellRio: number;
  netBuyRio: number;
  totalBuyUrio: string;
  totalSellUrio: string;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  uniqueTraders: number;
  uniqueBuyers: number;
  uniqueSellers: number;
};

type PumpIndexedTradersResponse = {
  ok: boolean;
  source?: string;
  tokenAddress?: string;
  summary?: PumpIndexedTraderSummary;
  traders?: PumpIndexedTraderRow[];
  error?: string;
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

function actionButton(primary = false, striking = false) {
  if (striking) {
    return "inline-flex h-10 items-center justify-center rounded-2xl border border-cyan-400/35 bg-[linear-gradient(90deg,rgba(34,211,238,0.16),rgba(217,70,239,0.16))] px-4 text-sm font-semibold text-white hover:translate-y-[-1px]";
  }
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
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: max }).format(value);
}

const PUMP_FINALIZER_ADDRESS = "rio1e9hszjll3d4pkn74n2th47wwyyh228wn2vhmsf";
const PUMP_REQUIRED_TOKEN_RESERVE_BASE = "200000000000000";

type PumpCreateApiResponse =
  | {
      ok: true;
      tokenAddress?: string;
      txHash?: string;
      message?: string;
    }
  | {
      ok: false;
      error?: string;
    };

function isPumpCreateError(data: PumpCreateApiResponse): data is { ok: false; error?: string } {
  return data.ok === false;
}

function extractPumpContractAddressFromExecute(result: any): string | null {
  const events = Array.isArray(result?.events) ? result.events : [];

  for (const event of events) {
    if (event?.type !== "wasm") continue;
    const attrs = Array.isArray(event.attributes) ? event.attributes : [];
    const action = attrs.find((a: any) => a?.key === "action")?.value;
    const contract = attrs.find((a: any) => a?.key === "contract")?.value;

    if (action === "token_created" && typeof contract === "string" && contract.startsWith("rio1")) {
      return contract;
    }
  }

  for (const event of events) {
    if (event?.type !== "instantiate") continue;
    const attrs = Array.isArray(event.attributes) ? event.attributes : [];
    const contract = attrs.find((a: any) => a?.key === "_contract_address")?.value;

    if (typeof contract === "string" && contract.startsWith("rio1")) {
      return contract;
    }
  }

  if (typeof result?.contractAddress === "string" && result.contractAddress.startsWith("rio1")) {
    return result.contractAddress;
  }

  return null;
}

function toPumpBaseUnits(value: string, decimals = 6): bigint {
  const raw = value.trim();
  if (!raw) return 0n;

  const [wholePart, fracPart = ""] = raw.split(".");
  const whole = wholePart.replace(/[^\d]/g, "") || "0";
  const frac = fracPart.replace(/[^\d]/g, "").slice(0, decimals).padEnd(decimals, "0");

  return BigInt(`${whole}${frac}`);
}

function compactMoney(value: number) {
  if (!Number.isFinite(value)) return "0.00";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}

function formatCurvePrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0";

  if (value < 0.000001) return value.toExponential(4);
  if (value < 0.01) return value.toFixed(8);
  if (value < 1) return value.toFixed(6);

  return compactMoney(value);
}

function shortAddress(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return "—";
  if (text.length <= 16) return text;
  return `${text.slice(0, 8)}…${text.slice(-6)}`;
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

function isAddressLike(value?: string | null) {
  return Boolean(value && /^rio1[a-z0-9]{20,}$/i.test(value.trim()));
}

function hasPumpLpOrMarketProof(row?: PumpBoardRow | null) {
  return Boolean(
    row?.liquidityStatus === "ready" ||
      row?.liquidityStatus === "live" ||
      row?.graduationStatus === "completed" ||
      row?.graduationStatus === "pair_created" ||
      row?.pairAddress,
  );
}

function isPumpGraduationPending(row?: PumpBoardRow | null) {
  return Boolean(row && Number(row.progressPercent || 0) >= 100 && !hasPumpLpOrMarketProof(row));
}

function resolvePumpBoardLifecycle(row?: PumpBoardRow | null) {
  const curveReached = Number(row?.progressPercent || 0) >= 100;
  const hasLpOrMarketProof = hasPumpLpOrMarketProof(row);

  const trulyGraduated =
    Boolean(row) &&
    curveReached &&
    hasLpOrMarketProof;

  return resolveLaunchLifecycle({
    symbol: row?.symbol,
    assetId: row?.tokenAddress,
    contractAddress: row?.tokenAddress,
    pairAddress: row?.pairAddress,
    status: trulyGraduated ? "graduated" : row?.stage,
    lifecycleStatus: trulyGraduated ? "graduated" : row?.graduationStatus,
    graduated: trulyGraduated,
    curveProgress: row?.progressPercent,
    graduationProgress: row?.progressPercent,
    indexed: Boolean(row?.routes?.explorer || row?.routes?.screener),
    rioexIndexed: Boolean(row?.routes?.trade || row?.routes?.screener),
    rioexAssetId: row?.tokenAddress,
    liquidityAdded: hasLpOrMarketProof,
    tradeEnabled: trulyGraduated || Boolean(row?.routes?.trade) || Boolean(row?.pairAddress),
  });
}

function shouldHideDiscoveryDuplicate(row: PumpBoardRow, allRows: PumpBoardRow[]) {
  if (!isAddressLike(row.tokenName)) return false;

  return allRows.some((candidate) => {
    if (candidate.tokenAddress === row.tokenAddress) return false;
    if (isAddressLike(candidate.tokenName)) return false;

    const samePair = Boolean(row.pairAddress && candidate.pairAddress && row.pairAddress === candidate.pairAddress);
    const sameTradeRoute = Boolean(row.routes?.trade && candidate.routes?.trade && row.routes.trade === candidate.routes.trade);
    const sameSymbol = Boolean(row.symbol && candidate.symbol && row.symbol === candidate.symbol);

    return samePair || sameTradeRoute || sameSymbol;
  });
}

function dedupePumpBoardRows(inputRows: PumpBoardRow[]) {
  const seen = new Set<string>();
  const cleanRows: PumpBoardRow[] = [];

  for (const row of inputRows) {
    if (shouldHideDiscoveryDuplicate(row, inputRows)) continue;

    const lifecycle = resolvePumpBoardLifecycle(row);
    const stableKey = [
      row.pairAddress || "no-pair",
      row.routes?.trade || "no-trade-route",
      row.routes?.screener || "no-screener-route",
      row.tokenAddress,
      row.symbol,
      lifecycle.isGraduated ? "graduated" : row.stage,
    ]
      .join("|")
      .toLowerCase();

    if (seen.has(stableKey)) continue;
    seen.add(stableKey);
    cleanRows.push(row);
  }

  return cleanRows.map((row, index) => ({ ...row, rank: index + 1 }));
}

const chartToolIcons = ["+", "/", "=", "~", "⌁", "T", "☺", "⌗"];
const ranges: ChartRange[] = ["15m", "1d", "2d", "5d", "1w", "1mo", "5mo", "1y"];
const modes: ChartMode[] = ["candles", "line", "string", "area"];

function mapAuthorityTrendToDirection(trend: LaunchCardTrend): "up" | "flat" | "down" {
  if (trend === "hot") return "up";
  if (trend === "ready") return "up";
  return "flat";
}

function mapAuthorityCardToBoardRow(card: LaunchCardState, rank = 1): PumpBoardRow {
  const stage = card.trend === "ready" ? "ready" : card.trend === "hot" ? "watch" : "momentum";

  return {
    rank,
    tokenAddress: card.tokenAddress,
    tokenName: card.tokenName,
    symbol: card.symbol,
    launchRail: "pump.live",
    standard: "SPO-20",
    baseAsset: "RIO",
    stage,
    stageLabel: stage === "ready" ? "Graduation Watch" : stage === "watch" ? "Building Demand" : "Momentum",
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

function resolvePumpMarketLabels(row: PumpBoardRow | null, selectedChart: PumpChartRangeState | undefined, hasRealDiscoveryRows: boolean) {
  const lifecycle = resolvePumpBoardLifecycle(row);
  const hasChart = Boolean(selectedChart?.points?.length);
  const isGraduationPending = isPumpGraduationPending(row);
  const isGraduatedRealMarket = hasRealDiscoveryRows && lifecycle.isGraduated;

  if (!row) {
    return {
      marketCap: "Awaiting market",
      volume24h: "Awaiting swaps",
      price: "Awaiting AMM price",
      ath: "Awaiting trade history",
      open: "No candle yet",
      high: "No candle yet",
      low: "No candle yet",
      chartHigh: "No candle yet",
      chartLow: "No candle yet",
      marketHeaderReserve: "Pair indexing",
      marketHeaderPrice: "Awaiting AMM price",
      lp: "Pair indexing",
      tradeBadge: "RioDex Pending",
      chartEmptyTitle: "Awaiting first RioDex candle",
      chartEmptyBody: "Price will populate after indexed reserves or the first RioDex swap.",
    };
  }

  if (isGraduatedRealMarket) {
    const pairIndexed = Boolean(row.pairAddress || row.routes?.trade || row.routes?.pool || row.routes?.screener);
    const pairLabel = pairIndexed ? "Pair indexed · reserves pending" : "Pair indexing";

    return {
      marketCap: "Awaiting RioDex price",
      volume24h: "Awaiting swaps",
      price: "Awaiting AMM price",
      ath: "Awaiting trade history",
      open: hasChart ? compactMoney(selectedChart?.open ?? 0) : "No candle yet",
      high: hasChart ? compactMoney(selectedChart?.high ?? 0) : "No candle yet",
      low: hasChart ? compactMoney(selectedChart?.low ?? 0) : "No candle yet",
      chartHigh: hasChart ? compactMoney(selectedChart?.high ?? 0) : "No candle yet",
      chartLow: hasChart ? compactMoney(selectedChart?.low ?? 0) : "No candle yet",
      marketHeaderReserve: pairLabel,
      marketHeaderPrice: "Awaiting RioDex price",
      lp: pairLabel,
      tradeBadge: pairIndexed ? "Pair Indexed" : "RioDex Pending",
      chartEmptyTitle: pairIndexed ? "Graduated · awaiting first RioDex swap" : "Graduated · awaiting RioDex pair indexing",
      chartEmptyBody: pairIndexed
        ? `${row.symbol} completed bonding and has entered the RioDex phase. Candles will appear after the first indexed RioDex swap/reserve update.`
        : `${row.symbol} completed bonding. The chart will switch from Pump curve data to RioDex candles once the pair, LP proof, and first market event are indexed.`,
    };
  }

  return {
    marketCap: row.impliedMarketCapRio > 0 ? `${compactMoney(row.impliedMarketCapRio)} RIO` : "Curve market pending",
    volume24h: row.volume24hRio > 0 ? `${compactMoney(row.volume24hRio)} RIO` : "Awaiting volume",
    price: row.effectivePriceRio > 0 ? `${formatCurvePrice(row.effectivePriceRio)} RIO` : "Curve pending",
    ath: `${formatCurvePrice(selectedChart?.high ?? row.effectivePriceRio)} RIO`,
    open: formatCurvePrice(selectedChart?.open ?? row.effectivePriceRio),
    high: formatCurvePrice(selectedChart?.high ?? row.effectivePriceRio),
    low: formatCurvePrice(selectedChart?.low ?? row.effectivePriceRio),
    chartHigh: formatCurvePrice(selectedChart?.high ?? row.effectivePriceRio),
    chartLow: formatCurvePrice(selectedChart?.low ?? row.effectivePriceRio),
    marketHeaderReserve: row.reserveLabel || "Liquidity reserve pending",
    marketHeaderPrice: lifecycle.isGraduated ? "Awaiting RioDex price" : "Curve price active",
    lp: lifecycle.isLiquidityReady ? row.reserveLabel || "Ready" : "Pending",
    tradeBadge: lifecycle.isGraduated ? "RioDex Pending" : "Curve Active",
    chartEmptyTitle: isGraduationPending
      ? "Curve filled · graduation pending"
      : "Awaiting first bonding curve trade",
    chartEmptyBody: isGraduationPending
      ? "The bonding curve has reached its target. Trading visibility now depends on graduation finalization, LP seed proof, and the first indexed RioDex market event."
      : "This token is live in the bonding phase. The chart will populate after the first indexed Pump buy/sell from the bonding curve.",
  };
}

function getTradeHref(row: PumpBoardRow | null) {
  if (!row) return "/riodex/swap";
  if (row.routes?.trade) return row.routes.trade;
  if (row.pairAddress) return `/riodex/swap?pair=${row.pairAddress}`;
  return "/riodex/swap";
}

function getPoolHref(row: PumpBoardRow | null) {
  if (!row) return "/riodex/pools";
  if (row.routes?.pool) return row.routes.pool;
  if (row.pairAddress) return `/riodex/pool/${row.pairAddress}`;
  return "/riodex/pools";
}

export default function PumpBoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorFileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [indexedChartPoints, setIndexedChartPoints] = useState<PumpChartPoint[]>([]);
  const [indexedParticipants, setIndexedParticipants] = useState<PumpParticipantAuthorityRow[]>([]);
  const [indexedTraders, setIndexedTraders] = useState<PumpIndexedTraderRow[]>([]);
  const [indexedTraderSummary, setIndexedTraderSummary] = useState<PumpIndexedTraderSummary | null>(null);
  const [indexedTraderError, setIndexedTraderError] = useState<string | null>(null);
  const [rankedSearch, setRankedSearch] = useState("");
  const [rankedFilter, setRankedFilter] = useState<"all" | "active" | "with_trades" | "graduated">("all");

  const [creatorName, setCreatorName] = useState("");
  const [creatorTicker, setCreatorTicker] = useState("");
  const [creatorSupply, setCreatorSupply] = useState("1000000000");
  const [creatorDescription, setCreatorDescription] = useState("");
  const [creatorWebsite, setCreatorWebsite] = useState("");
  const [creatorTwitter, setCreatorTwitter] = useState("");
  const [creatorTelegram, setCreatorTelegram] = useState("");
  const [creatorDiscord, setCreatorDiscord] = useState("");
  const [creatorFile, setCreatorFile] = useState<File | null>(null);
  const [creatorFileName, setCreatorFileName] = useState("");
  const [creatorFilePreview, setCreatorFilePreview] = useState("");
  const [creatorLogoUrl, setCreatorLogoUrl] = useState("");
  const [isCreatingPumpToken, setIsCreatingPumpToken] = useState(false);
  const [creatorRailError, setCreatorRailError] = useState<string | null>(null);
  const [creatorRailNotice, setCreatorRailNotice] = useState<string | null>(null);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false);

  const pumpFactoryAddress =
    process.env.NEXT_PUBLIC_PUMP_FACTORY_ADDRESS ||
    process.env.NEXT_PUBLIC_SPO20_FACTORY_ADDRESS ||
    "";

  const pumpFactoryFeeUrio =
    process.env.NEXT_PUBLIC_PUMP_CREATE_FEE_URIO ||
    process.env.NEXT_PUBLIC_CREATE_TOKEN_FEE_URIO ||
    "5000000";

  function handleCreatorPickFile() {
    creatorFileInputRef.current?.click();
  }

  function handleCreatorFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setCreatorFile(file);
    setCreatorFileName(file?.name ?? "");
    setCreatorFilePreview(file ? URL.createObjectURL(file) : "");
  }

  function handleOpenCreateReview() {
    setCreatorRailError(null);
    setCreatorRailNotice(null);

    const name = creatorName.trim();
    const symbol = creatorTicker.trim().toUpperCase();
    const description = creatorDescription.trim();

    if (!name) {
      setCreatorRailError("Token name is required.");
      return;
    }

    if (!symbol) {
      setCreatorRailError("Ticker is required.");
      return;
    }

    if (!description) {
      setCreatorRailError("Description is required.");
      return;
    }

    void handleBoardCreatePumpToken();
  }

  async function handleBoardCreatePumpToken() {
    setCreatorRailError(null);
    setCreatorRailNotice(null);

    const name = creatorName.trim();
    const symbol = creatorTicker.trim().toUpperCase();
    const supply = creatorSupply.trim();
    const description = creatorDescription.trim();

    if (!pumpFactoryAddress) {
      setCreatorRailError("Missing Pump factory address.");
      return;
    }

    if (!name) {
      setCreatorRailError("Token name is required.");
      return;
    }

    if (!symbol) {
      setCreatorRailError("Ticker is required.");
      return;
    }

    if (!description) {
      setCreatorRailError("Description is required.");
      return;
    }

    try {
      setIsCreatingPumpToken(true);

      const baseSupply = toPumpBaseUnits(supply || "1000000000", 6);

      const msg = {
        create_token: {
          name,
          symbol,
          initial_supply: baseSupply.toString(),
          mintable: false,
          reserve_recipient: PUMP_FINALIZER_ADDRESS,
          reserve_amount: PUMP_REQUIRED_TOKEN_RESERVE_BASE,
        },
      };

      const requestId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `riolight-pump-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const feeRio = String(Number(pumpFactoryFeeUrio || "0") / 1_000_000);
      const displaySupply = supply || "1000000000";

      const execResult = await executeSpherioRioLightAction({
        surfaceKey: "pump_create",
        product: "Pump",
        action: "pump_create",
        contractAddress: pumpFactoryAddress,
        msg,
        funds: [{ denom: "urio", amount: pumpFactoryFeeUrio }],
        memo: "Pump.live Create Token",
        reviewTitle: "Pump Launch Creation",
        reviewSubtitle:
          "Review this Pump launch before RioLight signs and broadcasts. After creation, the bonding-curve launch path opens automatically.",
        spendAmount: feeRio,
        spendSymbol: "RIO",
        receiveAmount: displaySupply,
        receiveSymbol: symbol,
        routeLabel: "Pump launch factory",
        feeAmount: feeRio,
        feeSymbol: "RIO",
        contractLabel: "Pump.live Create Token",
        handoverIntent: createRioLightGlobalHandoverIntent({
          requestId,
          surface: "pump",
          product: "Pump",
          actionKind: "pump_create",
          actionLabel: "Create Pump Launch",
          walletAddress: null,
          contractAddress: pumpFactoryAddress,
          contractLabel: "Pump.live Create Token",
          title: "Pump Launch Creation",
          subtitle:
            "Review token creation, factory fee, broadcast, and receipt in one RioLight flow.",
          assets: [
            {
              label: "Factory fee",
              symbol: "RIO",
              assetId: "urio",
              assetType: "native",
              amount: feeRio,
              role: "fee",
            },
            {
              label: "Token supply",
              symbol,
              amount: displaySupply,
              role: "receive",
            },
          ],
          routeLabel: "Pump launch factory",
          feeAmount: feeRio,
          feeSymbol: "RIO",
          feeRecipient: pumpFactoryAddress,
          treasuryRecipient: pumpFactoryAddress,
          tokenAddress: null,
          msg,
          funds: [{ denom: "urio", amount: pumpFactoryFeeUrio }],
          riskNotes: [
            "Pump launches create public token metadata and a bonding-curve launch path.",
            "Verify token name, ticker, description, and supply before approval.",
          ],
          truthNotes: [
            "Pump creation uses the configured Pump factory contract.",
            "RioExplorer proof becomes available after broadcast and indexing.",
          ],
          proofHref: rioLightExplorerProofHref({ address: pumpFactoryAddress }),
          explorerHref: rioLightExplorerProofHref({ address: pumpFactoryAddress }),
          metadata: {
            projectName: name,
            symbol,
            totalSupply: displaySupply,
            description,
            source: "pump_board_create",
          },
        }),
        metadata: {
          projectName: name,
          symbol,
          totalSupply: supply || "1000000000",
          description,
          source: "pump_board_create",
        },
      });

      if ((execResult as any)?.status === "approval_opened") {
        setCreatorRailNotice(
          "RioLight approval opened. Complete review, confirmation, broadcast, and receipt in the single RioLight popup.",
        );
        setIsCreateReviewOpen(false);
        return;
      }

      const tokenAddress = extractPumpContractAddressFromExecute(execResult);
      const txHash = (execResult as any)?.transactionHash || (execResult as any)?.txHash || "";
      const createdHeight = Number((execResult as any)?.height || 0);
      const sender =
        (execResult as any)?.sender ||
        (execResult as any)?.signer ||
        (execResult as any)?.address ||
        "";

      if (!tokenAddress) {
        throw new Error("Create transaction was submitted through RioLight, but no token address was returned yet.");
      }

      const formData = new FormData();
      formData.append("coinName", name);
      formData.append("tokenName", name);
      formData.append("ticker", symbol);
      formData.append("symbol", symbol);
      formData.append("totalSupply", supply || "1000000000");
      formData.append("description", description);
      formData.append("website", creatorWebsite.trim());
      formData.append("twitter", creatorTwitter.trim());
      formData.append("telegram", creatorTelegram.trim());
      formData.append("discord", creatorDiscord.trim());
      formData.append("logoUrl", creatorLogoUrl.trim());
      formData.append("tokenAddress", tokenAddress);
      formData.append("txHash", txHash);
      formData.append("createdHeight", String(createdHeight));
      formData.append("creatorAddress", sender);

      if (creatorFile) {
        formData.append("logo", creatorFile);
      }

      const response = await fetch("/api/pump/create", {
        method: "POST",
        body: formData,
        cache: "no-store",
      });

      const responseText = await response.text();
      let data: PumpCreateApiResponse;

      try {
        data = JSON.parse(responseText) as PumpCreateApiResponse;
      } catch {
        throw new Error(
          `Pump token publish failed: non-JSON response ${response.status}. ${responseText.slice(0, 240)}`,
        );
      }

      if (!response.ok || isPumpCreateError(data)) {
        throw new Error(
          isPumpCreateError(data)
            ? data.error || "Pump token publish failed."
            : `Pump token publish failed with status ${response.status}.`,
        );
      }

      const finalTokenAddress = data.tokenAddress || tokenAddress;
      setCreatorRailNotice("Token created. Opening Bonding Curve page...");
      setIsCreateReviewOpen(false);
      setIsCreatorModalOpen(false);

      await fetchBoard(sort);

      router.push(`/createtoken/pump/token/${encodeURIComponent(finalTokenAddress)}?created=1`);
    } catch (err) {
      setCreatorRailError(err instanceof Error ? err.message : "Pump token creation failed.");
    } finally {
      setIsCreatingPumpToken(false);
    }
  }

  async function fetchBoard(nextSort: DiscoverSort) {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/pump/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort: nextSort, limit: 200, totalSupply: 1_000_000_000 }),
      });

      const data = (await response.json()) as PumpBoardResponse;
      if (!response.ok || !data.ok || !data.board) throw new Error(data.error || "Failed to load Pump board.");
      const orderedBoard = dedupePumpBoardRows(data.board).sort((a, b) => {
        const aLifecycle = resolvePumpBoardLifecycle(a);
        const bLifecycle = resolvePumpBoardLifecycle(b);

        const group = (row: PumpBoardRow, lifecycle: ReturnType<typeof resolvePumpBoardLifecycle>) => {
          if (lifecycle.isGraduated || row.stage === "graduated") return 4;
          if (row.stage === "watch") return 0;
          if (row.stage === "momentum") return 1;
          if (row.stage === "ready") return 2;
          return 3;
        };

        const groupDelta = group(a, aLifecycle) - group(b, bLifecycle);
        if (groupDelta !== 0) return groupDelta;

        const progressDelta = (b.progressPercent || 0) - (a.progressPercent || 0);
        if (progressDelta !== 0) return progressDelta;

        return (a.rank || 0) - (b.rank || 0);
      }).map((row, index) => ({ ...row, rank: index + 1 }));

      setRows(orderedBoard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Pump board.");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSurfaceState() {
    try {
      setSurfaceLoading(true);
      setSurfaceError(null);
      const response = await fetch("/api/launches/pump", { method: "GET", cache: "no-store" });
      const data = (await response.json()) as PumpLaunchSurfaceResponse;
      if (!response.ok || !data.ok || !data.state) throw new Error(data.error || "Failed to load Pump surface state.");
      setSurfaceState(data.state);
    } catch (err) {
      setSurfaceError(err instanceof Error ? err.message : "Failed to load Pump surface state.");
      setSurfaceState(null);
    } finally {
      setSurfaceLoading(false);
    }
  }

  useEffect(() => {
    void fetchBoard(sort);
  }, [sort]);

  useEffect(() => {
    if ((searchParams.get("create") || "").trim() === "1") {
      setIsCreatorModalOpen(true);

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("create");

      const nextQuery = nextParams.toString();
      router.replace(`/createtoken/pump/board${nextQuery ? `?${nextQuery}` : ""}`, {
        scroll: false,
      });
    }
  }, [router, searchParams]);

  useEffect(() => {
    setSurfaceLoading(false);
    setSurfaceError(null);
    setSurfaceState(null);
  }, []);
  const selectedTokenParam = (searchParams.get("token") || "").trim().toLowerCase();

  const leader = useMemo(() => {
    const selected =
      selectedTokenParam
        ? rows.find((row) => row.tokenAddress.toLowerCase() === selectedTokenParam)
        : null;

    if (selected) return selected;
    if (rows.length) return rows[0];
    if (surfaceState?.apexLeader) return mapAuthorityCardToBoardRow(surfaceState.apexLeader, 1);
    return null;
  }, [rows, selectedTokenParam, surfaceState]);

  const rankedRows = useMemo(() => {
    if (rows.length) return dedupePumpBoardRows(rows);
    if (surfaceState?.apexLeader) return [mapAuthorityCardToBoardRow(surfaceState.apexLeader, 1)];
    return [];
  }, [rows, surfaceState]);

  const boardCounts = useMemo(() => {
    return {
      listed: rankedRows.length,
      activeBonding: rankedRows.filter((row) => {
        const lifecycle = resolvePumpBoardLifecycle(row);
        return !lifecycle.isGraduated && lifecycle.curveProgress > 0;
      }).length,
      graduated: rankedRows.filter((row) => resolvePumpBoardLifecycle(row).isGraduated).length,
      withTrades: rankedRows.filter(
        (row) => Number(row.volume24hRio || 0) > 0 || Number(row.progressPercent || 0) > 0,
      ).length,
    };
  }, [rankedRows]);

  const filteredRankedRows = useMemo(() => {
    const query = rankedSearch.trim().toLowerCase();

    return rankedRows.filter((row) => {
      const lifecycle = resolvePumpBoardLifecycle(row);
      const hasTextMatch = !query
        ? true
        : [row.tokenName, row.symbol, row.tokenAddress]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

      const hasTrades =
        Number(row.volume24hRio || 0) > 0 || Number(row.progressPercent || 0) > 0;

      const hasFilterMatch =
        rankedFilter === "all"
          ? true
          : rankedFilter === "active"
            ? !lifecycle.isGraduated && lifecycle.curveProgress > 0
            : rankedFilter === "with_trades"
              ? hasTrades
              : lifecycle.isGraduated;

      return hasTextMatch && hasFilterMatch;
    });
  }, [rankedRows, rankedSearch, rankedFilter]);

  const hasRealDiscoveryRows = rows.length > 0;
  const leaderLifecycle = resolvePumpBoardLifecycle(leader);

  const lifecycle = hasRealDiscoveryRows
    ? {
        rail: "pump" as const,
        progressPercent: leaderLifecycle.curveProgress || leader?.progressPercent || 0,
        steps: [
          { key: "create", label: "Create", status: "complete" as const },
          { key: "bonding", label: "Bonding Curve", status: leaderLifecycle.isGraduated ? "complete" as const : "active" as const },
          { key: "auto_lp", label: "Auto LP", status: leaderLifecycle.isLiquidityReady ? "complete" as const : "pending" as const },
          { key: "screener", label: "Screener", status: leaderLifecycle.isGraduated ? "complete" as const : "pending" as const },
          { key: "trade", label: "Trade", status: leaderLifecycle.isTradeReady ? "active" as const : "pending" as const },
          { key: "rioex", label: "RioEx", status: leaderLifecycle.isRioExIndexed ? "complete" as const : "optional" as const },
        ],
      }
    : surfaceState?.lifecycle ?? { rail: "pump" as const, progressPercent: leader?.progressPercent || 0, steps: [] };

  const protection = hasRealDiscoveryRows ? null : surfaceState?.protection;
  const graduation = hasRealDiscoveryRows ? null : surfaceState?.graduation;
  const launchOutput = hasRealDiscoveryRows ? null : surfaceState?.launchOutput;
  const participants = hasRealDiscoveryRows ? indexedParticipants : surfaceState?.participants ?? [];
  const authorityChart = surfaceState?.chart ?? null;
  const selectedChart = authorityChart?.ranges[chartRange];
  const chartPoints = hasRealDiscoveryRows
    ? indexedChartPoints
    : selectedChart?.points ?? [];
  const social = hasRealDiscoveryRows ? null : surfaceState?.social;

  useEffect(() => {
    let cancelled = false;

    async function fetchIndexedChart() {
      if (!hasRealDiscoveryRows || !leader?.tokenAddress) {
        setIndexedChartPoints([]);
        setIndexedParticipants([]);
        setIndexedTraders([]);
        setIndexedTraderSummary(null);
        setIndexedTraderError(null);
        return;
      }

      try {
        const response = await fetch("/api/pump/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenAddress: leader.tokenAddress, limit: 80 }),
        });

        const data = await response.json();

        if (!cancelled) {
          const points = data?.ok && Array.isArray(data.points) ? data.points : [];
          setIndexedChartPoints(points);

          setIndexedParticipants(
            points
              .slice(-8)
              .reverse()
              .map((point: any, index: number) => ({
                id: String(point.txHash || `${point.blockHeight || 0}-${index}`),
                wallet: String(point.traderAddress || point.txHash || "indexed-trader"),
                displayWallet: String(point.traderAddress || "").startsWith("backend:")
                  ? "Backend Test"
                  : point.traderAddress
                    ? `${String(point.traderAddress).slice(0, 10)}…${String(point.traderAddress).slice(-6)}`
                    : `Trade ${point.t || index + 1}`,
                side: point.side === "sell" ? "sell" : "buy",
                amount: Number(point.volume || 0),
                amountDenom: "RIO",
                curvePercent: leader?.progressPercent || 0,
                earlyFloatPercent: 0,
                bondingPercent: leader?.progressPercent || 0,
                timeLabel: point.txHash
                  ? `${String(point.txHash).slice(0, 10)}…${String(point.txHash).slice(-6)}`
                  : `h${point.blockHeight || "indexed"}`,
              })),
          );

          const traderResponse = await fetch(
            `/api/pump/traders?tokenAddress=${encodeURIComponent(leader.tokenAddress)}&limit=25`,
            { method: "GET", cache: "no-store" },
          );

          const traderData = (await traderResponse.json()) as PumpIndexedTradersResponse;

          if (!cancelled) {
            if (traderResponse.ok && traderData.ok) {
              setIndexedTraders(Array.isArray(traderData.traders) ? traderData.traders : []);
              setIndexedTraderSummary(traderData.summary || null);
              setIndexedTraderError(null);
            } else {
              setIndexedTraders([]);
              setIndexedTraderSummary(null);
              setIndexedTraderError(traderData.error || "Failed to load indexed traders.");
            }
          }
        }
      } catch {
        if (!cancelled) {
          setIndexedChartPoints([]);
          setIndexedParticipants([]);
          setIndexedTraders([]);
          setIndexedTraderSummary(null);
          setIndexedTraderError("Failed to load indexed trader activity.");
        }
      }
    }

    fetchIndexedChart();

    return () => {
      cancelled = true;
    };
  }, [hasRealDiscoveryRows, leader?.tokenAddress]);

  const marketLabels = useMemo(
    () => resolvePumpMarketLabels(leader, hasRealDiscoveryRows ? { range: chartRange, points: indexedChartPoints, open: 0, high: 0, low: 0, close: 0, volume: 0 } : selectedChart, hasRealDiscoveryRows),
    [leader, selectedChart, hasRealDiscoveryRows, indexedChartPoints, chartRange],
  );

  const chartPath = useMemo(() => {
    if (!chartPoints.length) return "";
    const min = Math.min(...chartPoints.map((p) => p.close));
    const max = Math.max(...chartPoints.map((p) => p.close));
    const spread = Math.max(max - min, 1);
    return chartPoints
      .map((point, index) => {
        const x = 40 + index * (930 / Math.max(chartPoints.length - 1, 1));
        const y = 410 - ((point.close - min) / spread) * 340;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartPoints]);

  const chartAreaPath = useMemo(() => {
    if (!chartPoints.length || !chartPath) return "";
    const lastX = 40 + (chartPoints.length - 1) * (930 / Math.max(chartPoints.length - 1, 1));
    return `${chartPath} L ${lastX} 440 L 40 440 Z`;
  }, [chartPath, chartPoints]);

  async function fetchPumpQuote(side: "buy" | "sell", amount: string) {
    if (!leader || resolvePumpBoardLifecycle(leader).isGraduated) return;
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
        body: JSON.stringify({ side, amount: normalizedAmount, tokenAddress: leader.tokenAddress, symbol: leader.symbol, totalSupply: 1_000_000_000 }),
      });
      const data = (await response.json()) as PumpQuoteResponse;
      if (!response.ok || !data.ok || !data.quote) throw new Error(data.error || "Failed to fetch quote.");
      if (side === "buy") setBuyQuote(data.quote);
      else setSellQuote(data.quote);
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Failed to fetch quote.");
      if (side === "buy") setBuyQuote(null);
      else setSellQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  }

  async function executePumpTrade(side: "buy" | "sell") {
    if (!leader || resolvePumpBoardLifecycle(leader).isGraduated) return;
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
      const data = (await executeRioLightPumpTrade({
          side,
          amount: normalizedAmount,
          tokenAddress: leader.tokenAddress,
          symbol: leader.symbol,
          totalSupply: 1_000_000_000,
        })) as PumpExecuteResponse & {
          rioLight?: { address: string; adapter: string; chainId: string };
        };

        if (!data.ok || !data.execution) throw new Error(data.error || "Execution failed.");
      const walletSuffix = data.rioLight?.address

        ? ` Wallet: ${data.rioLight.address.slice(0, 10)}…${data.rioLight.address.slice(-6)}`

        : "";


      setExecutionNotice(`${data.execution.message}${walletSuffix}`);
      setLastTxHash(data.execution.txHash);
      await fetchPumpQuote("buy", buyRioIn);
      await fetchPumpQuote("sell", sellTokenIn);
      await fetchBoard(sort);
      await fetchSurfaceState();
    } catch (err) {
      setExecutionError(err instanceof Error ? err.message : "Execution failed.");
    } finally {
      setIsExecutingTrade(false);
    }
  }

  useEffect(() => {
    if (leader && !resolvePumpBoardLifecycle(leader).isGraduated) void fetchPumpQuote("buy", buyRioIn);
    else setBuyQuote(null);
  }, [leader?.tokenAddress, leader?.symbol, leader?.stage, buyRioIn]);

  useEffect(() => {
    if (leader && !resolvePumpBoardLifecycle(leader).isGraduated) void fetchPumpQuote("sell", sellTokenIn);
    else setSellQuote(null);
  }, [leader?.tokenAddress, leader?.symbol, leader?.stage, sellTokenIn]);

  return (
    <main className={shell()}>
      {isCreatorModalOpen ? (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-black/76 px-4 py-20 backdrop-blur-md">
          <div className="w-full max-w-[760px] rounded-2xl border border-[#23314f] bg-[#09111f] p-5 md:p-6 shadow-[0_30px_120px_rgba(0,0,0,0.80)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="text-center flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-fuchsia-200/70">
                  Create PUMP
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                  Create PUMP Token
                </h2>
                <div className="mt-2 text-xs leading-5 text-white/55">
                  After creation, the Bonding Curve page opens automatically.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatorModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/88">
                  Coin name
                </label>
                <input
                  value={creatorName}
                  onChange={(event) => setCreatorName(event.target.value)}
                  placeholder="Name your coin"
                  className="h-11 w-full rounded-2xl border border-cyan-300/24 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/88">
                  Ticker
                </label>
                <input
                  value={creatorTicker}
                  onChange={(event) => setCreatorTicker(event.target.value.toUpperCase())}
                  placeholder="DOGE"
                  className="h-11 w-full rounded-2xl border border-cyan-300/24 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/88">
                Total supply
              </label>
              <input
                value={creatorSupply}
                onChange={(event) => setCreatorSupply(event.target.value)}
                placeholder="1000000000"
                className="h-11 w-full rounded-2xl border border-cyan-300/24 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/88">
                Description
              </label>
              <textarea
                value={creatorDescription}
                onChange={(event) => setCreatorDescription(event.target.value)}
                rows={3}
                placeholder="Write a short description"
                className="w-full rounded-2xl border border-cyan-300/24 bg-[#040916] px-4 py-3 text-sm text-white outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(10,18,34,0.92),rgba(7,12,24,0.98))] p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white/88">
                  Add social links
                  <span className="ml-2 text-cyan-100/40">(Optional)</span>
                </div>
                <div className="text-cyan-100/40">—</div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <input value={creatorWebsite} onChange={(event) => setCreatorWebsite(event.target.value)} placeholder="Website" className="h-11 rounded-2xl border border-cyan-300/24 bg-[rgba(9,20,38,0.92)] px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70 focus:bg-[rgba(11,26,48,0.98)]" />
                <input value={creatorTwitter} onChange={(event) => setCreatorTwitter(event.target.value)} placeholder="X / Twitter" className="h-11 rounded-2xl border border-cyan-300/24 bg-[rgba(9,20,38,0.92)] px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70 focus:bg-[rgba(11,26,48,0.98)]" />
                <input value={creatorTelegram} onChange={(event) => setCreatorTelegram(event.target.value)} placeholder="Telegram" className="h-11 rounded-2xl border border-cyan-300/24 bg-[rgba(9,20,38,0.92)] px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70 focus:bg-[rgba(11,26,48,0.98)]" />
                <input value={creatorDiscord} onChange={(event) => setCreatorDiscord(event.target.value)} placeholder="Discord" className="h-11 rounded-2xl border border-cyan-300/24 bg-[rgba(9,20,38,0.92)] px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70 focus:bg-[rgba(11,26,48,0.98)]" />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/88">
                Logo / Image / GIF
              </label>

              <input
                ref={creatorFileInputRef}
                type="file"
                accept="image/*,.gif"
                className="hidden"
                onChange={handleCreatorFileChange}
              />

              <div className="rounded-2xl border border-dashed border-cyan-300/55 bg-[#061326] px-4 py-5 text-center shadow-[inset_0_0_0_1px_rgba(34,211,238,0.08)]">
                {creatorFilePreview ? (
                  <img
                    src={creatorFilePreview}
                    alt="Selected token media preview"
                    className="mx-auto mb-4 max-h-28 rounded-xl border border-white/10 object-contain"
                  />
                ) : creatorLogoUrl.trim() ? (
                  <img
                    src={creatorLogoUrl.trim()}
                    alt="Logo URL preview"
                    className="mx-auto mb-4 max-h-28 rounded-xl border border-white/10 object-contain"
                  />
                ) : null}

                <div className="text-sm font-semibold text-cyan-50/90">
                  {creatorFileName || "Drag and drop an image or GIF"}
                </div>

                <button
                  type="button"
                  onClick={handleCreatorPickFile}
                  className="mt-4 rounded-xl border border-cyan-300/70 bg-cyan-400/14 px-5 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/20"
                >
                  Select a file
                </button>
              </div>

              <label className="mt-3 block">
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/72">
                  Logo URL
                  <span className="ml-2 text-cyan-100/38">(Optional)</span>
                </div>
                <input
                  value={creatorLogoUrl}
                  onChange={(event) => setCreatorLogoUrl(event.target.value)}
                  placeholder="https://example.com/logo.png or ipfs://..."
                  className="h-11 w-full rounded-2xl border border-cyan-300/24 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70"
                />
                <p className="mt-2 text-xs leading-5 text-cyan-50/45">
                  Upload a file or paste a logo URL. If both are provided, the uploaded file is used first.
                </p>
              </label>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateReview}
              disabled={isCreatingPumpToken}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-5 text-sm font-bold text-[#04111d] transition hover:opacity-95 disabled:opacity-50"
            >
              {isCreatingPumpToken ? "Creating..." : "Create Pump Token"}
            </button>

            <div className="mt-3 rounded-xl border border-cyan-300/30 bg-cyan-500/[0.10] px-4 py-3 text-center text-xs leading-5 text-cyan-50/90">
              After creation, your Bonding Curve page opens automatically for live monitoring.
            </div>

            {creatorRailError ? (
              <div className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/14 px-4 py-3 text-sm font-medium text-rose-100">
                {creatorRailError}
              </div>
            ) : null}

            {creatorRailNotice ? (
              <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/14 px-4 py-3 text-sm font-medium text-emerald-100">
                {creatorRailNotice}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isCreateReviewOpen ? (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/78 px-4 py-8 backdrop-blur-md">
          <div className="w-full max-w-[520px] rounded-[28px] border border-cyan-300/25 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,rgba(7,15,30,0.98),rgba(4,8,18,1))] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.85)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">
                  RioLight Confirmation
                </div>
                <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-white">
                  Review Pump Creation
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  Review the token details before signing. RioLight prepares the launch, then your connected wallet signs the on-chain creation transaction.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateReviewOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/42">Token</div>
                <div className="mt-1 text-lg font-bold text-white">
                  {creatorName.trim() || "Unnamed Token"}
                  <span className="ml-2 text-sm font-semibold text-cyan-200/80">
                    ({creatorTicker.trim().toUpperCase() || "TICKER"})
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/42">Total Supply</div>
                  <div className="mt-1 text-sm font-bold text-white">{creatorSupply || "1000000000"}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/42">Route</div>
                  <div className="mt-1 text-sm font-bold text-cyan-100">Pump.live → Bonding Curve</div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-100/85">
                RioLight will prepare the launch. Your connected wallet will open next for final signing. After approval, the Bonding Curve page opens automatically.
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsCreateReviewOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCreateReviewOpen(false);
                  void handleBoardCreatePumpToken();
                }}
                disabled={isCreatingPumpToken}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-5 text-sm font-black text-[#04111d] transition hover:opacity-95 disabled:opacity-50"
              >
                {isCreatingPumpToken ? "Creating..." : "Confirm & Open Wallet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1640px] p-3 sm:p-4">
        <div className="space-y-4">
          <div className={terminalCard("p-5")}>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-4xl">
                  <div className={sectionEyebrow()}>Pump.live</div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Discovery Board</h1>
                  <div className="mt-3 text-sm text-white/68">
                    Live-ranked launches across the Pump.live rail. Lifecycle, market, LP, trade, and RioEx states are resolved through one truth-first lifecycle layer.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={pill("pink")}>Momentum</span>
                    <span className={pill("cyan")}>Graduation Watch</span>
                    <span className={pill("amber")}>Graduated</span>
                    <span className={pill("emerald")}>RIO Market</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["trending", "progress", "marketCap", "new"] as DiscoverSort[]).map((item) => (
                    <button key={item} type="button" onClick={() => setSort(item)} className={sort === item ? actionButton(true) : actionButton(false)}>
                      {item === "marketCap" ? "Market Cap" : item[0].toUpperCase() + item.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {leader ? (
                  <Link
                    href={`/createtoken/pump/token/${encodeURIComponent(leader.tokenAddress)}`}
                    className={actionButton(true, true)}
                  >
                    Open Bonding Curve Page
                  </Link>
                ) : (
                  <Link href="/createtoken/pump/create" className={actionButton(true, true)}>
                    Create PUMP Token
                  </Link>
                )}
                <Link href="/createtoken/prime" className={actionButton(false, true)}>Prime Token</Link>
                <Link href="/riodex/screener" className={actionButton(false, true)}>Screener</Link>
                <Link href="/riodex/swap" className={actionButton(false, true)}>Trade</Link>
                <Link href="/rioex" className={actionButton(false, true)}>RioEx</Link>
                <Link href="/rioexplorer" className={actionButton(false, true)}>RioExplorer</Link>
              </div>
            </div>
          </div>

          <div className={terminalCard("p-4")}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-4 rounded-2xl border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,16,30,0.86),rgba(5,10,20,0.96))] px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/70">
                        RioLight Wallet Authority
                      </div>
                      <div className="mt-1 text-sm text-white/62">
                        RioLight stays active in the background for Pump creation, trading, and lifecycle actions.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-4 text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/16"
                    >
                      Connect RioLight
                    </button>
                  </div>
                </div>

                <div className={sectionEyebrow()}>Pump lifecycle</div>
                <div className="mt-2 text-lg font-semibold text-white">Create → Bonding Curve → Auto LP → Screener → Trade → RioEx</div>
                <div className="mt-1 text-sm text-white/62">
                  Create Pump tokens from this Board, then open the Bonding Curve page for detailed token progress, trades, graduation, LP proof, and reward monitoring.
                </div>

                {leader ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/createtoken/pump/token/${encodeURIComponent(leader.tokenAddress)}`}
                      className={actionButton(true)}
                    >
                      Open Bonding Curve Page
                    </Link>


                  </div>
                ) : null}
              </div>
              <div className="hidden w-full max-w-[430px] rounded-[24px] border border-cyan-300/15 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.12),transparent_34%),linear-gradient(180deg,rgba(8,15,30,0.92),rgba(5,9,18,0.98))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
                      Creator Rail
                    </div>
                    <div className="mt-1 text-xl font-bold tracking-[-0.03em] text-white">
                      Create Pump Token
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/55">
                      Simple AI-ready launch rail. After creation, the Bonding Curve page opens automatically.
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/40">
                      Lifecycle
                    </div>
                    <div className="mt-1 text-lg font-bold text-cyan-300">
                      {lifecycle.progressPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    value={creatorName}
                    onChange={(event) => setCreatorName(event.target.value)}
                    placeholder="Token name"
                    className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none placeholder:text-cyan-100/40 focus:border-cyan-300/35"
                  />

                  <input
                    value={creatorTicker}
                    onChange={(event) => setCreatorTicker(event.target.value.toUpperCase())}
                    placeholder="Ticker"
                    className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none placeholder:text-cyan-100/40 focus:border-cyan-300/35"
                  />
                </div>

                <textarea
                  value={creatorDescription}
                  onChange={(event) => setCreatorDescription(event.target.value)}
                  rows={3}
                  placeholder="Short description"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder:text-cyan-100/40 focus:border-cyan-300/35"
                />

                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] leading-5 text-white/48">
                  AI Assist will help polish naming and description later. It will not generate financial promises or guaranteed-return language.
                </div>

                <button
                  type="button"
                  onClick={handleBoardCreatePumpToken}
                  disabled={isCreatingPumpToken}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-4 text-xs font-bold text-[#04111d] transition hover:opacity-95 disabled:opacity-50"
                >
                  {isCreatingPumpToken ? "Creating..." : "Create Pump Token"}
                </button>

                {creatorRailError ? (
                  <div className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {creatorRailError}
                  </div>
                ) : null}

                {creatorRailNotice ? (
                  <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {creatorRailNotice}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-5 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.98),rgba(168,85,247,0.96),rgba(251,191,36,0.92))]" style={{ width: `${Math.min(lifecycle.progressPercent, 100)}%` }} />
            </div>

            <div className="mt-5 rounded-[24px] border border-cyan-300/24 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,rgba(8,15,30,0.94),rgba(5,9,18,0.99))] px-5 py-4 text-center shadow-[0_22px_70px_rgba(0,0,0,0.30)]">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/90">
                Creator Rail
              </div>
              <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-white">
                Launch a Pump Token
              </h2>
              <p className="mx-auto mt-1 max-w-2xl text-sm leading-6 text-white/70">
                Create from this Discovery Board. After successful creation, your Bonding Curve page opens automatically.
              </p>
              <button
                type="button"
                onClick={() => setIsCreatorModalOpen(true)}
                className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl border border-cyan-300/45 bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-9 py-3 text-base font-black uppercase tracking-[0.18em] text-[#04111d] shadow-[0_18px_55px_rgba(34,211,238,0.22)] transition hover:scale-[1.01] hover:opacity-95"
              >
                CLICK HERE TO CREATE PUMP TOKEN
              </button>
            </div>

            <div className="hidden">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/24 px-4 py-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">
                    Pump Creator Modal
                  </div>
                  <div className="mt-1 text-xs text-white/58">
                    Fill the full creation rail. Successful creation opens the Bonding Curve page automatically.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatorModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/90">
                    Creator Rail
                  </div>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-white">
                    Create Pump Token
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
                    Create from the Discovery Board. After successful creation, the Bonding Curve page opens automatically for monitoring, trades, graduation, LP proof, and rewards.
                  </p>
                </div>

                <div className="rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(168,85,247,0.08))] px-4 py-3 text-xs leading-5 text-white/72">
                  AI Assist-ready. We will polish token identity and description without generating financial promises or guaranteed-return language.
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/88">
                    Coin name
                  </label>
                  <input
                    value={creatorName}
                    onChange={(event) => setCreatorName(event.target.value)}
                    placeholder="Name your coin"
                    className="h-11 w-full rounded-2xl border border-cyan-300/24 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/88">
                    Ticker
                  </label>
                  <input
                    value={creatorTicker}
                    onChange={(event) => setCreatorTicker(event.target.value.toUpperCase())}
                    placeholder="DOGE"
                    className="h-11 w-full rounded-2xl border border-cyan-300/24 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/88">
                  Total supply
                </label>
                <input
                  value={creatorSupply}
                  onChange={(event) => setCreatorSupply(event.target.value)}
                  placeholder="1000000000"
                  className="h-11 w-full rounded-2xl border border-cyan-300/24 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/88">
                  Description
                </label>
                <textarea
                  value={creatorDescription}
                  onChange={(event) => setCreatorDescription(event.target.value)}
                  rows={4}
                  placeholder="Write a short description"
                  className="w-full rounded-2xl border border-cyan-300/24 bg-[#040916] px-4 py-3 text-sm text-white outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(10,18,34,0.92),rgba(7,12,24,0.98))] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white/88">
                    Add social links
                    <span className="ml-2 text-cyan-100/40">(Optional)</span>
                  </div>
                  <div className="text-cyan-100/40">—</div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <input
                    value={creatorWebsite}
                    onChange={(event) => setCreatorWebsite(event.target.value)}
                    placeholder="Website"
                    className="h-11 rounded-2xl border border-cyan-300/24 bg-[rgba(9,20,38,0.92)] px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70 focus:bg-[rgba(11,26,48,0.98)]"
                  />

                  <input
                    value={creatorTwitter}
                    onChange={(event) => setCreatorTwitter(event.target.value)}
                    placeholder="X / Twitter"
                    className="h-11 rounded-2xl border border-cyan-300/24 bg-[rgba(9,20,38,0.92)] px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70 focus:bg-[rgba(11,26,48,0.98)]"
                  />

                  <input
                    value={creatorTelegram}
                    onChange={(event) => setCreatorTelegram(event.target.value)}
                    placeholder="Telegram"
                    className="h-11 rounded-2xl border border-cyan-300/24 bg-[rgba(9,20,38,0.92)] px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70 focus:bg-[rgba(11,26,48,0.98)]"
                  />

                  <input
                    value={creatorDiscord}
                    onChange={(event) => setCreatorDiscord(event.target.value)}
                    placeholder="Discord"
                    className="h-11 rounded-2xl border border-cyan-300/24 bg-[rgba(9,20,38,0.92)] px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-cyan-100/35 focus:border-cyan-300/70 focus:bg-[rgba(11,26,48,0.98)]"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/88">
                  Logo / Image / GIF
                </label>

                <input
                  ref={creatorFileInputRef}
                  type="file"
                  accept="image/*,.gif"
                  className="hidden"
                  onChange={handleCreatorFileChange}
                />

                <div className="rounded-2xl border border-dashed border-cyan-300/55 bg-[linear-gradient(180deg,rgba(10,24,45,0.58),rgba(7,15,28,0.92))] px-4 py-6 text-center shadow-[inset_0_0_0_1px_rgba(34,211,238,0.08)]">
                  {creatorFilePreview ? (
                    <img
                      src={creatorFilePreview}
                      alt="Selected token media preview"
                      className="mx-auto mb-4 max-h-28 rounded-xl border border-white/10 object-contain"
                    />
                  ) : null}

                  <div className="text-sm font-semibold text-cyan-50/90">
                    {creatorFileName || "Drag and drop an image or GIF"}
                  </div>

                  <button
                    type="button"
                    onClick={handleCreatorPickFile}
                    className="mt-4 rounded-xl border border-cyan-300/70 bg-cyan-400/14 px-5 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/20"
                  >
                    Select a file
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBoardCreatePumpToken}
                disabled={isCreatingPumpToken}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-5 text-sm font-bold text-[#04111d] transition hover:opacity-95 disabled:opacity-50"
              >
                {isCreatingPumpToken ? "Creating..." : "Create Pump Token"}
              </button>

              <div className="mt-3 rounded-xl border border-cyan-300/30 bg-cyan-500/[0.10] px-4 py-3 text-center text-xs leading-5 text-cyan-50/90">
                After creation, your Bonding Curve page opens automatically for live monitoring.
              </div>

              {creatorRailError ? (
                <div className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/14 px-4 py-3 text-sm font-medium text-rose-100">
                  {creatorRailError}
                </div>
              ) : null}

              {creatorRailNotice ? (
                <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/14 px-4 py-3 text-sm font-medium text-emerald-100">
                  {creatorRailNotice}
                </div>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
              {lifecycle.steps.map((step) => {
                const isCompleted = step.status === "complete";
                const isActive = step.status === "active";
                const isOptional = step.status === "optional";
                return (
                  <div key={step.key} className={`rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition ${isCompleted ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-200" : isActive ? "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200" : isOptional ? "border-amber-400/25 bg-amber-500/8 text-amber-200" : "border-white/10 bg-white/[0.03] text-white/58"}`}>
                    {step.label}
                  </div>
                );
              })}
            </div>
            {surfaceLoading ? <div className="mt-4 text-sm text-white/55">Loading authority state...</div> : null}
            {surfaceError ? <div className="mt-4 text-sm text-rose-300">{surfaceError}</div> : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.24fr)_minmax(320px,0.76fr)]">
            <div className="space-y-4">
              <div className={terminalCard("p-4")}>
                {leader ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-fuchsia-400/22 bg-[linear-gradient(180deg,rgba(217,70,239,0.18),rgba(34,211,238,0.08))] text-xl font-bold text-white">{leader.symbol.slice(0, 2)}</div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-2xl font-bold tracking-[-0.03em] text-white">{leader.tokenName}</div>
                            <span className={pill("cyan")}>{leader.symbol}</span>
                            {isPumpGraduationPending(leader) ? (
                              <span className="inline-flex rounded-full border border-amber-300/25 bg-amber-500/[0.12] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100">
                                Graduation Pending
                              </span>
                            ) : (
                              <span className={stagePill(leaderLifecycle.isGraduated ? "graduated" : leader.stage)}>
                                {leaderLifecycle.isGraduated ? "GRADUATED" : leader.stageLabel}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/58">
                            <span>{leader.tokenAddress}</span>
                            <span>{leader.createdAtLabel}</span>
                            <span>{leader.baseAsset}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/createtoken/pump/board?token=${encodeURIComponent(leader.tokenAddress)}`} className={actionButton(false)}>Selected</Link>
                        <Link
                          href={`/createtoken/pump/token/${encodeURIComponent(leader.tokenAddress)}`}
                          className={actionButton(true)}
                        >
                          Bonding Curve
                        </Link>
                        <Link
                          href={`/rioexplorer/spo20/${encodeURIComponent(leader.tokenAddress)}`}
                          className={actionButton(false)}
                        >
                          RioExplorer
                        </Link>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className={sectionEyebrow()}>Launch Progression</div>
                          <div className="mt-2 text-xl font-semibold text-white">Create → LP → Screener → Trade → RioEx</div>
                        </div>
                        {isPumpGraduationPending(leader) ? (
                          <span className="inline-flex rounded-full border border-amber-300/25 bg-amber-500/[0.12] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100">
                            Graduation Pending
                          </span>
                        ) : (
                          <span className={stagePill(leaderLifecycle.isGraduated ? "graduated" : leader.stage)}>
                            {leaderLifecycle.isGraduated ? "GRADUATED" : leader.stage}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
                        <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(217,70,239,0.92),rgba(34,211,238,0.88),rgba(245,158,11,0.85))]" style={{ width: `${Math.min(lifecycle.progressPercent, 100)}%` }} />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-5">
                        {lifecycle.steps.slice(0, 5).map((step) => (
                          <div key={step.key} className={`rounded-2xl border px-4 py-3 text-sm ${step.status === "complete" || step.status === "active" ? "border-fuchsia-400/24 bg-fuchsia-500/10 text-white" : "border-white/10 bg-white/[0.03] text-white/65"}`}>
                            {step.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(5,9,20,0.92),rgba(8,12,22,0.98))] p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className={sectionEyebrow()}>{leaderLifecycle.isGraduated ? "RioDex Market State" : hasRealDiscoveryRows ? "Market State" : "Market Cap"}</div>
                          <div className="mt-2 text-3xl font-semibold text-white">{marketLabels.marketCap}</div>
                          <div className={`mt-1 text-sm ${leaderLifecycle.isGraduated ? "text-cyan-300" : trendTone(leader.trendDirection)}`}>
                            {leaderLifecycle.isGraduated ? "Graduated · awaiting RioDex market feed" : `+0 (${leader.trendDirection === "up" ? "+strong" : leader.trendDirection === "down" ? "-cooling" : "stable"}) 24hr`}
                          </div>
                        </div>
                        <div className="w-full max-w-[320px] text-right">
                          <div className="mx-auto h-2 w-full rounded-full bg-white/15">
                            <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.4),rgba(134,239,172,0.9))]" style={{ width: `${Math.min(Math.max(leaderLifecycle.curveProgress || leader.progressPercent || 0, 0), 100)}%` }} />
                          </div>
                          <div className="mt-2 text-sm text-white/82">ATH {marketLabels.ath}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-white/86">
                        <span className={chartRange === "1d" ? "text-white" : "text-white/78"}>24h</span>
                        <span className="text-white/78">Trade Display</span>
                        <span className="text-white/78">Hide All Bubbles</span>
                        <span className={chartMode === "line" ? "text-white" : "text-white/78"}>Price / MCap</span>
                        <span className="text-emerald-300">RIO / RUSD</span>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-[52px_minmax(0,1fr)]">
                        <div className="rounded-[18px] border border-white/8 bg-black/10 p-2">
                          <div className="flex flex-col gap-2">
                            {chartToolIcons.map((icon) => (
                              <button key={icon} type="button" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.02] text-xs text-white/70 hover:bg-white/[0.05]">{icon}</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-[14px] border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/86">
                            {hasRealDiscoveryRows ? (
                              <>
                                <span className="font-medium">{leader.symbol}/{leader.baseAsset} Market State</span> · {leaderLifecycle.lifecycleLabel} · <span className="text-cyan-300">{marketLabels.marketHeaderReserve}</span> · <span className="text-white/70">{marketLabels.marketHeaderPrice}</span>
                              </>
                            ) : (
                              <>
                                <span className="font-medium">{leader.symbol}/{leader.baseAsset} Market Cap</span> · {chartRange} · Pump · <span className="text-cyan-300">O {marketLabels.open}</span> <span className="text-rose-300">H {marketLabels.high}</span> <span className="text-white">L {marketLabels.low}</span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {ranges.map((range) => <button key={range} type="button" onClick={() => setChartRange(range)} className={chartRange === range ? actionButton(true) : actionButton(false)}>{range}</button>)}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {modes.map((mode) => <button key={mode} type="button" onClick={() => setChartMode(mode)} className={chartMode === mode ? actionButton(true) : actionButton(false)}>{mode}</button>)}
                          </div>

                          <div className="relative h-[440px] overflow-hidden rounded-[18px] border border-white/8 bg-[radial-gradient(circle_at_20%_0%,rgba(217,70,239,0.08),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.06),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0.00))]">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
                            <svg viewBox="0 0 1000 480" className="absolute inset-0 h-full w-full">
                              {chartMode === "candles" && chartPoints.length
                                ? chartPoints.map((point, index) => {
                                    const min = Math.min(...chartPoints.map((p) => p.low));
                                    const max = Math.max(...chartPoints.map((p) => p.high));
                                    const spread = Math.max(max - min, 1);
                                    const x = 60 + index * (860 / Math.max(chartPoints.length - 1, 1));
                                    const openY = 410 - ((point.open - min) / spread) * 340;
                                    const closeY = 410 - ((point.close - min) / spread) * 340;
                                    const highY = 410 - ((point.high - min) / spread) * 340;
                                    const lowY = 410 - ((point.low - min) / spread) * 340;
                                    const top = Math.min(openY, closeY);
                                    const height = Math.max(Math.abs(closeY - openY), 8);
                                    const bullish = point.close >= point.open;
                                    return (
                                      <g key={point.t}>
                                        <line x1={x} y1={highY} x2={x} y2={lowY} stroke={bullish ? "rgba(34,211,238,0.85)" : "rgba(217,70,239,0.85)"} strokeWidth="3" />
                                        <rect x={x - 15} y={top} width="30" height={height} fill={bullish ? "rgba(34,211,238,0.85)" : "rgba(217,70,239,0.85)"} />
                                      </g>
                                    );
                                  })
                                : null}
                              {chartMode === "area" && chartAreaPath ? <><path d={chartAreaPath} fill="rgba(34,211,238,0.18)" /><path d={chartPath} fill="none" stroke="rgba(34,211,238,0.92)" strokeWidth="3" /></> : null}
                              {(chartMode === "line" || chartMode === "string") && chartPath ? <path d={chartPath} fill="none" stroke="rgba(34,211,238,0.92)" strokeWidth={chartMode === "string" ? "2" : "3"} strokeDasharray={chartMode === "string" ? "6 6" : undefined} /> : null}
                            </svg>
                            {!chartPoints.length ? (
                              <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                                <div className="w-full max-w-[520px] rounded-2xl border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(6,14,28,0.86),rgba(2,6,14,0.92))] px-5 py-5 shadow-[0_18px_70px_-35px_rgba(0,0,0,0.95)] backdrop-blur-md">
                                  <div className="mx-auto mb-3 inline-flex rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100">
                                    {leaderLifecycle.isGraduated ? "RioDex phase" : isPumpGraduationPending(leader) ? "Graduation phase" : "Bonding phase"}
                                  </div>
                                  <div className="text-base font-bold text-white">{marketLabels.chartEmptyTitle}</div>
                                  <div className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/62">{marketLabels.chartEmptyBody}</div>
                                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.95),rgba(217,70,239,0.95),rgba(245,158,11,0.9))]"
                                      style={{ width: `${Math.min(Math.max(leaderLifecycle.curveProgress || leader?.progressPercent || 0, 0), 100)}%` }}
                                    />
                                  </div>
                                  <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-white/38">
                                    <span>Curve progress</span>
                                    <span>{Math.min(Math.max(leaderLifecycle.curveProgress || leader?.progressPercent || 0, 0), 100).toFixed(2)}%</span>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                            <div className="absolute right-4 top-3 text-xs text-white/52">{marketLabels.chartHigh}</div>
                            <div className="absolute right-4 bottom-28 text-xs text-white/52">{marketLabels.chartLow}</div>
                            <div className="absolute bottom-3 left-4 flex gap-3 text-xs text-white/65">{chartPoints.map((p) => <span key={p.t}>{p.t}</span>)}</div>
                            <div className="absolute bottom-3 right-4 flex gap-3 text-xs text-white/65"><span>20:18:17 UTC</span><span>%</span><span>log</span><span className="text-cyan-300">auto</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-5">
                        {[
                          ["Vol " + chartRange, marketLabels.volume24h],
                          ["Price", marketLabels.price],
                          ["Open", marketLabels.open],
                          ["High", marketLabels.high],
                          ["Low", marketLabels.low],
                        ].map(([label, value]) => (
                          <div key={label} className={statCard("py-4")}><div className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</div><div className="mt-2 text-base font-semibold text-white">{value}</div></div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                      <div className={glassCard("p-4")}>
                        <div className="flex items-center justify-between gap-3">
                          <div><div className={sectionEyebrow()}>Trade</div><div className="mt-2 text-base font-semibold text-white">Buy / Sell</div></div>
                          <span className={pill(leaderLifecycle.isGraduated ? "amber" : "pink")}>{marketLabels.tradeBadge}</span>
                        </div>

                        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
                          {leaderLifecycle.isGraduated ? (
                            <div className="space-y-3">
                              <div className="rounded-2xl border border-amber-400/15 bg-amber-500/8 p-4 text-sm text-amber-100">Pump curve trading is closed for this asset. Use RioDex once indexed reserves or swaps produce the market price.</div>
                              <Link href={getTradeHref(leader)} className={actionButton(true)}>Open RioDex Trade</Link>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1">
                                <button type="button" onClick={() => setTradeSide("buy")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tradeSide === "buy" ? "bg-emerald-400 text-slate-950" : "text-white/70"}`}>Buy</button>
                                <button type="button" onClick={() => setTradeSide("sell")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tradeSide === "sell" ? "bg-amber-400 text-slate-950" : "text-white/70"}`}>Sell</button>
                              </div>
                              {tradeSide === "buy" ? (
                                <div className="mt-4 space-y-3">
                                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0a0f1c] px-4 py-3"><input className="min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-slate-500" value={buyRioIn} onChange={(e) => setBuyRioIn(e.target.value)} placeholder="0.0" /><span className="text-sm font-semibold text-white/80">RIO</span></div>
                                  <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setBuyRioIn("0.1")} className={actionButton(false)}>0.1 RIO</button><button type="button" onClick={() => setBuyRioIn("0.5")} className={actionButton(false)}>0.5 RIO</button><button type="button" onClick={() => setBuyRioIn("1")} className={actionButton(false)}>1 RIO</button><button type="button" onClick={() => setBuyRioIn("5")} className={actionButton(false)}>Max</button></div>
                                  <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/72">{isLoadingQuote ? "Loading quote..." : buyQuote ? `Est. ${formatNumber(Math.round(buyQuote.estimatedAmountOut))} ${buyQuote.estimatedAmountOutDenom}` : "Enter amount"}</div>
                                  {buyQuote ? <div className="text-xs text-white/50">Fee {buyQuote.feeAmount} {buyQuote.feeDenom} · Price {buyQuote.effectivePriceRio} RIO</div> : null}
                                  <button type="button" onClick={() => executePumpTrade("buy")} disabled={isExecutingTrade} className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{isExecutingTrade ? "Buying..." : "Buy"}</button>
                                </div>
                              ) : (
                                <div className="mt-4 space-y-3">
                                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0a0f1c] px-4 py-3"><input className="min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-slate-500" value={sellTokenIn} onChange={(e) => setSellTokenIn(e.target.value)} placeholder="0.0" /><span className="text-sm font-semibold text-white/80">{leader.symbol}</span></div>
                                  <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/72">{isLoadingQuote ? "Loading quote..." : sellQuote ? `Est. ${sellQuote.estimatedAmountOut.toFixed(2)} ${sellQuote.estimatedAmountOutDenom}` : "Enter amount"}</div>
                                  {sellQuote ? <div className="text-xs text-white/50">Fee {sellQuote.feeAmount} {sellQuote.feeDenom} · Price {sellQuote.effectivePriceRio} RIO</div> : null}
                                  <button type="button" onClick={() => executePumpTrade("sell")} disabled={isExecutingTrade} className="w-full rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{isExecutingTrade ? "Selling..." : "Sell"}</button>
                                </div>
                              )}
                            </>
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
                            <div className="mt-2 text-xl font-bold tracking-[-0.03em] text-white">
                              {leader.tokenName}
                              <span className="ml-2 text-sm font-semibold text-cyan-200/80">
                                ({leader.symbol})
                              </span>
                            </div>
                            <div className="mt-1 break-all text-xs text-white/55">{leader.tokenAddress}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={pill("pink")}>{leader.launchRail}</span>
                            <span className={pill("cyan")}>{leader.standard}</span>
                            <span className={pill("amber")}>{leader.baseAsset}</span>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 xl:grid-cols-3"><div className={glassCard("p-3")}><div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Route</div><div className="mt-2 text-sm text-white/75">{launchOutput?.routeLabel || (leaderLifecycle.isGraduated ? "RioDex" : "Pump.live")}</div></div><div className={glassCard("p-3")}><div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Economics</div><div className="mt-2 text-sm text-white/75">{leaderLifecycle.isGraduated ? "Awaiting reserves / swaps" : launchOutput?.economicsLabel || "$60,000–$65,000 / $15,000"}</div></div><div className={glassCard("p-3")}><div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Base</div><div className="mt-2 text-sm text-white/75">{launchOutput?.baseAsset || "RIO"}</div></div></div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-5"><Link href={getPoolHref(leader)} className={actionButton(false)}>Add LP</Link><Link href="/createtoken/pump/board" className={actionButton(false)}>Discovery</Link><Link href={getTradeHref(leader)} className={actionButton(true)}>Trade</Link><Link href="/rioex" className={actionButton(false)}>RioEx</Link><Link href="/createtoken/pump" className={actionButton(false)}>Preview</Link></div>
                      </div>
                    </div>
                  </div>
                ) : <div className="p-6 text-sm text-white/60">{isLoading || surfaceLoading ? "Loading discovery leader..." : "No discovery leader available."}</div>}
              </div>

              <div className={terminalCard("p-4")}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className={sectionEyebrow()}>Board</div>
                    <div className="mt-2 text-lg font-semibold text-white">Ranked Launches</div>
                    <div className="mt-2 inline-flex rounded-full border border-cyan-300/15 bg-cyan-500/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100/65">
                      Source: pump_live_tokens + pump_live_curve_state + pump_live_trades
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/40">Listed</div>
                        <div className="mt-1 text-sm font-semibold text-white">{boardCounts.listed}</div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/40">Active Bonding</div>
                        <div className="mt-1 text-sm font-semibold text-cyan-100">{boardCounts.activeBonding}</div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/40">Graduated</div>
                        <div className="mt-1 text-sm font-semibold text-emerald-100">{boardCounts.graduated}</div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/40">With Trades</div>
                        <div className="mt-1 text-sm font-semibold text-fuchsia-100">{boardCounts.withTrades}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex min-w-[280px] flex-col items-end gap-2">
                    <input
                      value={rankedSearch}
                      onChange={(event) => setRankedSearch(event.target.value)}
                      placeholder="Search token, ticker, address..."
                      className="w-full max-w-[320px] rounded-xl border border-cyan-300/15 bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder:text-cyan-100/40 focus:border-cyan-300/40"
                    />

                    <div className="flex w-full max-w-[320px] flex-wrap items-center justify-end gap-2">
                      {[
                        ["all", "All"],
                        ["active", "Active"],
                        ["with_trades", "With Trades"],
                        ["graduated", "Graduated"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRankedFilter(value as "all" | "active" | "with_trades" | "graduated")}
                          className={
                            rankedFilter === value
                              ? "rounded-full border border-cyan-300/25 bg-cyan-500/[0.14] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100"
                              : "rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 hover:text-white/75"
                          }
                        >
                          {label}
                        </button>
                      ))}

                      <span className={pill("neutral")}>
                        {filteredRankedRows.length}/{rankedRows.length} listed
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10">
                  <div className="grid grid-cols-[72px_1.4fr_0.9fr_0.8fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-3 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50"><div>Rank</div><div>Asset</div><div>MCap</div><div>Curve %</div><div>Watchers</div><div>Momentum</div><div>Stage</div><div>Height</div></div>
                  <div className="max-h-[420px] divide-y divide-white/8 overflow-y-auto [scrollbar-color:rgba(34,211,238,0.45)_rgba(255,255,255,0.06)] [scrollbar-width:thin]">
                    {isLoading ? <div className="px-4 py-10 text-sm text-white/50">Loading Pump board...</div> : error ? <div className="px-4 py-10 text-sm text-rose-300">{error}</div> : filteredRankedRows.length ? filteredRankedRows.map((row) => {
                      const rowLifecycle = resolvePumpBoardLifecycle(row);
                      return (
                        <button key={row.tokenAddress} type="button" onClick={() => {
                            router.push(`/createtoken/pump/board?token=${encodeURIComponent(row.tokenAddress)}`, { scroll: false });
                            setRows((prev) => {
                              const next = [...prev];
                              const idx = next.findIndex((x) => x.tokenAddress === row.tokenAddress);
                              if (idx > 0) {
                                const [picked] = next.splice(idx, 1);
                                next.unshift(picked);
                                return next.map((item, index) => ({ ...item, rank: index + 1 }));
                              }
                              return prev;
                            });
                          }} className={`grid w-full grid-cols-[72px_1.4fr_0.9fr_0.8fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-3 px-4 py-4 text-left text-sm transition ${
                            row.tokenAddress === leader?.tokenAddress
                              ? "bg-cyan-500/[0.10] ring-1 ring-cyan-300/35 shadow-[inset_4px_0_0_rgba(34,211,238,0.85),0_0_28px_rgba(34,211,238,0.08)]"
                              : "hover:bg-white/[0.03]"
                          }`}>
                          <div className="flex items-center">
                            <span
                              className={
                                row.tokenAddress === leader?.tokenAddress
                                  ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-500/15 font-semibold text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.16)]"
                                  : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-semibold text-white"
                              }
                            >
                              {row.rank}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-400/18 bg-fuchsia-500/10 text-xs font-bold text-white">
                                {row.symbol.slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-bold tracking-[-0.02em] text-white">
                                  {row.tokenName}
                                  <span className="ml-1 text-xs font-semibold text-cyan-200/75">
                                    ({row.symbol})
                                  </span>
                                </div>
                                <div
                                  className="truncate font-mono text-xs text-white/40"
                                  title={row.tokenAddress}
                                >
                                  {shortAddress(row.tokenAddress)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-white/84">{rowLifecycle.isGraduated ? "Pending" : `${compactMoney(row.impliedMarketCapRio)} RIO`}</div>
                          <div className="text-cyan-300">{rowLifecycle.curveProgress.toFixed(2)}%</div>
                          <div className="text-white/78">{formatNumber(row.watcherCount)}</div>
                          <div className="text-white/84">{row.momentumScore.toFixed(2)}</div>
                          <div>
                            {row.tokenAddress === leader?.tokenAddress ? (
                              <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-500/[0.12] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                                Selected
                              </span>
                            ) : isPumpGraduationPending(row) ? (
                              <span className="inline-flex rounded-full border border-amber-300/25 bg-amber-500/[0.12] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100">
                                Graduation Pending
                              </span>
                            ) : (
                              <span className={stagePill(rowLifecycle.isGraduated ? "graduated" : row.stage)}>
                                {rowLifecycle.isGraduated ? "GRADUATED" : row.stage}
                              </span>
                            )}
                          </div>
                          <div className="text-white/52">{row.createdAtLabel}</div>
                        </button>
                      );
                    }) : (
                      <div className="px-4 py-10 text-sm text-white/50">
                        No Pump tokens match this search.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className={terminalCard("p-4")}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={sectionEyebrow()}>Lifecycle Preview</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        Selected Token Status
                      </div>
                      <p className="mt-1 text-sm leading-6 text-white/58">
                        Quick status for the selected token. Open the Bonding Curve page for full monitoring, graduation proof, and creator reward tracking.
                      </p>
                    </div>

                    <span className={stagePill(leaderLifecycle.isGraduated ? "graduated" : leader?.stage || "watch")}>
                      {leaderLifecycle.isGraduated
                        ? "GRADUATED"
                        : isPumpGraduationPending(leader)
                          ? "GRADUATION"
                          : "BONDING"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                        Participants
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {participants.length ? `${participants.length} indexed activity rows` : "No indexed activity yet"}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-white/45">
                        Buyer/seller activity appears as trades are indexed.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                        Protection
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {protection ? "Guarded" : "Monitoring"}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-white/45">
                        Anti-sniper, anti-rug, liquidity, and manipulation checks are monitored.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                        Graduation
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {leaderLifecycle.isGraduated
                          ? "Graduated"
                          : isPumpGraduationPending(leader)
                            ? "Graduation pending"
                            : "Bonding"}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-white/45">
                        {leaderLifecycle.isGraduated
                          ? "Token has moved into the post-bonding market lifecycle."
                          : isPumpGraduationPending(leader)
                            ? "Curve target has been reached. LP/proof handoff is next."
                            : "Continue bonding curve activity until the graduation target is reached."}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.06] p-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/55">
                      Next Step
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {leaderLifecycle.isGraduated
                        ? "Monitor RioDex market activity"
                        : isPumpGraduationPending(leader)
                          ? "Verify graduation and LP proof"
                          : "Continue Bonding Curve"}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/48">
                      Use the full Bonding Curve page for lifecycle intelligence, proof links, and reward status.
                    </p>
                  </div>

                  {leader ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link
                        href={`/createtoken/pump/token/${encodeURIComponent(leader.tokenAddress)}`}
                        className={actionButton(true)}
                      >
                        Open Bonding Curve
                      </Link>

                      <Link
                        href={`/rioexplorer/spo20/${encodeURIComponent(leader.tokenAddress)}`}
                        className={actionButton(false)}
                      >
                        RioExplorer Proof
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={terminalCard("p-4")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={sectionEyebrow()}>Bonding Curve Intelligence</div>
                    <div className="mt-2 text-lg font-semibold text-white">Live Buyer Contribution</div>
                    <p className="mt-1 text-sm leading-6 text-white/58">
                      Wallet-level contribution view for the selected Pump token. Real buyer rows appear only after indexed trades exist.
                    </p>
                  </div>
                  <span className={pill(leaderLifecycle.isGraduated ? "emerald" : "cyan")}>
                    {leaderLifecycle.isGraduated ? "Finalized" : "Live"}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.06] p-3">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-cyan-100/55">
                    <span>Bonding gauge</span>
                    <span>{Math.min(Math.max(leaderLifecycle.curveProgress || leader?.progressPercent || 0, 0), 100).toFixed(2)}%</span>
                  </div>

                  <div className="mt-3 grid grid-cols-10 gap-1">
                    {Array.from({ length: 10 }).map((_, index) => {
                      const progress = Math.min(Math.max(leaderLifecycle.curveProgress || leader?.progressPercent || 0, 0), 100);
                      const segmentFilled = progress >= (index + 1) * 10;
                      const segmentActive = progress > index * 10 && progress < (index + 1) * 10;

                      return (
                        <div
                          key={index}
                          className={
                            segmentFilled
                              ? "h-3 rounded-full bg-cyan-300"
                              : segmentActive
                                ? "h-3 rounded-full bg-fuchsia-400"
                                : "h-3 rounded-full bg-white/10"
                          }
                          title={`${index * 10}-${(index + 1) * 10}%`}
                        />
                      );
                    })}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Curve progress</div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {Math.min(Math.max(leaderLifecycle.curveProgress || leader?.progressPercent || 0, 0), 100).toFixed(2)}%
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Current curve value</div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {leader ? `${compactMoney(leader.impliedMarketCapRio)} RIO` : "—"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Indexed traders</div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {indexedTraderSummary ? `${indexedTraderSummary.uniqueTraders} wallets / ${indexedTraderSummary.tradeCount} trades` : "0"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/24 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Top trader wallets</div>
                      <div className="mt-1 text-sm font-semibold text-white">Indexed buy / sell contribution</div>
                      <div className="mt-1 text-[11px] leading-5 text-white/45">
                        Bonding gauge shows total curve progress. Wallet contribution bars show each wallet's share of indexed buy volume.
                      </div>
                    </div>
                    <span className={pill("neutral")}>
                      {indexedTraderSummary ? `${indexedTraderSummary.uniqueTraders} wallets` : "Awaiting data"}
                    </span>
                  </div>

                  {indexedTraderSummary ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Buy volume</div>
                        <div className="mt-1 text-sm font-semibold text-emerald-100">
                          {compactMoney(indexedTraderSummary.totalBuyRio)} RIO
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Sell volume</div>
                        <div className="mt-1 text-sm font-semibold text-rose-100">
                          {compactMoney(indexedTraderSummary.totalSellRio)} RIO
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Net flow</div>
                        <div className="mt-1 text-sm font-semibold text-cyan-100">
                          {compactMoney(indexedTraderSummary.netBuyRio)} RIO
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {indexedTraderError ? (
                    <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                      {indexedTraderError}
                    </div>
                  ) : null}

                  <div className="mt-3 space-y-2">
                    {indexedTraders.length ? (
                      indexedTraders.slice(0, 8).map((trader, index) => (
                        <div key={`${trader.wallet}-${index}`} className="grid grid-cols-[34px_1fr_0.65fr_0.65fr_0.65fr_0.5fr_0.55fr_0.8fr] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-500/10 font-semibold text-cyan-100">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-mono text-white/80" title={trader.wallet}>
                              {shortAddress(trader.wallet)}
                            </div>
                          </div>
                          <div className="text-right font-semibold text-emerald-100">
                            {trader.rioBought > 0 ? `${compactMoney(trader.rioBought)} RIO` : "—"}
                          </div>
                          <div className="text-right font-semibold text-rose-100">
                            {trader.rioSold > 0 ? `${compactMoney(trader.rioSold)} RIO` : "—"}
                          </div>
                          <div className="text-right font-semibold text-cyan-100">
                            {compactMoney(trader.netRio)} RIO
                          </div>
                          <div className="text-right text-cyan-200">
                            {trader.buyContributionPct > 0 ? `${trader.buyContributionPct.toFixed(2)}%` : "—"}
                          </div>
                          <div className="text-right text-white/55">
                            {trader.buyCount}/{trader.sellCount}
                          </div>
                          <div className="min-w-[72px]">
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-cyan-300"
                                style={{
                                  width: `${Math.min(Math.max(trader.buyContributionPct || 0, 0), 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-cyan-300/20 bg-cyan-500/[0.04] px-3 py-4 text-sm leading-6 text-white/55">
                        No indexed trader activity yet. Once buy or sell trades are indexed, this panel will show wallet, RIO bought, RIO sold, net flow, contribution percentage, and buy/sell count.
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-[34px_1fr_0.65fr_0.65fr_0.65fr_0.5fr_0.55fr_0.8fr] gap-2 px-3 text-[10px] uppercase tracking-[0.12em] text-white/32">
                    <div>#</div>
                    <div>Wallet</div>
                    <div className="text-right">Bought</div>
                    <div className="text-right">Sold</div>
                    <div className="text-right">Net</div>
                    <div className="text-right">Buy %</div>
                    <div className="text-right">B/S</div>
                    <div>Contribution</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
