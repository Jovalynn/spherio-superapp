"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ExchangeSurfaceNav from "@/components/exchange/ExchangeSurfaceNav";
import TradeChart, {
  TradeCandle,
  TradeChartMode,
  TradeMarker,
} from "@/components/rioex/TradeChart";

type TradeTerminalResponse = {
  ok: boolean;
  source?: { type: string; database: string; tables: string[] };
  market?: {
    pairAddress: string;
    label: string;
    asset0Id: string | null;
    asset1Id: string | null;
    asset0LogoUrl: string | null;
    asset1LogoUrl: string | null;
    feeBps: number;
    isCanonical: boolean;
    isLive: boolean;
    price: number;
    liquidityUsd: number;
    flow24hUsd: number;
    trades24h: number;
    reserves: {
      asset0Display: number;
      asset1Display: number;
      totalShareDisplay: number;
    };
    timestamps: {
      createdTime: string | null;
      liquidityTime: string | null;
      lastSwapTime: string | null;
      lastActivityTime: string | null;
    };
    metadata: {
      liquidityHeight: string | number | null;
      liquiditySource: string | null;
      liquidityUpdatedAt: string | null;
      lastSwapTxHash: string | null;
      displaySymbol: string | null;
      feeRecipientAddress: string | null;
      feePolicy: string | null;
    };
    routes: {
      assetTerminal: string;
      marketBoard: string;
      hero: string;
      trade?: string;
      pool: string;
      swap: string;
      liquidity: string;
    };
  };
  summary?: {
    latestTradePrice: number;
    latestTradeTime: string | null;
    lastSwapTxHash: string | null;
    trades24h: number;
    flow24hUsd: number;
  };
  recentTrades?: Array<{
    txHash: string;
    offerAssetId: string;
    askAssetId: string;
    offerAssetLabel: string;
    askAssetLabel: string;
    offerAmountDisplay: number;
    returnAmountDisplay: number;
    effectivePrice: number;
    blockHeight: string | number;
    blockTime: string;
  }>;
  candleReadiness?: { status: string; note: string };
  error?: string;
};

type CandleRouteResponse = {
  ok: boolean;
  pairAddress: string;
  interval: string;
  limit: number;
  candles: TradeCandle[];
  diagnostics?: {
    swapRows: number;
    canonicalizedRows: number;
    bucketCount: number;
  };
  error?: string;
};

type TimeframeMode =
  | "1m"
  | "2m"
  | "5m"
  | "10m"
  | "15m"
  | "1h"
  | "4h"
  | "1d"
  | "1w";

type ChartRangeMode =
  | "1d"
  | "2d"
  | "5d"
  | "2w"
  | "1mo"
  | "2mo"
  | "6mo"
  | "1y"
  | "2y"
  | "all";

type SidePanelMode = "tape" | "depth" | "provenance";

const INTERVAL_OPTIONS: Array<{ value: TimeframeMode; label: string }> = [
  { value: "1m", label: "1m" },
  { value: "2m", label: "2m" },
  { value: "5m", label: "5m" },
  { value: "10m", label: "10m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1d" },
  { value: "1w", label: "1w" },
];

const RANGE_OPTIONS: Array<{ value: ChartRangeMode; label: string }> = [
  { value: "1d", label: "1D" },
  { value: "2d", label: "2D" },
  { value: "5d", label: "5D" },
  { value: "2w", label: "2W" },
  { value: "1mo", label: "1MO" },
  { value: "2mo", label: "2MO" },
  { value: "6mo", label: "6MO" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "all", label: "ALL" },
];

function chartRangeMs(range: ChartRangeMode) {
  const day = 24 * 60 * 60 * 1000;
  switch (range) {
    case "1d":
      return day;
    case "2d":
      return 2 * day;
    case "5d":
      return 5 * day;
    case "2w":
      return 14 * day;
    case "1mo":
      return 30 * day;
    case "2mo":
      return 60 * day;
    case "6mo":
      return 180 * day;
    case "1y":
      return 365 * day;
    case "2y":
      return 730 * day;
    case "all":
    default:
      return null;
  }
}

