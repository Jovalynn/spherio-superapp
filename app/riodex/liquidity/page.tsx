"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

const WALLET_STORAGE_KEY = "spherio_wallet_address";
const WALLET_EVENT = "spherio:wallet-changed";
const CANONICAL_PAIR_ADDR =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";

function formatInt(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatNum(value: number, max = 6) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
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

function cardClass(
  variant: "liquidity" | "market" | "neutral" | "hero" = "neutral"
) {
  if (variant === "liquidity") {
    return "rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(72,201,255,0.16),transparent_32%),linear-gradient(180deg,rgba(8,19,28,0.96),rgba(7,11,23,0.96))] p-6 shadow-[0_20px_70px_rgba(29,121,190,0.14)] backdrop-blur-2xl";
  }
  if (variant === "market") {
    return "rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(255,181,72,0.16),transparent_32%),linear-gradient(180deg,rgba(18,15,18,0.96),rgba(9,11,18,0.96))] p-6 shadow-[0_20px_70px_rgba(190,121,29,0.12)] backdrop-blur-2xl";
  }
  if (variant === "hero") {
    return "rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(74,222,255,0.18),transparent_30%),linear-gradient(180deg,rgba(8,20,30,0.96),rgba(7,11,23,0.96))] p-6 shadow-[0_20px_80px_rgba(20,120,170,0.18)] backdrop-blur-2xl";
  }
  return "rounded-[30px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl";
}

function pillClass(tone: "live" | "canonical" | "liquidity" | "pending" = "live") {
  if (tone === "canonical") {
    return "rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200";
  }
  if (tone === "liquidity") {
    return "rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200";
  }
  if (tone === "pending") {
    return "rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200";
  }
  return "rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200";
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

export default function RioDexLiquidityPage() {
  const searchParams = useSearchParams();
  const poolFromQuery = searchParams.get("pair") || searchParams.get("pool") || "";
  const pairAddress = poolFromQuery || CANONICAL_PAIR_ADDR;

  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const [pair, setPair] = useState<PairMeta | null>(null);
  const [liquidityHistory, setLiquidityHistory] = useState<LiquiditySnapshot[]>([]);
  const [recentSwaps, setRecentSwaps] = useState<SwapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketError, setMarketError] = useState<string | null>(null);

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
    let active = true;

    async function loadMarket() {
      try {
        setLoading(true);
        setMarketError(null);

        const [pairsRes, liquidityRes, swapsRes] = await Promise.all([
          fetchJson<{ ok?: boolean; pairs?: PairMeta[] }>("/api/v1/riodex/pairs"),
          fetchJson<{ ok?: boolean; liquidity?: LiquiditySnapshot[] }>(
            `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/liquidity?limit=40`
          ),
          fetchJson<{ ok?: boolean; swaps?: SwapRow[] }>(
            `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/swaps?limit=8`
          ),
        ]);

        if (!active) return;

        const matchedPair =
          pairsRes?.pairs?.find((p) => p.pair_address === pairAddress) || null;

        setPair(matchedPair);
        setLiquidityHistory(liquidityRes?.liquidity || []);
        setRecentSwaps(swapsRes?.swaps || []);
      } catch (error: any) {
        if (!active) return;
        console.error("Failed to load RioDex liquidity page data", error);
        setMarketError(error?.message || "Failed to load RioDex liquidity state");
        setPair(null);
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
  }, [pairAddress]);

  async function handleConnect() {
    try {
      setConnecting(true);
      const { address } = await getKeplrSigner();
      setConnectedAddress(address);
      writeStoredWalletAddress(address);
    } catch (e: any) {
      console.error("Liquidity wallet connect failed", e);
      alert(e?.message || "Failed to connect Keplr");
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setConnectedAddress(null);
    writeStoredWalletAddress(null);
  }

  const latestLiquidity = liquidityHistory[0] || null;
  const latestSwap = recentSwaps[0] || null;

  const reserve0 = latestLiquidity ? fromBaseUnits(latestLiquidity.reserve_0) : 0;
  const reserve1 = latestLiquidity ? fromBaseUnits(latestLiquidity.reserve_1) : 0;
  const totalShare = latestLiquidity ? fromBaseUnits(latestLiquidity.total_share) : 0;

  const marketLabel =
    pair && pair.asset_0_id && pair.asset_1_id
      ? `${assetLabel(pair.asset_0_id)} / ${assetLabel(pair.asset_1_id)}`
      : "RIO / RUSD";

  const reservePrice =
    reserve0 > 0 && reserve1 > 0 ? reserve0 / reserve1 : null;

  const latestPrice =
    latestSwap?.effective_price !== null && latestSwap?.effective_price !== undefined
      ? Number(latestSwap.effective_price)
      : null;

  const totalSnapshots = liquidityHistory.length;

  const reserveChange = useMemo(() => {
    if (liquidityHistory.length < 2) return null;

    const current = liquidityHistory[0];
    const previous = liquidityHistory[1];

    const currentR0 = fromBaseUnits(current.reserve_0);
    const currentR1 = fromBaseUnits(current.reserve_1);
    const prevR0 = fromBaseUnits(previous.reserve_0);
    const prevR1 = fromBaseUnits(previous.reserve_1);

    return {
      delta0: currentR0 - prevR0,
      delta1: currentR1 - prevR1,
    };
  }, [liquidityHistory]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_top_left,rgba(72,201,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,166,76,0.10),transparent_24%),linear-gradient(180deg,#060B16_0%,#07101C_52%,#060B16_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 pb-14 pt-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={pillClass("liquidity")}>RioDex</span>
              <span className={pillClass("canonical")}>Liquidity</span>
              {pair?.is_live ? <span className={pillClass("live")}>Live</span> : null}
            </div>

            <div className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
              Sovereign Liquidity Console
            </div>
            <div className="mt-2 text-4xl font-semibold tracking-tight text-white">
              Liquidity Terminal
            </div>
            <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Reserve-backed liquidity console for the canonical RioDex pool: current
              reserves, LP share state, snapshot history, recent swap linkage, and wallet-aware
              provisioning posture.
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/riodex"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Back to RioDex
            </Link>
            <Link
              href="/riodex/markets"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Markets
            </Link>
            <Link
              href="/riodex/swap"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Swap
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className={cardClass("hero")}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Market</div>
            <div className="mt-2 text-2xl font-semibold text-white">{marketLabel}</div>
            <div className="mt-2 text-sm text-slate-300">Canonical pool context</div>
          </div>

          <div className={cardClass("liquidity")}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Reserve Price</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {reservePrice !== null ? `${formatNum(reservePrice, 6)} RIO / RUSD` : loading ? "Loading..." : "—"}
            </div>
            <div className="mt-2 text-sm text-slate-300">Derived from current pool reserves</div>
          </div>

          <div className={cardClass("market")}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Latest Trade</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {latestPrice !== null ? `${formatNum(latestPrice, 6)} RIO / RUSD` : loading ? "Loading..." : "—"}
            </div>
            <div className="mt-2 text-sm text-slate-300">
              {latestSwap ? formatDateTime(latestSwap.block_time) : "Awaiting recent trade"}
            </div>
          </div>

          <div className={cardClass("neutral")}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Snapshots</div>
            <div className="mt-2 text-2xl font-semibold text-white">{formatInt(totalSnapshots)}</div>
            <div className="mt-2 text-sm text-slate-300">Indexed liquidity history rows</div>
          </div>
        </div>

        {marketError ? (
          <div className="mt-6 rounded-[24px] border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="font-semibold">Liquidity feed attention required</div>
            <div className="mt-2">{marketError}</div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className={cardClass("liquidity")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Current Pool State</div>
                <div className="mt-1 text-xs text-slate-400">
                  Live reserve state and share structure for the canonical liquidity venue.
                </div>
              </div>
              <span className={pillClass("canonical")}>Reserve Truth</span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  {assetLabel(pair?.asset_0_id)}
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {latestLiquidity ? `${formatNum(reserve0)} ${assetLabel(pair?.asset_0_id)}` : loading ? "Loading..." : "—"}
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  {assetLabel(pair?.asset_1_id)}
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {latestLiquidity ? `${formatNum(reserve1)} ${assetLabel(pair?.asset_1_id)}` : loading ? "Loading..." : "—"}
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Total LP Share
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {latestLiquidity ? formatNum(totalShare) : loading ? "Loading..." : "—"}
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Last Snapshot
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {latestLiquidity ? formatDateTime(latestLiquidity.block_time) : loading ? "Loading..." : "—"}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Reserve Delta</div>
                {reserveChange ? (
                  <div className="mt-2 space-y-1">
                    <div>{assetLabel(pair?.asset_0_id)}: {formatNum(reserveChange.delta0)}</div>
                    <div>{assetLabel(pair?.asset_1_id)}: {formatNum(reserveChange.delta1)}</div>
                  </div>
                ) : (
                  <div className="mt-2 text-slate-400">Need at least two snapshots</div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Pair Reference</div>
                <div className="mt-2 space-y-1">
                  <div className="font-semibold text-white">{marketLabel}</div>
                  <div className="font-mono text-xs text-slate-400">{shortAddr(pairAddress, 14, 12)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={cardClass("market")}>
              <div className="text-sm font-semibold text-white">Provisioning Path</div>

              <div className="mt-5 space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-200">
                  This is the canonical liquidity surface for RioDex pool operations, LP visibility,
                  reserve-backed market context, and wallet-aware provisioning posture.
                </div>

                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-200">
                  {latestLiquidity
                    ? `The current pool state holds ${formatNum(reserve0)} ${assetLabel(
                        pair?.asset_0_id
                      )} and ${formatNum(reserve1)} ${assetLabel(
                        pair?.asset_1_id
                      )}. Total share is ${formatNum(totalShare)} and the reserve-derived reference price is ${
                        reservePrice !== null ? formatNum(reservePrice, 6) : "—"
                      } RIO / RUSD.`
                    : loading
                      ? "Loading canonical liquidity state..."
                      : "Canonical liquidity state unavailable."}
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(35,92,110,0.22),rgba(12,14,20,0.92))] p-4 text-sm leading-7 text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-400">Pair</span>
                    <span>{marketLabel}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-slate-400">Pool context</span>
                    <span className="font-mono text-xs">{shortAddr(pairAddress, 12, 10)}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-slate-400">Connected wallet</span>
                    <span className="font-mono text-xs">
                      {connectedAddress ? shortAddr(connectedAddress, 12, 10) : "Not connected"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-slate-400">Latest trade</span>
                    <span>
                      {latestPrice !== null ? `${formatNum(latestPrice, 6)} RIO / RUSD` : "—"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-slate-400">Factory</span>
                    <span className="font-mono text-xs">
                      {pair?.factory_address ? shortAddr(pair.factory_address, 12, 10) : "—"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-slate-400">LP token</span>
                    <span className="font-mono text-xs">
                      {pair?.lp_token_address ? shortAddr(pair.lp_token_address, 12, 10) : "—"}
                    </span>
                  </div>
                </div>

                {connectedAddress ? (
                  <button
                    onClick={handleDisconnect}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
                  >
                    Disconnect Wallet
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="w-full rounded-2xl border border-sky-400/20 bg-[linear-gradient(180deg,rgba(37,116,145,0.92),rgba(23,74,104,0.96))] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {connecting ? "Connecting..." : "Connect Wallet"}
                  </button>
                )}

                <button
                  disabled={!connectedAddress}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add / Remove Liquidity Wiring Next
                </button>
              </div>
            </div>

            <div className={cardClass("neutral")}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Reserve History</div>
                <span className={pillClass("liquidity")}>Snapshots</span>
              </div>

              {liquidityHistory.length ? (
                <div className="mt-4 space-y-3">
                  {liquidityHistory.slice(0, 6).map((snap, idx) => (
                    <div
                      key={`${snap.block_height}-${idx}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">
                          Snapshot #{idx + 1}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDateTime(snap.block_time)}
                        </div>
                      </div>

                      <div className="mt-2 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">{assetLabel(pair?.asset_0_id)}</span>
                          <span>{formatNum(fromBaseUnits(snap.reserve_0))}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">{assetLabel(pair?.asset_1_id)}</span>
                          <span>{formatNum(fromBaseUnits(snap.reserve_1))}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">LP Share</span>
                          <span>{formatNum(fromBaseUnits(snap.total_share))}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Height</span>
                          <span>{snap.block_height}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                  No liquidity history loaded yet.
                </div>
              )}
            </div>

            <div className={cardClass("neutral")}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Recent Swap Linkage</div>
                <span className={pillClass("pending")}>Tape</span>
              </div>

              {recentSwaps.length ? (
                <div className="mt-4 space-y-3">
                  {recentSwaps.slice(0, 4).map((swap) => (
                    <div
                      key={swap.tx_hash}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">
                          {assetLabel(swap.offer_asset_id)} → {assetLabel(swap.ask_asset_id)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDateTime(swap.block_time)}
                        </div>
                      </div>

                      <div className="mt-2 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Input</span>
                          <span>{formatNum(fromBaseUnits(swap.offer_amount))}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Output</span>
                          <span>{formatNum(fromBaseUnits(swap.return_amount))}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Price</span>
                          <span>{swap.effective_price ? formatNum(Number(swap.effective_price), 6) : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Fee</span>
                          <span>{formatNum(fromBaseUnits(swap.commission_amount))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                  No recent swap linkage loaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
