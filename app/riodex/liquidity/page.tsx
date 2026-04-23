"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ExchangeSurfaceNav from "@/components/exchange/ExchangeSurfaceNav";
import { connectRioWallet } from "@/lib/wallet/connect";
import type { LiquiditySource } from "@/lib/riodex/handoff";
import {
  normalizeAssetLabel,
  normalizePairLabel,
} from "@/lib/riodex/display";
import {
  buildProvideLiquidityPlan,
  buildWithdrawLiquidityPlan,
  executeLiquidityPlan,
  getRioDexPosition,
  type RioDexPositionResponse,
  type AssetInput,
} from "@/lib/riodex/liquidity";
import {
  buildTokenRegistryMap,
  getRioDexTokenRegistryBatch,
  getRegistryLogoUrl,
  getRegistryPairLabel,
} from "@/lib/riodex/token-registry";
import {
  RIODEX_HOME_ROUTE,
  RIODEX_SCREENER_ROUTE,
  buildRioDexSurfaceHref,
} from "@/lib/riodex/routes";

type PairMeta = {
  pair_address: string;
  factory_address?: string | null;
  lp_token_address?: string | null;
  pair_key?: string | null;
  display_symbol?: string | null;
  fee_bps?: number | null;
  is_canonical?: boolean | null;
  is_live?: boolean | null;
  created_height?: string | number | null;
  created_time?: string | null;
  updated_at?: string | null;
  asset_0_id?: string | null;
  asset_1_id?: string | null;
  asset_0_type?: string | null;
  asset_1_type?: string | null;
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
};

