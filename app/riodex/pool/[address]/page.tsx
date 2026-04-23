"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ExchangeSurfaceNav from "@/components/exchange/ExchangeSurfaceNav";
import { getKeplrSigner } from "@/lib/cosm";

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

type PairDetailResponse = {
  ok?: boolean;
  pair: PairMeta | null;
  last_swap: SwapRow | null;
  last_liquidity: LiquiditySnapshot | null;
  volume_24h?: {
    volume_offer?: string;
    volume_return?: string;
    trades?: number;
  } | null;
};

type PositionResponse = {
  ok?: boolean;
  error?: string;
  address?: string;
  pair_address?: string;
  lp_token_address?: string;
  pair_label?: string;
  asset_0_id?: string | null;
  asset_1_id?: string | null;
  asset_0_label?: string | null;
  asset_1_label?: string | null;
  wallet_lp_balance?: number;
  wallet_lp_balance_raw?: string;
  total_share?: number;
  total_share_raw?: string;
  share_ratio?: number;
  ownership_pct?: number;
  reserve_0?: number;
  reserve_0_raw?: string;
  reserve_1?: number;
  reserve_1_raw?: string;
  underlying_0?: number;
  underlying_1?: number;
  updated_at?: string;
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

const WALLET_STORAGE_KEY = "spherio_wallet_address";
const WALLET_EVENT = "spherio:wallet-changed";
const RIO_LOGO =
  "https://avatars.githubusercontent.com/u/175851528?s=400&u=b0c1a871d1e739566c4c2bf96a97720fedfc03ab&v=4";
const RUSD_LOGO =
  "https://raw.githubusercontent.com/Lerivee/RUSD/refs/heads/main/Untitled%20design.png";

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

function assetLabel(v?: string | null) {
  if (!v) return "—";
  if (v === "urio" || v === "RIO") return "RIO";
  if (v.startsWith("rio1")) return "RUSD";
  return v;
}

function assetLogo(v?: string | null) {
  const label = assetLabel(v);
  if (label === "RIO") return RIO_LOGO;
  if (label === "RUSD") return RUSD_LOGO;
  return null;
}

function canonicalDisplaySymbol(registryPair?: RegistryPair | null) {
  if (!registryPair) return null;

  const raw = String(registryPair.displaySymbol || "").trim();
  if (raw && raw.toLowerCase() !== "urio") return raw;

  const base = String(registryPair.baseSymbol || assetLabel(registryPair.baseAssetId)).trim();
  const quote = String(registryPair.quoteSymbol || assetLabel(registryPair.quoteAssetId)).trim();

  if (base && quote) return `${base} / ${quote}`;
  if (registryPair.canonicalSymbol?.trim()) {
    return registryPair.canonicalSymbol.replace("/", " / ");
  }

  return raw || null;
}

function pairDisplayLabel(pair?: PairMeta | null, registryPair?: RegistryPair | null) {
  const registryLabel = canonicalDisplaySymbol(registryPair);
  if (registryLabel) return registryLabel;

  if (!pair) return "—";

  const raw = String(pair.display_symbol || "").trim();
  if (raw && raw.toLowerCase() !== "urio") return raw;

  return `${assetLabel(pair.asset_0_id)} / ${assetLabel(pair.asset_1_id)}`;
}

function ageLabel(value?: string | null) {
  if (!value) return "—";
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / (86400 * 30))}mo`;
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

function pillClass(
  tone: "live" | "canonical" | "candidate" | "neutral" = "neutral"
) {
  if (tone === "canonical") {
    return "rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200";
  }
  if (tone === "live") {
    return "rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200";
  }
  if (tone === "candidate") {
    return "rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200";
  }
  return "rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200";
}

function shellClass() {
  return "rounded-[26px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(7,18,49,0.90),rgba(3,10,29,0.96))] shadow-[0_18px_70px_rgba(0,0,0,0.38)]";
}

function rowPillClass(active = false) {
  return active
    ? "inline-flex h-10 items-center justify-center rounded-[12px] border border-white/14 bg-white/10 px-4 text-[12px] font-semibold text-white"
    : "inline-flex h-10 items-center justify-center rounded-[12px] border border-[#243663] bg-[#18264b] px-4 text-[12px] font-medium text-white/92 hover:bg-[#1c2d58]";
}

function smallStatClass() {
  return "rounded-[18px] border border-cyan-400/14 bg-[linear-gradient(180deg,rgba(28,40,93,0.82),rgba(13,20,54,0.94))] p-4";
}

function panelBoxClass() {
  return "rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,14,38,0.98),rgba(4,10,28,0.98))] p-4";
}

function darkChipClass() {
  return "rounded-[12px] border border-white/10 bg-white/8 px-3 py-2 text-[11px] font-medium text-white/82";
}

function statLabelClass() {
  return "text-[10px] uppercase tracking-[0.16em] text-slate-500";
}

function tokenCardClass() {
  return "rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(4,10,28,0.98),rgba(2,7,20,0.98))] p-4";
}

function detailStatCardClass() {
  return "rounded-[16px] border border-cyan-400/14 bg-[linear-gradient(180deg,rgba(28,40,93,0.82),rgba(13,20,54,0.94))] p-4";
}

function getPromotionStatus(pair: PairMeta | null, registryPair: RegistryPair | null) {
  if (registryPair?.isCanonical || pair?.is_canonical) {
    return { label: "Canonical", tone: "canonical" as const };
  }
  if (registryPair?.isLive || pair?.is_live) {
    return { label: "Live", tone: "live" as const };
  }
  return { label: "Indexed", tone: "candidate" as const };
}

function buildSyntheticPairFromRegistry(registryPair: RegistryPair): PairMeta {
  return {
    pair_address: registryPair.pairAddress,
    display_symbol: canonicalDisplaySymbol(registryPair),
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

function derive24hVolume(detailRes?: PairDetailResponse | null, swaps: SwapRow[] = []) {
  const direct =
    fromBaseUnits(detailRes?.volume_24h?.volume_return) ||
    fromBaseUnits(detailRes?.volume_24h?.volume_offer);

  if (direct > 0) return direct;

  return swaps.reduce((sum, swap) => {
    return sum + (fromBaseUnits(swap.return_amount) || fromBaseUnits(swap.offer_amount));
  }, 0);
}

function pickLatestLiquidity(
  detailRes?: PairDetailResponse | null,
  snapshots: LiquiditySnapshot[] = []
) {
  if (detailRes?.last_liquidity) return detailRes.last_liquidity;
  if (!snapshots.length) return null;

  return [...snapshots].sort((a, b) => {
    const at = a.block_time ? new Date(a.block_time).getTime() : 0;
    const bt = b.block_time ? new Date(b.block_time).getTime() : 0;
    return bt - at;
  })[0];
}

function RecentActivityCard({ swap }: { swap: SwapRow }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-black/18 p-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center -space-x-2">
          <img src={assetLogo(swap.offer_asset_id) || RIO_LOGO} alt="" className="h-5 w-5 rounded-full border border-black bg-black object-cover" />
          <img src={assetLogo(swap.ask_asset_id) || RUSD_LOGO} alt="" className="h-5 w-5 rounded-full border border-black bg-black object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold text-white">
            {assetLabel(swap.offer_asset_id)} — {assetLabel(swap.ask_asset_id)}
          </div>
          <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] text-slate-400">
            <span>Input</span>
            <span className="text-right text-white/85">{formatNum(fromBaseUnits(swap.offer_amount), 4)}</span>
            <span>Output</span>
            <span className="text-right text-white/85">{formatNum(fromBaseUnits(swap.return_amount), 4)}</span>
            <span>Fee</span>
            <span className="text-right text-white/85">{formatNum(fromBaseUnits(swap.commission_amount), 4)}</span>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-400">
          {formatDateTime(swap.block_time)}
        </div>
      </div>
    </div>
  );
}

export default function RioDexPoolPage() {
  const params = useParams<{ address: string }>();
  const pairAddress = useMemo(() => String(params?.address ?? "").trim(), [params]);

  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const [pair, setPair] = useState<PairMeta | null>(null);
  const [registryPair, setRegistryPair] = useState<RegistryPair | null>(null);
  const [latestSwap, setLatestSwap] = useState<SwapRow | null>(null);
  const [latestLiquidity, setLatestLiquidity] = useState<LiquiditySnapshot | null>(null);
  const [recentSwaps, setRecentSwaps] = useState<SwapRow[]>([]);
  const [volume24h, setVolume24h] = useState(0);
  const [loading, setLoading] = useState(true);
  const [poolError, setPoolError] = useState<string | null>(null);

  const [position, setPosition] = useState<PositionResponse | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);
  const [positionError, setPositionError] = useState<string | null>(null);

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

  async function refreshPool() {
    if (!pairAddress) return;

    try {
      setLoading(true);
      setPoolError(null);

      const [registryRes, detailRes, liquidityRes, swapsRes] = await Promise.all([
        fetchJson<RegistryPairResponse>(
          `/api/rioex/markets/${encodeURIComponent(pairAddress)}`
        ).catch(() => ({ pair: null, item: null }) as RegistryPairResponse),

        fetchJson<PairDetailResponse>(
          `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}`
        ).catch(() => null),

        fetchJson<{ ok?: boolean; liquidity?: LiquiditySnapshot[] }>(
          `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/liquidity?limit=40`
        ).catch(() => ({ liquidity: [] })),

        fetchJson<{ ok?: boolean; swaps?: SwapRow[] }>(
          `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/swaps?limit=8`
        ).catch(() => ({ swaps: [] })),
      ]);

      const resolvedRegistryPair = registryRes?.pair || registryRes?.item || null;
      const resolvedPair =
        detailRes?.pair ||
        (resolvedRegistryPair ? buildSyntheticPairFromRegistry(resolvedRegistryPair) : null);

      const resolvedRecentSwaps = swapsRes?.swaps || [];
      const resolvedLatestSwap = detailRes?.last_swap || resolvedRecentSwaps[0] || null;
      const resolvedLatestLiquidity = pickLatestLiquidity(
        detailRes,
        liquidityRes?.liquidity || []
      );
      const resolvedVolume24h = derive24hVolume(detailRes, resolvedRecentSwaps);

      setRegistryPair(resolvedRegistryPair);
      setPair(resolvedPair);
      setLatestSwap(resolvedLatestSwap);
      setLatestLiquidity(resolvedLatestLiquidity);
      setRecentSwaps(resolvedRecentSwaps);
      setVolume24h(resolvedVolume24h);

      if (!resolvedPair && !resolvedRegistryPair) {
        setPoolError("Pool not found in authoritative pair registry.");
      } else if (!detailRes?.pair) {
        setPoolError(null);
      }
    } catch (error: any) {
      console.error("Failed to load RioDex pool page data", error);
      setPoolError(error?.message || "Failed to load pool");
      setPair(null);
      setRegistryPair(null);
      setLatestSwap(null);
      setLatestLiquidity(null);
      setRecentSwaps([]);
      setVolume24h(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshPool();
  }, [pairAddress]);

  useEffect(() => {
    let active = true;

    async function loadPosition() {
      if (!connectedAddress || !pairAddress) {
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

        const res = await fetchJson<PositionResponse>(
          `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/position?address=${encodeURIComponent(connectedAddress)}`
        );

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

    void loadPosition();

    return () => {
      active = false;
    };
  }, [connectedAddress, pairAddress]);

  async function handleConnect() {
    try {
      setConnecting(true);
      const { address } = await getKeplrSigner();
      setConnectedAddress(address);
      writeStoredWalletAddress(address);
    } catch (e: any) {
      console.error("Pool wallet connect failed", e);
      alert(e?.message || "Failed to connect Keplr");
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setConnectedAddress(null);
    writeStoredWalletAddress(null);
    setPosition(null);
  }

  const effectivePair =
    pair || (registryPair ? buildSyntheticPairFromRegistry(registryPair) : null);

  const pairLabel = pairDisplayLabel(effectivePair, registryPair);
  const reserve0 = latestLiquidity ? fromBaseUnits(latestLiquidity.reserve_0) : 0;
  const reserve1 = latestLiquidity ? fromBaseUnits(latestLiquidity.reserve_1) : 0;
  const totalShare = latestLiquidity ? fromBaseUnits(latestLiquidity.total_share) : 0;
  const reservePrice = reserve0 > 0 ? reserve1 / reserve0 : null;
  const latestTradePrice =
    latestSwap?.effective_price !== null && latestSwap?.effective_price !== undefined
      ? Number(latestSwap.effective_price)
      : null;
  const promotion = getPromotionStatus(effectivePair, registryPair);

  const swapHref =
    registryPair?.routes?.swap ||
    `/riodex/swap?pair=${encodeURIComponent(pairAddress)}&pool=${encodeURIComponent(pairAddress)}`;
  const liquidityHref =
    registryPair?.routes?.liquidity ||
    `/riodex/liquidity?pool=${encodeURIComponent(pairAddress)}`;
  const poolHref =
    registryPair?.routes?.pool || `/riodex/pool/${encodeURIComponent(pairAddress)}`;
  const assetTerminalHref =
    registryPair?.routes?.assetTerminal || `/rioex/markets/${encodeURIComponent(pairAddress)}`;
  const liquidityAddHref = liquidityHref;
  const liquidityRemoveHref = liquidityHref;
  const terminalHref =
    registryPair?.routes?.assetTerminal ||
    `/rioex/markets/${encodeURIComponent(pairAddress)}/trades`;
  const screenerHref = registryPair?.routes?.marketBoard || "/rioex/markets";
  const marketHref = "/rioex/markets";
  const homeHref = "/riodex";
  const explorerHref = "/rioexplorer";

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_15%_10%,rgba(164,114,255,0.24),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(255,205,127,0.08),transparent_18%),radial-gradient(circle_at_30%_38%,rgba(118,63,255,0.09),transparent_28%),linear-gradient(180deg,#06070E_0%,#090B12_44%,#05070D_100%)] text-white">
        <div className="mx-auto max-w-[1120px] px-6 pb-12 pt-8">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
            Loading pool...
          </div>
        </div>
      </div>
    );
  }

  if (!effectivePair && !registryPair) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_15%_10%,rgba(164,114,255,0.24),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(255,205,127,0.08),transparent_18%),radial-gradient(circle_at_30%_38%,rgba(118,63,255,0.09),transparent_28%),linear-gradient(180deg,#06070E_0%,#090B12_44%,#05070D_100%)] text-white">
        <div className="mx-auto max-w-[1120px] px-6 pb-12 pt-8">
          <div className="flex flex-wrap gap-3">
            <Link href={homeHref} className={rowPillClass(false)}>Back to RioDex</Link>
            <Link href={screenerHref} className={rowPillClass(false)}>Back to Screener</Link>
          </div>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
            <h1 className="text-xl font-semibold">Pool not found</h1>
            <p className="mt-2 break-all font-mono text-sm text-slate-300">{pairAddress}</p>
            {poolError ? <p className="mt-3 text-sm text-slate-400">{poolError}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  const livePair = effectivePair!;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_15%_10%,rgba(164,114,255,0.24),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(255,205,127,0.08),transparent_18%),radial-gradient(circle_at_30%_38%,rgba(118,63,255,0.09),transparent_28%),linear-gradient(180deg,#06070E_0%,#090B12_44%,#05070D_100%)] text-white">
      <div className="mx-auto max-w-[1120px] px-6 pb-12 pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={pillClass("candidate")}>RioDex</span>
              <span className={pillClass("neutral")}>Pool</span>
              {(registryPair?.isLive || livePair.is_live) ? <span className={pillClass("live")}>Live</span> : null}
              {(registryPair?.isCanonical || livePair.is_canonical) ? (
                <span className={pillClass("canonical")}>Canonical</span>
              ) : null}
            </div>

            <h1 className="mt-4 text-[56px] font-semibold leading-none tracking-tight text-cyan-300">
              Pool
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Single-pair truth surface for reserves, price, liquidity, wallet position, and authoritative pool routing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:w-[320px]">
            <div className={smallStatClass()}>
              <div className={statLabelClass()}>Reserve Price</div>
              <div className="mt-2 text-[30px] font-semibold text-white">
                {reservePrice !== null ? formatNum(reservePrice, 4) : "—"}
              </div>
            </div>
            <div className={smallStatClass()}>
              <div className={statLabelClass()}>24h Volume</div>
              <div className="mt-2 text-[30px] font-semibold text-white">
                {formatNum(volume24h, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ExchangeSurfaceNav
            product="riodex"
            activeKey="pool"
            featured={registryPair ? {
              displaySymbol: canonicalDisplaySymbol(registryPair) || registryPair.displaySymbol,
              liquidityUsd: registryPair.liquidityUsd,
              feeBps: registryPair.feeBps,
              isCanonical: registryPair.isCanonical,
              isLive: registryPair.isLive,
              routes: registryPair.routes,
            } : {
              displaySymbol: pairLabel,
              liquidityUsd: 0,
              feeBps: livePair.fee_bps ?? null,
              isCanonical: livePair.is_canonical,
              isLive: livePair.is_live,
              routes: {
                assetTerminal: assetTerminalHref,
                marketBoard: screenerHref,
                hero: marketHref,
                pool: poolHref,
                swap: swapHref,
                liquidity: liquidityHref,
              },
            }}
            title="RioDex Pool Surfaces"
            subtitle="Shared horizontal routing now sits above Pool so pair identity, registry liquidity, treasury policy, and surface handoff remain consistent with Swap, Liquidity, Screener, and RioEx Markets."
          />
        </div>

        <div className="mt-4 rounded-[22px] border border-cyan-400/16 bg-cyan-500/6 px-5 py-4 text-sm text-white/85">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Integrity Truth
            </span>
            {(registryPair?.isCanonical || livePair?.is_canonical) ? (
              <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
                Canonical
              </span>
            ) : null}
            {(registryPair?.isLive || livePair?.is_live) ? (
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Live
              </span>
            ) : null}
          </div>
          <div className="mt-3 grid gap-2 text-sm text-white/75 sm:grid-cols-2 xl:grid-cols-4">
            <div>Registry Liquidity: <span className="font-semibold text-white">{formatUsd(registryPair?.liquidityUsd || 0)}</span></div>
            <div>Liquidity Source: <span className="font-semibold text-white">{registryPair?.liquiditySource || "unresolved"}</span></div>
            <div>Fee Policy: <span className="font-semibold text-white">{registryPair?.feePolicy || "—"}</span></div>
            <div>Treasury Recipient: <span className="font-semibold text-white">{shortAddr(registryPair?.feeRecipientAddress, 12, 10)}</span></div>
          </div>
          <div className="mt-2 text-xs text-white/50">
            Last registry update: {formatDateTime(registryPair?.liquidityUpdatedAt || registryPair?.lastSwapTime || latestLiquidity?.block_time || null)}
          </div>
        </div>

        <div className="mt-6">
          <div className={shellClass()}>
            {poolError ? (
              <div className="px-4 pt-4">
                <div className="rounded-[18px] border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  {poolError}
                </div>
              </div>
            ) : null}

            <div className="p-4 md:p-5">
              <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
                <div className="space-y-4">
                  <div className={panelBoxClass()}>
                    <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
                      <div className={tokenCardClass()}>
                        <div className="flex items-start gap-4">
                          <div className="flex items-center -space-x-2">
                            <img src={registryPair?.baseLogoUrl || assetLogo(livePair.asset_0_id) || RIO_LOGO} alt="" className="h-10 w-10 rounded-full border border-black bg-black object-cover" />
                            <img src={registryPair?.quoteLogoUrl || assetLogo(livePair.asset_1_id) || RUSD_LOGO} alt="" className="h-10 w-10 rounded-full border border-black bg-black object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[26px] font-semibold text-white">{pairLabel}</div>
                            <div className="mt-1 text-[11px] text-slate-400">{shortAddr(pairAddress, 10, 8)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className={detailStatCardClass()}>
                          <div className={statLabelClass()}>RIO</div>
                          <div className="mt-2 text-[20px] font-semibold leading-tight tracking-tight text-white">{formatNum(reserve0, 0)}</div>
                        </div>
                        <div className={detailStatCardClass()}>
                          <div className={statLabelClass()}>RUSD</div>
                          <div className="mt-2 text-[20px] font-semibold leading-tight tracking-tight text-white">{formatNum(reserve1, 0)}</div>
                        </div>
                        <div className={detailStatCardClass()}>
                          <div className={statLabelClass()}>Last Liquidity</div>
                          <div className="mt-2 text-[18px] font-semibold text-white">
                            {latestLiquidity ? formatDateTime(latestLiquidity.block_time) : "—"}
                          </div>
                        </div>
                        <div className={detailStatCardClass()}>
                          <div className={statLabelClass()}>Latest Trade</div>
                          <div className="mt-2 text-[18px] font-semibold text-white">
                            {latestTradePrice !== null ? formatNum(latestTradePrice, 4) : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={panelBoxClass()}>
                    <div className="text-[24px] font-semibold text-white">Wallet Position</div>

                    {positionLoading ? (
                      <div className="mt-4 rounded-[14px] border border-white/10 bg-[rgba(255,198,74,0.06)] px-4 py-3 text-sm text-slate-200">
                        Loading wallet position...
                      </div>
                    ) : positionError ? (
                      <div className="mt-4 rounded-[14px] border border-amber-300/20 bg-[rgba(255,198,74,0.06)] px-4 py-3 text-sm text-amber-100">
                        {positionError}
                      </div>
                    ) : !connectedAddress ? (
                      <div className="mt-4 rounded-[14px] border border-amber-300/20 bg-[rgba(255,198,74,0.06)] px-4 py-3 text-sm text-amber-100">
                        address is required
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className={detailStatCardClass()}>
                          <div className={statLabelClass()}>LP Balance</div>
                          <div className="mt-2 text-[22px] font-semibold text-white">
                            {formatNum(Number(position?.wallet_lp_balance || 0), 4)}
                          </div>
                        </div>
                        <div className={detailStatCardClass()}>
                          <div className={statLabelClass()}>Ownership</div>
                          <div className="mt-2 text-[22px] font-semibold text-white">
                            {formatNum(Number(position?.ownership_pct || 0), 4)}%
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 rounded-[14px] border border-white/10 bg-black/12 p-3 text-[11px] text-slate-300">
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/78">
                        Integrity Truth
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className={darkChipClass()}>
                          Registry Liquidity: <span className="font-semibold text-white">{formatUsd(registryPair?.liquidityUsd || 0)}</span>
                        </div>
                        <div className={darkChipClass()}>
                          Liquidity Source: {registryPair?.liquiditySource || "unresolved"}
                        </div>
                        <div className={darkChipClass()}>
                          Treasury Policy: {registryPair?.feePolicy || "—"}
                        </div>
                        <div className={darkChipClass()}>
                          Treasury Recipient: {shortAddr(registryPair?.feeRecipientAddress, 12, 10)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={panelBoxClass()}>
                    <div className="grid gap-3">
                      {connectedAddress ? (
                        <button
                          onClick={handleDisconnect}
                          className="w-full rounded-[14px] border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
                        >
                          Disconnect Wallet
                        </button>
                      ) : (
                        <button
                          onClick={handleConnect}
                          disabled={connecting}
                          className="w-full rounded-[14px] border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {connecting ? "Connecting..." : "Connect Wallet"}
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href={liquidityAddHref}
                          className="flex h-12 items-center justify-center rounded-[14px] border border-cyan-400 bg-cyan-400/8 px-4 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/12"
                        >
                          Add Liquidity
                        </Link>
                        <Link
                          href={liquidityRemoveHref}
                          className="flex h-12 items-center justify-center rounded-[14px] border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15"
                        >
                          Remove Liquidity
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className={detailStatCardClass()}>
                          <div className={statLabelClass()}>Fee Tier</div>
                          <div className="mt-2 text-[24px] font-semibold text-white">
                            {registryPair?.feeBps ?? livePair.fee_bps ?? 0} bps
                          </div>
                        </div>
                        <div className={detailStatCardClass()}>
                          <div className={statLabelClass()}>LP Supply</div>
                          <div className="mt-2 text-[24px] font-semibold text-white">
                            {formatNum(totalShare, 3)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={panelBoxClass()}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">Advanced</div>
                      <span className={pillClass("neutral")}>{promotion.label}</span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className={tokenCardClass()}>
                        <div className={statLabelClass()}>Pair Address</div>
                        <div className="mt-2 font-mono text-xs text-white/88">
                          {shortAddr(pairAddress, 12, 10)}
                        </div>
                      </div>
                      <div className={tokenCardClass()}>
                        <div className={statLabelClass()}>LP Token</div>
                        <div className="mt-2 font-mono text-xs text-white/88">
                          {livePair.lp_token_address ? shortAddr(livePair.lp_token_address, 12, 10) : "—"}
                        </div>
                      </div>
                      <div className={tokenCardClass()}>
                        <div className={statLabelClass()}>Factory</div>
                        <div className="mt-2 font-mono text-xs text-white/88">
                          {livePair.factory_address ? shortAddr(livePair.factory_address, 12, 10) : "—"}
                        </div>
                      </div>
                      <div className={tokenCardClass()}>
                        <div className={statLabelClass()}>Pool Age</div>
                        <div className="mt-2 text-base font-semibold text-white">
                          {ageLabel(livePair.created_time)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Link href={swapHref} className="flex h-12 items-center justify-center rounded-[14px] border border-[#243663] bg-[#18264b] px-4 text-sm font-medium text-white/92 hover:bg-[#1c2d58]">
                        Open Swap
                      </Link>
                      <Link href={terminalHref} className="flex h-12 items-center justify-center rounded-[14px] border border-[#243663] bg-[#18264b] px-4 text-sm font-medium text-white/92 hover:bg-[#1c2d58]">
                        Open RioEx Terminal
                      </Link>
                      <Link href={assetTerminalHref} className="flex h-12 items-center justify-center rounded-[14px] border border-[#243663] bg-[#18264b] px-4 text-sm font-medium text-white/92 hover:bg-[#1c2d58]">
                        Open Market View
                      </Link>
                      <Link href={explorerHref} className="flex h-12 items-center justify-center rounded-[14px] border border-[#243663] bg-[#18264b] px-4 text-sm font-medium text-white/92 hover:bg-[#1c2d58]">
                        Open Explorer
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className={panelBoxClass()}>
                  <div className="text-[24px] font-semibold text-white">Recent Activity</div>
                  {recentSwaps.length ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {recentSwaps.slice(0, 6).map((swap) => (
                        <RecentActivityCard key={swap.tx_hash} swap={swap} />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[16px] border border-white/10 bg-black/18 p-4 text-sm text-slate-300">
                      No recent activity loaded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
