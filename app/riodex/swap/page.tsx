"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Clock3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import {
  buildTokenRegistryMap,
  getRioDexTokenRegistryBatch,
  getRegistryLogoUrl,
  getRegistryPairLabel,
} from "@/lib/riodex/token-registry";
import ExchangeSurfaceNav from "@/components/exchange/ExchangeSurfaceNav";
import {
  RIODEX_HOME_ROUTE,
  RIODEX_SCREENER_ROUTE,
  RIODEX_SWAP_ROUTE,
  RIODEX_LIQUIDITY_ROUTE,
  buildRioDexSurfaceHref,
} from "@/lib/riodex/routes";

type PairMeta = {
  pair_address: string;
  factory_address?: string | null;
  lp_token_address?: string | null;
  pair_key?: string | null;
  asset_0_type?: string | null;
  asset_0_id?: string | null;
  asset_1_type?: string | null;
  asset_1_id?: string | null;
  display_symbol?: string | null;
  fee_bps?: number | null;
  created_height?: string | number | null;
  created_time?: string | null;
  is_canonical?: boolean | null;
  is_live?: boolean | null;
  last_synced_height?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type LiquiditySnapshot = {
  tx_hash?: string;
  msg_index?: number;
  event_index?: number;
  pair_address?: string;
  provider?: string | null;
  lp_token_address?: string | null;
  event_type?: string;
  asset_0_amount?: string | null;
  asset_1_amount?: string | null;
  liquidity_amount?: string | null;
  reserve_0: string;
  reserve_1: string;
  total_share: string;
  block_height: string | number;
  block_time: string;
  raw_event?: unknown;
};

type SwapRow = {
  tx_hash: string;
  msg_index?: number;
  event_index?: number;
  pair_address: string;
  sender?: string | null;
  recipient?: string | null;
  offer_asset_id: string;
  ask_asset_id: string;
  offer_amount: string;
  return_amount: string;
  commission_amount: string;
  spread_amount: string;
  effective_price?: string | null;
  block_height: string | number;
  block_time: string;
  raw_event?: unknown;
};

type WalletBalanceSnapshot = {
  rio: number;
  rusd: number;
  updatedAt: string | null;
};

type SettlementReceipt = {
  status: "success" | "error";
  phase: string;
  submittedAt: string;
  completedAt?: string;
  txHash?: string;
  wallet: string;
  market: string;
  direction: string;
  requestAmount: number;
  quotedOutput: number;
  actualInputDelta?: number | null;
  actualOutputDelta?: number | null;
  beforeRio?: number | null;
  beforeRusd?: number | null;
  afterRio?: number | null;
  afterRusd?: number | null;
  height?: string | number | null;
  gasUsed?: string | number | null;
  error?: string | null;
  rpcEndpoint?: string | null;
};

type TvSeries = {
  s?: string;
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
};

type CandleBucket = {
  pair_id?: string;
  resolution?: string;
  bucket_start?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume0?: string;
  volume1?: string;
  trades?: string;
  created_at?: string;
  updated_at?: string;
};

type CandleResponse = {
  ok?: boolean;
  pair_id?: string;
  resolution?: string;
  candles?: CandleBucket[];
  tv?: TvSeries;
};

type ChartPoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};


type RegistryMarketLite = {
  pairAddress: string;
  displaySymbol: string;
  canonicalSymbol: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseLogoUrl: string | null;
  quoteLogoUrl: string | null;
  liquidityUsd: number;
  feeBps?: number | null;
  isCanonical: boolean;
  isLive: boolean;
  routes: {
    assetTerminal: string;
    marketBoard: string;
    hero: string;
    pool: string;
    swap: string;
    liquidity: string;
  };
};

type RegistryPairContext = {
  pairAddress: string;
  displaySymbol: string;
  canonicalSymbol: string;
  baseAssetId: string;
  quoteAssetId: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseDisplayName: string;
  quoteDisplayName: string;
  baseLogoUrl: string | null;
  quoteLogoUrl: string | null;
  baseAssetType?: string | null;
  quoteAssetType?: string | null;
  feeBps: number;
  isCanonical: boolean;
  isLive: boolean;
  liquidityUsd: number;
  liquidityHeight: string | number | null;
  liquidityTime: string | null;
  liquiditySource: string | null;
  liquidityUpdatedAt: string | null;
  lastSwapTime: string | null;
  lastSwapTxHash: string | null;
  feeRecipientAddress: string | null;
  feePolicy: string | null;
  quoteConvention: "asset_1_per_asset_0";
  routes: {
    assetTerminal: string;
    marketBoard: string;
    hero: string;
    pool: string;
    swap: string;
    liquidity: string;
  };
  source: string;
};

type RegistryBoardResponse = {
  ok?: boolean;
  markets?: RegistryMarketLite[];
};

type RegistryPairResponse = {
  ok?: boolean;
  pair?: RegistryPairContext;
  item?: RegistryPairContext;
};

const CHAIN_ID = "spherio-1";
const CANONICAL_PAIR_ADDR =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";
const RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";
const RIO_DENOM = "urio";
const TREASURY_FEE_COLLECTOR =
  "rio1nnhxsa49cc5e9vyxj6r6s3hwlkymcrletx7wch";

const RIO_LOGO_FALLBACK =
  "https://avatars.githubusercontent.com/u/175851528?s=400&u=b0c1a871d1e739566c4c2bf96a97720fedfc03ab&v=4";
const RUSD_LOGO_FALLBACK =
  "https://raw.githubusercontent.com/Lerivee/RUSD/refs/heads/main/Untitled%20design.png";

const WALLET_STORAGE_KEY = "spherio_wallet_address";
const WALLET_EVENT = "spherio:wallet-changed";

function formatNum(value: number, max = 6) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatSigned(value: number, max = 6) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatNum(Math.abs(value), max)}`;
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

function formatClock(unixSeconds?: number | null) {
  if (!unixSeconds) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(unixSeconds * 1000));
  } catch {
    return "—";
  }
}

function getAssetSymbol(v?: string | null) {
  const value = String(v || "").trim();
  if (!value) return "—";
  if (value === "RIO" || value === RIO_DENOM) return "RIO";
  if (value === "RUSD" || value === RUSD_CONTRACT) return "RUSD";
  if (value.startsWith("rio1")) return shortAddr(value, 8, 6);
  return value;
}

function buildTruthPairLabel(asset0Id?: string | null, asset1Id?: string | null) {
  return `${getAssetSymbol(asset0Id)} / ${getAssetSymbol(asset1Id)}`;
}

function shortAddr(v?: string | null, left = 8, right = 6) {
  if (!v) return "—";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

function toBaseUnits(displayAmount: string, decimals = 6) {
  const n = Number(displayAmount || "0");
  if (!Number.isFinite(n) || n <= 0) return "0";
  return String(Math.floor(n * 10 ** decimals));
}

function fromBaseUnits(baseAmount?: string | number | null, decimals = 6) {
  const n = Number(baseAmount ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n / 10 ** decimals;
}

function isStableAsset(assetId?: string | null) {
  const s = String(assetId || "").toLowerCase();
  return (
    s.includes("rusd") ||
    s.includes("usdc") ||
    s.includes("usdt") ||
    s.includes("dai")
  );
}

function estimateLiquidityValue(
  pair: PairMeta | null,
  latestLiquidity: LiquiditySnapshot | null
) {
  if (!pair || !latestLiquidity) return 0;

  const reserve0 = fromBaseUnits(latestLiquidity.reserve_0);
  const reserve1 = fromBaseUnits(latestLiquidity.reserve_1);

  if (isStableAsset(pair.asset_1_id)) return reserve1 * 2;
  if (isStableAsset(pair.asset_0_id)) return reserve0 * 2;

  return reserve1;
}

function maxSpreadFromSlippage(slippagePct: number) {
  if (!Number.isFinite(slippagePct) || slippagePct <= 0) return "0.005";
  return String(slippagePct / 100);
}

function encodeHookMsg(msg: unknown) {
  if (typeof window === "undefined") return "";
  return window.btoa(JSON.stringify(msg));
}

function readStoredWalletAddress() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(WALLET_STORAGE_KEY);
}

function writeStoredWalletAddress(address: string | null) {
  if (typeof window === "undefined") return;
  if (address) {
    window.localStorage.setItem(WALLET_STORAGE_KEY, address);
  } else {
    window.localStorage.removeItem(WALLET_STORAGE_KEY);
  }
  window.dispatchEvent(
    new CustomEvent(WALLET_EVENT, {
      detail: { address },
    })
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const raw = await response.text();

  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Route returned non-JSON (${response.status})`);
  }

  if (!response.ok || (json && json.ok === false)) {
    throw new Error(json?.error || `Request failed: ${response.status}`);
  }

  return json as T;
}

