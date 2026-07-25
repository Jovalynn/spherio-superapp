"use client";


import { RioValuationBadge } from "@/components/riolight/RioValuationBadge";
import { SPHERIO_FEE_POLICY, SPHERIO_TREASURY_MULTISIG, resolveTreasuryRecipient } from "@/lib/protocol/treasury";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Clock3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { RIOLIGHT_SWAP_RESULT_EVENT, createRioLightRequestId } from "@/lib/riolight/approval";
const RIOLIGHT_EXECUTION_APPROVED_EVENT = "riolight:executionApproved";
import { RioLightApprovalCard } from "@/components/riolight/RioLightApprovalCard";
import { executeSpherioRioLightAction } from "@/lib/riolight/execution";
import {
  createRioLightGlobalHandoverIntent,
  rioLightExplorerProofHref,
} from "@/lib/riolight/handover";
import {
  buildTokenRegistryMap,
  getRioDexTokenRegistryBatch,
  getRegistryLogoUrl,
  getRegistryPairLabel,
} from "@/lib/riodex/token-registry";

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
  rows?: RegistryMarketLite[];
  items?: RegistryMarketLite[];
  pairs?: RegistryMarketLite[];
};

type RegistryPairResponse = {
  ok?: boolean;
  pair?: RegistryPairContext;
  item?: RegistryPairContext;
};

type TokenUniverseSearchItem = {
  assetId: string;
  symbol: string;
  displayName: string;
  assetType: string;
  status: string;
  logoUrl: string | null;
  source: string;
};

type SwapTokenSelectorOption = {
  assetId: string;
  label: string;
  symbol: string;
  displayName: string;
  assetType: string;
  status: string;
  logoUrl: string | null;
  source: string;
};

const CHAIN_ID = "spherio-1";
const CANONICAL_PAIR_ADDR =
  "rio1zfw930csx0k5qzf35vndaulwada4wa3pwtg5hy8rmnnx35wdyhssn3pmhj";
const RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";
const RIO_DENOM = "urio";
const PUMP_GRADUATION_RUSD_TARGET = 15_000;
const RIO_REFERENCE_PRICE_RUSD_ESTIMATE = 0.1;
const PUMP_GRADUATION_RIO_TARGET_ESTIMATE =
  PUMP_GRADUATION_RUSD_TARGET / RIO_REFERENCE_PRICE_RUSD_ESTIMATE;
const TREASURY_FEE_COLLECTOR = SPHERIO_TREASURY_MULTISIG;

const RIO_LOGO_FALLBACK =
  "https://avatars.githubusercontent.com/u/175851528?s=400&u=b0c1a871d1e739566c4c2bf96a97720fedfc03ab&v=4";
const RUSD_LOGO_FALLBACK = "https://raw.githubusercontent.com/Lerivee/RUSD/refs/heads/main/Untitled%20design.png";

const WALLET_STORAGE_KEY = "spherio_wallet_address";
const WALLET_EVENT = "spherio:wallet-changed";

function resolveInitialPairAddress(searchParams: ReturnType<typeof useSearchParams>) {
  return (
    searchParams.get("pair") ||
    searchParams.get("pool") ||
    searchParams.get("address") ||
    "rio1zfw930csx0k5qzf35vndaulwada4wa3pwtg5hy8rmnnx35wdyhssn3pmhj"
  );
}


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

function marketDisplayLabel(market: Partial<RegistryMarketLite | RegistryPairContext> | null | undefined) {
  const base = getAssetSymbol((market as any)?.baseSymbol || (market as any)?.baseAssetId);
  const quote = getAssetSymbol((market as any)?.quoteSymbol || (market as any)?.quoteAssetId);

  if (base && quote && base !== "—" && quote !== "—" && base !== quote) {
    return `${base} / ${quote}`;
  }

  const display = String((market as any)?.displaySymbol || "").trim();
  const canonical = String((market as any)?.canonicalSymbol || "").trim();

  if (display && !display.startsWith("rio1") && display.toLowerCase() !== "urio") {
    if (display.includes("/")) return display.replace("urio", "RIO").replace("URIO", "RIO");
    return getAssetSymbol(display);
  }

  if (canonical && !canonical.startsWith("rio1") && canonical.toLowerCase() !== "urio") {
    if (canonical.includes("/")) return canonical.replace("urio", "RIO").replace("URIO", "RIO");
    return getAssetSymbol(canonical);
  }

  // If this is the known canonical pair, never show RIO/RIO.
  const pairAddress = String((market as any)?.pairAddress || (market as any)?.pair_address || "").trim();
  if (pairAddress === CANONICAL_PAIR_ADDR) return "RIO / RUSD";

  return display || canonical || "Indexed market";
}

function normalizeScreenerMarket(raw: any): RegistryMarketLite {
  const pairAddress = String(raw?.pairAddress || raw?.pair_address || "");
  const baseSymbol = String(raw?.baseSymbol || raw?.base_symbol || "").trim();
  const quoteSymbol = String(raw?.quoteSymbol || raw?.quote_symbol || "").trim();

  return {
    pairAddress,
    displaySymbol: marketDisplayLabel(raw),
    canonicalSymbol: String(raw?.canonicalSymbol || raw?.canonical_symbol || marketDisplayLabel(raw)),
    baseSymbol,
    quoteSymbol,
    baseLogoUrl: raw?.baseLogoUrl || raw?.base_logo_url || null,
    quoteLogoUrl: raw?.quoteLogoUrl || raw?.quote_logo_url || null,
    liquidityUsd: Number(raw?.liquidityUsd ?? raw?.liquidity_usd ?? 0),
    feeBps: Number(raw?.feeBps ?? raw?.fee_bps ?? 30),
    isCanonical: Boolean(raw?.isCanonical ?? raw?.is_canonical),
    isLive: Boolean(raw?.isLive ?? raw?.is_live),
    routes: raw?.routes || {
      assetTerminal: `/rioex/markets/${encodeURIComponent(pairAddress)}`,
      marketBoard: "/rioex",
      hero: "/rioex",
      pool: `/riodex/pool/${encodeURIComponent(pairAddress)}`,
      swap: `/riodex/swap?pair=${encodeURIComponent(pairAddress)}`,
      liquidity: `/riodex/liquidity?pool=${encodeURIComponent(pairAddress)}`,
    },
  };
}

function isHealthyIndexedMarket(market: RegistryMarketLite) {
  if (!market.pairAddress) return false;

  const base = String(market.baseSymbol || "").trim();
  const quote = String(market.quoteSymbol || "").trim();
  const display = String(market.displaySymbol || "").trim().toUpperCase();
  const canonical = String(market.canonicalSymbol || "").trim().toUpperCase();

  // Hide incomplete / stale / malformed rows from Swap search.
  if (!base || !quote) return false;
  if (base === quote) return false;
  if (display.includes("UNKNOWN") || canonical.includes("UNKNOWN")) return false;
  if (display === "RIO / RIO" || canonical === "RIO/RIO") return false;

  // Swap search should show executable indexed markets only.
  if (!market.isLive) return false;

  return true;
}


function normalizeTokenUniverseItem(raw: any): TokenUniverseSearchItem | null {
  const assetId = String(
    raw?.assetId ||
      raw?.asset_id ||
      raw?.contractAddress ||
      raw?.contract_address ||
      raw?.denom ||
      raw?.address ||
      ""
  ).trim();

  const symbol = String(
    raw?.symbol ||
      raw?.ticker ||
      raw?.displaySymbol ||
      raw?.display_symbol ||
      raw?.name ||
      ""
  ).trim();

  const displayName = String(
    raw?.displayName ||
      raw?.display_name ||
      raw?.name ||
      symbol ||
      assetId
  ).trim();

  if (!assetId && !symbol) return null;

  const normalizedSymbol =
    symbol.toLowerCase() === "urio"
      ? "RIO"
      : symbol || getAssetSymbol(assetId);

  return {
    assetId: assetId || normalizedSymbol,
    symbol: normalizedSymbol,
    displayName: displayName || normalizedSymbol,
    assetType: String(raw?.assetType || raw?.asset_type || raw?.type || "registry").trim(),
    status: String(raw?.status || raw?.routeStatus || raw?.route_status || "indexed").trim(),
    logoUrl: raw?.logoUrl || raw?.logo_url || raw?.logo || null,
    source: String(raw?.source || raw?.registrySource || raw?.registry_source || "token_registry").trim(),
  };
}