function candleFetchLimit(interval: TimeframeMode, range: ChartRangeMode) {
  const baseByInterval: Record<TimeframeMode, number> = {
    "1m": 2400,
    "2m": 2400,
    "5m": 2200,
    "10m": 1800,
    "15m": 1600,
    "1h": 1200,
    "4h": 900,
    "1d": 800,
    "1w": 520,
  };

  const multiplierByRange: Record<ChartRangeMode, number> = {
    "1d": 1,
    "2d": 1,
    "5d": 1,
    "2w": 1.2,
    "1mo": 1.4,
    "2mo": 1.8,
    "6mo": 2.4,
    "1y": 3.2,
    "2y": 4.5,
    "all": 5,
  };

  return Math.min(
    5000,
    Math.max(120, Math.round(baseByInterval[interval] * multiplierByRange[range]))
  );
}

function formatMoney(value: number, max = 2) {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
  }).format(Number.isFinite(value) ? value : 0)}`;
}

function formatNumber(value: number, max = 6) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function shortAddr(value?: string | null, left = 14, right = 10) {
  if (!value) return "—";
  if (value.length <= left + right) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

function cardClass() {
  return "rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 backdrop-blur-xl";
}

function shellClass() {
  return "rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
}

function buttonClass(kind: "primary" | "secondary" | "tertiary" = "secondary") {
  if (kind === "primary") {
    return "rounded-2xl border border-fuchsia-400/28 bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(157,23,77,0.18))] px-4 py-2 text-sm font-semibold text-white";
  }
  if (kind === "secondary") {
    return "rounded-2xl border border-cyan-400/24 bg-[linear-gradient(180deg,rgba(34,211,238,0.16),rgba(15,118,110,0.10))] px-4 py-2 text-sm font-medium text-white";
  }
  return "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/95";
}

function tinyButtonClass(active = false) {
  return active
    ? "rounded-[12px] border border-cyan-400 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200"
    : "rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80";
}

function badgeClass(label: string) {
  const cls =
    label === "Canonical"
      ? "border-fuchsia-400/25 bg-fuchsia-500/12 text-fuchsia-200"
      : label === "Live"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
      : "border-cyan-400/25 bg-cyan-400/8 text-cyan-300";

  return `rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${cls}`;
}

function PairMarks({ leftLogo, rightLogo }: { leftLogo?: string | null; rightLogo?: string | null }) {
  return (
    <div className="flex -space-x-2">
      {leftLogo ? (
        <img src={leftLogo} alt="" className="h-10 w-10 rounded-full border border-white/10 bg-black/20 object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white">A</div>
      )}
      {rightLogo ? (
        <img src={rightLogo} alt="" className="h-10 w-10 rounded-full border border-white/10 bg-black/20 object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white">B</div>
      )}
    </div>
  );
}

export default function RioExTradeTerminalRestoredPage() {
  const params = useParams<{ pairAddress: string }>();
  const pairAddress = String(params?.pairAddress || "");

  const [data, setData] = useState<TradeTerminalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [candles, setCandles] = useState<TradeCandle[]>([]);
  const [candlesLoading, setCandlesLoading] = useState(true);
  const [candlesError, setCandlesError] = useState<string | null>(null);

  const [mode, setMode] = useState<TradeChartMode>("candle");
  const [timeframe, setTimeframe] = useState<TimeframeMode>("15m");
  const [chartRange, setChartRange] = useState<ChartRangeMode>("all");
  const [sidePanel, setSidePanel] = useState<SidePanelMode>("tape");
  const [autoRefresh, setAutoRefresh] = useState(false);

  async function loadTradeTerminal(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(
        `/api/rioex/markets/${encodeURIComponent(pairAddress)}/trades`,
        { cache: "no-store" }
      );
      const raw = await response.text();
      const json: TradeTerminalResponse | null = raw ? JSON.parse(raw) : null;

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || `RioEx trade route failed: ${response.status}`);
      }

      setData(json);
    } catch (e: any) {
      setData(null);
      setError(e?.message || "Failed to load RioEx trade terminal.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }

  async function loadCandles(nextTimeframe: TimeframeMode, nextRange: ChartRangeMode, options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    try {
      if (!silent) setCandlesLoading(true);
      setCandlesError(null);

      const limit = candleFetchLimit(nextTimeframe, nextRange);
      const response = await fetch(
        `/api/rioex/markets/${encodeURIComponent(pairAddress)}/candles?interval=${nextTimeframe}&limit=${limit}`,
        { cache: "no-store" }
      );
      const raw = await response.text();
      const json: CandleRouteResponse | null = raw ? JSON.parse(raw) : null;

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || `RioEx candles route failed: ${response.status}`);
      }

      setCandles(json?.candles || []);
    } catch (e: any) {
      if (!silent) setCandles([]);
      setCandlesError(e?.message || "Failed to load RioEx candles.");
    } finally {
      if (!silent) setCandlesLoading(false);
    }
  }

  useEffect(() => {
    if (!pairAddress) return;
    void loadTradeTerminal();
  }, [pairAddress]);

  useEffect(() => {
    if (!pairAddress) return;
    void loadCandles(timeframe, chartRange);
  }, [pairAddress, timeframe, chartRange]);

  useEffect(() => {
    if (!autoRefresh || !pairAddress) return;
    const interval = setInterval(() => {
      void loadTradeTerminal({ silent: true });
      void loadCandles(timeframe, chartRange, { silent: true });
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, pairAddress, timeframe, chartRange]);

  const market = data?.market || null;
  const summary = data?.summary || null;
  const recentTrades = data?.recentTrades || [];
  const candleReadiness = data?.candleReadiness || null;

  const featured = market
    ? {
        displaySymbol: market.metadata?.displaySymbol || market.label,
        liquidityUsd: market.liquidityUsd,
        feeBps: market.feeBps,
        isCanonical: market.isCanonical,
        isLive: market.isLive,
        routes: {
          ...market.routes,
          trade:
            market.routes?.trade ||
            `${market.routes?.assetTerminal || `/rioex/markets/${encodeURIComponent(pairAddress)}`}/trades`,
        },
      }
    : null;

  const visibleCandles = useMemo(() => {
    if (!candles.length) return [];
    const ms = chartRangeMs(chartRange);
    if (ms === null) return candles;

    const latestTime = new Date(candles[candles.length - 1].time).getTime();
    if (!Number.isFinite(latestTime)) return candles;

    const cutoff = latestTime - ms;
    const filtered = candles.filter((candle) => {
      const t = new Date(candle.time).getTime();
      return Number.isFinite(t) && t >= cutoff;
    });

    return filtered.length ? filtered : candles;
  }, [candles, chartRange]);

  const tradeMarkers = useMemo<TradeMarker[]>(() => {
    return recentTrades.slice(0, 12).map((trade) => ({
      time: trade.blockTime,
      price: trade.effectivePrice,
      label: trade.offerAmountDisplay >= trade.returnAmountDisplay ? "S" : "B",
      tone: trade.offerAmountDisplay >= trade.returnAmountDisplay ? "sell" : "buy",
    }));
  }, [recentTrades]);

  const eventMarkers = useMemo<TradeMarker[]>(() => {
    return recentTrades.slice(0, 6).map((trade) => ({
      time: trade.blockTime,
      price: trade.effectivePrice,
      label: "•",
      tone: "event",
    }));
  }, [recentTrades]);

  const sideItems = useMemo(() => {
    if (sidePanel === "depth") {
      return [
        { label: "Bid Ladder", value: formatMoney((market?.liquidityUsd || 0) * 0.48, 0) },
        { label: "Ask Ladder", value: formatMoney((market?.liquidityUsd || 0) * 0.52, 0) },
        { label: "Spread", value: "route-based" },
        { label: "Execution", value: "pool-routed" },
      ];
    }

    if (sidePanel === "provenance") {
      return [
        { label: "Liquidity Source", value: market?.metadata?.liquiditySource || "unresolved" },
        { label: "Fee Policy", value: market?.metadata?.feePolicy || "—" },
        { label: "Treasury", value: shortAddr(market?.metadata?.feeRecipientAddress, 12, 10) },
        { label: "Last Swap Tx", value: shortAddr(summary?.lastSwapTxHash, 12, 10) },
      ];
    }

    return recentTrades.slice(0, 8).map((trade) => ({
      label: `${trade.offerAssetLabel} → ${trade.askAssetLabel}`,
      value: formatNumber(trade.effectivePrice, 6),
      sub: formatDateTime(trade.blockTime),
      meta: shortAddr(trade.txHash, 10, 8),
    }));
  }, [sidePanel, recentTrades, market, summary]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <ExchangeSurfaceNav
          product="rioex"
          activeKey="trades"
          featured={featured}
          title="RioEx Trade Terminal"
          subtitle="Restored trade terminal on the authoritative RioEx trade and candle routes, with the trading view back in place while denser Binance / Bitget mirroring continues."
        />

        {market ? (
          <div className="-mt-3 rounded-[22px] border border-cyan-400/16 bg-cyan-500/6 px-5 py-4 text-sm text-white/85">
            <div className="flex flex-wrap items-center gap-3">
              <span className={badgeClass("Integrity Truth")}>Integrity Truth</span>
              {market.isCanonical ? <span className={badgeClass("Canonical")}>Canonical</span> : null}
              {market.isLive ? <span className={badgeClass("Live")}>Live</span> : null}
              <button type="button" onClick={() => setAutoRefresh((v) => !v)} className={tinyButtonClass(autoRefresh)}>
                {autoRefresh ? "Auto Refresh On" : "Auto Refresh Off"}
              </button>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-white/75 sm:grid-cols-2 xl:grid-cols-4">
              <div>Registry TVL: <span className="font-semibold text-white">{formatMoney(market.liquidityUsd, 0)}</span></div>
              <div>Liquidity Source: <span className="font-semibold text-white">{market.metadata?.liquiditySource || "unresolved"}</span></div>
              <div>Fee Policy: <span className="font-semibold text-white">{market.metadata?.feePolicy || "—"}</span></div>
              <div>Treasury Recipient: <span className="font-semibold text-white">{shortAddr(market.metadata?.feeRecipientAddress, 12, 10)}</span></div>
            </div>
          </div>
        ) : null}

        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(37,10,24,0.82),rgba(10,9,18,0.94))] p-8 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">RioEx • Trade Terminal</div>
              <h1 className="mt-2 text-[2rem] font-semibold tracking-tight sm:text-[2.25rem]">Trade Terminal</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                Restored chart-first terminal for candles, line and area views, OHLC structure, tape, and execution handoff on authoritative RioEx routes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/rioex/markets/${encodeURIComponent(pairAddress)}`} className={buttonClass("tertiary")}>
                Back to Market
              </Link>
              <button
                type="button"
                onClick={() => {
                  void loadTradeTerminal({ silent: true });
                  void loadCandles(timeframe, chartRange, { silent: true });
                }}
                className={buttonClass("secondary")}
              >
                {refreshing ? "Refreshing…" : "Refresh Terminal"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              Loading trade terminal…
            </div>
          ) : market ? (
            <>
              <div className={`${shellClass()} mt-2 p-2.5 sm:p-3`}>
                <div className="grid gap-1.5 xl:grid-cols-[1.12fr_repeat(5,minmax(0,0.8fr))]">
                  <div className="xl:col-span-1">
                    <div className="flex items-start gap-2.5">
                      <PairMarks
                        leftLogo={market.asset0LogoUrl}
                        rightLogo={market.asset1LogoUrl}
                      />
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Pair Identity</div>
                        <div className="mt-1 text-[1.15rem] font-semibold tracking-tight">{market.label}</div>
                        <div className="mt-1 font-mono text-[10px] text-white/50">{shortAddr(market.pairAddress, 18, 12)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] px-3 py-2.5 backdrop-blur-xl">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Last Price</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{formatNumber(summary?.latestTradePrice || market.price, 6)}</div>
                  </div>
                  <div className="rounded-[14px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] px-3 py-2.5 backdrop-blur-xl">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">24h Volume</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{formatMoney(summary?.flow24hUsd || market.flow24hUsd || 0, 0)}</div>
                  </div>
                  <div className="rounded-[14px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] px-3 py-2.5 backdrop-blur-xl">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">24h Trades</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{summary?.trades24h || market.trades24h || 0}</div>
                  </div>
                  <div className="rounded-[14px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] px-3 py-2.5 backdrop-blur-xl">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Liquidity</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{formatMoney(market.liquidityUsd, 0)}</div>
                  </div>
                  <div className="rounded-[14px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] px-3 py-2.5 backdrop-blur-xl">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Last Trade</div>
                    <div className="mt-2 text-sm font-medium text-white">{formatDateTime(summary?.latestTradeTime || market.timestamps?.lastSwapTime)}</div>
                  </div>
                </div>
              </div>

              <div className={`${shellClass()} mt-2 p-2.5 sm:p-3`}>
                <div className="grid gap-3 xl:grid-cols-[1.9fr_0.42fr]">
                  <div>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Spot Terminal</div>
                        <div className="mt-1 text-[1.4rem] font-semibold text-white">Institutional Spot View</div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(["candle", "line", "ohlc", "area"] as TradeChartMode[]).map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setMode(option)}
                            className={tinyButtonClass(mode === option)}
                          >
                            {option === "candle" ? "Candles" : option === "ohlc" ? "OHLC" : option.charAt(0).toUpperCase() + option.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-2 grid gap-2 xl:grid-cols-[0.17fr_0.83fr]">
                      <div className={cardClass()}>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Candle Interval</div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {INTERVAL_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setTimeframe(option.value)}
                              className={tinyButtonClass(timeframe === option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={cardClass()}>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Range Window</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {RANGE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setChartRange(option.value)}
                              className={tinyButtonClass(chartRange === option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-1.5 grid gap-2 xl:grid-cols-[0.18fr_0.82fr]">
                      <div className={cardClass()}>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">OHLC Strip</div>
                        {visibleCandles.length ? (
                          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-white/74">
                            <div>Open</div><div className="text-right">{formatNumber(visibleCandles[visibleCandles.length - 1].open, 6)}</div>
                            <div>High</div><div className="text-right">{formatNumber(visibleCandles[visibleCandles.length - 1].high, 6)}</div>
                            <div>Low</div><div className="text-right">{formatNumber(visibleCandles[visibleCandles.length - 1].low, 6)}</div>
                            <div>Close</div><div className="text-right">{formatNumber(visibleCandles[visibleCandles.length - 1].close, 6)}</div>
                            <div>Vol</div><div className="text-right">{formatNumber(visibleCandles[visibleCandles.length - 1].volume, 2)}</div>
                            <div>Range</div><div className="text-right">{chartRange.toUpperCase()}</div>
                          </div>
                        ) : (
                          <div className="mt-3 text-sm text-white/60">No candles available.</div>
                        )}
                      </div>

                      <div className={cardClass()}>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Indicator Deck</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={tinyButtonClass(false)}>EMA20</span>
                          <span className={tinyButtonClass(false)}>EMA50</span>
                          <span className={tinyButtonClass(false)}>VWAP</span>
                          <span className={tinyButtonClass(true)}>Trade Marks</span>
                          <span className={tinyButtonClass(true)}>Events</span>
                        </div>
                        <div className="mt-3 text-xs text-white/52">
                          Structural mode with visible-history windowing. Interval controls candle construction while the right rail stays aligned to execution context and live tape.
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      {candlesLoading ? (
                        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">Loading candles…</div>
                      ) : candlesError ? (
                        <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-6 text-sm text-amber-200">{candlesError}</div>
                      ) : (
                        <TradeChart
                          candles={visibleCandles}
                          mode={mode}
                          lastPrice={summary?.latestTradePrice || market.price}
                          showEma20={true}
                          showEma50={true}
                          showVwap={true}
                          tradeMarkers={tradeMarkers}
                          eventMarkers={eventMarkers}
                        />
                      )}
                    </div>
                  </div>

                  <div className={cardClass()}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(["tape", "depth", "provenance"] as SidePanelMode[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSidePanel(option)}
                          className={tinyButtonClass(sidePanel === option)}
                        >
                          {option === "tape" ? "Tape" : option === "depth" ? "Depth" : "Intel"}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 h-[620px] overflow-y-auto pr-1.5 pl-1">
                      {sidePanel === "tape" ? (
                        <div className="grid gap-3">
                          {recentTrades.slice(0, 14).map((trade, index) => (
                            <div key={`${trade.txHash}-${index}`} className="rounded-[14px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] px-3.5 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[13px] leading-5 font-semibold text-white">
                                    {trade.offerAssetLabel} → {trade.askAssetLabel}
                                  </div>
                                  <div className="mt-1 font-mono text-[11px] text-white/50">
                                    {shortAddr(trade.txHash, 10, 8)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-white">{formatNumber(trade.effectivePrice, 6)}</div>
                                  <div className="mt-1 text-[11px] text-white/55">{formatDateTime(trade.blockTime)}</div>
                                </div>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1">
                                <span className={badgeClass("Canonical")}>Tape</span>
                                <span className={badgeClass("Live")}>Height {trade.blockHeight}</span>
                              </div>

                              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-white/74">
                                <div>Offer: {formatNumber(trade.offerAmountDisplay, 6)} {trade.offerAssetLabel}</div>
                                <div>Return: {formatNumber(trade.returnAmountDisplay, 6)} {trade.askAssetLabel}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : sidePanel === "depth" ? (
                        <div className="grid gap-3">
                          {[
                            ["Bid Ladder", formatMoney(market.liquidityUsd * 0.48, 0)],
                            ["Ask Ladder", formatMoney(market.liquidityUsd * 0.52, 0)],
                            ["Spread", "route-based"],
                            ["Execution", "pool-routed"],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-[16px] border border-white/10 bg-white/[0.035] p-3.5">
                              <div className="text-[10px] uppercase tracking-[0.12em] text-white/50">{label}</div>
                              <div className="mt-2 text-lg font-semibold text-white">{value}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {[
                            ["Liquidity Source", market.metadata?.liquiditySource || "unresolved"],
                            ["Fee Policy", market.metadata?.feePolicy || "—"],
                            ["Treasury", shortAddr(market.metadata?.feeRecipientAddress, 12, 10)],
                            ["Last Swap Tx", shortAddr(summary?.lastSwapTxHash, 12, 10)],
                            ["Candle Readiness", candleReadiness?.status || "unknown"],
                            ["Note", candleReadiness?.note || "—"],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-[16px] border border-white/10 bg-white/[0.035] p-3.5">
                              <div className="text-[10px] uppercase tracking-[0.12em] text-white/50">{label}</div>
                              <div className="mt-2 text-sm font-medium text-white">{value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${shellClass()} mt-2 p-2.5 sm:p-3`}>
                <div className="flex flex-wrap gap-2">
                  <Link href={featured?.routes?.trade || "#"} className={buttonClass("primary")}>Trade</Link>
                  <Link href={featured?.routes?.swap || "#"} className={buttonClass("secondary")}>Swap</Link>
                  <Link href={featured?.routes?.pool || "#"} className={buttonClass("secondary")}>Pool</Link>
                  <Link href={featured?.routes?.liquidity || "#"} className={buttonClass("tertiary")}>Liquidity</Link>
                  <span className="ml-auto rounded-[10px] border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">Sparse Market</span>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