function trimFixed(n: number, digits = 6) {
  return n.toFixed(digits).replace(/\.?0+$/, "");
}

function shell(
  tone: "nav" | "panel" | "card" | "field" | "soft" | "token" = "panel"
) {
  const tones = {
    nav: "rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl",
    panel:
      "rounded-[28px] border border-white/10 bg-[#1a2448]/92 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl",
    card:
      "rounded-[24px] border border-white/10 bg-[#1b2548]/95 shadow-[0_14px_45px_rgba(0,0,0,0.18)] backdrop-blur-2xl",
    field: "rounded-[20px] border border-white/8 bg-[#05112d]/96",
    soft: "rounded-[16px] border border-white/8 bg-white/[0.04]",
    token: "rounded-[16px] border border-white/8 bg-[#202d58]",
  };

  return tones[tone];
}

function truthBadge(tone: "live" | "neutral" | "warning" = "neutral") {
  if (tone === "live") {
    return "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200";
  }
  if (tone === "warning") {
    return "rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100";
  }
  return "rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300";
}

function QuickAmountButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-white/8 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/12"
    >
      {label}
    </button>
  );
}

function NavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-4 py-2 text-sm transition",
        active
          ? "bg-cyan-400 text-[#081229] font-semibold"
          : "text-slate-200 hover:bg-white/8",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function SimpleStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={`${shell("soft")} p-4`}>
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function TokenAvatar({
  registryMap,
  assetId,
  label,
  size = 36,
}: {
  registryMap: ReturnType<typeof buildTokenRegistryMap>;
  assetId?: string | null;
  label?: string;
  size?: number;
}) {
  const normalized = String(assetId || "").trim();
  const symbol = label || getAssetSymbol(normalized);

  const logoUrl =
    getRegistryLogoUrl(registryMap, normalized) ||
    (normalized === RUSD_CONTRACT
      ? RUSD_LOGO_FALLBACK
      : normalized === RIO_DENOM
      ? RIO_LOGO_FALLBACK
      : null);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={symbol}
        width={size}
        height={size}
        className="rounded-full border border-white/10 bg-[#09132e] object-cover"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full border border-white/10 bg-[#202d58] text-xs font-semibold text-white"
    >
      {symbol.slice(0, 1)}
    </div>
  );
}

function parseTvSeries(tv?: TvSeries | null): ChartPoint[] {
  const t = tv?.t || [];
  const o = tv?.o || [];
  const h = tv?.h || [];
  const l = tv?.l || [];
  const c = tv?.c || [];
  const v = tv?.v || [];

  const size = Math.min(t.length, o.length, h.length, l.length, c.length);

  return Array.from({ length: size })
    .map((_, idx) => ({
      time: Number(t[idx]),
      open: Number(o[idx] ?? 0),
      high: Number(h[idx] ?? 0),
      low: Number(l[idx] ?? 0),
      close: Number(c[idx] ?? 0),
      volume: Number(v[idx] ?? 0),
    }))
    .filter(
      (p) =>
        Number.isFinite(p.time) &&
        Number.isFinite(p.open) &&
        Number.isFinite(p.high) &&
        Number.isFinite(p.low) &&
        Number.isFinite(p.close) &&
        p.time > 0 &&
        p.open > 0 &&
        p.high > 0 &&
        p.low > 0 &&
        p.close > 0
    );
}

function parseCandleBuckets(candles?: CandleBucket[] | null): ChartPoint[] {
  if (!candles?.length) return [];

  return candles
    .map((row) => {
      const timeMs = row.bucket_start ? new Date(row.bucket_start).getTime() : NaN;
      const volume1 = Number(row.volume1 ?? 0);
      const volume0 = Number(row.volume0 ?? 0);

      return {
        time: Number.isFinite(timeMs) ? Math.floor(timeMs / 1000) : 0,
        open: Number(row.open ?? 0),
        high: Number(row.high ?? 0),
        low: Number(row.low ?? 0),
        close: Number(row.close ?? 0),
        volume: Number.isFinite(volume1) && volume1 > 0 ? volume1 : volume0,
      };
    })
    .filter(
      (p) =>
        Number.isFinite(p.time) &&
        Number.isFinite(p.open) &&
        Number.isFinite(p.high) &&
        Number.isFinite(p.low) &&
        Number.isFinite(p.close) &&
        p.time > 0 &&
        p.open > 0 &&
        p.high > 0 &&
        p.low > 0 &&
        p.close > 0
    );
}

function sanitizeChartPoints(points: ChartPoint[]): ChartPoint[] {
  if (!points.length) return [];

  const byTime = new Map<number, ChartPoint>();
  for (const point of points) {
    byTime.set(point.time, point);
  }

  const sorted = Array.from(byTime.values()).sort((a, b) => a.time - b.time);
  const closes = sorted.map((p) => p.close).sort((a, b) => a - b);
  const median = closes[Math.floor(closes.length / 2)] || 0;

  return sorted.filter((p) => {
    const pointMax = Math.max(p.open, p.high, p.low, p.close);
    const pointMin = Math.min(p.open, p.high, p.low, p.close);

    if (pointMin <= 0) return false;
    if (pointMax / pointMin > 50) return false;
    if (median > 0 && (pointMax > median * 12 || pointMin < median / 12)) return false;

    return true;
  });
}