function tokenSearchBlob(token: TokenUniverseSearchItem) {
  return [
    token.assetId,
    token.symbol,
    token.displayName,
    token.assetType,
    token.status,
    token.source,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}


function tokenUniverseToSelectorOption(token: TokenUniverseSearchItem): SwapTokenSelectorOption {
  const symbol = String(token.symbol || getAssetSymbol(token.assetId) || "").trim();

  return {
    assetId: token.assetId,
    label: symbol || token.displayName || token.assetId,
    symbol: symbol || token.assetId,
    displayName: token.displayName || symbol || token.assetId,
    assetType: token.assetType || "registry",
    status: token.status || "indexed",
    logoUrl: token.logoUrl || null,
    source: token.source || "token_registry",
  };
}

function selectorOptionSearchBlob(option: SwapTokenSelectorOption) {
  return [
    option.assetId,
    option.label,
    option.symbol,
    option.displayName,
    option.assetType,
    option.status,
    option.source,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
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

  const lower = value.toLowerCase();

  if (value === "RIO" || lower === RIO_DENOM) return "RIO";
  if (value === "RUSD" || value === RUSD_CONTRACT) return "RUSD";

  // Canonical stablecoin aliases should never become long addresses in public labels.
  if (lower.includes("rusd")) return "RUSD";

  // Public swap labels should not expose rio1... as the market symbol.
  // Keep addresses for proof rows only.
  if (value.startsWith("rio1")) return shortAddr(value, 8, 6);

  if (lower === "urio") return "RIO";

  return value.toUpperCase();
}

function buildTruthPairLabel(asset0Id?: string | null, asset1Id?: string | null) {
  return `${getAssetSymbol(asset0Id)} / ${getAssetSymbol(asset1Id)}`;
}

function canonicalSwapPairLabel(pairAddress?: string | null, fallback?: string | null) {
  if (String(pairAddress || "") === CANONICAL_PAIR_ADDR) return "RIO / RUSD";
  const value = String(fallback || "").trim();
  if (!value || value === "RIO / RIO" || value === "urio / urio") return "Indexed market";
  return value.replace("urio", "RIO").replace("URIO", "RIO");
}

function safeSwapRouteLabel(pairAddress?: string | null, fallback?: string | null) {
  const raw = String(fallback || "").trim();
  const normalizedRaw = raw.replace("urio", "RIO").replace("URIO", "RIO");

  if (
    normalizedRaw &&
    normalizedRaw !== "Indexed market" &&
    normalizedRaw !== "RIO / RIO" &&
    normalizedRaw !== "RIO/RIO" &&
    normalizedRaw !== "urio / urio"
  ) {
    return normalizedRaw;
  }

  const value = canonicalSwapPairLabel(pairAddress, fallback);
  if (value === "Indexed market" || value === "RIO / RIO" || value === "urio / urio") {
    return "Route pending";
  }
  return value;
}

function safeRouteMetric(hasRoute: boolean, value?: string | number | null) {
  if (!hasRoute) return "Pending";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function safeLiquidityTruth(hasRoute: boolean, value?: string | number | null) {
  const raw = safeRouteMetric(hasRoute, value);
  if (raw === "Pending" || raw === "—") return raw;

  return String(raw)
    .replace(/200,000\s+RIO/g, "200,000 RUSD")
    .replace(/90\s+RIO/g, "90 RUSD")
    .replace(/\/\s*200,000\s+RIO/g, "/ 200,000 RUSD")
    .replace(/\/\s*90\s+RIO/g, "/ 90 RUSD");
}

function canonicalSwapLiquidityUsd(pairAddress?: string | null, rawValue?: number | null) {
  if (String(pairAddress || "") === CANONICAL_PAIR_ADDR) return 400_000;
  const n = Number(rawValue || 0);
  return Number.isFinite(n) ? n : 0;
}


function canonicalTokenMeta(assetId?: string | null, label?: string | null) {
  const id = String(assetId || "").trim();
  const sym = String(label || "").trim().toUpperCase();

  // Asset ID wins over label. This prevents stale labels from assigning
  // the wrong logo/symbol to a registry-backed asset.
  if (id === RUSD_CONTRACT) {
    return {
      assetId: RUSD_CONTRACT,
      symbol: "RUSD",
      displayName: "Spherio RUSD",
      logoUrl: RUSD_LOGO_FALLBACK,
    };
  }

  if (id === RIO_DENOM) {
    return {
      assetId: RIO_DENOM,
      symbol: "RIO",
      displayName: "Spherio RIO",
      logoUrl: RIO_LOGO_FALLBACK,
    };
  }

  if (sym === "RUSD") {
    return {
      assetId: RUSD_CONTRACT,
      symbol: "RUSD",
      displayName: "Spherio RUSD",
      logoUrl: RUSD_LOGO_FALLBACK,
    };
  }

  if (sym === "RIO") {
    return {
      assetId: RIO_DENOM,
      symbol: "RIO",
      displayName: "Spherio RIO",
      logoUrl: RIO_LOGO_FALLBACK,
    };
  }

  return null;
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

function makeAssetInfo(assetId: string, assetType?: string | null) {
  const id = String(assetId || "").trim();
  const t = String(assetType || "").toLowerCase();

  if (!id || t.includes("native") || id === "urio" || id.startsWith("u")) {
    return { native_token: { denom: id || "urio" } };
  }

  return { token: { contract_addr: id } };
}

function isNativeExecutionAsset(assetId: string, assetType?: string | null) {
  const id = String(assetId || "").trim();
  const t = String(assetType || "").toLowerCase();

  return t.includes("native") || id === "urio" || id.startsWith("u");
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
      <RioValuationBadge />

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
  const canonical = canonicalTokenMeta(normalized, label);
  const symbol = canonical?.symbol || label || getAssetSymbol(normalized);

  const logoUrl =
    canonical?.logoUrl ||
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
  const initialPool =
  searchParams.get("pool") ||
  searchParams.get("pair") ||
  "";

  const [fromToken, setFromToken] = useState(
    initialFrom === "RUSD" ? "RUSD" : "RIO"
  );
  const [toToken, setToToken] = useState(initialTo === "RIO" ? "RUSD" : initialTo || "RUSD");

const [fromTokenAssetId, setFromTokenAssetId] = useState<string>("");
const [toTokenAssetId, setToTokenAssetId] = useState<string>("");
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
  const [marketSearch, setMarketSearch] = useState("");
  const [fromTokenSearch, setFromTokenSearch] = useState("");
  const [toTokenSearch, setToTokenSearch] = useState("");
  const [tokenMenuOpen, setTokenMenuOpen] = useState<"from" | "to" | null>(null);

  const [quoteOut, setQuoteOut] = useState<string>("0");
  const [quoteFee, setQuoteFee] = useState<string>("0");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [executing, setExecuting] = useState(false);
  const [executionStage, setExecutionStage] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [rioLightCardOpen, setRioLightCardOpen] = useState(false);
  const [activeRioLightRequestId, setActiveRioLightRequestId] = useState<string | null>(null);
  const [rioLightApproved, setRioLightApproved] = useState(false);
  const [receipt, setReceipt] = useState<SettlementReceipt | null>(null);
  const [flashNotice, setFlashNotice] = useState<string | null>(null);

  const pairAddress = initialPool || CANONICAL_PAIR_ADDR;
  const pairRoutes = useMemo(
    () => ({
      swap: `/riodex/swap?pair=${encodeURIComponent(pairAddress)}`,
      liquidity: `/riodex/liquidity?pair=${encodeURIComponent(pairAddress)}&mode=add`,
      pool: `/riodex/pool/${encodeURIComponent(pairAddress)}`,
      screener: `/riodex/screener`,
      markets: `/rioex/markets/${encodeURIComponent(pairAddress)}`,
      trade: `/rioex/markets/${encodeURIComponent(pairAddress)}/trades`,
      explorer: `/rioexplorer/address/${encodeURIComponent(pairAddress)}`,
    }),
    [pairAddress]
  );

  const [tokenUniverse, setTokenUniverse] = useState<TokenUniverseSearchItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadTokenUniverse() {
      try {
        const [json, screenerJson]: any[] = await Promise.all([
          fetchJson<any>("/api/riodex/token-registry?limit=1000"),
          fetchJson<any>("/api/riodex/screener"),
        ]);

        const rawItems =
          (Array.isArray(json?.items) && json.items) ||
          (Array.isArray(json?.tokens) && json.tokens) ||
          (Array.isArray(json?.assets) && json.assets) ||
          (Array.isArray(json?.rows) && json.rows) ||
          [];

        const normalized = rawItems
          .map(normalizeTokenUniverseItem)
          .filter(Boolean) as TokenUniverseSearchItem[];

        const byKey = new Map<string, TokenUniverseSearchItem>();

        const addTokenUniverseItem = (item: Partial<TokenUniverseSearchItem> | null | undefined) => {
          if (!item) return;

          const assetId = String(item.assetId || "").trim();
          const symbol = String(item.symbol || "").trim();

          if (!assetId || !symbol) return;

          const key = assetId.toLowerCase();
          if (byKey.has(key)) return;

          byKey.set(key, {
            assetId,
            symbol,
            displayName: String(item.displayName || symbol),
            assetType: String(item.assetType || "indexed"),
            status: String(item.status || "live"),
            logoUrl: item.logoUrl || null,
            source: String(item.source || "swap_market_universe"),
          });
        };

        normalized.forEach(addTokenUniverseItem);

        const screenerRows =
          (Array.isArray(screenerJson?.rows) && screenerJson.rows) ||
          (Array.isArray(screenerJson?.items) && screenerJson.items) ||
          (Array.isArray(screenerJson?.markets) && screenerJson.markets) ||
          (Array.isArray(screenerJson?.pairs) && screenerJson.pairs) ||
          [];

        screenerRows.forEach((row: any) => {
          const market = normalizeScreenerMarket(row);

          addTokenUniverseItem({
            assetId:
              (market as any).baseAssetId ||
              (market as any).asset0Id ||
              row?.baseAssetId ||
              row?.base_asset_id ||
              row?.asset_0_id ||
              row?.resolved_asset_0_id,
            symbol:
              (market as any).baseSymbol ||
              (market as any).asset0Symbol ||
              row?.baseSymbol ||
              row?.base_symbol ||
              row?.asset_0_symbol,
            displayName:
              (market as any).baseDisplayName ||
              (market as any).asset0DisplayName ||
              row?.baseDisplayName ||
              row?.asset_0_display_name ||
              row?.asset_0_symbol,
            assetType: row?.asset_0_type || row?.baseAssetType || "indexed",
            logoUrl: row?.asset_0_logo_url || row?.baseLogoUrl || null,
            status: (market as any).isLive ? "live" : "indexed",
            source: "screener_market_universe",
          });

          addTokenUniverseItem({
            assetId:
              (market as any).quoteAssetId ||
              (market as any).asset1Id ||
              row?.quoteAssetId ||
              row?.quote_asset_id ||
              row?.asset_1_id ||
              row?.resolved_asset_1_id,
            symbol:
              (market as any).quoteSymbol ||
              (market as any).asset1Symbol ||
              row?.quoteSymbol ||
              row?.quote_symbol ||
              row?.asset_1_symbol,
            displayName:
              (market as any).quoteDisplayName ||
              (market as any).asset1DisplayName ||
              row?.quoteDisplayName ||
              row?.asset_1_display_name ||
              row?.asset_1_symbol,
            assetType: row?.asset_1_type || row?.quoteAssetType || "indexed",
            logoUrl: row?.asset_1_logo_url || row?.quoteLogoUrl || null,
            status: (market as any).isLive ? "live" : "indexed",
            source: "screener_market_universe",
          });
        });

        // Always include canonical base assets even if the APIs are sparse.
        [
          {
            assetId: RIO_DENOM,
            symbol: "RIO",
            displayName: "Spherio RIO",
            assetType: "native",
            status: "live",
            logoUrl: RIO_LOGO_FALLBACK,
            source: "canonical",
          },
          {
            assetId: RUSD_CONTRACT,
            symbol: "RUSD",
            displayName: "Spherio RUSD",
            assetType: "spo20",
            status: "live",
            logoUrl: RUSD_LOGO_FALLBACK,
            source: "canonical",
          },
        ].forEach(addTokenUniverseItem);

        if (!cancelled) setTokenUniverse(Array.from(byKey.values()));
      } catch {
        if (!cancelled) {
          setTokenUniverse([
            {
              assetId: RIO_DENOM,
              symbol: "RIO",
              displayName: "Spherio RIO",
              assetType: "native",
              status: "live",
              logoUrl: RIO_LOGO_FALLBACK,
              source: "canonical",
            },
            {
              assetId: RUSD_CONTRACT,
              symbol: "RUSD",
              displayName: "Spherio RUSD",
              assetType: "spo20",
              status: "live",
              logoUrl: RUSD_LOGO_FALLBACK,
              source: "canonical",
            },
          ]);
        }
      }
    }

    void loadTokenUniverse();

    return () => {
      cancelled = true;
    };
  }, []);

  const searchableRegistryMarkets = useMemo(() => {
    const q = marketSearch.trim().toLowerCase();

    const rows = registryMarkets.filter((market) => {
      if (!q) return true;

      return [
        marketDisplayLabel(market),
        market.displaySymbol,
        market.canonicalSymbol,
        market.baseSymbol,
        market.quoteSymbol,
        market.pairAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    return rows.slice(0, 8);
  }, [registryMarkets, marketSearch]);

  const hasTokenSearchQuery = marketSearch.trim().length >= 2;

  const searchableTokenUniverse = useMemo(() => {
    const q = marketSearch.trim().toLowerCase();

    if (q.length < 2) return [];

    const base = tokenUniverse.filter((token) => tokenSearchBlob(token).includes(q));

    return base.slice(0, 8);
  }, [marketSearch, tokenUniverse]);

  const registryTokenOptions = useMemo(() => {
    const byKey = new Map<string, SwapTokenSelectorOption>();

    tokenUniverse
      .map(tokenUniverseToSelectorOption)
      .forEach((option) => {
        const key = String(option.assetId || option.symbol).toLowerCase();
        if (key && !byKey.has(key)) byKey.set(key, option);
      });

    // Always preserve canonical swap assets.
    [
      {
        assetId: RIO_DENOM,
        label: "RIO",
        symbol: "RIO",
        displayName: "Spherio RIO",
        assetType: "native",
        status: "live",
        logoUrl: RIO_LOGO_FALLBACK,
        source: "canonical",
      },
      {
        assetId: RUSD_CONTRACT,
        label: "RUSD",
        symbol: "RUSD",
        displayName: "Spherio RUSD",
        assetType: "spo20",
        status: "live",
        logoUrl: RUSD_LOGO_FALLBACK,
        source: "canonical",
      },
    ].forEach((option) => {
      const key = option.assetId.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, option);
    });

    return Array.from(byKey.values()).sort((a, b) => {
      const ar = a.symbol === "RIO" ? 0 : a.symbol === "RUSD" ? 1 : 2;
      const br = b.symbol === "RIO" ? 0 : b.symbol === "RUSD" ? 1 : 2;
      if (ar !== br) return ar - br;
      return a.symbol.localeCompare(b.symbol);
    });
  }, [tokenUniverse]);

  const fromTokenOptions = useMemo(() => {
    const q = fromTokenSearch.trim().toLowerCase();
    if (!q) return registryTokenOptions.slice(0, 12);
    return registryTokenOptions
      .filter((option) => selectorOptionSearchBlob(option).includes(q))
      .slice(0, 12);
  }, [fromTokenSearch, registryTokenOptions]);

  const toTokenOptions = useMemo(() => {
    const q = toTokenSearch.trim().toLowerCase();
    if (!q) return registryTokenOptions.slice(0, 12);
    return registryTokenOptions
      .filter((option) => selectorOptionSearchBlob(option).includes(q))
      .slice(0, 12);
  }, [toTokenSearch, registryTokenOptions]);

  
const CANONICAL_RUSD_ASSET_ID = "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";

function canonicalAssetSymbol(value: unknown) {
  const raw = String(value || "").trim();
  const lower = raw.toLowerCase();

  if (!raw) return "";
  if (lower === "urio") return "RIO";
  if (lower === "rio") return "RIO";
  if (lower === "rusd") return "RUSD";
  if (lower === CANONICAL_RUSD_ASSET_ID.toLowerCase()) return "RUSD";
  if (lower.startsWith("rio14nur")) return "RUSD";

  if (/^rio1[0-9a-z]{20,}$/i.test(raw)) return "";

  return raw.toUpperCase();
}

function canonicalAssetSymbolFromFields(symbol: unknown, assetId: unknown, fallback?: unknown) {
  return (
    canonicalAssetSymbol(symbol) ||
    canonicalAssetSymbol(assetId) ||
    canonicalAssetSymbol(fallback)
  );
}


function normalizeRouteSymbol(value?: string | null) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace("URIO", "RIO");
  }

  
function isValidRouteSymbol(value?: string | null) {
  const clean = normalizeRouteSymbol(value);

  return Boolean(
    clean &&
      clean !== "UNKNOWN" &&
      clean !== "ROUTEPENDING" &&
      clean !== "INDEXEDMARKET" &&
      clean !== "—"
  );
}

function isValidRouteSymbolPair(value?: string | null) {
  const raw = String(value || "").trim();

  if (!raw.includes("/")) return false;

  const [a, b] = raw.split("/").map((part) => normalizeRouteSymbol(part));

  if (!isValidRouteSymbol(a) || !isValidRouteSymbol(b)) return false;
  if (a === b) return false;

  return true;
}

function cleanRouteDisplayLabel(value?: string | null) {
  if (!isValidRouteSymbolPair(value)) return "Route pending";

  return String(value || "")
    .replace("urio", "RIO")
    .replace("URIO", "RIO");
}

function findExecutableRouteForTokens(inputToken: string, outputToken: string) {
    const from = normalizeRouteSymbol(inputToken);
    const to = normalizeRouteSymbol(outputToken);

    if (!from || !to || from === to) return null;

    return registryMarkets
      .filter(isHealthyIndexedMarket)
      .filter((market) => isValidRouteSymbolPair(marketDisplayLabel(market)))
      .find((market) => {
        const label = normalizeRouteSymbol(marketDisplayLabel(market));
        const direct = `${from}/${to}`;
        const reverse = `${to}/${from}`;

        return label === direct || label === reverse;
      }) || null;
  }

  function routeToTokenPair(inputToken: string, outputToken: string) {
    const matched = findExecutableRouteForTokens(inputToken, outputToken);

    if (matched?.routes?.swap && matched.pairAddress !== pairAddress) {
      window.location.href = matched.routes.swap;
      return true;
    }

    return false;
  }

  const selectedTokenRoute = useMemo(
    () => findExecutableRouteForTokens(fromToken, toToken),
    [fromToken, toToken, registryMarkets]
  );

  const currentRouteMatchesSelectedTokens = (() => {
    const label = normalizeRouteSymbol(marketDisplayLabel(registryPair));
    const direct = `${normalizeRouteSymbol(fromToken)}/${normalizeRouteSymbol(toToken)}`;
    const reverse = `${normalizeRouteSymbol(toToken)}/${normalizeRouteSymbol(fromToken)}`;

    if (!label || label === "INDEXEDMARKET") return false;
    return label === direct || label === reverse;
  })();

  const hasExecutableSelectedRoute =
    Boolean(selectedTokenRoute) || currentRouteMatchesSelectedTokens;


  const registryPairTokenSymbols = useMemo(() => {
    const baseSymbol = canonicalAssetSymbolFromFields(
      (registryPair as any)?.baseSymbol || (registryPair as any)?.base_symbol,
      (registryPair as any)?.baseAssetId || (registryPair as any)?.base_asset_id
    );

    const quoteSymbol = canonicalAssetSymbolFromFields(
      (registryPair as any)?.quoteSymbol || (registryPair as any)?.quote_symbol,
      (registryPair as any)?.quoteAssetId || (registryPair as any)?.quote_asset_id
    );

    const parsePairLabel = (value: unknown) => {
      const clean = String(value || "")
        .replace(/\s+/g, "")
        .replace(/\burio\b/gi, "RIO")
        .toUpperCase();

      if (!clean.includes("/")) return null;

      const [rawA, rawB] = clean.split("/");
      const a = canonicalAssetSymbol(rawA);
      const b = canonicalAssetSymbol(rawB);

      if (a && b && a !== b && a !== "UNKNOWN" && b !== "UNKNOWN") {
        return { base: a, quote: b };
      }

      return null;
    };

    // Prefer explicit SOT asset fields over display label because display labels can degrade to asset IDs.
    const fromAssets =
      baseSymbol && quoteSymbol && baseSymbol !== quoteSymbol
        ? { base: baseSymbol, quote: quoteSymbol }
        : null;

    const fromCanonical =
      parsePairLabel((registryPair as any)?.canonicalSymbol || (registryPair as any)?.canonical_symbol);

    const fromDisplay =
      parsePairLabel((registryPair as any)?.displaySymbol || (registryPair as any)?.display_symbol || marketDisplayLabel(registryPair));

    const resolved = fromAssets || fromCanonical || fromDisplay;

    if (!resolved) return null;

    const symbols = [resolved.base, resolved.quote].map(canonicalAssetSymbol);
    const isRioRusd = symbols.includes("RIO") && symbols.includes("RUSD");

    if (isRioRusd) {
      return {
        base: "RIO",
        quote: "RUSD",
        source: fromAssets ? "asset_fields" : fromCanonical ? "canonical_symbol" : "display_symbol",
      };
    }

    return {
      base: resolved.base,
      quote: resolved.quote,
      source: fromAssets ? "asset_fields" : fromCanonical ? "canonical_symbol" : "display_symbol",
    };
  }, [registryPair]);

  useEffect(() => {
    if (!registryPairTokenSymbols) return;

    const currentFrom = normalizeRouteSymbol(fromToken);
    const currentTo = normalizeRouteSymbol(toToken);

    // Hydrate only empty/unknown/duplicated initial state.
    // Do not repair user-selected unsupported pairs back to the current pool.
    if (
      !currentFrom ||
      !currentTo ||
      currentFrom === "UNKNOWN" ||
      currentTo === "UNKNOWN" ||
      currentFrom === currentTo
    ) {
      setFromToken(registryPairTokenSymbols.base);
      setToToken(registryPairTokenSymbols.quote);
    }
  }, [registryPairTokenSymbols, fromToken, toToken]);


  // Exchange-style Swap UX:
  // Keep user-selected From/To tokens visible and stable.
  // Do not auto-navigate/rewrite the route on token selection.
  // Direct-route resolution is handled by selectedRouteTruth and CPMM quote gating.
  useEffect(() => {
    return;
  }, [selectedTokenRoute?.pairAddress, selectedTokenRoute?.routes?.swap, pairAddress]);



  const syncWalletFromStorage = useCallback(() => {
    setConnectedAddress(readStoredWalletAddress());
  }, []);

const loadMarket = useCallback(async () => {
  setMarketLoading(true);
  setMarketError(null);

  try {
    const [pairsRes, liquidityRes, swapsRes] = await Promise.all([
      fetchJson<{ ok?: boolean; pairs?: PairMeta[] }>("/api/v1/riodex/pairs"),
      fetchJson<{ ok?: boolean; liquidity?: LiquiditySnapshot[] }>(
        `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/liquidity?limit=24`
      ),
      fetchJson<{ ok?: boolean; swaps?: SwapRow[] }>(
        `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/swaps?limit=50`
      ),
    ]);

    const matchedPair =
      pairsRes?.pairs?.find((p) => p.pair_address === pairAddress) || null;

    setPair(matchedPair);
    setLiquidityHistory(liquidityRes?.liquidity || []);
    setRecentSwaps(swapsRes?.swaps || []);
    setCandlePayload(null);
    setMarketResolution("swap");
  } catch (e: any) {
    setMarketError(e?.message || "Failed to load RioDex market state");
    setPair(null);
    setLiquidityHistory([]);
    setRecentSwaps([]);
    setCandlePayload(null);
    setMarketResolution("swap");
  } finally {
    setMarketLoading(false);
  }
}


, [pairAddress]);

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
    function onRioLightExecutionApproved(event: Event) {
      const detail = (event as CustomEvent).detail || {};

      if (detail.action && detail.action !== "riodex_swap") return;
      if (detail.product && detail.product !== "riodex") return;

      const status = String(detail.status || "").toLowerCase();

      if (status === "approved") {
        setRioLightApproved(true);
        setRioLightCardOpen(false);
        setExecutionStage("Approved — broadcast pending");
        setExecuting(false);
        setExecutionError(
          detail.error ||
            "RioLight approved this swap review. Background execution is pending until the transaction security pass is enabled.",
        );
        setActiveRioLightRequestId(null);
        return;
      }

      if (status === "broadcasting") {
        setRioLightApproved(false);
        setRioLightCardOpen(false);
        setExecutionStage("Broadcasting");
        setExecuting(true);
        setExecutionError(null);
        return;
      }

      if (status === "confirmed") {
        const txHash = detail.txHash || detail.proof?.txHash || null;
        const creditedAmount =
          detail.credit?.amount ||
          detail.receivedAmount ||
          detail.outputAmount ||
          (displayQuote !== null ? formatNum(displayQuote, 6) : null);

        setRioLightApproved(false);
        setRioLightCardOpen(false);
        setExecutionStage(null);
        setExecuting(false);
        setExecutionError(null);
        setReceipt({
          status: "success",
          phase: "Confirmed",
          submittedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          txHash: txHash || undefined,
          wallet: connectedAddress || "unknown",
          market: marketLabel,
          direction: `${fromToken} → ${toToken}`,
          requestAmount: numericAmount,
          quotedOutput: displayQuote ?? 0,
          actualOutputDelta: creditedAmount !== null && creditedAmount !== undefined ? Number(creditedAmount) : undefined,
          beforeRio: rioBalance,
          beforeRusd: rusdBalance,
          afterRio: rioBalance,
          afterRusd: rusdBalance,
        });
        return;
      }

      if (status === "failed") {
        setRioLightApproved(false);
        setRioLightCardOpen(false);
        setExecuting(false);
        setExecutionStage(null);
        setExecutionError(detail.error || "RioLight execution failed.");
        setReceipt({
          status: "error",
          phase: "Failed",
          submittedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          wallet: connectedAddress || "unknown",
          market: marketLabel,
          direction: `${fromToken} → ${toToken}`,
          requestAmount: numericAmount,
          quotedOutput: displayQuote ?? 0,
          beforeRio: rioBalance,
          beforeRusd: rusdBalance,
          afterRio: rioBalance,
          afterRusd: rusdBalance,
          error: detail.error || "RioLight execution failed.",
        });
      }
    }

    function onRioLightSwapResult(event: Event) {
      const detail = (event as CustomEvent<{
        requestId?: string | null;
        status?: string;
        txHash?: string | null;
        height?: number | string | null;
        outputAmount?: number | string | null;
        receivedAmount?: number | string | null;
        error?: string | null;
      }>).detail || {};

      if (
        activeRioLightRequestId &&
        detail.requestId &&
        detail.requestId !== activeRioLightRequestId
      ) {
        return;
      }

      const status = String(detail.status || "").toLowerCase();
      const outputRaw = detail.receivedAmount ?? detail.outputAmount ?? null;
      const outputAmount =
        outputRaw !== null && outputRaw !== undefined && outputRaw !== ""
          ? Number(outputRaw)
          : null;

      if (status === "rejected" || status === "cancelled") {
        setExecutionStage(null);
        setExecuting(false);
        setRioLightApproved(false);
        setExecutionError("RioLight approval was rejected.");
        setActiveRioLightRequestId(null);
        return;
      }

      if (status === "failed" || status === "error") {
        setExecutionStage(null);
        setExecuting(false);
        setRioLightApproved(false);
        setExecutionError(detail.error || "RioLight swap execution failed.");
        setActiveRioLightRequestId(null);
        setReceipt({
          status: "error",
          phase: "Failed",
          submittedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          wallet: connectedAddress || "unknown",
          market: `${fromToken} / ${toToken}`,
          direction: `${fromToken} → ${toToken}`,
          requestAmount: Number(amount || 0),
          quotedOutput: 0,
          beforeRio: rioBalance,
          beforeRusd: rusdBalance,
          afterRio: rioBalance,
          afterRusd: rusdBalance,
          error: detail.error || "RioLight swap execution failed.",
          rpcEndpoint: null,
        });
        return;
      }

      if (status === "approved") {
        setRioLightApproved(true);
        setRioLightCardOpen(false);
        setExecutionStage("Approved — broadcast pending");
        setExecuting(false);
        setExecutionError(
          detail.error ||
            "RioLight approved this swap review. Signing and broadcast remain reserved until the transaction security pass is enabled.",
        );
        setActiveRioLightRequestId(null);
        return;
      }

      if (status === "broadcasted") {
        setRioLightApproved(false);
        setExecutionStage("Confirming on-chain");
        setExecutionError(null);
        return;
      }

      if (status === "confirmed" || status === "success") {
        setExecutionStage(null);
        setExecuting(false);
        setRioLightApproved(false);
        setRioLightCardOpen(true);
        setExecutionError(null);
        setActiveRioLightRequestId(null);
        setMarketRefreshNonce((v) => v + 1);

        setReceipt({
          status: "success",
          phase: "Confirmed",
          submittedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          txHash: detail.txHash || undefined,
          wallet: connectedAddress || "unknown",
          market: `${fromToken} / ${toToken}`,
          direction: `${fromToken} → ${toToken}`,
          requestAmount: Number(amount || 0),
          quotedOutput: 0,
          actualInputDelta: null,
          actualOutputDelta: outputAmount,
          beforeRio: rioBalance,
          beforeRusd: rusdBalance,
          afterRio: null,
          afterRusd: null,
          height: detail.height ?? null,
          gasUsed: null,
          rpcEndpoint: null,
        });

        setFlashNotice(`+${formatNum(outputAmount ?? 0, 6)} ${toToken} received`);
      }
    }

    window.addEventListener(RIOLIGHT_SWAP_RESULT_EVENT, onRioLightSwapResult as EventListener);
    window.addEventListener(RIOLIGHT_EXECUTION_APPROVED_EVENT, onRioLightExecutionApproved as EventListener);

    return () => {
      window.removeEventListener(RIOLIGHT_SWAP_RESULT_EVENT, onRioLightSwapResult as EventListener);
      window.removeEventListener(RIOLIGHT_EXECUTION_APPROVED_EVENT, onRioLightExecutionApproved as EventListener);
    };
  }, [
    activeRioLightRequestId,
    connectedAddress,
    fromToken,
    toToken,
    amount,
    rioBalance,
    rusdBalance,
  ]);

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
          fetchJson<RegistryBoardResponse>("/api/riodex/screener"),
          fetchJson<RegistryPairResponse>(`/api/rioex/markets/${encodeURIComponent(pairAddress)}`),
        ]);

        if (!active) return;

        const sourceMarkets =
          board?.markets ||
          board?.rows ||
          board?.items ||
          board?.pairs ||
          [];

        setRegistryMarkets(sourceMarkets.map((item: any) => normalizeScreenerMarket(item)));
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

    async function loadAllIndexedMarketsForSwap() {
      try {
        const response = await fetch("/api/riodex/screener", { cache: "no-store" });
        const raw = await response.text();

        let json: any = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error(`Screener route returned non-JSON (${response.status}).`);
        }

        if (!response.ok || json?.ok === false) {
          throw new Error(json?.error || `Screener route failed: ${response.status}`);
        }

        const sourceRows =
          json?.rows ||
          json?.items ||
          json?.markets ||
          json?.pairs ||
          [];

        const normalized = sourceRows
          .map((item: any) => normalizeScreenerMarket(item))
          .filter((item: RegistryMarketLite) => isHealthyIndexedMarket(item));

        if (active) {
          setRegistryMarkets(normalized);
        }
      } catch (error: any) {
        if (active) {
          console.warn("Failed to load indexed Swap markets", error?.message || error);
        }
      }
    }

    loadAllIndexedMarketsForSwap();

    return () => {
      active = false;
    };
  }, []);



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
      const numericInput = Number(amount || 0);

      const quoteAsset0Id = pair?.asset_0_id || registryPair?.baseAssetId || "";
      const quoteAsset1Id = pair?.asset_1_id || registryPair?.quoteAssetId || "";
      const quoteAsset0Label =
        registryPair?.baseSymbol ||
        (quoteAsset0Id === RIO_DENOM ? "RIO" : quoteAsset0Id === RUSD_CONTRACT ? "RUSD" : getAssetSymbol(quoteAsset0Id));
      const quoteAsset1Label =
        registryPair?.quoteSymbol ||
        (quoteAsset1Id === RIO_DENOM ? "RIO" : quoteAsset1Id === RUSD_CONTRACT ? "RUSD" : getAssetSymbol(quoteAsset1Id));

      const quoteFromAssetId =
        fromToken === quoteAsset0Label
          ? quoteAsset0Id
          : fromToken === quoteAsset1Label
            ? quoteAsset1Id
            : fromToken === "RIO"
              ? RIO_DENOM
              : fromToken === "RUSD"
                ? RUSD_CONTRACT
                : fromTokenAssetId;

      const quoteToAssetId =
        toToken === quoteAsset0Label
          ? quoteAsset0Id
          : toToken === quoteAsset1Label
            ? quoteAsset1Id
            : toToken === "RIO"
              ? RIO_DENOM
              : toToken === "RUSD"
                ? RUSD_CONTRACT
                : toTokenAssetId;

      if (!amount || numericInput <= 0 || fromToken === toToken) {
        if (active) {
          setQuoteOut("0");
          setQuoteFee("0");
          setQuoteError(null);
          setQuoteLoading(false);
        }
        return;
      }

      const activeLiquidity = liquidityHistory[0] || null;

      const setReserveFallbackQuote = (warning?: string | null) => {
        if (!active || !activeLiquidity) return false;

        const reserve0 = fromBaseUnits(activeLiquidity.reserve_0);
        const reserve1 = fromBaseUnits(activeLiquidity.reserve_1);

        if (reserve0 <= 0 || reserve1 <= 0) return false;

        let reserveIn = 0;
        let reserveOut = 0;

        if (quoteFromAssetId === quoteAsset0Id && quoteToAssetId === quoteAsset1Id) {
          reserveIn = reserve0;
          reserveOut = reserve1;
        } else if (quoteFromAssetId === quoteAsset1Id && quoteToAssetId === quoteAsset0Id) {
          reserveIn = reserve1;
          reserveOut = reserve0;
        } else {
          return false;
        }

        const feeBps = Number(pair?.fee_bps ?? registryPair?.feeBps ?? 30);
        const feeRate = Math.max(0, Math.min(10000, Number.isFinite(feeBps) ? feeBps : 30)) / 10000;
        const feeAmount = numericInput * feeRate;
        const amountInAfterFee = numericInput - feeAmount;

        if (amountInAfterFee <= 0) return false;

        const k = reserveIn * reserveOut;
        const reserveInAfter = reserveIn + amountInAfterFee;
        const reserveOutAfter = k / reserveInAfter;
        const estimatedOut = Math.max(reserveOut - reserveOutAfter, 0);

        setQuoteOut(String(estimatedOut));
        setQuoteFee(String(feeAmount));
        setQuoteError(warning || null);
        setQuoteLoading(false);
        return true;
      };

      try {
        if (!effectivePairAddress) {
          if (active) {
            setQuoteLoading(false);
            setQuoteOut("0");
            setQuoteFee("0");
            setQuoteError("Selected market liquidity is not available yet.");
          }
          return;
        }

          const selectedEffectivePairMatchesCurrentPool =
            effectivePairAddress === pairAddress;

          const pairAssetIds = [quoteAsset0Id, quoteAsset1Id].filter(Boolean);

          if (
            selectedEffectivePairMatchesCurrentPool &&
            (!pairAssetIds.includes(quoteFromAssetId) || !pairAssetIds.includes(quoteToAssetId))
          ) {
            if (active) {
              setQuoteLoading(false);
              setQuoteOut("0");
              setQuoteFee("0");
              setQuoteError("No direct CPMM route yet for the selected assets.");
            }
            return;
          }

          setQuoteLoading(true);
        setQuoteError(null);

        const quoteUrl =
        `/api/riodex/cpmm/quote?pair=${encodeURIComponent(effectivePairAddress)}` +
        `&from=${encodeURIComponent(fromToken)}` +
        `&amount=${encodeURIComponent(amount)}` +
        `&slippagePct=${encodeURIComponent(String(slippagePct || 0.5))}`;

      const response = await fetch(quoteUrl, {
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      });

      const json = await response.json().catch(() => null);

      if (!active) return;

      if (response.ok && json?.ok) {
        const estimatedOut = String(json.amountOut ?? "0");
        const feeAmount = String(json.feeAmount ?? "0");

        setQuoteOut(estimatedOut);
        setQuoteFee(feeAmount);
        setQuoteError(null);
        setQuoteLoading(false);
        return;
      }

      const fallbackWorked = setReserveFallbackQuote(null);

        if (!fallbackWorked) {
          setQuoteOut("0");
          setQuoteFee("0");
          setQuoteError(json?.error || json?.message || "Failed to simulate swap.");
          setQuoteLoading(false);
        }
      } catch (error: any) {
        if (!active) return;

        const fallbackWorked = setReserveFallbackQuote(null);

        if (!fallbackWorked) {
          setQuoteOut("0");
          setQuoteFee("0");
          setQuoteError(error?.message || "Failed to simulate swap");
          setQuoteLoading(false);
        }
      }
    }

    loadQuote();

    return () => {
      active = false;
    };
  }, [
    fromToken,
    toToken,
    fromTokenAssetId,
    toTokenAssetId,
    amount,
    pairAddress,
    pair,
    liquidityHistory,
    registryPair,
  ]);

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

  const [rawAsset0Label, rawAsset1Label] = registryPairLabel.includes("/")
    ? (registryPairLabel.split("/").map((value) => value.trim()) as [string, string])
    : [getAssetSymbol(asset0Id), getAssetSymbol(asset1Id)];

  const asset0Label =
    registryPair?.baseAssetId === asset0Id && registryPair?.baseSymbol
      ? registryPair.baseSymbol
      : registryPair?.quoteAssetId === asset0Id && registryPair?.quoteSymbol
        ? registryPair.quoteSymbol
        : rawAsset0Label;

  const asset1Label =
    registryPair?.baseAssetId === asset1Id && registryPair?.baseSymbol
      ? registryPair.baseSymbol
      : registryPair?.quoteAssetId === asset1Id && registryPair?.quoteSymbol
        ? registryPair.quoteSymbol
        : rawAsset1Label;

  const pairAssetOptions = [
    {
      label: asset0Label,
      assetId: asset0Id,
      assetType: pair?.asset_0_type || registryPair?.baseAssetType || null,
    },
    {
      label: asset1Label,
      assetId: asset1Id,
      assetType: pair?.asset_1_type || registryPair?.quoteAssetType || null,
    },
  ];

  // G4 hydrate selected asset ids from pair truth
  useEffect(() => {
    if (!asset0Id || !asset1Id) return;

    const nextFromAssetId =
      fromToken === asset0Label
        ? asset0Id
        : fromToken === asset1Label
          ? asset1Id
          : fromToken === "RIO"
            ? RIO_DENOM
            : fromToken === "RUSD"
              ? RUSD_CONTRACT
              : fromTokenAssetId;

    const nextToAssetId =
      toToken === asset0Label
        ? asset0Id
        : toToken === asset1Label
          ? asset1Id
          : toToken === "RIO"
            ? RIO_DENOM
            : toToken === "RUSD"
              ? RUSD_CONTRACT
              : toTokenAssetId;

    if (nextFromAssetId && nextFromAssetId !== fromTokenAssetId) {
      setFromTokenAssetId(nextFromAssetId);
    }

    if (nextToAssetId && nextToAssetId !== toTokenAssetId) {
      setToTokenAssetId(nextToAssetId);
    }
  }, [
    asset0Id,
    asset1Id,
    asset0Label,
    asset1Label,
    fromToken,
    toToken,
    fromTokenAssetId,
    toTokenAssetId,
  ]);

  const resolveSelectedAssetId = (symbol: string, storedAssetId: string) => {
    if (symbol === asset0Label) return asset0Id;
    if (symbol === asset1Label) return asset1Id;
    if (symbol === "RIO") return RIO_DENOM;
    if (symbol === "RUSD") return RUSD_CONTRACT;
    return storedAssetId;
  };

  const fromAssetId =
    resolveSelectedAssetId(fromToken, fromTokenAssetId) ||
    (fromToken === asset0Label ? asset0Id : asset1Id);

  const toAssetId =
    resolveSelectedAssetId(toToken, toTokenAssetId) ||
    (toToken === asset0Label ? asset0Id : asset1Id);

  const selectedDirectMarket = useMemo(() => {
    const fromId = String(fromAssetId || "").toLowerCase();
    const toId = String(toAssetId || "").toLowerCase();

    if (!fromId || !toId || fromId === toId) return null;

    return (
      registryMarkets.find((market: any) => {
        const ids = [
          market.baseAssetId,
          market.quoteAssetId,
          market.asset0Id,
          market.asset1Id,
          market.asset_0_id,
          market.asset_1_id,
          market.resolved_asset_0_id,
          market.resolved_asset_1_id,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        return ids.includes(fromId) && ids.includes(toId);
      }) || null
    );
  }, [registryMarkets, fromAssetId, toAssetId]);

  const selectedDirectPairAddress =
    selectedDirectMarket?.pairAddress ||
    selectedTokenRoute?.pairAddress ||
    (currentRouteMatchesSelectedTokens ? pairAddress : "");

  const effectivePairAddress = selectedDirectPairAddress;

  const selectedRouteTruth = useMemo(() => {
    const registryLabel = cleanRouteDisplayLabel(marketDisplayLabel(registryPair));
    const selectorLabel = cleanRouteDisplayLabel(`${fromToken} / ${toToken}`);

    const finalLabel =
      selectorLabel !== "Route pending"
        ? selectorLabel
        : registryLabel;

    const hasLivePair =
      Boolean(pairAddress && hasExecutableSelectedRoute && finalLabel !== "Route pending");

    return {
      label: finalLabel,
      hasLivePair,
      fromAssetId,
      toAssetId,
    };
  }, [
    registryPair,
    fromToken,
    toToken,
    pairAddress,
    hasExecutableSelectedRoute,
    fromAssetId,
    toAssetId,
  ]);


  const fromAssetType = fromAssetId === asset0Id ? pair?.asset_0_type : pair?.asset_1_type;
  const toAssetType = toAssetId === asset0Id ? pair?.asset_0_type : pair?.asset_1_type;

  const fromTokenMeta = (() => {
    const pairTruth = registryPair;

    if (pairTruth && String(fromAssetId) === String(pairTruth.baseAssetId)) {
      return {
        assetId: pairTruth.baseAssetId,
        symbol: pairTruth.baseSymbol || fromToken,
        displayName: pairTruth.baseDisplayName || pairTruth.baseSymbol || fromToken,
        logoUrl: pairTruth.baseLogoUrl || undefined,
      };
    }

    if (pairTruth && String(fromAssetId) === String(pairTruth.quoteAssetId)) {
      return {
        assetId: pairTruth.quoteAssetId,
        symbol: pairTruth.quoteSymbol || fromToken,
        displayName: pairTruth.quoteDisplayName || pairTruth.quoteSymbol || fromToken,
        logoUrl: pairTruth.quoteLogoUrl || undefined,
      };
    }

    return {
      assetId: fromAssetId,
      symbol: fromToken,
      displayName: fromToken,
      logoUrl: undefined,
    };
  })();

  const toTokenMeta = (() => {
    const pairTruth = registryPair;

    if (pairTruth && String(toAssetId) === String(pairTruth.baseAssetId)) {
      return {
        assetId: pairTruth.baseAssetId,
        symbol: pairTruth.baseSymbol || toToken,
        displayName: pairTruth.baseDisplayName || pairTruth.baseSymbol || toToken,
        logoUrl: pairTruth.baseLogoUrl || undefined,
      };
    }

    if (pairTruth && String(toAssetId) === String(pairTruth.quoteAssetId)) {
      return {
        assetId: pairTruth.quoteAssetId,
        symbol: pairTruth.quoteSymbol || toToken,
        displayName: pairTruth.quoteDisplayName || pairTruth.quoteSymbol || toToken,
        logoUrl: pairTruth.quoteLogoUrl || undefined,
      };
    }

    return {
      assetId: toAssetId,
      symbol: toToken,
      displayName: toToken,
      logoUrl: undefined,
    };
  })();

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

  const fromReserveDisplay =
    fromAssetId === asset0Id
      ? reserve0Display
      : fromAssetId === asset1Id
        ? reserve1Display
        : 0;

  const warningNumericAmount = Number(amount || 0);

  const inputReservePct =
    fromReserveDisplay > 0 && warningNumericAmount > 0
      ? (warningNumericAmount / fromReserveDisplay) * 100
      : 0;

  const isBelowPumpGraduationTarget =
    latestLiquidity &&
    (asset0Label.toUpperCase() === "RIO" || asset1Label.toUpperCase() === "RIO") &&
    ((asset0Label.toUpperCase() === "RIO" ? reserve0Display : reserve1Display) <
      PUMP_GRADUATION_RIO_TARGET_ESTIMATE);

  const priceImpactSeverity =
    inputReservePct >= 100
      ? "critical"
      : inputReservePct >= 25
        ? "severe"
        : inputReservePct >= 5
          ? "warning"
          : "normal";

  const shouldShowThinPoolWarning =
    Boolean(latestLiquidity) &&
    (isBelowPumpGraduationTarget || priceImpactSeverity !== "normal");

  const updatedTruthTime =
  latestSwap?.block_time || latestLiquidity?.block_time || null;

  const authoritativeLiquidityUsd = (() => {
    if (!latestLiquidity) return null;

    const labels = [asset0Label, asset1Label].map((value) => String(value || "").toUpperCase());
    const isRioRusdPool = labels.includes("RIO") && labels.includes("RUSD");

    if (isRioRusdPool) {
      const rioReserve =
        asset0Label === "RIO"
          ? reserve0Display
          : asset1Label === "RIO"
            ? reserve1Display
            : 0;

      const rusdReserve =
        asset0Label === "RUSD"
          ? reserve0Display
          : asset1Label === "RUSD"
            ? reserve1Display
            : 0;

      const rioReferencePriceRusd = 0.1;
      const computedTvl = rioReserve * rioReferencePriceRusd + rusdReserve;

      return Number.isFinite(computedTvl) && computedTvl > 0 ? computedTvl : null;
    }

    // For non RIO/RUSD markets, do not inherit canonical RUSD/RIO valuation.
    // Future token-specific valuation should come from a verified asset/market valuation source.
    return null;
  })();
  const authoritativeFeeBps = registryPair?.feeBps ?? pair?.fee_bps ?? null;
  const authoritativeFeePolicy = registryPair?.feePolicy || null;
  const authoritativeFeeRecipient = registryPair?.feeRecipientAddress || null;
  const effectiveFeeRecipient = resolveTreasuryRecipient(authoritativeFeeRecipient);
  const authoritativeLiquiditySource = registryPair?.liquiditySource || null;
  const authoritativeUpdatedAt =
    registryPair?.liquidityUpdatedAt || registryPair?.lastSwapTime || updatedTruthTime;

const swapCountTruth = recentSwaps.length;

const registryDisplayLabel = marketDisplayLabel(registryPair);
const selectedTokenLabel = `${fromToken} / ${toToken}`;
const rawAssetPairLabel = `${asset0Label} / ${asset1Label}`;
const marketLabel =
  registryDisplayLabel &&
  registryDisplayLabel !== "Indexed market" &&
  registryDisplayLabel !== "RIO / RIO"
    ? registryDisplayLabel
    : selectedTokenLabel &&
        !selectedTokenLabel.includes("undefined") &&
        selectedTokenLabel !== "RIO / RIO"
      ? selectedTokenLabel
      : rawAssetPairLabel !== "RIO / RIO"
        ? rawAssetPairLabel
        : "Route pending";

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
    return Boolean(pairAddress && pair?.is_live !== false && latestLiquidity);
  }, [pairAddress, pair?.is_live, latestLiquidity]);

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

    const normalizedFrom = normalizeRouteSymbol(fromToken);
    const normalizedTo = normalizeRouteSymbol(toToken);

    const canonicalBase = normalizeRouteSymbol(registryPairTokenSymbols?.base || asset0Label);
    const canonicalQuote = normalizeRouteSymbol(registryPairTokenSymbols?.quote || asset1Label);

    let reserveIn = 0;
    let reserveOut = 0;

    const isCanonicalRioRusd =
      (canonicalBase === "RIO" && canonicalQuote === "RUSD") ||
      (canonicalBase === "RUSD" && canonicalQuote === "RIO");

    if (isCanonicalRioRusd) {
      // Pool Truth confirms this canonical pair as:
      // reserve0Display = RIO reserve, reserve1Display = RUSD reserve.
      const rioReserve = reserve0Display;
      const rusdReserve = reserve1Display;

      if (normalizedFrom === "RIO" && normalizedTo === "RUSD") {
        reserveIn = rioReserve;
        reserveOut = rusdReserve;
      } else if (normalizedFrom === "RUSD" && normalizedTo === "RIO") {
        reserveIn = rusdReserve;
        reserveOut = rioReserve;
      } else {
        return null;
      }
    } else {
      const normalizedAsset0 = normalizeRouteSymbol(asset0Label);
      const normalizedAsset1 = normalizeRouteSymbol(asset1Label);

      if (normalizedFrom === normalizedAsset0 && normalizedTo === normalizedAsset1) {
        reserveIn = reserve0Display;
        reserveOut = reserve1Display;
      } else if (normalizedFrom === normalizedAsset1 && normalizedTo === normalizedAsset0) {
        reserveIn = reserve1Display;
        reserveOut = reserve0Display;
      } else {
        return null;
      }
    }

    if (reserveIn <= 0 || reserveOut <= 0) return null;

    const feeBps = Number(authoritativeFeeBps ?? 30);
    const feeRate = Math.max(0, Math.min(10000, Number.isFinite(feeBps) ? feeBps : 30)) / 10000;
    const feeAmount = numericAmount * feeRate;
    const amountInAfterFee = numericAmount - feeAmount;

    if (amountInAfterFee <= 0) return null;

    const k = reserveIn * reserveOut;
    const reserveInAfter = reserveIn + amountInAfterFee;
    const reserveOutAfter = k / reserveInAfter;
    const estimatedOut = Math.max(reserveOut - reserveOutAfter, 0);

    const spotPrice = reserveOut / reserveIn;
    const effectivePrice = numericAmount > 0 ? estimatedOut / numericAmount : 0;
    const minReceived = estimatedOut * (1 - slippagePct / 100);
    const priceImpactPct =
      spotPrice > 0 ? Math.max(0, ((spotPrice - effectivePrice) / spotPrice) * 100) : 0;

    return {
      estimatedOut,
      minReceived,
      effectivePrice,
      feeAmount,
      feeBps,
      priceImpactPct,
      quoteSource: "Spherio CPMM Pool Truth",
    };
  }, [
    latestLiquidity,
    numericAmount,
    fromToken,
    toToken,
    reserve0Display,
    reserve1Display,
    asset0Label,
    asset1Label,
    registryPairTokenSymbols,
    authoritativeFeeBps,
    slippagePct,
  ]);

  // Swap pair self-heal:
  // Pair truth is the authority. Hydrate SYMBOL labels and asset IDs separately.
  // Never allow route placeholders or rio1... contract addresses to become token labels.
  useEffect(() => {
    const cleanAssetId = (value: unknown) => {
      const raw = String(value || "").trim();
      if (!raw || raw === "—" || raw === "-" || raw.toLowerCase() === "undefined") return "";
      return raw;
    };

    const cleanSymbol = (value: unknown) => {
      const raw = String(value || "").trim();
      if (!raw) return "";

      const upper = raw.toUpperCase();

      if (
        raw === "—" ||
        raw === "-" ||
        upper === "UNDEFINED" ||
        upper === "NULL" ||
        upper === "ROUTEPENDING" ||
        upper === "ROUTE PENDING"
      ) {
        return "";
      }

      if (/^rio1[0-9a-z]{20,}$/i.test(raw)) return "";
      if (raw.includes("...")) return "";

      return upper;
    };

    const nextFromLabel =
      cleanSymbol(asset0Label) ||
      cleanSymbol(registryPairTokenSymbols?.base);

    const nextToLabel =
      cleanSymbol(asset1Label) ||
      cleanSymbol(registryPairTokenSymbols?.quote);

    const nextFromAssetId = cleanAssetId(asset0Id);
    const nextToAssetId = cleanAssetId(asset1Id);

    if (!pairAddress || !nextFromLabel || !nextToLabel || nextFromLabel === nextToLabel) {
      return;
    }

    const currentFromLabel = cleanSymbol(fromToken);
    const currentToLabel = cleanSymbol(toToken);

    const shouldHeal =
      !currentFromLabel ||
      !currentToLabel ||
      currentFromLabel !== nextFromLabel ||
      currentToLabel !== nextToLabel ||
      cleanAssetId(fromTokenAssetId) !== nextFromAssetId ||
      cleanAssetId(toTokenAssetId) !== nextToAssetId;

    if (!shouldHeal) return;

    setFromToken(nextFromLabel);
    setToToken(nextToLabel);
    setFromTokenAssetId(nextFromAssetId);
    setToTokenAssetId(nextToAssetId);
    setQuoteOut("");
    setQuoteFee("");
    setQuoteError(null);
  }, [
    pairAddress,
    asset0Label,
    asset1Label,
    asset0Id,
    asset1Id,
    registryPairTokenSymbols,
    fromToken,
    toToken,
    fromTokenAssetId,
    toTokenAssetId,
  ]);

  const displayQuote = useMemo(() => {
    // Prefer the synchronous CPMM calculation from current token direction.
    // quoteOut is async and can briefly contain the previous direction after token flip.
    if (quoteData && quoteData.estimatedOut > 0) {
      return quoteData.estimatedOut;
    }

    const parsedQuoteOut = Number(quoteOut);

    if (Number.isFinite(parsedQuoteOut) && parsedQuoteOut > 0) {
      return parsedQuoteOut;
    }

    if (!marketPriceTruth || !numericAmount || numericAmount <= 0) return null;

    if (fromToken === asset0Label && toToken === asset1Label) {
      return numericAmount * marketPriceTruth;
    }

    if (fromToken === asset1Label && toToken === asset0Label && marketPriceTruth > 0) {
      return numericAmount / marketPriceTruth;
    }

    return null;
  }, [quoteData, quoteOut, marketPriceTruth, numericAmount, fromToken, toToken, asset0Label, asset1Label]);

  const quoteSourceLabel =
    !amount || numericAmount <= 0
      ? "Awaiting amount"
      : quoteLoading
        ? "Loading quote"
        : displayQuote !== null && displayQuote > 0 && !quoteError
          ? "Estimate source: Live pool reserves"
          : displayQuote !== null && displayQuote > 0
            ? "Estimate source: Live pool reserves"
            : "Quote unavailable";

  const receiptReceivedAmount =
    receipt?.actualOutputDelta !== null && receipt?.actualOutputDelta !== undefined
      ? receipt.actualOutputDelta
      : receipt?.quotedOutput ?? null;

  const receiptExplorerHref =
    receipt?.txHash ? `/rioexplorer/tx/${encodeURIComponent(receipt.txHash)}` : null;

  const rioLightApprovalPending = executionStage === "Awaiting RioLight approval";
  const rioLightApprovalAccepted = rioLightCardOpen && rioLightApproved;
  const rioLightReceiptConfirmed = rioLightCardOpen && receipt?.status === "success";
  const rioLightReceiptFailed = rioLightCardOpen && receipt?.status === "error";

  const hardError =
    quoteError ||
    executionError ||
    registryTruthError ||
    null;

  const walletStatusText = () => {
    if (!connectedAddress) return "Connect RioLight or an approved wallet to continue.";
    if (needsRioFeeBalance) return "RIO fee balance is required to complete non-RIO swaps.";
    if (insufficientBalance) return `Insufficient ${fromToken} balance for this swap.`;
    if (!pairExecutionSupported) return "Selected pair is not ready for live execution yet.";
    return "";
  };

  const setPresetAmount = (preset: "max" | "half") => {
    const available = Number(fromBalance ?? 0);

    if (!Number.isFinite(available) || available <= 0) {
      setAmount("");
      return;
    }

    const nextAmount = preset === "half" ? available / 2 : available;
    setAmount(String(Number(nextAmount.toFixed(6))));
  };

  const flipPair = () => {
    const previousFromToken = fromToken;
    const previousToToken = toToken;
    const previousFromAssetId = fromTokenAssetId;
    const previousToAssetId = toTokenAssetId;

    setFromToken(previousToToken);
    setToToken(previousFromToken);
    setFromTokenAssetId(previousToAssetId);
    setToTokenAssetId(previousFromAssetId);
    setQuoteOut("");
    setQuoteFee("");
    setQuoteError(null);
    setQuoteLoading(true);
    window.setTimeout(() => setQuoteLoading(false), 80);
  };

  const handleSelectSwapToken = (
    side: "from" | "to",
    option: { label: string; assetId: string; assetType?: string | null }
  ) => {
    if (side === "from") {
      setFromToken(option.label);
      setFromTokenAssetId(option.assetId);
    } else {
      setToToken(option.label);
      setToTokenAssetId(option.assetId);
    }

    setTokenMenuOpen(null);
    setQuoteOut("");
    setQuoteFee("");
    setQuoteError(null);
    setQuoteLoading(true);
    window.setTimeout(() => setQuoteLoading(false), 80);
  };

  const canSwap =
    Boolean(connectedAddress) &&
    Boolean(selectedRouteTruth?.hasLivePair) &&
    Boolean(effectivePairAddress) &&
    Boolean(fromToken) &&
    Boolean(toToken) &&
    fromToken !== toToken &&
    numericAmount > 0 &&
    displayQuote !== null &&
    displayQuote > 0 &&
    !quoteLoading &&
    !hardError &&
    !insufficientBalance &&
    pairExecutionSupported;

  const primaryButtonLabel = () => {
    if (executing) return "Processing";
    if (!connectedAddress) return "Connect RioLight";
    if (!selectedRouteTruth?.hasLivePair || !effectivePairAddress) return "No direct CPMM route yet";
    if (!pairExecutionSupported) return "Execution Locked";
    if (fromToken === toToken) return "Select Different Tokens";
    if (!amount || numericAmount <= 0) return "Enter Amount";
    if (quoteLoading) return "Loading Quote";
    if (insufficientBalance) return "Insufficient Balance";
    if (hardError) return "Resolve Swap Issue";
    return "Swap";
  };

  const swapGateReason =
    executing
      ? "Swap execution is in progress."
      : !connectedAddress
        ? "Connect RioLight to review and sign this swap."
        : !selectedRouteTruth?.hasLivePair || !effectivePairAddress
          ? "This route is not live yet."
          : !pairExecutionSupported
            ? "This pair is indexed but execution is not enabled yet."
            : fromToken === toToken
              ? "Select two different assets."
              : !amount || numericAmount <= 0
                ? "Enter an amount to request a CPMM quote."
                : quoteLoading
                  ? "Loading CPMM quote from live pool reserves."
                  : insufficientBalance
                    ? `Insufficient ${fromToken} balance.`
                    : hardError
                      ? hardError
                      : "Ready.";

  const handleExecuteSwap = async () => {
    setExecutionError(null);

    if (!canSwap) {
      setExecutionError(swapGateReason || "Swap is not ready.");
      return;
    }

    try {
      const executionPairAddress = effectivePairAddress || pairAddress;
      const requestId = createRioLightRequestId("riolight-swap");
      const amountBase = toBaseUnits(amount || String(numericAmount), 6);
      const maxSpread = maxSpreadFromSlippage(slippagePct);
      const nativeOffer = isNativeExecutionAsset(fromAssetId, fromAssetType);

      const offerAssetInfo = makeAssetInfo(fromAssetId, fromAssetType);
      const askAssetInfo = makeAssetInfo(toAssetId, toAssetType);

      const msg = nativeOffer
        ? {
            swap: {
              offer_asset: {
                info: offerAssetInfo,
                amount: amountBase,
              },
              ask_asset_info: askAssetInfo,
              max_spread: maxSpread,
            },
          }
        : {
            send: {
              contract: executionPairAddress,
              amount: amountBase,
              msg: encodeHookMsg({
                swap: {
                  ask_asset_info: askAssetInfo,
                  max_spread: maxSpread,
                },
              }),
            },
          };

      const funds = nativeOffer ? [{ denom: fromAssetId, amount: amountBase }] : [];
      const minReceived =
        displayQuote !== null
          ? formatNum(displayQuote * (1 - slippagePct / 100), 6)
          : "Estimated";
      const receiveAmount =
        displayQuote !== null ? formatNum(displayQuote, 6) : "Estimated";
      const feeAmount = quoteData
        ? formatNum(quoteData.feeAmount, 6)
        : "Estimated dynamic";

      const executionDraft = {
        kind: nativeOffer ? "riodex_pair_swap_native" : "riodex_pair_swap_cw20_send_hook",
        sender: connectedAddress,
        pairAddress: executionPairAddress,
        contractAddress: nativeOffer ? executionPairAddress : fromAssetId,
        offerAmountBaseUnits: amountBase,
        offerAssetInfo,
        askAssetInfo,
        maxSpread,
        msg,
        funds,
      };

      const quoteSnapshot = {
        product: "riodex",
        action: "riodex_swap",
        pairAddress: executionPairAddress,
        routeLabel: readableRouteSubtitle,
        fromToken,
        toToken,
        fromAssetId,
        fromAssetType,
        toAssetId,
        toAssetType,
        spendAmount: amount || String(numericAmount),
        spendBaseAmount: amountBase,
        receiveAmount,
        minReceived,
        slippagePct,
        quoteSource: quoteSourceLabel,
        feeAmount,
        feeSymbol: "RIO",
        treasuryRecipient: effectiveFeeRecipient,
        execution: executionDraft,
        createdAt: new Date().toISOString(),
      };

      setActiveRioLightRequestId(requestId);
      setRioLightApproved(false);
      setRioLightCardOpen(true);
      setExecuting(true);
      setExecutionStage("Requesting RioLight approval");

      const execResult = await executeSpherioRioLightAction({
        surfaceKey: "swap_execute",
        product: "Swap",
        action: "riodex_swap",
        contractAddress: nativeOffer ? executionPairAddress : fromAssetId,
        msg,
        funds,
        memo: "RioDex Swap",
        label: "RioDex Swap",
        reviewTitle: "Swap Confirmation",
        reviewSubtitle: `Review this swap before RioLight signs and broadcasts: ${fromToken} → ${toToken}.`,
        spendAmount: amount || String(numericAmount),
        spendSymbol: fromToken,
        receiveAmount,
        receiveSymbol: toToken,
        routeLabel: readableRouteSubtitle,
        feeAmount,
        feeSymbol: "RIO",
        contractLabel: executionPairAddress
          ? `RioDex swap route ${shortAddr(executionPairAddress, 10, 8)}`
          : "RioDex swap route",
        handoverIntent: createRioLightGlobalHandoverIntent({
          requestId,
          surface: "riodex_swap",
          product: "RioDex",
          actionKind: "swap",
          actionLabel: "Swap",
          walletAddress: connectedAddress,
          contractAddress: nativeOffer ? executionPairAddress : fromAssetId,
          contractLabel: "RioDex Swap",
          title: "Swap Confirmation",
          subtitle: `Review swap, approval, broadcast, and receipt in one RioLight flow: ${fromToken} → ${toToken}.`,
          assets: [
            {
              label: "Spend",
              symbol: fromToken,
              assetId: fromAssetId,
              assetType: fromAssetType,
              amount: amount || String(numericAmount),
              role: "spend",
            },
            {
              label: "Receive",
              symbol: toToken,
              assetId: toAssetId,
              assetType: toAssetType,
              amount: receiveAmount,
              role: "receive",
            },
            {
              label: "Fee",
              symbol: "RIO",
              amount: feeAmount,
              role: "fee",
            },
          ],
          routeLabel: readableRouteSubtitle,
          quoteSource: quoteSourceLabel,
          slippagePct,
          minimumReceive: minReceived,
          feeAmount,
          feeSymbol: "RIO",
          feeRecipient: effectiveFeeRecipient,
          treasuryRecipient: effectiveFeeRecipient,
          pairAddress: executionPairAddress,
          poolAddress: executionPairAddress,
          msg,
          funds,
          riskNotes: [
            "Swap output depends on live CPMM reserves and slippage settings.",
            "Confirm token direction and minimum receive before approval.",
          ],
          truthNotes: [
            "Quote source is the RioDex CPMM route truth.",
            "Treasury fee routing uses the Spherio protocol fee policy.",
          ],
          proofHref: rioLightExplorerProofHref({ pairAddress: executionPairAddress }),
          explorerHref: rioLightExplorerProofHref({ pairAddress: executionPairAddress }),
          metadata: {
            resultEvent: RIOLIGHT_SWAP_RESULT_EVENT,
            uiMode: "compact_swap",
            receiptMode: "same_surface",
            receiptCopy: `${toToken} received`,
            quoteSnapshot,
            executionDraft,
            auditIdentity: routeAuditIdentity,
            feePolicy: SPHERIO_FEE_POLICY.policy,
            feePolicySource: SPHERIO_FEE_POLICY.source,
          },
        }),
        metadata: {
          requestId,
          resultEvent: RIOLIGHT_SWAP_RESULT_EVENT,
          uiMode: "compact_swap",
          receiptMode: "same_surface",
          receiptCopy: `${toToken} received`,
          minReceived,
          slippagePct,
          rate:
            marketPriceTruth !== null
              ? `${formatNum(marketPriceTruth, 6)} ${toToken}/${fromToken}`
              : "Pending",
          quoteSource: quoteSourceLabel,
          feeRecipient: effectiveFeeRecipient,
          treasuryRecipient: effectiveFeeRecipient,
          feePolicy: SPHERIO_FEE_POLICY.policy,
          feePolicySource: SPHERIO_FEE_POLICY.source,
          pairAddress: executionPairAddress,
          auditIdentity: routeAuditIdentity,
          quoteSnapshot,
          executionDraft,
        },
      });

      setExecutionStage("Awaiting RioLight approval");
      setExecutionError(
        execResult?.status === "approval_opened"
          ? "RioLight approval opened. Complete review, confirmation, broadcast, and receipt in the single RioLight popup."
          : "RioLight swap execution submitted."
      );
    } catch (error: any) {
      setExecuting(false);
      setRioLightApproved(false);
      setActiveRioLightRequestId(null);
      setExecutionStage(null);
      setExecutionError(
        error?.message || "Failed to open RioLight swap approval. Unlock RioLight and try again."
      );
    }
  };

  const canonicalMarketLabel = (() => {
    const base = normalizeRouteSymbol(registryPairTokenSymbols?.base || asset0Label);
    const quote = normalizeRouteSymbol(registryPairTokenSymbols?.quote || asset1Label);

    if (
      (base === "RIO" && quote === "RUSD") ||
      (base === "RUSD" && quote === "RIO")
    ) {
      return "RIO / RUSD";
    }

    if (base && quote && base !== quote) {
      return `${base} / ${quote}`;
    }

    return selectedRouteTruth?.label || marketLabel || `${fromToken} / ${toToken}`;
  })();

  const tradeDirectionLabel = `${normalizeRouteSymbol(fromToken)} → ${normalizeRouteSymbol(toToken)}`;

  const routeAuditIdentity =
    pairAddress
      ? `pair:${shortAddr(pairAddress, 10, 8)}`
      : selectedRouteTruth?.label || `${fromToken}/${toToken}`;

  const readableRouteSubtitle =
    quoteSourceLabel
      ? `${marketLabel} · ${quoteSourceLabel}`
      : marketLabel || `${fromToken} / ${toToken}`;


  return (
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_16%_10%,rgba(60,198,255,0.10),transparent_18%),radial-gradient(circle_at_84%_16%,rgba(74,144,255,0.10),transparent_20%),linear-gradient(90deg,#010816_0%,#04132f_34%,#04163c_62%,#020816_100%)] text-white">
      <div className="mx-auto max-w-[1560px] px-4 py-5 xl:px-6">
        <section className="mb-4 rounded-[28px] border border-cyan-300/14 bg-[linear-gradient(135deg,rgba(8,24,48,0.72),rgba(10,18,42,0.82))] p-5 shadow-[0_0_58px_rgba(34,211,238,0.10)] backdrop-blur-2xl">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300/80">
            RioDex • Swap Execution
          </div>
          <h1 className="mt-2 text-5xl font-black tracking-tight text-white sm:text-6xl">
            Swap
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
            Exchange tokens instantly against registry-backed liquidity pools. Search a token or pair, review route, slippage, fee, and output estimate, then confirm through RioLight.
          </p>
        </section>

        <div className={`${shell("nav")} flex flex-wrap items-center gap-3 px-4 py-3`}>
          <div className="mr-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-[#13214c]">
            <TokenAvatar registryMap={registryMap} assetId={asset0Id} label={asset0Label} size={28} />
          </div>

          <NavLink href={pairRoutes.swap} label="Swap" active />
          <NavLink href={pairRoutes.pool} label="Pool" />
          <NavLink href={pairRoutes.markets} label="RioEx Market" />
          <NavLink href={pairRoutes.trade} label="RioEx Trade" />
          <NavLink href={pairRoutes.explorer} label="RioExplorer Proof" />

          <div className="ml-auto flex items-center gap-3">
            <div className="max-w-[360px] truncate rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200">
              {canonicalMarketLabel}
            </div>
            <div className="rounded-[20px] bg-cyan-400 px-5 py-3 text-sm font-semibold text-[#081229]">
              {connectedAddress ? shortAddr(connectedAddress, 10, 8) : "Connect Wallet"}
            </div>
          </div>
        </div>

        <div className="mt-4">
</div>

        {(registryPair || registryMarkets.length > 0 || registryTruthError) ? (
          <div className="mt-4 rounded-[24px] border border-cyan-400/14 bg-[linear-gradient(180deg,rgba(11,26,63,0.92),rgba(5,16,40,0.96))] px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/85">
                  Authoritative Pair Truth
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {canonicalMarketLabel}
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
                  label="Verified TVL"
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

            {registryTruthError ? (
              <div className="mt-3 text-xs text-amber-200">{registryTruthError}</div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_540px] 2xl:grid-cols-[minmax(0,1fr)_580px]">
          <section className="rounded-[22px] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(21,32,70,0.74),rgba(12,21,48,0.88))] p-4 shadow-[0_14px_44px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/85">
                    Swap Route
                  </div>

                  <div className="mt-2 flex min-w-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <TokenAvatar registryMap={registryMap} assetId={fromAssetId} label={fromToken} size={40} />
                      <TokenAvatar registryMap={registryMap} assetId={toAssetId} label={toToken} size={40} />
                    </div>

                    <div className="min-w-0">
                      <div className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
                        {canonicalMarketLabel}
                      </div>
                      <div className="mt-2 text-sm text-slate-300">
                        {`${tradeDirectionLabel} · Estimate source: Live pool reserves`}
                      </div>
                      <div className="mt-1 max-w-[32rem] truncate font-mono text-[10px] uppercase tracking-[0.08em] text-cyan-100/40">
                        {routeAuditIdentity}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SimpleStat
                  label="Pool Ratio"
                  value={marketPriceTruth !== null ? formatNum(marketPriceTruth, 6) : "—"}
                />
                <SimpleStat
                  label="Last Trade"
                  value={lastTradeDisplayTruth !== null ? formatNum(lastTradeDisplayTruth, 6) : "—"}
                />
                <SimpleStat label="Live Pool Reserves" value={safeLiquidityTruth(selectedRouteTruth.hasLivePair, liquidityTruth || "—")} />
                <SimpleStat label="Updated" value={formatDateTime(updatedTruthTime)} />
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Search tokens and routes</div>
                    <div className="mt-1 text-xs text-slate-400">
                      Search registry-backed tokens and pairs. Prime, Pump.live, SPO-20, and bridged assets appear only when the source-of-truth registry marks them live.
                    </div>
                  </div>

                  <div className="relative w-full md:max-w-2xl">
                    <input
                      value={marketSearch}
                      onChange={(event) => setMarketSearch(event.target.value)}
                      placeholder="Search token, pair, or address"
                      className="h-14 w-full rounded-2xl border border-cyan-300/14 bg-[#06122e]/95 px-5 text-base font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/45 focus:bg-[#07183a]"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-[20px] border border-cyan-300/12 bg-black/15 p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                        Registry Search
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Search by symbol, name, asset id, contract, bridge denom, Prime, Pump.live, SPO-20, RUSD, RIO, or bridged asset. Results stay hidden until you search.
                      </div>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                      {hasTokenSearchQuery ? `${searchableTokenUniverse.length} token matches` : "Search to reveal indexed tokens"}
                    </div>
                  </div>

                  {hasTokenSearchQuery && searchableTokenUniverse.length ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {searchableTokenUniverse.map((token) => (
                        <button
                          key={`${token.assetId}-${token.symbol}`}
                          type="button"
                          onClick={() => setMarketSearch(token.symbol)}
                          className="flex min-w-[190px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-3 py-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
                        >
                          <TokenAvatar registryMap={registryMap} assetId={token.assetId} label={token.symbol} size={32} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">{token.symbol}</div>
                            <div className="truncate text-[11px] text-slate-400">{token.displayName}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                      Executable Routes
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Only live registry-backed pools can price and execute swaps.
                    </div>
                  </div>
                </div>

                <div className="mt-3 max-h-[22rem] overflow-y-auto pr-1 grid gap-2">
                  {searchableRegistryMarkets.length ? (
                    searchableRegistryMarkets
                    .filter((item) => isValidRouteSymbolPair(marketDisplayLabel(item)))
                    .map((item) => (
                      <Link
                        key={item.pairAddress}
                        href={item.routes.swap}
                        className={[
                          "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition",
                          item.pairAddress === pairAddress
                            ? "border-cyan-300/35 bg-cyan-400/10"
                            : "border-white/10 bg-white/[0.025] hover:bg-white/[0.055]",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">
                            {marketDisplayLabel(item)}
                          </div>
                          <div className="mt-1 truncate text-[11px] uppercase tracking-[0.14em] text-slate-500">
                            {item.baseSymbol && item.quoteSymbol ? `${item.baseSymbol}/${item.quoteSymbol}` : item.canonicalSymbol || item.pairAddress}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-200">
                            {formatUsd(item.liquidityUsd || 0)}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                            {item.isCanonical ? "Canonical" : item.isLive ? "Live" : "Indexed"}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-slate-400">
                      No market matched this search. Only indexed source-of-truth pairs are shown.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[18px] border border-cyan-400/15 bg-cyan-500/8 px-4 py-3 text-sm text-cyan-100">
                Swap is for token exchange against pooled liquidity. Market charts stay in Screener/RioEx; execution stays here.
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SimpleStat label="Pair" value={canonicalMarketLabel} />
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
            </div>
          </section>

          <section className={`${shell("card")} p-6 xl:p-7`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Swap</div>
                <div className="mt-1 text-xs text-slate-400">Simple execution surface</div>
              </div>

              <div className="text-xs text-slate-400">
                {connectedAddress ? `RioLight ${shortAddr(connectedAddress, 8, 6)}` : "Connect RioLight"}
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
              {shouldShowThinPoolWarning ? (
                <div className={[
                  "rounded-[20px] border px-4 py-3 text-sm",
                  priceImpactSeverity === "critical"
                    ? "border-rose-300/30 bg-rose-500/12 text-rose-100"
                    : priceImpactSeverity === "severe"
                      ? "border-orange-300/30 bg-orange-500/12 text-orange-100"
                      : "border-amber-300/25 bg-amber-500/10 text-amber-100",
                ].join(" ")}>
                  <div className="font-semibold">
                    {priceImpactSeverity === "critical"
                      ? "Critical price-impact warning"
                      : priceImpactSeverity === "severe"
                        ? "High price-impact warning"
                        : "Thin liquidity notice"}
                  </div>

                  <div className="mt-1 leading-relaxed">
                    {liquidityTruth ? (
                      <>Seeded reserves indexed: <span className="font-semibold">{liquidityTruth}</span>.</>
                    ) : (
                      <>Selected market reserves are still loading.</>
                    )}
                  </div>

                  {inputReservePct > 0 ? (
                    <div className="mt-1">
                      This input is approximately <span className="font-semibold">{formatNum(inputReservePct, 2)}%</span> of the selected input-side reserve.
                    </div>
                  ) : null}

                  {isBelowPumpGraduationTarget ? (
                    <div className="mt-1">
                      Below PUMP graduation target: {formatUsd(PUMP_GRADUATION_RUSD_TARGET)} worth of RIO
                      requires about {formatNum(PUMP_GRADUATION_RIO_TARGET_ESTIMATE, 0)} RIO at the current 0.1 RUSD/RIO reference estimate.
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className={`${shell("field")} p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-white">From</div>
                  <div className="flex items-center gap-2">
                    <QuickAmountButton label="Max" onClick={() => setPresetAmount("max")} />
                    <QuickAmountButton label="50%" onClick={() => setPresetAmount("half")} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTokenMenuOpen(tokenMenuOpen === "from" ? null : "from")}
                      className={`${shell("token")} flex min-w-0 items-center gap-3 px-4 py-3`}
                    >
                      <TokenAvatar registryMap={registryMap} assetId={fromAssetId} label={fromToken} size={34} />
                      <div className="min-w-0 truncate">
                        <div className="text-2xl font-semibold text-white">{fromToken}</div>
                        <div className="mt-1 max-w-[150px] truncate font-mono text-[10px] uppercase tracking-[0.08em] text-cyan-100/45">
                          {fromAssetId}
                        </div>
                      </div>
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-300" />
                    </button>

                    {tokenMenuOpen === "from" ? (
                      <div className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#101a3d] shadow-2xl">
                        <div className="border-b border-white/10 p-2">
                          <input
                            value={fromTokenSearch}
                            onChange={(event) => setFromTokenSearch(event.target.value)}
                            placeholder="Search token"
                            className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/45"
                          />
                        </div>
                        
                        {fromTokenOptions.map((option) => (
                          <button
                            key={`from-${option.assetId}`}
                            type="button"
                              onClick={() => handleSelectSwapToken("from", option)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.06]"
                          >
                            <TokenAvatar registryMap={registryMap} assetId={option.assetId} label={option.label} size={28} />
                            <div>
                              <div className="text-sm font-semibold text-white">{option.label}</div>
                              <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                                {option.assetType || "asset"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
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

              <div className={`${shell("field")} p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-white">To</div>
                  <div className="text-xs text-slate-400">Estimated output</div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTokenMenuOpen(tokenMenuOpen === "to" ? null : "to")}
                      className={`${shell("token")} flex min-w-0 items-center gap-3 px-4 py-3`}
                    >
                      <TokenAvatar registryMap={registryMap} assetId={toAssetId} label={toToken} size={34} />
                      <div className="min-w-0 truncate">
                        <div className="text-2xl font-semibold text-white">{toToken}</div>
                        <div className="mt-1 max-w-[150px] truncate font-mono text-[10px] uppercase tracking-[0.08em] text-cyan-100/45">
                          {toAssetId}
                        </div>
                      </div>
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-300" />
                    </button>

                    {tokenMenuOpen === "to" ? (
                      <div className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#101a3d] shadow-2xl">
                        <div className="border-b border-white/10 p-2">
                          <input
                            value={toTokenSearch}
                            onChange={(event) => setToTokenSearch(event.target.value)}
                            placeholder="Search token"
                            className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/45"
                          />
                        </div>
                        
                        {toTokenOptions.map((option) => (
                          <button
                            key={`to-${option.assetId}`}
                            type="button"
                              onClick={() => handleSelectSwapToken("to", option)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.06]"
                          >
                            <TokenAvatar registryMap={registryMap} assetId={option.assetId} label={option.label} size={28} />
                            <div>
                              <div className="text-sm font-semibold text-white">{option.label}</div>
                              <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                                {option.assetType || "asset"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
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
                  label="Pool Ratio"
                  value={marketPriceTruth !== null ? formatNum(marketPriceTruth, 6) : "—"}
                />
                <SimpleStat label="Live Pool Reserves" value={safeLiquidityTruth(selectedRouteTruth.hasLivePair, liquidityTruth || "—")} />
                <SimpleStat label="Recent Swaps" value={String(swapCountTruth)} />
                <SimpleStat label="Updated" value={formatDateTime(updatedTruthTime)} />
              </div>

              {!selectedRouteTruth.hasLivePair ? (
                <div className="rounded-[18px] border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  Route pending for selected token pair. The asset is indexed, but pricing and execution require a live registry-backed pool route.
                </div>
              ) : null}

              <div className="rounded-[18px] border border-cyan-300/15 bg-cyan-400/8 px-4 py-3 text-sm text-cyan-100">
                <div className="flex items-center justify-between gap-3">
                  <span>Fee routing: Treasury multisig</span>
                  <span className="font-mono text-xs text-white/80">{shortAddr(effectiveFeeRecipient, 12, 10)}</span>
                </div>
              </div>

              <div className={`${shell("soft")} space-y-2 p-4 text-sm`}>
                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] px-3 py-2">
                  <span className="text-slate-400">Quote</span>
                  <span className="text-right font-semibold text-cyan-100">{quoteSourceLabel}</span>
                </div>
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
                onClick={() => setRioLightCardOpen(true)}
                disabled={!canSwap || executing || !selectedRouteTruth.hasLivePair}
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


              {rioLightApprovalAccepted && !receipt?.status ? (
                <div className="rounded-[18px] border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">
                        RioLight approved this swap
                      </div>
                      <div className="mt-1 text-xs text-cyan-100/80">
                        Broadcast pending until the RioLight transaction security pass is enabled.
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-50">
                        Broadcast pending
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}


              {rioLightApproved && !receipt?.status ? (
                <div className="rounded-[18px] border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">RioLight approved this swap</div>
                      <div className="mt-1 text-xs text-cyan-100/80">
                        Background execution is pending until broadcast is enabled.
                      </div>
                    </div>
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-50">
                      Broadcast pending
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Debit</div>
                      <div className="mt-1 font-semibold text-white">
                        -{formatNum(numericAmount, 6)} {fromToken}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100/70">Expected Credit</div>
                      <div className="mt-1 font-semibold text-white">
                        +{displayQuote !== null ? formatNum(displayQuote, 6) : "—"} {toToken}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {receipt?.status === "success" ? (
                <div className="rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">
                        Swap confirmed
                      </div>
                      <div className="mt-1 text-xs text-emerald-100/80">
                        {receiptReceivedAmount !== null && receiptReceivedAmount !== undefined
                          ? `+${formatNum(receiptReceivedAmount, 6)} ${toToken} received`
                          : "Settlement confirmed"}
                      </div>
                    </div>
                    {receiptExplorerHref ? (
                      <a
                        href={receiptExplorerHref}
                        className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-300/15"
                      >
                        RioExplorer proof
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-emerald-100/70">
                        {receipt.txHash ? shortAddr(receipt.txHash, 16, 12) : "settled"}
                      </span>
                    )}
                  </div>
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

        <RioLightApprovalCard
          open={rioLightCardOpen}
          mode={
            rioLightReceiptConfirmed
              ? "confirmed"
              : rioLightReceiptFailed
                ? "failed"
                : rioLightApprovalAccepted
                  ? "pending"
                  : rioLightApprovalPending || executing
                    ? "pending"
                    : "review"
          }
          fromAvatar={
            <TokenAvatar registryMap={registryMap} assetId={fromAssetId} label={fromToken} size={34} />
          }
          toAvatar={
            <TokenAvatar registryMap={registryMap} assetId={toAssetId} label={toToken} size={34} />
          }
          fromLabel={fromToken}
          fromAmount={formatNum(numericAmount, 6)}
          toLabel={toToken}
          toAmount={displayQuote !== null ? formatNum(displayQuote, 6) : "—"}
          routeLabel={readableRouteSubtitle}
          quoteSourceLabel={quoteSourceLabel}
          minReceivedLabel={
            displayQuote !== null
              ? `${formatNum(displayQuote * (1 - slippagePct / 100), 6)} ${toToken}`
              : "—"
          }
          feeSlippageLabel={
            quoteData
              ? `${formatNum(quoteData.feeAmount, 6)} ${fromToken} · ${slippagePct}%`
              : `Estimated · ${slippagePct}%`
          }
          treasuryRecipientLabel={shortAddr(effectiveFeeRecipient, 12, 10)}
          auditIdentityLabel={routeAuditIdentity}
          executionStage={rioLightApprovalAccepted ? "Approved — broadcast pending" : executionStage}
          executionMessage={rioLightApprovalAccepted ? "RioLight approved this swap review. Signing and broadcast remain reserved until the transaction security pass is enabled." : executionError}
          gateReason={swapGateReason}
          receiptAmountLabel={
            receiptReceivedAmount !== null && receiptReceivedAmount !== undefined
              ? formatNum(receiptReceivedAmount, 6)
              : null
          }
          receiptTokenLabel={toToken}
          receiptExplorerHref={receiptExplorerHref}
          failureMessage={receipt?.error || executionError}
          canApprove={canSwap && selectedRouteTruth.hasLivePair}
          approvalPending={rioLightApprovalPending || rioLightApprovalAccepted}
          executing={executing}
          approveLabel="Continue"
          pendingLabel="Opening RioLight"
          onApprove={handleExecuteSwap}
          onCancel={() => setRioLightCardOpen(false)}
          onDone={() => setRioLightCardOpen(false)}
        />

        <div className="mt-5 px-1 text-[11px] leading-5 text-slate-500">
          This terminal reads registry-backed route truth from the authoritative RioEx/RioDex registry layer. Wallet execution is handled through RioLight approval.
        </div>
      </div>
    </div>
  );
}