type RegistryPair = {
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
  quoteConvention: string;
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

type RegistryPairResponse = {
  ok?: boolean;
  pair?: RegistryPair | null;
  item?: RegistryPair | null;
  error?: string;
};

type LiquidityRow = {
  pairAddress: string;
  pairKey: string;
  displayLabel: string;
  isCanonical: boolean;
  isLive: boolean;
  asset0: number;
  asset1: number;
  price: number;
  lpShare: string | number;
  feeBps: number;
  liquidityUsd: number;
  liquiditySource: string | null;
  marketSource: string | null;
  createdAtHeight: string | number | null;
  createdAtTime: string | null;
  asset0Id: string | null;
  asset1Id: string | null;
  routes: {
    assetTerminal?: string;
    marketBoard?: string;
    hero?: string;
    pool?: string;
    swap?: string;
    liquidity?: string;
  };
};

type LiquidityRouteResponse = {
  ok?: boolean;
  count?: number;
  pools?: LiquidityRow[];
  error?: string;
};

type ProvisionalPairInput = {
  tokenAddress: string;
  baseAssetId: string;
  symbol?: string;
};

const WALLET_STORAGE_KEY = "spherio_wallet_address";
const WALLET_EVENT = "spherio:wallet-changed";
const CANONICAL_PAIR_ADDR =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";

function buildSyntheticPairFromRegistry(registryPair: RegistryPair): PairMeta {
  return {
    pair_address: registryPair.pairAddress,
    display_symbol: registryPair.displaySymbol,
    fee_bps: registryPair.feeBps,
    is_canonical: registryPair.isCanonical,
    is_live: registryPair.isLive,
    updated_at: registryPair.liquidityUpdatedAt || registryPair.lastSwapTime || null,
    asset_0_id: registryPair.baseAssetId,
    asset_1_id: registryPair.quoteAssetId,
    asset_0_type: "native",
    asset_1_type: registryPair.quoteAssetId?.startsWith("rio1") ? "token" : "native",
    lp_token_address: null,
    factory_address: null,
    pair_key: null,
    created_height: registryPair.liquidityHeight || null,
    created_time: registryPair.liquidityTime || null,
  };
}

function buildProvisionalPairMeta({
  tokenAddress,
  baseAssetId,
  symbol,
}: ProvisionalPairInput): PairMeta {
  const normalizedBase = (baseAssetId || "urio").toLowerCase();
  const baseLabel = normalizedBase === "urio" ? "RIO" : normalizedBase.toUpperCase();
  const quoteLabel = (symbol || shortAddr(tokenAddress, 6, 4)).toUpperCase();

  return {
    pair_address: `pending:${tokenAddress}:${normalizedBase}`,
    pair_key: `pending:${tokenAddress}:${normalizedBase}`,
    display_symbol: `${quoteLabel} / ${baseLabel}`,
    fee_bps: 30,
    is_canonical: false,
    is_live: false,
    updated_at: null,
    asset_0_id: tokenAddress,
    asset_1_id: normalizedBase,
    asset_0_type: "token",
    asset_1_type: "native",
    lp_token_address: null,
    factory_address: null,
    created_height: null,
    created_time: null,
  };
}

function formatInt(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

function fromBaseUnits(baseAmount?: string | number | null, decimals = 6) {
  const n = Number(baseAmount ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n / 10 ** decimals;
}

function toBaseUnits(value: string, decimals = 6) {
  const trimmed = value.trim();
  if (!trimmed) return "0";

  const [whole, frac = ""] = trimmed.split(".");
  const safeWhole = whole.replace(/[^\d]/g, "") || "0";
  const safeFrac = frac.replace(/[^\d]/g, "").slice(0, decimals);
  const paddedFrac = safeFrac.padEnd(decimals, "0");
  const combined = `${safeWhole}${paddedFrac}`.replace(/^0+/, "");

  return combined || "0";
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

function shortAddr(v?: string | null, left = 10, right = 8) {
  if (!v) return "—";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

function formatFeeBps(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return `${value} bps`;
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

function pageShellClass() {
  return "min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_12%_15%,rgba(123,63,242,0.18),transparent_22%),linear-gradient(180deg,#020611_0%,#020815_48%,#010611_100%)] text-white";
}

function panelClass() {
  return "rounded-[32px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(7,18,49,0.92),rgba(3,10,29,0.96))] shadow-[0_18px_70px_rgba(0,0,0,0.38)]";
}

function rowPillClass(active = false) {
  return active
    ? "inline-flex h-12 items-center justify-center rounded-full border border-cyan-400 bg-cyan-400/8 px-8 text-[16px] font-medium text-cyan-300"
    : "inline-flex h-12 items-center justify-center rounded-full border border-[#243663] bg-[#18264b] px-8 text-[16px] font-medium text-white/95 hover:bg-[#1c2d58]";
}

function tableActionClass(primary = false) {
  return primary
    ? "inline-flex h-13 min-w-[126px] items-center justify-center rounded-[18px] border border-cyan-400 bg-cyan-400/8 px-6 text-[16px] font-semibold text-cyan-300 hover:bg-cyan-400/12"
    : "inline-flex h-11 min-w-[92px] items-center justify-center rounded-[18px] border border-violet-400/35 bg-violet-500/6 px-5 text-[15px] font-medium text-white hover:bg-violet-500/10";
}

function actionToggleClass(active: boolean) {
  return active
    ? "flex h-16 w-full items-center justify-center rounded-[20px] border border-cyan-400 bg-cyan-400/10 text-[20px] font-semibold text-cyan-200"
    : "flex h-16 w-full items-center justify-center rounded-[20px] border border-white/10 bg-white/8 text-[20px] font-semibold text-white/92 hover:bg-white/10";
}

function modalStatClass() {
  return "rounded-[28px] border border-cyan-400/14 bg-[linear-gradient(180deg,rgba(28,40,93,0.82),rgba(13,20,54,0.94))] p-5";
}

function noticeClass() {
  return "rounded-[22px] border border-amber-500/35 bg-[linear-gradient(180deg,rgba(58,39,18,0.86),rgba(40,27,14,0.94))] px-5 py-4 text-amber-100";
}

function appendRouteQuery(href: string, query: string) {
  return href.includes("?") ? `${href}&${query}` : `${href}?${query}`;
}

function matchesTokenOrBase(assetId?: string | null, needle?: string) {
  if (!assetId || !needle) return false;
  const value = assetId.toLowerCase();
  const query = needle.toLowerCase();
  return value === query || value.includes(query);
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

function buildAssetInput(
  assetType: string | null | undefined,
  assetId: string | null | undefined,
  amount: string,
  label: string
): AssetInput {
  if (!assetId) {
    throw new Error(`Missing ${label} asset id`);
  }

  if (assetType === "native" || assetId === "urio") {
    return {
      kind: "native",
      denom: assetId,
      amount,
      label,
    };
  }

  return {
    kind: "cw20",
    contract: assetId,
    amount,
    label,
  };
}

function fallbackPairLabel(pair?: PairMeta | null) {
  if (!pair) return "—";
  return normalizePairLabel({
    displaySymbol: pair.display_symbol,
    asset0Id: pair.asset_0_id,
    asset1Id: pair.asset_1_id,
  });
}

function assetLabel(assetId?: string | null) {
  return normalizeAssetLabel(assetId);
}

function isStableAsset(assetId?: string | null) {
  const s = (assetId || "").toLowerCase();
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

  if (isStableAsset(pair.asset_1_id)) return reserve1;
  if (isStableAsset(pair.asset_0_id)) return reserve0;

  return reserve1;
}

function compute24hVolume(pair: PairMeta | null, swaps: SwapRow[]) {
  if (!pair) return 0;

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  return swaps.reduce((sum, swap) => {
    const ts = new Date(swap.block_time).getTime();
    if (!Number.isFinite(ts) || ts < dayAgo) return sum;

    const offerId = (swap.offer_asset_id || "").toLowerCase();
    const askId = (swap.ask_asset_id || "").toLowerCase();

    if (isStableAsset(offerId)) {
      return sum + fromBaseUnits(swap.offer_amount);
    }

    if (isStableAsset(askId)) {
      return sum + fromBaseUnits(swap.return_amount);
    }

    return sum;
  }, 0);
}

function compute24hFees(swaps: SwapRow[]) {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  return swaps.reduce((sum, swap) => {
    const ts = new Date(swap.block_time).getTime();
    if (!Number.isFinite(ts) || ts < dayAgo) return sum;
    return sum + fromBaseUnits(swap.commission_amount);
  }, 0);
}

function TokenPairBadge({
  registryMap,
  pair,
}: {
  registryMap: ReturnType<typeof buildTokenRegistryMap>;
  pair: PairMeta;
}) {
  const logo0 = pair.asset_0_id ? getRegistryLogoUrl(registryMap, pair.asset_0_id) : null;
  const logo1 = pair.asset_1_id ? getRegistryLogoUrl(registryMap, pair.asset_1_id) : null;
   const pairLabel =
    pair.display_symbol ||
    (pair.asset_0_id && pair.asset_1_id
      ? getRegistryPairLabel(registryMap, pair.asset_0_id, pair.asset_1_id)
      : fallbackPairLabel(pair));

  return (
    <div className="flex items-center gap-4">
      <div className="flex shrink-0 items-center -space-x-2">
        {logo0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo0}
            alt={assetLabel(pair.asset_0_id)}
            className="h-12 w-12 rounded-full border border-black bg-black object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black bg-black text-base font-semibold text-white">
            {assetLabel(pair.asset_0_id).slice(0, 1)}
          </div>
        )}

        {logo1 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo1}
            alt={assetLabel(pair.asset_1_id)}
            className="h-12 w-12 rounded-full border border-black bg-black object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black bg-black text-base font-semibold text-white">
            {assetLabel(pair.asset_1_id).slice(0, 1)}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate text-[20px] font-semibold text-white">
          {pairLabel}
        </div>
        <div className="mt-1 font-mono text-[13px] text-white/55">
          {shortAddr(pair.pair_address, 12, 10)}
        </div>
      </div>
    </div>
  );
}

function HandoffBanner({
  source,
  token,
  tx,
  graduated,
}: {
  source: LiquiditySource;
  token?: string;
  tx?: string;
  graduated?: boolean;
}) {
  return (
    <div className="mt-6 rounded-[24px] border border-cyan-400/16 bg-cyan-500/6 px-5 py-4 text-sm text-white/85">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
          {source === "createtoken" ? "CreateToken" : "Pump.live"}
        </span>
        <span>
          {source === "createtoken"
            ? "Pool handoff complete. Continue liquidity provisioning here."
            : graduated
            ? "Bonding graduation complete. Liquidity is now under RioDex control."
            : "Pump.live handoff active. Continue liquidity provisioning here."}
        </span>
      </div>

      {(token || tx) && (
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/55">
          {token ? <span>Token: {shortAddr(token, 12, 10)}</span> : null}
          {tx ? <span>Tx: {shortAddr(tx, 12, 10)}</span> : null}
        </div>
      )}
    </div>
  );
}

export default function RioDexLiquidityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const poolFromQuery = searchParams.get("pair") || searchParams.get("pool") || "";
  const modeFromQuery = searchParams.get("mode");
  const baseFromQuery = (searchParams.get("base")?.trim() || "").toLowerCase();
  const symbolFromQuery = (searchParams.get("symbol")?.trim() || "").toUpperCase();

  const sourceFromQuery = (searchParams.get("source")?.trim() || "") as
    | LiquiditySource
    | "";
  const tokenFromQuery = (searchParams.get("token")?.trim() || "").toLowerCase();
  const txFromQuery = searchParams.get("tx")?.trim() || "";
  const graduatedFromQuery = searchParams.get("graduated") === "1";

  const [resolvedPairAddress, setResolvedPairAddress] = useState<string>(
    poolFromQuery || CANONICAL_PAIR_ADDR
  );

  const pairAddress = resolvedPairAddress;
  const pairRoutes = useMemo(() => buildRioDexSurfaceHref(pairAddress), [pairAddress]);

  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const [pair, setPair] = useState<PairMeta | null>(null);
  const [registryPair, setRegistryPair] = useState<RegistryPair | null>(null);
  const [allPairs, setAllPairs] = useState<PairMeta[]>([]);
  const [liquidityHistory, setLiquidityHistory] = useState<LiquiditySnapshot[]>([]);
  const [recentSwaps, setRecentSwaps] = useState<SwapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketError, setMarketError] = useState<string | null>(null);

  const [position, setPosition] = useState<RioDexPositionResponse | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);
  const [positionError, setPositionError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState<"add" | "remove">("add");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [addAsset0Amount, setAddAsset0Amount] = useState("");
  const [addAsset1Amount, setAddAsset1Amount] = useState("");
  const [removeLpAmount, setRemoveLpAmount] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [registryMap, setRegistryMap] = useState(() => buildTokenRegistryMap([]));
  const [registryLoading, setRegistryLoading] = useState(false);

  const [liquidityRows, setLiquidityRows] = useState<LiquidityRow[]>([]);
  const [liquidityRouteLoading, setLiquidityRouteLoading] = useState(false);
  const [liquidityRouteError, setLiquidityRouteError] = useState<string | null>(null);

  const matchedLiquidityRowFromQuery = useMemo(() => {
    if (poolFromQuery || !liquidityRows.length) return null;

    if (tokenFromQuery && baseFromQuery) {
      const exact = liquidityRows.find((row) => {
        const a0 = (row.asset0Id || "").toLowerCase();
        const a1 = (row.asset1Id || "").toLowerCase();
        const tokenMatch =
          matchesTokenOrBase(a0, tokenFromQuery) || matchesTokenOrBase(a1, tokenFromQuery);
        const baseMatch =
          matchesTokenOrBase(a0, baseFromQuery) || matchesTokenOrBase(a1, baseFromQuery);
        return tokenMatch && baseMatch;
      });

      if (exact) return exact;
    }

    if (!tokenFromQuery) return null;

    return (
      liquidityRows.find((row) => {
        const a0 = (row.asset0Id || "").toLowerCase();
        const a1 = (row.asset1Id || "").toLowerCase();
        return matchesTokenOrBase(a0, tokenFromQuery) || matchesTokenOrBase(a1, tokenFromQuery);
      }) || null
    );
  }, [poolFromQuery, liquidityRows, tokenFromQuery, baseFromQuery]);

  const provisionalPair = useMemo(() => {
    if (poolFromQuery) return null;
    if (matchedLiquidityRowFromQuery) return null;
    if (sourceFromQuery !== "createtoken" && sourceFromQuery !== "pumplive") return null;
    if (!tokenFromQuery) return null;

    return buildProvisionalPairMeta({
      tokenAddress: tokenFromQuery,
      baseAssetId: baseFromQuery || "urio",
      symbol: symbolFromQuery,
    });
  }, [
    poolFromQuery,
    matchedLiquidityRowFromQuery,
    sourceFromQuery,
    tokenFromQuery,
    baseFromQuery,
    symbolFromQuery,
  ]);

  const isProvisionalSelection =
    !!provisionalPair && pairAddress === provisionalPair.pair_address;
  const effectivePair = isProvisionalSelection ? provisionalPair : pair;

  async function loadLiquidityRowsOnce() {
    try {
      setLiquidityRouteLoading(true);
      setLiquidityRouteError(null);

      const res = await fetchJson<LiquidityRouteResponse>("/api/riodex/liquidity");
      setLiquidityRows(res?.pools || []);
    } catch (error: any) {
      setLiquidityRows([]);
      setLiquidityRouteError(
        error?.message || "Failed to load authoritative liquidity rows"
      );
    } finally {
      setLiquidityRouteLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    setConnectedAddress(readStoredWalletAddress());

    function onStorage(e: StorageEvent) {
      if (e.key === WALLET_STORAGE_KEY) {
        setConnectedAddress(readStoredWalletAddress());
      }
    }

    function onWalletChanged() {
      setConnectedAddress(readStoredWalletAddress());
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(WALLET_EVENT, onWalletChanged as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WALLET_EVENT, onWalletChanged as EventListener);
    };
  }, []);

  useEffect(() => {
    void loadLiquidityRowsOnce();
  }, []);

  useEffect(() => {
    if (poolFromQuery) {
      if (resolvedPairAddress !== poolFromQuery) {
        setResolvedPairAddress(poolFromQuery);
      }
      return;
    }

    if (matchedLiquidityRowFromQuery?.pairAddress) {
      if (resolvedPairAddress !== matchedLiquidityRowFromQuery.pairAddress) {
        setResolvedPairAddress(matchedLiquidityRowFromQuery.pairAddress);
      }
      return;
    }

    if (provisionalPair?.pair_address) {
      if (resolvedPairAddress !== provisionalPair.pair_address) {
        setResolvedPairAddress(provisionalPair.pair_address);
      }
      return;
    }

    if (resolvedPairAddress !== CANONICAL_PAIR_ADDR) {
      setResolvedPairAddress(CANONICAL_PAIR_ADDR);
    }
  }, [
    poolFromQuery,
    matchedLiquidityRowFromQuery,
    provisionalPair,
    resolvedPairAddress,
  ]);

  useEffect(() => {
    let active = true;

    async function loadMarket() {
      try {
        setLoading(true);
        setMarketError(null);

        if (provisionalPair && pairAddress === provisionalPair.pair_address) {
          if (!active) return;
          setAllPairs([]);
          setPair(provisionalPair);
          setRegistryPair(null);
          setLiquidityHistory([]);
          setRecentSwaps([]);
          setMarketError(null);
          return;
        }

        const [liquidityRes, swapsRes, registryRes] = await Promise.all([
          fetchJson<{ ok?: boolean; liquidity?: LiquiditySnapshot[] }>(
            `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/liquidity?limit=40`
          ).catch(() => ({ liquidity: [] })),
          fetchJson<{ ok?: boolean; swaps?: SwapRow[] }>(
            `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/swaps?limit=50`
          ).catch(() => ({ swaps: [] })),
          fetchJson<RegistryPairResponse>(
            `/api/rioex/markets/${encodeURIComponent(pairAddress)}`
          ).catch(() => ({ pair: null, item: null }) as RegistryPairResponse),
        ]);

        if (!active) return;

        const resolvedRegistryPair = registryRes?.pair || registryRes?.item || null;
        const resolvedPair = resolvedRegistryPair
          ? buildSyntheticPairFromRegistry(resolvedRegistryPair)
          : null;

        setAllPairs([]);
        setPair(resolvedPair);
        setRegistryPair(resolvedRegistryPair);
        setLiquidityHistory(liquidityRes?.liquidity || []);
        setRecentSwaps(swapsRes?.swaps || []);

        if (!resolvedPair && !resolvedRegistryPair) {
          setMarketError("Pool not found in authoritative liquidity registry.");
        }
      } catch (error: any) {
        if (!active) return;
        setMarketError(error?.message || "Failed to load RioDex liquidity state");
        setPair(null);
        setRegistryPair(null);
        setAllPairs([]);
        setLiquidityHistory([]);
        setRecentSwaps([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMarket();

    return () => {
      active = false;
    };
  }, [pairAddress, provisionalPair]);

  useEffect(() => {
    let active = true;

    async function loadRegistry() {
      const assetIds = [
        ...new Set(
          [
            ...allPairs.flatMap((p) => [p.asset_0_id || "", p.asset_1_id || ""]),
            effectivePair?.asset_0_id || "",
            effectivePair?.asset_1_id || "",
            registryPair?.baseAssetId || "",
            registryPair?.quoteAssetId || "",
          ].filter(Boolean)
        ),
      ];

      if (!assetIds.length) {
        setRegistryMap(buildTokenRegistryMap([]));
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
  }, [allPairs, effectivePair, registryPair]);

  useEffect(() => {
    const isLaunchHandoff =
      sourceFromQuery === "createtoken" || sourceFromQuery === "pumplive";

    if (modeFromQuery === "add" || modeFromQuery === "remove") {
      setActionMode(modeFromQuery);
      setModalOpen(true);
      return;
    }

    if (isLaunchHandoff) {
      setActionMode("add");
      setModalOpen(true);
    }
  }, [modeFromQuery, sourceFromQuery]);

useEffect(() => {
  const isLaunchHandoff =
    sourceFromQuery === "createtoken" || sourceFromQuery === "pumplive";

  if (!isLaunchHandoff) return;
  if (searchQuery.trim()) return;

  const seed = symbolFromQuery || tokenFromQuery || baseFromQuery || "";
  if (seed) setSearchQuery(seed);
}, [sourceFromQuery, symbolFromQuery, tokenFromQuery, baseFromQuery, searchQuery]);

  useEffect(() => {
    let active = true;

    async function loadPosition() {
      if (!connectedAddress || !pairAddress || isProvisionalSelection) {
        if (active) {
          setPosition(null);
          setPositionError(null);
          setPositionLoading(false);
        }
        return;
      }

      try {
        setPositionLoading(true);
        setPositionError(null);

        const res = await getRioDexPosition(pairAddress, connectedAddress);

        if (!active) return;
        setPosition(res);
      } catch (error: any) {
        if (!active) return;
        setPosition(null);
        setPositionError(error?.message || "Failed to load position");
      } finally {
        if (active) setPositionLoading(false);
      }
    }

    loadPosition();

    return () => {
      active = false;
    };
  }, [connectedAddress, pairAddress, isProvisionalSelection]);

  async function refreshPosition() {
    if (!connectedAddress || !pairAddress || isProvisionalSelection) return;

    try {
      setPositionLoading(true);
      setPositionError(null);
      const res = await getRioDexPosition(pairAddress, connectedAddress);
      setPosition(res);
    } catch (error: any) {
      setPosition(null);
      setPositionError(error?.message || "Failed to refresh position");
    } finally {
      setPositionLoading(false);
    }
  }

  async function refreshMarketSnapshot() {
    try {
      if (isProvisionalSelection) {
        setAllPairs([]);
        setPair(provisionalPair);
        setRegistryPair(null);
        setLiquidityHistory([]);
        setRecentSwaps([]);
        setMarketError(null);
        await loadLiquidityRowsOnce();
        return;
      }

      const [liquidityRes, swapsRes, registryRes] = await Promise.all([
        fetchJson<{ ok?: boolean; liquidity?: LiquiditySnapshot[] }>(
          `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/liquidity?limit=40`
        ).catch(() => ({ liquidity: [] })),
        fetchJson<{ ok?: boolean; swaps?: SwapRow[] }>(
          `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/swaps?limit=50`
        ).catch(() => ({ swaps: [] })),
        fetchJson<RegistryPairResponse>(
          `/api/rioex/markets/${encodeURIComponent(pairAddress)}`
        ).catch(() => ({ pair: null, item: null }) as RegistryPairResponse),
      ]);

      const resolvedRegistryPair = registryRes?.pair || registryRes?.item || null;
      const resolvedPair = resolvedRegistryPair
        ? buildSyntheticPairFromRegistry(resolvedRegistryPair)
        : null;

      setAllPairs([]);
      setPair(resolvedPair);
      setRegistryPair(resolvedRegistryPair);
      setLiquidityHistory(liquidityRes?.liquidity || []);
      setRecentSwaps(swapsRes?.swaps || []);
      setMarketError(null);

      await loadLiquidityRowsOnce();
    } catch (error: any) {
      setMarketError(error?.message || "Failed to refresh liquidity state");
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true);
      const { address } = await connectRioWallet();
      setConnectedAddress(address);
      writeStoredWalletAddress(address);
    } catch (e: any) {
      alert(e?.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setConnectedAddress(null);
    writeStoredWalletAddress(null);
    setPosition(null);
    setActionError(null);
    setActionSuccess(null);
  }

  async function handleAddLiquidity() {
    if (isProvisionalSelection) {
      setActionError(
        "This token is still in provisional handoff mode. A real liquidity row or pool address must exist before on-chain provisioning can execute from this surface."
      );
      return;
    }

    if (!effectivePair || !connectedAddress) {
      setActionError("Wallet and pool are required.");
      return;
    }

    const amount0 = toBaseUnits(addAsset0Amount);
    const amount1 = toBaseUnits(addAsset1Amount);

    if (amount0 === "0" || amount1 === "0") {
      setActionError("Enter both asset amounts.");
      return;
    }

    try {
      setActionBusy(true);
      setActionError(null);
      setActionSuccess(null);

      const plan = buildProvideLiquidityPlan({
        pairAddress,
        walletAddress: connectedAddress,
        asset0: buildAssetInput(
          effectivePair.asset_0_type,
          effectivePair.asset_0_id,
          amount0,
          assetLabel(effectivePair.asset_0_id)
        ),
        asset1: buildAssetInput(
          effectivePair.asset_1_type,
          effectivePair.asset_1_id,
          amount1,
          assetLabel(effectivePair.asset_1_id)
        ),
      });

      await executeLiquidityPlan(plan, "Add Liquidity");

      setActionSuccess("Liquidity submitted.");
      setAddAsset0Amount("");
      setAddAsset1Amount("");
      await Promise.all([refreshPosition(), refreshMarketSnapshot()]);
         const targetToken =
        tokenFromQuery || effectivePair?.asset_0_id || "";

      window.setTimeout(() => {
        if (targetToken) {
          router.push(`/riodex/markets?token=${encodeURIComponent(targetToken)}&live=1`);
          return;
        }

        router.push(screenerHref);
      }, 900);
    
    } catch (error: any) {
      setActionError(error?.message || "Failed to add liquidity.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRemoveLiquidity() {
    if (!connectedAddress) {
      setActionError("Wallet is required.");
      return;
    }

    if (!hasPosition) {
      setActionError("This wallet does not currently hold liquidity in the selected pool.");
      return;
    }

    const lpTokenAddress = position?.lp_token_address;
    if (!lpTokenAddress) {
      setActionError("Remove liquidity is not yet enabled for this pool on this surface.");
      return;
    }

    const amount = toBaseUnits(removeLpAmount);
    if (amount === "0") {
      setActionError("Enter LP amount.");
      return;
    }

    try {
      setActionBusy(true);
      setActionError(null);
      setActionSuccess(null);

      const plan = buildWithdrawLiquidityPlan({
        pairAddress,
        lpTokenAddress,
        amount,
      });

      await executeLiquidityPlan(plan, "Remove Liquidity");

      setActionSuccess("Liquidity withdrawal submitted.");
      setRemoveLpAmount("");
      await Promise.all([refreshPosition(), refreshMarketSnapshot()]);
    } catch (error: any) {
      setActionError(error?.message || "Failed to remove liquidity.");
    } finally {
      setActionBusy(false);
    }
  }

  function openCreateModal(mode: "add" | "remove" = "add") {
    setActionMode(mode);
    setActionError(null);
    setActionSuccess(null);
    setModalOpen(true);
  }

  function openRowAction(
    poolItem: { pair_address: string; poolHref?: string },
    mode: "add" | "remove" = "add"
  ) {
    if (poolItem.pair_address === pairAddress || poolItem.pair_address.startsWith("pending:")) {
      openCreateModal(mode);
      return;
    }

    const targetRoutes = buildRioDexSurfaceHref(poolItem.pair_address);
    const suffix = mode === "add" ? "mode=add" : "mode=remove";
    window.location.assign(
      appendRouteQuery(poolItem.poolHref || targetRoutes.liquidity, suffix)
    );
  }

  const latestLiquidity = liquidityHistory[0] || null;
  const walletLpBalance = Number(position?.wallet_lp_balance || 0);
  const hasPosition = walletLpBalance > 0;
  const removeSupported = !!position?.lp_token_address;

  const reserve0 =
    !isProvisionalSelection && latestLiquidity ? fromBaseUnits(latestLiquidity.reserve_0) : 0;
  const reserve1 =
    !isProvisionalSelection && latestLiquidity ? fromBaseUnits(latestLiquidity.reserve_1) : 0;
  const totalShare =
    !isProvisionalSelection && latestLiquidity ? fromBaseUnits(latestLiquidity.total_share) : 0;

  const selectedPairLabel = useMemo(() => {
    if (isProvisionalSelection && effectivePair) {
      return effectivePair.display_symbol || fallbackPairLabel(effectivePair);
    }

    const raw = String(registryPair?.displaySymbol || "").trim();

    if (raw && raw.toLowerCase() !== "urio") {
      return raw;
    }

    if (registryPair?.baseSymbol || registryPair?.quoteSymbol) {
      const base = String(registryPair?.baseSymbol || "RIO").trim() || "RIO";
      let quote = String(registryPair?.quoteSymbol || "RUSD").trim() || "RUSD";

      if (quote.toLowerCase().startsWith("rio14nur")) {
        quote = "RUSD";
      }

      return `${base} / ${quote}`;
    }

    if (effectivePair?.asset_0_id && effectivePair?.asset_1_id) {
      return getRegistryPairLabel(
        registryMap,
        effectivePair.asset_0_id,
        effectivePair.asset_1_id
      );
    }

    return fallbackPairLabel(effectivePair);
  }, [effectivePair, isProvisionalSelection, registryMap, registryPair]);

  const estimatedLiquidityDisplay = isProvisionalSelection
    ? 0
    : estimateLiquidityValue(effectivePair, latestLiquidity);
  const liquidityDisplay =
    Number(registryPair?.liquidityUsd || 0) > 0
      ? Number(registryPair?.liquidityUsd || 0)
      : estimatedLiquidityDisplay;
  const volume24h = isProvisionalSelection ? 0 : compute24hVolume(effectivePair, recentSwaps);
  const fees24h = isProvisionalSelection ? 0 : compute24hFees(recentSwaps);
  const apr24h = liquidityDisplay > 0 ? (fees24h * 365 * 100) / liquidityDisplay : 0;
  const authoritativeFeeBps = registryPair?.feeBps ?? effectivePair?.fee_bps ?? 30;
  const authoritativeLiquiditySource = isProvisionalSelection
    ? "launch_handoff_pending"
    : registryPair?.liquiditySource || null;
  const authoritativeFeePolicy = registryPair?.feePolicy || null;
  const authoritativeFeeRecipient = registryPair?.feeRecipientAddress || null;
  const authoritativeUpdatedAt = isProvisionalSelection
    ? null
    : registryPair?.liquidityUpdatedAt ||
      registryPair?.lastSwapTime ||
      latestLiquidity?.block_time ||
      null;
  const swapHref = registryPair?.routes?.swap || pairRoutes.swap;
  const poolHref = registryPair?.routes?.pool || pairRoutes.pool;
  const screenerHref =
    tokenFromQuery
      ? `/riodex/markets?token=${encodeURIComponent(tokenFromQuery)}`
      : registryPair?.routes?.marketBoard || RIODEX_SCREENER_ROUTE;
  const marketHref = isProvisionalSelection && tokenFromQuery
    ? `/rioex?token=${encodeURIComponent(tokenFromQuery)}`
    : registryPair?.routes?.hero || "/rioex";

const filteredPools = useMemo(() => {
  const q = searchQuery.trim().toLowerCase();

  const provisionalRows = provisionalPair
    ? [
        {
          pair_address: provisionalPair.pair_address,
          pair_key: provisionalPair.pair_key,
          fee_bps: provisionalPair.fee_bps,
          is_live: false,
          is_canonical: false,
          created_height: provisionalPair.created_height,
          asset_0_id: provisionalPair.asset_0_id,
          asset_1_id: provisionalPair.asset_1_id,
          displayLabel: provisionalPair.display_symbol || fallbackPairLabel(provisionalPair),
          rowLiquidityUsd: 0,
          rowVolumeUsd: 0,
          rowFeesUsd: 0,
          rowApr: 0,
          poolHref: buildRioDexSurfaceHref(provisionalPair.pair_address).liquidity,
        },
      ]
    : [];

  const routeBackedRows = liquidityRows.length
    ? liquidityRows.map((row) => ({
        pair_address: row.pairAddress,
        pair_key: row.pairKey,
        fee_bps: row.feeBps,
        is_live: row.isLive,
        is_canonical: row.isCanonical,
        created_height: row.createdAtHeight,
        asset_0_id: row.asset0Id,
        asset_1_id: row.asset1Id,
        displayLabel: row.displayLabel,
        rowLiquidityUsd: row.liquidityUsd,
        rowVolumeUsd: row.pairAddress === pairAddress ? volume24h : 0,
        rowFeesUsd: row.pairAddress === pairAddress ? fees24h : 0,
        rowApr: row.pairAddress === pairAddress ? apr24h : 0,
        poolHref:
          row.routes?.liquidity ||
          buildRioDexSurfaceHref(row.pairAddress).liquidity,
      }))
    : allPairs.map((poolItem) => {
        const pairLabel =
          poolItem.asset_0_id && poolItem.asset_1_id
            ? getRegistryPairLabel(
                registryMap,
                poolItem.asset_0_id,
                poolItem.asset_1_id
              )
            : fallbackPairLabel(poolItem);

        return {
          ...poolItem,
          displayLabel: pairLabel,
          rowLiquidityUsd: poolItem.pair_address === pairAddress ? liquidityDisplay : null,
          rowVolumeUsd: poolItem.pair_address === pairAddress ? volume24h : null,
          rowFeesUsd: poolItem.pair_address === pairAddress ? fees24h : null,
          rowApr: poolItem.pair_address === pairAddress ? apr24h : null,
          poolHref: buildRioDexSurfaceHref(poolItem.pair_address).liquidity,
        };
      });

  const combinedRows = [...provisionalRows, ...routeBackedRows];

  const searchedRows = combinedRows.filter((poolItem) => {
    if (!q) return true;

    return (
      (poolItem.displayLabel || "").toLowerCase().includes(q) ||
      (poolItem.pair_address || "").toLowerCase().includes(q) ||
      (poolItem.asset_0_id || "").toLowerCase().includes(q) ||
      (poolItem.asset_1_id || "").toLowerCase().includes(q)
    );
  });

  const isLaunchHandoff =
    sourceFromQuery === "createtoken" || sourceFromQuery === "pumplive";

  if (isLaunchHandoff) {
    return searchedRows.filter((poolItem) => {
      if (poolItem.pair_address === pairAddress) return true;
      if (poolItem.pair_address.startsWith("pending:")) return true;

      if (!q) return false;

      return (
        (poolItem.displayLabel || "").toLowerCase().includes(q) ||
        (poolItem.pair_address || "").toLowerCase().includes(q) ||
        (poolItem.asset_0_id || "").toLowerCase().includes(q) ||
        (poolItem.asset_1_id || "").toLowerCase().includes(q)
      );
    });
  }

  return searchedRows;
}, [
  allPairs,
  apr24h,
  fees24h,
  liquidityDisplay,
  liquidityRows,
  pairAddress,
  provisionalPair,
  registryMap,
  searchQuery,
  sourceFromQuery,
  volume24h,
]);

  const truthHealthy = !loading && !marketError && !!effectivePair;

  return (
    <div className={pageShellClass()}>
      <div className="mx-auto max-w-[1620px] px-10 pb-12 pt-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="pl-6">
            <h1 className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-500 bg-clip-text text-[72px] font-semibold leading-[0.95] tracking-[-0.04em] text-transparent">
              Liquidity Pools
            </h1>
            <div className="mt-5 text-[22px] text-sky-200/90">
              Provide liquidity, earn yield.
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-[272px] rounded-[28px] border border-cyan-400/18 bg-[#162451] px-6 py-7">
              <div className="text-[15px] text-sky-200/90">TVL</div>
              <div className="mt-5 text-[24px] font-semibold text-white">
                {formatUsd(liquidityDisplay)}
              </div>
            </div>

            <div className="min-w-[272px] rounded-[28px] border border-cyan-400/18 bg-[#162451] px-6 py-7">
              <div className="text-[15px] text-sky-200/90">24h Volume</div>
              <div className="mt-5 text-[24px] font-semibold text-white">
                {formatUsd(volume24h)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ExchangeSurfaceNav
            product="riodex"
            activeKey="liquidity"
            featured={registryPair ? {
              displaySymbol: selectedPairLabel,
              canonicalSymbol: registryPair.canonicalSymbol,
              baseSymbol: registryPair.baseSymbol,
              quoteSymbol: registryPair.quoteSymbol,
              liquidityUsd: liquidityDisplay,
              feeBps: registryPair.feeBps,
              isCanonical: registryPair.isCanonical,
              isLive: registryPair.isLive,
              routes: registryPair.routes,
            } : (effectivePair ? {
              displaySymbol: selectedPairLabel,
              liquidityUsd: liquidityDisplay,
              feeBps: authoritativeFeeBps,
              isCanonical: isProvisionalSelection ? false : effectivePair.is_canonical,
              isLive: isProvisionalSelection ? false : effectivePair.is_live,
              routes: {
                assetTerminal: marketHref,
                marketBoard: screenerHref,
                hero: marketHref,
                pool: poolHref,
                swap: swapHref,
                liquidity: buildRioDexSurfaceHref(pairAddress).liquidity,
              },
            } : null)}
            title="RioDex Liquidity Surfaces"
            subtitle="Shared horizontal routing now sits above Liquidity so pool operations read canonical pair identity, treasury fee policy, registry TVL, and route handoff from the same authoritative market language while the larger existing liquidity surface remains intact."
          />
        </div>

        {marketError || liquidityRouteError ? (
          <div className="mt-6 rounded-[22px] border border-amber-500/35 bg-amber-500/10 px-5 py-4 text-amber-100">
            {[marketError, liquidityRouteError].filter(Boolean).join(" • ")}
          </div>
        ) : null}

        {sourceFromQuery ? (
          <HandoffBanner
            source={sourceFromQuery}
            token={tokenFromQuery || undefined}
            tx={txFromQuery || undefined}
            graduated={graduatedFromQuery}
          />
        ) : null}

        {effectivePair ? (
          <div className="mt-6 rounded-[22px] border border-cyan-400/16 bg-cyan-500/6 px-5 py-4 text-sm text-white/85">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Integrity Truth
              </span>
              {!isProvisionalSelection && (registryPair?.isCanonical || effectivePair?.is_canonical) ? (
                <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
                  Canonical
                </span>
              ) : null}
              {!isProvisionalSelection && (registryPair?.isLive || effectivePair?.is_live) ? (
                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Live
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 text-sm text-white/75 sm:grid-cols-2 xl:grid-cols-4">
              <div>Registry TVL: <span className="font-semibold text-white">{formatUsd(liquidityDisplay)}</span></div>
              <div>Liquidity Source: <span className="font-semibold text-white">{authoritativeLiquiditySource || "unresolved"}</span></div>
              <div>Fee Policy: <span className="font-semibold text-white">{authoritativeFeePolicy || "—"}</span></div>
              <div>Treasury Recipient: <span className="font-semibold text-white">{shortAddr(authoritativeFeeRecipient, 12, 10)}</span></div>
            </div>
            <div className="mt-2 text-xs text-white/50">
              Last registry update: {formatDateTime(authoritativeUpdatedAt)}
            </div>
          </div>
        ) : null}

        <div className="mt-10 border-y border-white/8 bg-[#091432]/85 px-8 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={rowPillClass(searchQuery.trim().length === 0)}
              >
                All
              </button>

              <Link href={swapHref} className={rowPillClass(false)}>
                Swap
              </Link>
              <Link href={poolHref} className={rowPillClass(false)}>
                Pool
              </Link>
              <Link href={screenerHref} className={rowPillClass(false)}>
                Screener
              </Link>
              <Link href={marketHref} className={rowPillClass(false)}>
                Market
              </Link>
              <Link href={RIODEX_HOME_ROUTE} className={rowPillClass(false)}>
                RioDex
              </Link>
              <Link href="/rioex" className={rowPillClass(false)}>
                RioEx
              </Link>
              <Link href="/rioexplorer" className={rowPillClass(false)}>
                RioExplorer
              </Link>
              <Link href="/launch" className={rowPillClass(false)}>
                Launch
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-[360px] items-center gap-3 rounded-full border border-[#243663] bg-[#1a274f] px-4">
                <Search className="h-5 w-5 text-white/45" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search token, pair, or address"
                  className="w-full bg-transparent text-[16px] text-white placeholder:text-white/40 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={refreshMarketSnapshot}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#243663] bg-[#1a274f] text-white/70 hover:bg-[#203160]"
                aria-label="Refresh liquidity state"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => openCreateModal("add")}
                className="inline-flex h-14 min-w-[124px] items-center justify-center rounded-[18px] border border-cyan-400 bg-transparent px-8 text-[18px] font-semibold text-cyan-300 hover:bg-cyan-400/8"
              >
                Create
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[40px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(4,13,35,0.98),rgba(3,10,26,0.98))]">
          <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1fr_1.2fr] gap-6 px-10 py-8 text-[16px] font-medium text-sky-200">
            <div>Pool</div>
            <div>Liquidity</div>
            <div>Volume 24H</div>
            <div>Fees 24H</div>
            <div>APR 24H</div>
            <div />
          </div>

          <div className="divide-y divide-white/6">
            {filteredPools.length ? (
              filteredPools.map((poolItem) => {
                const isCurrent = poolItem.pair_address === pairAddress;
                const itemRoutes = buildRioDexSurfaceHref(poolItem.pair_address);
                const liquidityTarget = poolItem.poolHref || itemRoutes.liquidity;

                const rowLiquidity = poolItem.rowLiquidityUsd ?? (isCurrent ? liquidityDisplay : null);
                const rowVolume = poolItem.rowVolumeUsd ?? (isCurrent ? volume24h : null);
                const rowFees = poolItem.rowFeesUsd ?? (isCurrent ? fees24h : null);
                const rowApr = poolItem.rowApr ?? (isCurrent ? apr24h : null);

                return (
                  <div
                    key={poolItem.pair_address}
                    className="grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1fr_1.2fr] items-center gap-6 px-10 py-7"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-5">
                        <TokenPairBadge registryMap={registryMap} pair={poolItem} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 pl-[88px]">
                        <span className="rounded-full bg-[#2b4fa6] px-4 py-1 text-[14px] font-semibold text-white">
                          {formatFeeBps(isCurrent ? authoritativeFeeBps : poolItem.fee_bps ?? 0)}
                        </span>
                        {poolItem.is_live ? (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-[14px] font-semibold text-emerald-300">
                            LIVE
                          </span>
                        ) : null}
                        {poolItem.is_canonical ? (
                          <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1 text-[14px] font-semibold tracking-[0.18em] text-violet-200">
                            CANONICAL
                          </span>
                        ) : poolItem.pair_address.startsWith("pending:") ? (
                          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1 text-[14px] font-semibold tracking-[0.18em] text-amber-200">
                            PENDING
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-[20px] font-semibold text-white">
                      {rowLiquidity !== null ? formatUsd(rowLiquidity) : "—"}
                    </div>

                    <div className="text-[20px] font-semibold text-white">
                      {rowVolume !== null ? formatUsd(rowVolume) : "—"}
                    </div>

                    <div className="text-[20px] font-semibold text-white">
                      {rowFees !== null ? formatUsd(rowFees) : "—"}
                    </div>

                    <div className="text-[20px] font-semibold text-white">
                      {rowApr !== null ? `${formatNum(rowApr, 2)}%` : "—"}
                    </div>

                    <div className="flex items-center justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (isCurrent || poolItem.pair_address.startsWith("pending:")) {
                            openCreateModal("add");
                            return;
                          }
                          window.location.assign(liquidityTarget);
                        }}
                        className={tableActionClass(false)}
                      >
                        Open
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (poolItem.pair_address.startsWith("pending:")) {
                            openCreateModal("add");
                            return;
                          }
                          openRowAction(poolItem, "add");
                        }}
                        className={tableActionClass(true)}
                      >
                        Deposit
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-10 py-10 text-[18px] text-white/60">
                No pools found.
              </div>
            )}
          </div>
        </div>

        {modalOpen && effectivePair ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className={`relative w-full max-w-[1180px] ${panelClass()}`}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute right-6 top-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/75 hover:bg-white/10"
                aria-label="Close liquidity action"
              >
                <X className="h-7 w-7" />
              </button>

              <div className="border-b border-white/8 px-8 py-7">
                <div className="text-[15px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  Liquidity Action
                </div>
                <div className="mt-2 text-[54px] font-semibold tracking-[-0.04em] text-white">
                  {selectedPairLabel}
                </div>
              </div>

              <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="space-y-5">
                  <div className="rounded-[28px] border border-white/10 bg-black/18 p-5">
                                       <TokenPairBadge
                      registryMap={registryMap}
                      pair={{
                        ...effectivePair,
                        display_symbol: selectedPairLabel,
                      }}
                    />
                    <div className="mt-5 text-[18px] text-white/70">
                      Reserves: {formatInt(reserve0)} / {formatInt(reserve1)} &nbsp;•&nbsp; LP Supply: {formatNum(totalShare, 3)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActionMode("add");
                        setActionError(null);
                        setActionSuccess(null);
                      }}
                      className={actionToggleClass(actionMode === "add")}
                    >
                      Add Liquidity
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActionMode("remove");
                        setActionError(null);
                        setActionSuccess(null);
                      }}
                      className={actionToggleClass(actionMode === "remove")}
                    >
                      Remove Liquidity
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={modalStatClass()}>
                      <div className="text-[13px] font-medium uppercase tracking-[0.22em] text-white/55">
                        Liquidity
                      </div>
                      <div className="mt-4 text-[24px] font-semibold text-white">
                        {formatUsd(liquidityDisplay)}
                      </div>
                    </div>

                    <div className={modalStatClass()}>
                      <div className="text-[13px] font-medium uppercase tracking-[0.22em] text-white/55">
                        Volume 24H
                      </div>
                      <div className="mt-4 text-[24px] font-semibold text-white">
                        {formatUsd(volume24h)}
                      </div>
                    </div>

                    <div className={modalStatClass()}>
                      <div className="text-[13px] font-medium uppercase tracking-[0.22em] text-white/55">
                        Fees 24H
                      </div>
                      <div className="mt-4 text-[24px] font-semibold text-white">
                        {formatUsd(fees24h)}
                      </div>
                    </div>

                    <div className={modalStatClass()}>
                      <div className="text-[13px] font-medium uppercase tracking-[0.22em] text-white/55">
                        APR 24H
                      </div>
                      <div className="mt-4 text-[24px] font-semibold text-white">
                        {`${formatNum(apr24h, 2)}%`}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-black/18 p-6">
                    <div className="text-[18px] font-semibold text-white">
                      Wallet Position
                    </div>

                    {positionLoading ? (
                      <div className="mt-5 text-[20px] text-white/70">
                        Loading position...
                      </div>
                    ) : positionError ? (
                      <div className="mt-5 text-[18px] text-amber-200">
                        {positionError}
                      </div>
                    ) : hasPosition ? (
                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[14px] uppercase tracking-[0.18em] text-white/50">
                            LP Balance
                          </div>
                          <div className="mt-2 text-[24px] font-semibold text-white">
                            {formatInt(walletLpBalance)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[14px] uppercase tracking-[0.18em] text-white/50">
                            Ownership
                          </div>
                          <div className="mt-2 text-[24px] font-semibold text-white">
                            {formatNum(Number(position?.ownership_pct || 0), 4)}%
                          </div>
                        </div>
                      </div>
                    ) : isProvisionalSelection ? (
                      <div className="mt-5 text-[20px] text-white/80">
                        Provisional launch pair pending authoritative registration.
                      </div>
                    ) : (
                      <div className="mt-5 text-[20px] text-white/80">
                        No active liquidity position in this pool.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[28px] border border-white/10 bg-black/18 p-5">
                    {connectedAddress ? (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="inline-flex h-16 items-center justify-center rounded-[18px] border border-white/10 bg-white/8 px-6 text-[18px] font-semibold text-white hover:bg-white/10"
                      >
                        Disconnect Wallet
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnect}
                        disabled={connecting}
                        className="inline-flex h-16 items-center justify-center rounded-[18px] border border-cyan-400 bg-cyan-400/10 px-6 text-[18px] font-semibold text-cyan-200 hover:bg-cyan-400/14 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {connecting ? "Connecting..." : "Connect Wallet"}
                      </button>
                    )}

                    <div className="mt-6 text-[24px] font-semibold text-white">
                      {actionMode === "add" ? "Add Liquidity" : "Remove Liquidity"}
                    </div>

                    {actionMode === "add" ? (
                      <>
                        <div className="mt-6 space-y-4">
                          <input
                            value={addAsset0Amount}
                            onChange={(e) => setAddAsset0Amount(e.target.value)}
                            placeholder={`${normalizeAssetLabel(effectivePair.asset_0_id) || "Token"} amount`}
                            className="h-16 w-full rounded-[20px] border border-white/10 bg-white/6 px-5 text-[18px] text-white outline-none placeholder:text-white/35"
                          />

                          <input
                            value={addAsset1Amount}
                            onChange={(e) => setAddAsset1Amount(e.target.value)}
                            placeholder={`${normalizeAssetLabel(effectivePair.asset_1_id) || "Base"} amount`}
                            className="h-16 w-full rounded-[20px] border border-white/10 bg-white/6 px-5 text-[18px] text-white outline-none placeholder:text-white/35"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAddLiquidity}
                          disabled={actionBusy || !connectedAddress || isProvisionalSelection}
                          className="mt-5 inline-flex h-16 items-center justify-center rounded-[18px] border border-cyan-400 bg-cyan-400/10 px-7 text-[20px] font-semibold text-cyan-200 hover:bg-cyan-400/14 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionBusy ? "Submitting..." : "Add Liquidity"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="mt-6 space-y-4">
                          <input
                            value={removeLpAmount}
                            onChange={(e) => setRemoveLpAmount(e.target.value)}
                            placeholder="LP amount"
                            className="h-16 w-full rounded-[20px] border border-white/10 bg-white/6 px-5 text-[18px] text-white outline-none placeholder:text-white/35"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveLiquidity}
                          disabled={actionBusy || !connectedAddress || !hasPosition || !removeSupported}
                          className="mt-5 inline-flex h-16 items-center justify-center rounded-[18px] border border-white/10 bg-white/8 px-7 text-[20px] font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionBusy ? "Submitting..." : "Remove Liquidity"}
                        </button>
                      </>
                    )}

                    {isProvisionalSelection ? (
                     <div className="mt-5 rounded-[18px] border border-cyan-400/18 bg-cyan-500/6 px-4 py-3 text-sm text-cyan-100/90">
                        Pending pool registration. Search token/base on this page or continue to Screener after pool activation.
                      </div>
                    ) : null}

                    {actionError ? (
                      <div className={`mt-5 ${noticeClass()}`}>
                        <div className="text-[16px] font-semibold">
                          {actionMode === "remove"
                            ? "Remove liquidity unavailable"
                            : "Liquidity action attention required"}
                        </div>
                        <div className="mt-2 text-[14px] text-amber-100/90">
                          {actionError}
                        </div>
                      </div>
                    ) : null}

                    {actionSuccess ? (
                      <div className="mt-5 rounded-[22px] border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-emerald-100">
                        <div className="text-[16px] font-semibold">Liquidity action submitted</div>
                        <div className="mt-2 text-[14px] text-emerald-100/90">
                          {actionSuccess}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-black/18 p-5">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="inline-flex h-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/8 px-5 text-[16px] font-semibold text-white hover:bg-white/10"
                      >
                        Back to Liquidity
                      </button>

                      <Link
                        href={poolHref}
                        className="inline-flex h-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/8 px-5 text-[16px] font-semibold text-white hover:bg-white/10"
                      >
                        Pool
                      </Link>

                      <Link
                        href={screenerHref}
                        className="inline-flex h-14 items-center justify-center rounded-[18px] border border-white/10 bg-transparent px-5 text-[16px] font-semibold text-white hover:bg-white/6"
                      >
                        Screener
                      </Link>

                      <Link
                        href={marketHref}
                        className="inline-flex h-14 items-center justify-center rounded-[18px] border border-white/10 bg-transparent px-5 text-[16px] font-semibold text-white hover:bg-white/6"
                      >
                        Market
                      </Link>

                      <Link
                        href={swapHref}
                        className="inline-flex h-14 items-center justify-center rounded-[18px] border border-white/10 bg-transparent px-5 text-[16px] font-semibold text-white hover:bg-white/6"
                      >
                        Swap
                      </Link>

                      <Link
                        href={RIODEX_HOME_ROUTE}
                        className="inline-flex h-14 items-center justify-center rounded-[18px] border border-white/10 bg-transparent px-5 text-[16px] font-semibold text-white hover:bg-white/6"
                      >
                        RioDex
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {loading || liquidityRouteLoading ? (
          <div className="mt-5 text-sm text-white/45">
            Loading authoritative liquidity state...
          </div>
        ) : null}

        {!loading && truthHealthy && registryLoading ? (
          <div className="mt-5 text-sm text-white/45">
            Syncing token registry labels...
          </div>
        ) : null}
      </div>
    </div>
  );
}