function chartQuality(points: ChartPoint[]) {
  if (!points.length) return -999;

  const highs = points.map((p) => p.high);
  const lows = points.map((p) => p.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const ratio = min > 0 ? max / min : 9999;

  let score = points.length * 10;
  if (ratio > 8) score -= 40;
  if (ratio > 4) score -= 20;
  if (points.length < 4) score -= 15;

  return score;
}

function normalizeExecutionError(error: any, rpcEndpoint?: string | null) {
  const message = String(error?.message || "Transaction failed");

  if (/rejected|denied|declined/i.test(message)) {
    return "Signature rejected in wallet.";
  }

  if (/insufficient funds/i.test(message)) {
    return "Insufficient funds for swap amount or network fee.";
  }

  if (/failed to fetch|networkerror|fetch/i.test(message)) {
    return rpcEndpoint
      ? `Unable to reach RPC endpoint ${rpcEndpoint}. Ensure the node RPC is live and browser-accessible.`
      : "Unable to reach the browser RPC endpoint. Ensure the node RPC is live and browser-accessible.";
  }

  return message;
}

async function resolveBrowserRpcEndpoint() {
  const runtimeCandidates = [
    process.env.NEXT_PUBLIC_SPHERIO_RPC,
    process.env.NEXT_PUBLIC_RPC_URL,
    typeof window !== "undefined" ? `${window.location.protocol}//127.0.0.1:26657` : null,
    typeof window !== "undefined" ? `${window.location.protocol}//localhost:26657` : null,
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:26657`
      : null,
  ]
    .filter(Boolean)
    .map((v) => String(v).replace(/\/+$/, ""));

  const candidates = Array.from(new Set(runtimeCandidates));

  for (const candidate of candidates) {
    try {
      const res = await fetch(`${candidate}/status`, {
        method: "GET",
        cache: "no-store",
      });
      if (res.ok) return candidate;
    } catch {}
  }

  return candidates[0] || "http://127.0.0.1:26657";
}

async function getBrowserSigningContext() {
  if (typeof window === "undefined") {
    throw new Error("Wallet execution requires browser context.");
  }

  const w = window as any;

  if (!w.keplr || !w.getOfflineSigner) {
    throw new Error("Keplr wallet is not available in this browser.");
  }

  await w.keplr.enable(CHAIN_ID);

  const signer = w.getOfflineSigner(CHAIN_ID);
  const accounts = await signer.getAccounts();

  if (!accounts?.length) {
    throw new Error("No wallet account found for Spherio.");
  }

  const rpcEndpoint = await resolveBrowserRpcEndpoint();
  const client = await SigningCosmWasmClient.connectWithSigner(
    rpcEndpoint,
    signer,
    {
      gasPrice: GasPrice.fromString("0urio"),
    }
  );

  return {
    signer,
    client,
    address: accounts[0].address,
    rpcEndpoint,
  };
}

function TruthChart({
  data,
  pairLabel,
  resolutionLabel,
  requestedResolution,
  fallbackPrice,
}: {
  data: ChartPoint[];
  pairLabel: string;
  resolutionLabel: string;
  requestedResolution: string;
  fallbackPrice: number | null;
}) {
  const width = 940;
  const height = 470;
  const padTop = 36;
  const padBottom = 54;
  const padLeft = 24;
  const padRight = 82;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  if (!data.length) {
    const priceY =
      fallbackPrice !== null ? padTop + innerHeight * 0.42 : padTop + innerHeight * 0.5;

    return (
      <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,18,37,0.58),rgba(10,18,37,0.16))] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
              {resolutionLabel}
            </div>
            <div className="text-sm text-slate-300">
             No market activity yet.
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Requested {requestedResolution} • serving {resolutionLabel}
          </div>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[430px] w-full overflow-visible rounded-[18px]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="truthBgSwapSparse" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(17,27,56,0.10)" />
              <stop offset="100%" stopColor="rgba(8,15,32,0.38)" />
            </linearGradient>
          </defs>

          <rect x={0} y={0} width={width} height={height} rx={18} fill="url(#truthBgSwapSparse)" />

          {Array.from({ length: 5 }).map((_, idx) => {
            const y = padTop + (innerHeight / 4) * idx;
            return (
              <line
                key={`sparse-h-${idx}`}
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            );
          })}

          {Array.from({ length: 5 }).map((_, idx) => {
            const x = padLeft + (innerWidth / 4) * idx;
            return (
              <line
                key={`sparse-v-${idx}`}
                x1={x}
                y1={padTop}
                x2={x}
                y2={padTop + innerHeight}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            );
          })}

          {fallbackPrice !== null ? (
            <>
              <line
                x1={padLeft}
                y1={priceY}
                x2={width - padRight}
                y2={priceY}
                stroke="rgba(87,229,223,0.9)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <rect
                x={width - padRight + 2}
                y={priceY - 14}
                width={72}
                height={28}
                rx={8}
                fill="#57E5DF"
              />
              <text
                x={width - padRight + 38}
                y={priceY + 5}
                textAnchor="middle"
                fill="#081229"
                fontSize="14"
                fontWeight="700"
              >
                {formatNum(fallbackPrice, 6)}
              </text>
            </>
          ) : null}

          <text
            x={width / 2}
            y={height / 2 - 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.95)"
            fontSize="30"
            fontWeight="700"
          >
            {pairLabel}
          </text>

          <text
            x={width / 2}
            y={height / 2 + 24}
            textAnchor="middle"
            fill="rgba(203,213,225,0.80)"
            fontSize="14"
          >
            Truth layer remains live while long-range candles are sparse.
          </text>

          <text
            x={width / 2}
            y={height - 14}
            textAnchor="middle"
            fill="rgba(226,232,240,0.75)"
            fontSize="13"
          >
            {pairLabel}
          </text>
        </svg>
      </div>
    );
  }

  const lows = data.map((d) => d.low);
  const highs = data.map((d) => d.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = max - min || 1;

  const priceToY = (price: number) =>
    padTop + innerHeight - ((price - min) / range) * innerHeight;

  const slotWidth = innerWidth / Math.max(data.length, 1);
  const candleBodyWidth = Math.max(Math.min(slotWidth * 0.64, 12), 4);

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const delta = previous ? latest.close - previous.close : 0;
  const deltaPct = previous && previous.close !== 0 ? (delta / previous.close) * 100 : 0;
  const latestY = priceToY(latest.close);
  const displayHigh = Math.max(...highs);
  const displayLow = Math.min(...lows);

  const gridRows = 4;
  const priceTicks = Array.from({ length: gridRows + 1 }).map((_, idx) => {
    const ratio = idx / gridRows;
    const value = max - range * ratio;
    const y = padTop + innerHeight * ratio;
    return { value, y };
  });

  return (
    <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,18,37,0.58),rgba(10,18,37,0.16))] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
            {resolutionLabel}
          </div>
          <div className="text-sm text-slate-200">
            O <span className="text-cyan-300">{formatNum(latest.open, 6)}</span>{" "}
            H <span className="text-cyan-300">{formatNum(latest.high, 6)}</span>{" "}
            L <span className="text-cyan-300">{formatNum(latest.low, 6)}</span>{" "}
            C <span className="text-cyan-300">{formatNum(latest.close, 6)}</span>{" "}
            <span className={delta >= 0 ? "text-cyan-300" : "text-pink-300"}>
              {formatSigned(delta, 6)} ({formatSigned(deltaPct, 2)}%)
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Requested {requestedResolution} • serving {resolutionLabel}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[430px] w-full overflow-visible rounded-[18px]"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="truthBgSwap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(17,27,56,0.10)" />
            <stop offset="100%" stopColor="rgba(8,15,32,0.38)" />
          </linearGradient>
        </defs>

        <rect x={0} y={0} width={width} height={height} rx={18} fill="url(#truthBgSwap)" />

        {priceTicks.map((tick, idx) => (
          <g key={`grid-${idx}`}>
            <line
              x1={padLeft}
              y1={tick.y}
              x2={width - padRight}
              y2={tick.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <text
              x={width - padRight + 10}
              y={tick.y + 4}
              fill="rgba(226,232,240,0.90)"
              fontSize="13"
            >
              {formatNum(tick.value, 6)}
            </text>
          </g>
        ))}

        {Array.from({ length: 5 }).map((_, idx) => {
          const x = padLeft + (innerWidth / 4) * idx;
          return (
            <line
              key={`vgrid-${idx}`}
              x1={x}
              y1={padTop}
              x2={x}
              y2={padTop + innerHeight}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {data.map((d, idx) => {
          const x = padLeft + slotWidth * idx + slotWidth / 2;
          const openY = priceToY(d.open);
          const closeY = priceToY(d.close);
          const highY = priceToY(d.high);
          const lowY = priceToY(d.low);
          const rising = d.close >= d.open;
          const color = rising ? "#57E5DF" : "#FF5FA7";
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

          return (
            <g key={`candle-${idx}`}>
              <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.25" />
              <rect
                x={x - candleBodyWidth / 2}
                y={bodyTop}
                width={candleBodyWidth}
                height={bodyHeight}
                rx={1.5}
                fill={color}
              />
            </g>
          );
        })}

        <line
          x1={padLeft}
          y1={latestY}
          x2={width - padRight}
          y2={latestY}
          stroke="rgba(87,229,223,0.9)"
          strokeDasharray="4 4"
          strokeWidth="1"
        />

        <rect x={width - padRight + 2} y={latestY - 14} width={72} height={28} rx={8} fill="#57E5DF" />
        <text
          x={width - padRight + 38}
          y={latestY + 5}
          textAnchor="middle"
          fill="#081229"
          fontSize="14"
          fontWeight="700"
        >
          {formatNum(latest.close, 6)}
        </text>

        <rect x={width - padRight + 2} y={padTop + 6} width={74} height={26} rx={8} fill="#213B72" />
        <text x={width - padRight + 15} y={padTop + 23} fill="white" fontSize="13" fontWeight="700">
          High
        </text>
        <text
          x={width - padRight + 72}
          y={padTop + 23}
          textAnchor="end"
          fill="white"
          fontSize="13"
          fontWeight="700"
        >
          {formatNum(displayHigh, 6)}
        </text>

        <rect
          x={width - padRight + 2}
          y={padTop + innerHeight - 32}
          width={74}
          height={26}
          rx={8}
          fill="#213B72"
        />
        <text
          x={width - padRight + 15}
          y={padTop + innerHeight - 15}
          fill="white"
          fontSize="13"
          fontWeight="700"
        >
          Low
        </text>
        <text
          x={width - padRight + 72}
          y={padTop + innerHeight - 15}
          textAnchor="end"
          fill="white"
          fontSize="13"
          fontWeight="700"
        >
          {formatNum(displayLow, 6)}
        </text>

        <text x={padLeft + 8} y={height - 14} fill="rgba(226,232,240,0.85)" fontSize="13">
          {formatClock(data[0]?.time)}
        </text>
        <text
          x={width / 2}
          y={height - 14}
          textAnchor="middle"
          fill="rgba(226,232,240,0.85)"
          fontSize="13"
        >
          {pairLabel}
        </text>
        <text
          x={width - padRight}
          y={height - 14}
          textAnchor="end"
          fill="rgba(226,232,240,0.85)"
          fontSize="13"
        >
          {formatClock(data[data.length - 1]?.time)}
        </text>
      </svg>
    </div>
  );
}

export default function RioDexSwapPage() {
  const searchParams = useSearchParams();

  const initialFrom = getAssetSymbol(searchParams.get("from"));
  const initialTo = getAssetSymbol(searchParams.get("to"));
  const initialPool = searchParams.get("pool") || "";

  const [fromToken, setFromToken] = useState(
    initialFrom === "RUSD" ? "RUSD" : "RIO"
  );
  const [toToken, setToToken] = useState(initialTo === "RIO" ? "RIO" : "RUSD");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [selectedResolution, setSelectedResolution] = useState("1m");

  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const [rioBalance, setRioBalance] = useState<number | null>(null);
  const [rusdBalance, setRusdBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [pair, setPair] = useState<PairMeta | null>(null);
  const [registryMap, setRegistryMap] = useState(() => buildTokenRegistryMap([]));
  const [registryLoading, setRegistryLoading] = useState(false);
  const [liquidityHistory, setLiquidityHistory] = useState<LiquiditySnapshot[]>([]);
  const [recentSwaps, setRecentSwaps] = useState<SwapRow[]>([]);
  const [candlePayload, setCandlePayload] = useState<CandleResponse | null>(null);
  const [marketResolution, setMarketResolution] = useState<string>("1m");
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [marketRefreshNonce, setMarketRefreshNonce] = useState(0);
  const [registryPair, setRegistryPair] = useState<RegistryPairContext | null>(null);
  const [registryMarkets, setRegistryMarkets] = useState<RegistryMarketLite[]>([]);
  const [registryTruthLoading, setRegistryTruthLoading] = useState(false);
  const [registryTruthError, setRegistryTruthError] = useState<string | null>(null);

  const [quoteOut, setQuoteOut] = useState<string>("0");
  const [quoteFee, setQuoteFee] = useState<string>("0");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [executing, setExecuting] = useState(false);
  const [executionStage, setExecutionStage] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SettlementReceipt | null>(null);
  const [flashNotice, setFlashNotice] = useState<string | null>(null);

  const pairAddress = initialPool || CANONICAL_PAIR_ADDR;
  const pairRoutes = useMemo(() => buildRioDexSurfaceHref(pairAddress), [pairAddress]);

  const syncWalletFromStorage = useCallback(() => {
    setConnectedAddress(readStoredWalletAddress());
  }, []);

const loadMarket = useCallback(async () => {
  setMarketLoading(true);
  setMarketError(null);

  try {
    const [pairsRes, liquidityRes, swapsRes, candlesRes] = await Promise.all([
      fetchJson<{ ok?: boolean; pairs?: PairMeta[] }>("/api/v1/riodex/pairs"),
      fetchJson<{ ok?: boolean; liquidity?: LiquiditySnapshot[] }>(
        `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/liquidity?limit=24`
      ),
      fetchJson<{ ok?: boolean; swaps?: SwapRow[] }>(
        `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/swaps?limit=50`
      ),
      fetchJson<CandleResponse>(
        `/api/v1/riodex/pairs/${encodeURIComponent(
          pairAddress
        )}/candles?resolution=${encodeURIComponent(selectedResolution)}&limit=64`
      ),
    ]);

    const matchedPair =
      pairsRes?.pairs?.find((p) => p.pair_address === pairAddress) || null;

    setPair(matchedPair);
    setLiquidityHistory(liquidityRes?.liquidity || []);
    setRecentSwaps(swapsRes?.swaps || []);
    setCandlePayload(candlesRes || null);
    setMarketResolution(candlesRes?.resolution || selectedResolution);
  } catch (e: any) {
    setMarketError(e?.message || "Failed to load RioDex market state");
    setPair(null);
    setLiquidityHistory([]);
    setRecentSwaps([]);
    setCandlePayload(null);
    setMarketResolution(selectedResolution);
  } finally {
    setMarketLoading(false);
  }
}, [pairAddress, selectedResolution]);

  const loadBalances = useCallback(
    async (addressOverride?: string): Promise<WalletBalanceSnapshot | null> => {
      const targetAddress = addressOverride || connectedAddress;

      if (!targetAddress) {
        setRioBalance(null);
        setRusdBalance(null);
        setBalanceError(null);
        return null;
      }

      setBalanceLoading(true);
      setBalanceError(null);

      try {
        const response = await fetch(
          `/api/wallet/balances?address=${encodeURIComponent(targetAddress)}`,
          { cache: "no-store" }
        );

        const raw = await response.text();

        let json: any = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error(`Wallet balance route returned non-JSON (${response.status}).`);
        }

        if (!response.ok || !json.ok) {
          throw new Error(json?.error || `Balance request failed: ${response.status}`);
        }

        const snapshot: WalletBalanceSnapshot = {
          rio: Number(json.rio ?? 0),
          rusd: Number(json.rusd ?? 0),
          updatedAt: json.updated_at ?? null,
        };

        setRioBalance(snapshot.rio);
        setRusdBalance(snapshot.rusd);
        return snapshot;
      } catch (e: any) {
        setRioBalance(null);
        setRusdBalance(null);
        setBalanceError(e?.message || "Failed to load balances");
        return null;
      } finally {
        setBalanceLoading(false);
      }
    },
    [connectedAddress]
  );

  const refreshBalancesAfterExecution = useCallback(
    async (address: string): Promise<WalletBalanceSnapshot | null> => {
      let latest: WalletBalanceSnapshot | null = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) =>
          setTimeout(resolve, attempt === 0 ? 900 : 1200)
        );
        latest = await loadBalances(address);
        if (latest) return latest;
      }

      return latest;
    },
    [loadBalances]
  );

  useEffect(() => {
    syncWalletFromStorage();

    function onStorage(e: StorageEvent) {
      if (e.key === WALLET_STORAGE_KEY) {
        syncWalletFromStorage();
      }
    }

    function onWalletChanged() {
      syncWalletFromStorage();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(WALLET_EVENT, onWalletChanged as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WALLET_EVENT, onWalletChanged as EventListener);
    };
  }, [syncWalletFromStorage]);

  useEffect(() => {
    loadMarket();
  }, [loadMarket, marketRefreshNonce]);


  useEffect(() => {
    let active = true;

    async function loadRegistryTruth() {
      try {
        setRegistryTruthLoading(true);
        setRegistryTruthError(null);

        const [board, pairTruth] = await Promise.all([
          fetchJson<RegistryBoardResponse>("/api/rioex/markets?canonicalOnly=true&sort=liquidity"),
          fetchJson<RegistryPairResponse>(`/api/rioex/markets/${encodeURIComponent(pairAddress)}`),
        ]);

        if (!active) return;
        setRegistryMarkets(board?.markets || []);
        setRegistryPair(pairTruth?.pair || pairTruth?.item || null);
      } catch (error: any) {
        if (!active) return;
        setRegistryPair(null);
        setRegistryMarkets([]);
        setRegistryTruthError(error?.message || "Failed to load authoritative registry truth.");
      } finally {
        if (active) setRegistryTruthLoading(false);
      }
    }

    loadRegistryTruth();
    return () => {
      active = false;
    };
  }, [pairAddress]);
  useEffect(() => {
    if (!flashNotice) return;
    const timer = window.setTimeout(() => setFlashNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [flashNotice]);


  useEffect(() => {
    let active = true;

    async function loadRegistry() {
      const assetIds = [pair?.asset_0_id, pair?.asset_1_id].filter(Boolean) as string[];

      if (!assetIds.length) {
        if (active) setRegistryMap(buildTokenRegistryMap([]));
        return;
      }

      try {
        setRegistryLoading(true);
        const items = await getRioDexTokenRegistryBatch(assetIds);
        if (!active) return;
        setRegistryMap(buildTokenRegistryMap(items));
      } catch {
        if (!active) return;
        setRegistryMap(buildTokenRegistryMap([]));
      } finally {
        if (active) setRegistryLoading(false);
      }
    }

    loadRegistry();
    return () => {
      active = false;
    };
  }, [pair?.asset_0_id, pair?.asset_1_id]);

  useEffect(() => {
    let active = true;

    async function loadQuote() {
      if (!amount || Number(amount) <= 0 || fromToken === toToken) {
        if (active) {
          setQuoteOut("0");
          setQuoteFee("0");
          setQuoteError(null);
        }
        return;
      }

      const executionSupported =
        [pair?.asset_0_id ?? RIO_DENOM, pair?.asset_1_id ?? RUSD_CONTRACT]
          .sort()
          .join("|") === [RIO_DENOM, RUSD_CONTRACT].sort().join("|");

      try {
        if (!executionSupported) {
          if (active) {
            setQuoteLoading(false);
            setQuoteOut("0");
            setQuoteFee("0");
            setQuoteError(null);
          }
          return;
        }

        if (active) {
          setQuoteLoading(true);
          setQuoteError(null);
        }

        const response = await fetch("/api/riodex/simulate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromToken,
            amount,
          }),
          cache: "no-store",
        });

        const raw = await response.text();

        let json: any = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error(`Simulation route returned non-JSON (${response.status}).`);
        }

        if (!response.ok || json?.ok === false) {
          throw new Error(json?.error || `Simulation failed: ${response.status}`);
        }

        if (active) {
          setQuoteOut(json.amount_out || "0");
          setQuoteFee(json.commission || "0");
          setQuoteError(json.fallback ? json.warning || null : null);
        }
      } catch (error: any) {
        if (active) {
          setQuoteOut("0");
          setQuoteFee("0");
          setQuoteError(error?.message || "Failed to simulate swap");
        }
      } finally {
        if (active) setQuoteLoading(false);
      }
    }

    loadQuote();
    return () => {
      active = false;
    };
  }, [fromToken, toToken, amount, pair?.asset_0_id, pair?.asset_1_id]);

  useEffect(() => {
    if (!connectedAddress) {
      setRioBalance(null);
      setRusdBalance(null);
      setBalanceError(null);
      return;
    }
    loadBalances(connectedAddress);
  }, [connectedAddress, loadBalances]);

  const asset0Id = pair?.asset_0_id ?? RIO_DENOM;
  const asset1Id = pair?.asset_1_id ?? RUSD_CONTRACT;

  const registryPairLabel =
    registryMap.has(String(asset0Id)) && registryMap.has(String(asset1Id))
      ? getRegistryPairLabel(registryMap, asset0Id, asset1Id)
      : buildTruthPairLabel(asset0Id, asset1Id);

  const [asset0Label, asset1Label] = registryPairLabel.includes("/")
    ? (registryPairLabel.split("/").map((value) => value.trim()) as [string, string])
    : [getAssetSymbol(asset0Id), getAssetSymbol(asset1Id)];

  const fromAssetId = fromToken === asset0Label ? asset0Id : asset1Id;
  const toAssetId = toToken === asset0Label ? asset0Id : asset1Id;

  const latestLiquidity = liquidityHistory[0] || null;
  const latestSwap = recentSwaps[0] || null;

  const reserve0Display = latestLiquidity ? fromBaseUnits(latestLiquidity.reserve_0) : 0;
  const reserve1Display = latestLiquidity ? fromBaseUnits(latestLiquidity.reserve_1) : 0;
  const totalShare = latestLiquidity ? fromBaseUnits(latestLiquidity.total_share) : 0;

  const reservePriceTruth =
    latestLiquidity && reserve0Display > 0 ? reserve1Display / reserve0Display : null;

  const normalizedLastTradeTruth = useMemo(() => {
    if (!latestSwap?.effective_price) return null;

    const raw = Number(latestSwap.effective_price);
    if (!Number.isFinite(raw) || raw <= 0) return null;

    if (latestSwap.offer_asset_id === asset0Id && latestSwap.ask_asset_id === asset1Id) {
      return raw;
    }

    if (latestSwap.offer_asset_id === asset1Id && latestSwap.ask_asset_id === asset0Id) {
      return raw > 0 ? 1 / raw : null;
    }

    return null;
  }, [latestSwap, asset0Id, asset1Id]);

  const marketPriceTruth = reservePriceTruth ?? normalizedLastTradeTruth;
  const lastTradeDisplayTruth = normalizedLastTradeTruth;

  const liquidityTruth = latestLiquidity
    ? `${formatNum(reserve0Display, 2)} ${asset0Label} / ${formatNum(
        reserve1Display,
        2
      )} ${asset1Label}`
    : null;

  const updatedTruthTime =
  latestSwap?.block_time || latestLiquidity?.block_time || null;

  const authoritativeLiquidityUsd =
    registryPair?.liquidityUsd ?? estimateLiquidityValue(pair, latestLiquidity);
  const authoritativeFeeBps = registryPair?.feeBps ?? pair?.fee_bps ?? null;
  const authoritativeFeePolicy = registryPair?.feePolicy || null;
  const authoritativeFeeRecipient = registryPair?.feeRecipientAddress || null;
  const authoritativeLiquiditySource = registryPair?.liquiditySource || null;
  const authoritativeUpdatedAt =
    registryPair?.liquidityUpdatedAt || registryPair?.lastSwapTime || updatedTruthTime;

const swapCountTruth = recentSwaps.length;

const marketLabel = registryPairLabel;

  const marketIdentity = pair?.is_canonical
    ? "Canonical Spherio execution pair"
    : pair?.is_live
    ? "On-chain live pair"
    : "On-chain pair";

  const marketHandle = pair?.pair_key || shortAddr(pairAddress, 14, 10);

  const numericAmount = Number(amount || 0);
  const slippagePct = Number(slippage || 0);

  const chartData = useMemo<ChartPoint[]>(() => {
    const bucketPoints = sanitizeChartPoints(parseCandleBuckets(candlePayload?.candles));
    const tvPoints = sanitizeChartPoints(parseTvSeries(candlePayload?.tv));
    const best = chartQuality(bucketPoints) >= chartQuality(tvPoints) ? bucketPoints : tvPoints;

    if (!best.length) return [];

    const highs = best.map((p) => p.high);
    const lows = best.map((p) => p.low);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const ratio = min > 0 ? max / min : 9999;

    if (best.length < 4 || ratio > 6) {
      return [];
    }

    return best;
  }, [candlePayload]);

  const latestChart = chartData[chartData.length - 1];
  const previousChart = chartData[chartData.length - 2];
  const chartDelta =
    latestChart && previousChart ? latestChart.close - previousChart.close : 0;
  const chartDeltaPct =
    latestChart && previousChart && previousChart.close !== 0
      ? (chartDelta / previousChart.close) * 100
      : 0;

  const pairExecutionSupported = useMemo(() => {
    const combo = [asset0Id, asset1Id].sort().join("|");
    return combo === [RIO_DENOM, RUSD_CONTRACT].sort().join("|");
  }, [asset0Id, asset1Id]);

  const fromBalance = fromAssetId === RIO_DENOM ? rioBalance : fromAssetId === RUSD_CONTRACT ? rusdBalance : null;

  const insufficientBalance =
    fromBalance !== null && numericAmount > 0 ? numericAmount > fromBalance : false;

  const needsRioFeeBalance =
    !!connectedAddress &&
    fromAssetId !== RIO_DENOM &&
    rioBalance !== null &&
    rioBalance <= 0;

  const quoteData = useMemo(() => {
    if (!latestLiquidity || !numericAmount || numericAmount <= 0 || fromToken === toToken) {
      return null;
    }

    if (reserve0Display <= 0 || reserve1Display <= 0) return null;

    let midPrice = 0;

    if (fromToken === asset0Label && toToken === asset1Label) {
      midPrice = reserve1Display / reserve0Display;
    } else if (fromToken === asset1Label && toToken === asset0Label) {
      midPrice = reserve0Display / reserve1Display;
    }

    const estimatedOut = Number(quoteOut || 0);
    const feeAmount = Number(quoteFee || 0);
    const spotOut = numericAmount * midPrice;
    const priceImpactPct =
      spotOut > 0 ? Math.max(((spotOut - estimatedOut) / spotOut) * 100, 0) : 0;
    const minReceived = estimatedOut * (1 - slippagePct / 100);
    const effectivePrice = numericAmount > 0 ? estimatedOut / numericAmount : 0;

    return {
      midPrice,
      feeAmount,
      estimatedOut,
      priceImpactPct,
      minReceived,
      effectivePrice,
    };
  }, [
    latestLiquidity,
    numericAmount,
    fromToken,
    toToken,
    slippagePct,
    quoteOut,
    quoteFee,
    reserve0Display,
    reserve1Display,
    asset0Label,
    asset1Label,
  ]);

  const displayQuote = useMemo(() => {
    if (quoteData && quoteData.estimatedOut > 0) return quoteData.estimatedOut;
    if (!marketPriceTruth || !numericAmount || numericAmount <= 0) return null;

    if (fromToken === asset0Label && toToken === asset1Label) {
      return numericAmount * marketPriceTruth;
    }

    if (fromToken === asset1Label && toToken === asset0Label && marketPriceTruth > 0) {
      return numericAmount / marketPriceTruth;
    }

    return null;
  }, [quoteData, marketPriceTruth, numericAmount, fromToken, toToken, asset0Label, asset1Label]);

  const canSwap =
    !!connectedAddress &&
    pairExecutionSupported &&
    numericAmount > 0 &&
    fromToken !== toToken &&
    !insufficientBalance &&
    !needsRioFeeBalance &&
    !quoteLoading &&
    !marketLoading &&
    !marketError &&
    !!latestLiquidity &&
    displayQuote !== null &&
    displayQuote > 0;

  const swapGateReason =
    !connectedAddress
      ? "Connect wallet from the global header."
      : !pairExecutionSupported
      ? "Execution is currently wired for RIO/RUSD only."
      : marketLoading
      ? "Loading market state."
      : marketError
      ? "Market state unavailable."
      : !latestLiquidity
      ? "Liquidity unavailable."
      : !amount || numericAmount <= 0
      ? "Enter amount."
      : fromToken === toToken
      ? "Select a valid direction."
      : quoteLoading
      ? "Refreshing quote."
      : needsRioFeeBalance
      ? "RIO needed for network fees."
      : insufficientBalance
      ? `Insufficient ${fromToken}.`
      : "Ready.";

  useEffect(() => {
    if (!pair) return;
    const allowed = [asset0Label, asset1Label];
    if (!allowed.includes(fromToken) || !allowed.includes(toToken) || fromToken === toToken) {
      setFromToken(asset0Label);
      setToToken(asset1Label);
    }
  }, [pair, asset0Label, asset1Label]);

  const hardError =
    executionError ||
    marketError ||
    (!displayQuote && quoteError ? quoteError : null);

  function flipPair() {
    setFromToken(toToken);
    setToToken(fromToken);
    setQuoteError(null);
    setExecutionError(null);
  }

  function setPresetAmount(mode: "half" | "max") {
    if (fromBalance === null || !Number.isFinite(fromBalance) || fromBalance <= 0) {
      return;
    }

    let next = 0;

    if (mode === "half") {
      next = fromBalance / 2;
    } else {
      next = fromAssetId === RIO_DENOM ? Math.max(fromBalance - 0.02, 0) : fromBalance;
    }

    setAmount(next > 0 ? trimFixed(next, 6) : "");
  }

  async function handleExecuteSwap() {
    if (!connectedAddress || !canSwap || displayQuote === null) return;

    const beforeRio = rioBalance;
    const beforeRusd = rusdBalance;
    const submittedAt = new Date().toISOString();

    setExecuting(true);
    setExecutionError(null);
    setExecutionStage("Preparing");

    let rpcEndpoint: string | null = null;

    try {
      const ctx = await getBrowserSigningContext();
      const { client, address: sender } = ctx;
      rpcEndpoint = ctx.rpcEndpoint;

      if (sender !== connectedAddress) {
        writeStoredWalletAddress(sender);
        setConnectedAddress(sender);
      }

      setExecutionStage("Wallet");

      const amountBase = toBaseUnits(amount, 6);
      const maxSpread = maxSpreadFromSlippage(slippagePct);

      let res: any;

      if (fromAssetId === RIO_DENOM && toAssetId === RUSD_CONTRACT) {
        const msg = {
          swap: {
            offer_asset: {
              info: { native_token: { denom: RIO_DENOM } },
              amount: amountBase,
            },
            ask_asset_info: {
              token: { contract_addr: RUSD_CONTRACT },
            },
            max_spread: maxSpread,
          },
        };

        setExecutionStage("Broadcasting");

        res = await client.execute(
          sender,
          pairAddress,
          msg,
          "auto",
          "RioDex Swap RIO→RUSD",
          [{ denom: RIO_DENOM, amount: amountBase }]
        );
      } else if (fromAssetId === RUSD_CONTRACT && toAssetId === RIO_DENOM) {
        const hookMsg = encodeHookMsg({
          swap: {
            ask_asset_info: {
              native_token: { denom: RIO_DENOM },
            },
            max_spread: maxSpread,
          },
        });

        const msg = {
          send: {
            contract: pairAddress,
            amount: amountBase,
            msg: hookMsg,
          },
        };

        setExecutionStage("Broadcasting");

        res = await client.execute(
          sender,
          RUSD_CONTRACT,
          msg,
          "auto",
          "RioDex Swap RUSD→RIO"
        );
      } else {
        throw new Error("Execution is currently enabled for canonical RIO/RUSD routing only.");
      }

      setExecutionStage("Confirming");

      const [refreshed] = await Promise.all([
        refreshBalancesAfterExecution(sender),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);

      setMarketRefreshNonce((v) => v + 1);

      const afterRio = refreshed?.rio ?? null;
      const afterRusd = refreshed?.rusd ?? null;

      const actualInputDelta =
        fromAssetId === RIO_DENOM
          ? beforeRio !== null && afterRio !== null
            ? beforeRio - afterRio
            : null
          : fromAssetId === RUSD_CONTRACT
          ? beforeRusd !== null && afterRusd !== null
            ? beforeRusd - afterRusd
            : null
          : null;

      const actualOutputDelta =
        toAssetId === RUSD_CONTRACT
          ? beforeRusd !== null && afterRusd !== null
            ? afterRusd - beforeRusd
            : null
          : toAssetId === RIO_DENOM
          ? beforeRio !== null && afterRio !== null
            ? afterRio - beforeRio
            : null
          : null;

      setReceipt({
        status: "success",
        phase: "Confirmed",
        submittedAt,
        completedAt: new Date().toISOString(),
        txHash: res?.transactionHash || null,
        wallet: sender,
        market: marketLabel,
        direction: `${fromToken} → ${toToken}`,
        requestAmount: numericAmount,
        quotedOutput: displayQuote,
        actualInputDelta,
        actualOutputDelta,
        beforeRio,
        beforeRusd,
        afterRio,
        afterRusd,
        height: res?.height ?? null,
        gasUsed: res?.gasUsed ?? null,
        rpcEndpoint,
      });

      setFlashNotice(`+${formatNum(actualOutputDelta ?? displayQuote, 6)} ${toToken} received`);

      setAmount("");
      setExecutionStage(null);
    } catch (e: any) {
      const errorMessage = normalizeExecutionError(e, rpcEndpoint);
      setExecutionError(errorMessage);
      setReceipt({
        status: "error",
        phase: "Failed",
        submittedAt,
        completedAt: new Date().toISOString(),
        wallet: connectedAddress,
        market: marketLabel,
        direction: `${fromToken} → ${toToken}`,
        requestAmount: numericAmount,
        quotedOutput: displayQuote,
        beforeRio,
        beforeRusd,
        afterRio: rioBalance,
        afterRusd: rusdBalance,
        error: errorMessage,
        rpcEndpoint,
      });
      setExecutionStage(null);
    } finally {
      setExecuting(false);
    }
  }

  function primaryButtonLabel() {
    if (executing && executionStage) return executionStage.toUpperCase();
    return connectedAddress ? "SWAP" : "CONNECT WALLET";
  }

  function walletStatusText() {
    if (executionStage === "Wallet") return "Awaiting wallet approval";
    if (executionStage === "Broadcasting") return "Broadcasting to chain";
    if (executionStage === "Confirming") return "Awaiting confirmation";
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_16%_10%,rgba(60,198,255,0.10),transparent_18%),radial-gradient(circle_at_84%_16%,rgba(74,144,255,0.10),transparent_20%),linear-gradient(90deg,#010816_0%,#04132f_34%,#04163c_62%,#020816_100%)] text-white">
      <div className="mx-auto max-w-[1560px] px-4 py-5 xl:px-6">
        <div className={`${shell("nav")} flex flex-wrap items-center gap-3 px-4 py-3`}>
          <div className="mr-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-[#13214c]">
            <TokenAvatar registryMap={registryMap} assetId={asset0Id} label={asset0Label} size={28} />
          </div>

          <NavLink href={RIODEX_SWAP_ROUTE} label="Swap" active />
          <NavLink href={RIODEX_LIQUIDITY_ROUTE} label="Liquidity" />
          <NavLink href={RIODEX_SCREENER_ROUTE} label="Screener" />
          <NavLink href={pairRoutes.pool} label="Pool" />
          <NavLink href={RIODEX_HOME_ROUTE} label="RioDex" />
          <NavLink href="/rioex" label="RioEx" />
          <NavLink href="/rioexplorer" label="RioExplorer" />

          <div className="ml-auto flex items-center gap-3">
            <div className="max-w-[360px] truncate rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200">
              {marketLabel}
            </div>
            <div className="rounded-[20px] bg-cyan-400 px-5 py-3 text-sm font-semibold text-[#081229]">
              {connectedAddress ? shortAddr(connectedAddress, 10, 8) : "Connect Wallet"}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <ExchangeSurfaceNav
            product="riodex"
            activeKey="swap"
            featured={registryPair ? {
              displaySymbol: registryPair.displaySymbol,
              liquidityUsd: registryPair.liquidityUsd,
              feeBps: registryPair.feeBps,
              isCanonical: registryPair.isCanonical,
              isLive: registryPair.isLive,
              routes: registryPair.routes,
            } : (registryMarkets[0] || null)}
            title="RioDex Execution Surfaces"
            subtitle="Shared horizontal routing now sits above Swap so execution, markets, assets, LaunchPad, RIO, RUSD, and account handoff stay consistent while the larger existing swap surface remains intact."
          />
        </div>

        {(registryPair || registryMarkets.length > 0 || registryTruthError) ? (
          <div className="mt-4 rounded-[24px] border border-cyan-400/14 bg-[linear-gradient(180deg,rgba(11,26,63,0.92),rgba(5,16,40,0.96))] px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/85">
                  Authoritative Pair Truth
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {registryPair?.displaySymbol || marketLabel}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className={truthBadge(registryPair?.isLive ? "live" : "neutral")}>
                    {registryPair?.isCanonical ? "Canonical" : "Registry-backed"}
                  </span>
                  {authoritativeLiquiditySource ? (
                    <span className={truthBadge("neutral")}>{authoritativeLiquiditySource}</span>
                  ) : null}
                  {authoritativeFeePolicy ? (
                    <span className={truthBadge("neutral")}>{authoritativeFeePolicy}</span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SimpleStat
                  label="Registry Liquidity"
                  value={authoritativeLiquidityUsd !== null ? formatUsd(authoritativeLiquidityUsd) : "—"}
                />
                <SimpleStat
                  label="Fee Policy"
                  value={authoritativeFeeBps !== null ? `${authoritativeFeeBps} bps` : "—"}
                />
                <SimpleStat
                  label="Updated"
                  value={formatDateTime(authoritativeUpdatedAt)}
                />
                <SimpleStat
                  label="Treasury"
                  value={authoritativeFeeRecipient ? shortAddr(authoritativeFeeRecipient, 10, 8) : "—"}
                />
              </div>
            </div>

            {registryMarkets.length ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {registryMarkets.slice(0, 3).map((item) => (
                  <Link
                    key={item.pairAddress}
                    href={item.routes.swap}
                    className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-white">{item.displaySymbol}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
                      {item.canonicalSymbol}
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            {registryTruthError ? (
              <div className="mt-3 text-xs text-amber-200">{registryTruthError}</div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.42fr)_380px] 2xl:grid-cols-[minmax(0,1.48fr)_410px]">
          <section className={`${shell("panel")} p-5 xl:p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex items-center gap-2">
                    <TokenAvatar registryMap={registryMap} assetId={asset0Id} label={asset0Label} size={40} />
                    <TokenAvatar registryMap={registryMap} assetId={asset1Id} label={asset1Label} size={40} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-0 text-[32px] font-semibold leading-none tracking-tight text-white">
                        {marketLabel}
                      </div>
                      {registryPair?.isCanonical || pair?.is_canonical ? (
                        <span className={truthBadge("live")}>Canonical</span>
                      ) : null}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                      <span>{marketIdentity}</span>
                      {authoritativeFeeBps !== null && authoritativeFeeBps !== undefined ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300">
                          {authoritativeFeeBps} bps
                        </span>
                      ) : null}
                      <span className="max-w-[26rem] truncate text-slate-400">
                        {marketHandle}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setSelectedResolution(tf)}
                    className={[
                      "rounded-xl px-3 py-2 text-sm transition",
                      selectedResolution === tf
                        ? "bg-white/12 text-white"
                        : "text-slate-300 hover:bg-white/6",
                    ].join(" ")}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="text-2xl font-semibold">{selectedResolution}</div>

                <div className="hidden md:flex items-center gap-3 text-sm text-slate-400">
                  <span>O {latestChart ? formatNum(latestChart.open, 6) : "—"}</span>
                  <span>H {latestChart ? formatNum(latestChart.high, 6) : "—"}</span>
                  <span>L {latestChart ? formatNum(latestChart.low, 6) : "—"}</span>
                  <span>C {latestChart ? formatNum(latestChart.close, 6) : "—"}</span>
                  <span>
                    {latestChart && previousChart
                      ? `${formatSigned(chartDelta, 6)} (${formatSigned(chartDeltaPct, 2)}%)`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 grid-cols-2 xl:grid-cols-4">
              <SimpleStat
                label="Reserve Price"
                value={marketPriceTruth !== null ? formatNum(marketPriceTruth, 6) : "—"}
              />
              <SimpleStat
                label="Last Trade"
                value={lastTradeDisplayTruth !== null ? formatNum(lastTradeDisplayTruth, 6) : "—"}
              />
              <SimpleStat label="Liquidity" value={liquidityTruth || "—"} />
              <SimpleStat label="Updated" value={formatDateTime(updatedTruthTime)} />
            </div>

            <div className="mt-5">
              <TruthChart
                data={chartData}
                pairLabel={marketLabel}
                resolutionLabel={marketResolution || "1m"}
                requestedResolution={selectedResolution}
                fallbackPrice={marketPriceTruth}
              />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <Clock3 className="h-4 w-4" />
                <span>{new Date().toLocaleTimeString()}</span>
                <span>(local)</span>
              </div>

              <div className="text-xs text-slate-400">
                {marketLoading ? "Syncing truth source…" : registryPair ? "Truth source: RioDex + authoritative registry" : "Truth source: RioDex"}
              </div>
            </div>

            <div className="mt-5 grid gap-3 grid-cols-2 xl:grid-cols-4">
              <SimpleStat label="Pair" value={marketLabel} />
              <SimpleStat
                label="Fee Tier"
                value={
                  authoritativeFeeBps !== null && authoritativeFeeBps !== undefined
                    ? `${authoritativeFeeBps} bps`
                    : "—"
                }
              />
             <SimpleStat label="Recent Swaps Loaded" value={String(swapCountTruth)} />
              <SimpleStat
                label="LP Supply"
                value={latestLiquidity ? formatNum(totalShare, 2) : "—"}
              />
            </div>
          </section>

          <section className={`${shell("card")} p-5 xl:p-6`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Swap</div>
                <div className="mt-1 text-xs text-slate-400">Simple execution surface</div>
              </div>

              <div className="text-xs text-slate-400">
                {connectedAddress ? "Wallet ready" : "Wallet required"}
              </div>
            </div>

            {hardError ? (
              <div className="mt-4 rounded-[18px] border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {hardError}
              </div>
            ) : null}

            {walletStatusText() ? (
              <div className="mt-4 rounded-[18px] border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                {walletStatusText()}
              </div>
            ) : null}

            {flashNotice ? (
              <div className="mt-4 rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {flashNotice}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <div className={`${shell("field")} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-white">From</div>
                  <div className="flex items-center gap-2">
                    <QuickAmountButton label="Max" onClick={() => setPresetAmount("max")} />
                    <QuickAmountButton label="50%" onClick={() => setPresetAmount("half")} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className={`${shell("token")} flex min-w-0 items-center gap-3 px-4 py-3`}>
                    <TokenAvatar registryMap={registryMap} assetId={fromAssetId} label={fromToken} size={34} />
                    <div className="min-w-0 truncate text-2xl font-semibold text-white">
                      {fromToken}
                    </div>
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-300" />
                  </div>

                  <div className="text-sm text-slate-400">
                    {balanceLoading
                      ? "Loading..."
                      : fromBalance !== null
                      ? formatNum(fromBalance, 4)
                      : "—"}
                  </div>
                </div>

                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="mt-6 w-full bg-transparent text-right text-4xl font-semibold text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={flipPair}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#9dbbff] text-3xl font-semibold text-[#081229] shadow-[0_10px_30px_rgba(157,187,255,0.32)] transition hover:scale-[1.02]"
                >
                  ↓
                </button>
              </div>

              <div className={`${shell("field")} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-white">To</div>
                  <div className="text-xs text-slate-400">Estimated output</div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className={`${shell("token")} flex min-w-0 items-center gap-3 px-4 py-3`}>
                    <TokenAvatar registryMap={registryMap} assetId={toAssetId} label={toToken} size={34} />
                    <div className="min-w-0 truncate text-2xl font-semibold text-white">
                      {toToken}
                    </div>
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-300" />
                  </div>

                  <div className="text-sm text-slate-400">
                    {balanceLoading
                      ? "Loading..."
                      : toToken === "RIO"
                      ? rioBalance !== null
                        ? formatNum(rioBalance, 4)
                        : "—"
                      : rusdBalance !== null
                      ? formatNum(rusdBalance, 4)
                      : "—"}
                  </div>
                </div>

                <div className="mt-6 text-right text-4xl font-semibold text-white">
                  {quoteLoading ? "..." : displayQuote !== null ? formatNum(displayQuote, 6) : "0.0"}
                </div>
              </div>

              <div className={`${shell("soft")} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">Slippage</span>
                  <span className="text-sm font-medium text-white">{slippage}%</span>
                </div>

                <div className="mt-3 flex gap-2">
                  {["0.1", "0.5", "1.0"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSlippage(value)}
                      className={[
                        "rounded-xl px-3 py-2 text-xs transition",
                        slippage === value
                          ? "bg-cyan-400 text-[#081229] font-semibold"
                          : "bg-white/8 text-slate-300 hover:bg-white/12",
                      ].join(" ")}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SimpleStat
                  label="Reserve Price"
                  value={marketPriceTruth !== null ? formatNum(marketPriceTruth, 6) : "—"}
                />
                <SimpleStat label="Liquidity" value={liquidityTruth || "—"} />
                <SimpleStat label="Recent Swaps" value={String(swapCountTruth)} />
                <SimpleStat label="Updated" value={formatDateTime(updatedTruthTime)} />
              </div>

              <div className={`${shell("soft")} space-y-2 p-4 text-sm`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Rate</span>
                  <span className="text-white">
                    {quoteData
                      ? `${formatNum(quoteData.effectivePrice, 6)} ${toToken}/${fromToken}`
                      : marketPriceTruth !== null
                      ? `${formatNum(marketPriceTruth, 6)} ${asset1Label}/${asset0Label}`
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Min received</span>
                  <span className="text-white">
                    {quoteData
                      ? `${formatNum(quoteData.minReceived, 6)} ${toToken}`
                      : displayQuote !== null
                      ? `${formatNum(displayQuote * (1 - slippagePct / 100), 6)} ${toToken}`
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Fee</span>
                  <span className="text-white">
                    {quoteData ? `${formatNum(quoteData.feeAmount, 6)} ${fromToken}` : "—"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleExecuteSwap}
                disabled={!canSwap || executing}
                className={[
                  "w-full rounded-[18px] px-5 py-4 text-base font-semibold uppercase tracking-[0.14em] transition",
                  canSwap && !executing
                    ? "bg-cyan-400 text-[#081229] shadow-[0_14px_36px_rgba(34,211,238,0.28)] hover:brightness-105"
                    : "cursor-not-allowed bg-white/10 text-white/60",
                ].join(" ")}
              >
                {primaryButtonLabel()}
              </button>

              <div className="text-center text-xs text-slate-400">{swapGateReason}</div>

              {needsRioFeeBalance ? (
                <div className="text-center text-xs text-amber-300">
                  RIO is required for network fee settlement.
                </div>
              ) : null}

              {receipt?.status === "success" ? (
                <div className="rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  Confirmed • {receipt.txHash ? shortAddr(receipt.txHash, 16, 12) : "settled"}
                </div>
              ) : null}

              {receipt?.status === "error" ? (
                <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {receipt.error || "Swap failed"}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="mt-5 px-1 text-[11px] leading-5 text-slate-500">
          This terminal reads canonical pair truth from the authoritative RioEx market contract and keeps liquidity, recent swaps, and candle feeds wired for execution support. Treasury fee collection remains aligned to the chain-wide multisig collector: {shortAddr(TREASURY_FEE_COLLECTOR, 12, 10)}.
        </div>
      </div>
    </div>
  );
}
