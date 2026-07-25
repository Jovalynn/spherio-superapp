"use client";

import { RioValuationBadge } from "@/components/riolight/RioValuationBadge";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { connectRioLight } from "@/lib/riolight";
import { executeSpherioRioLightAction } from "@/lib/riolight/execution";
import {
  createRioLightGlobalHandoverIntent,
  rioLightExplorerProofHref,
} from "@/lib/riolight/handover";
import {
  getLiquidityIntelligence,
  normalizeLiquiditySource,
} from "@/lib/riodex/liquidity-intelligence";

type PoolTruthRecord = {
  pairAddress: string;
  pairLabel: string;
  baseAsset: { symbol: string };
  quoteAsset: { symbol: string };
  pool: {
    feeBps: number;
    lpTokenAddress: string | null;
    totalShareDisplay: number | null;
  };
  reserves: {
    baseDisplay: number;
    quoteDisplay: number;
  };
  valuation: {
    tvlRusd: number;
    source: string;
    note: string;
  };
  treasury: {
    recipient: string;
    feePolicy: string;
    confirmedOnChain: boolean;
  };
  capabilities?: Record<string, "live" | "pending" | "hidden">;
  launchContext: {
    source: string;
    graduationSeedRusdEquivalent: number | null;
    note: string | null;
  };
};

type PoolTruthResponse = {
  ok?: boolean;
  truth?: PoolTruthRecord;
  error?: string;
};

function formatUsd(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNum(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(Number(value || 0));
}

function shortAddr(value?: string | null) {
  const v = String(value || "");
  if (!v) return "—";
  if (v.length <= 18) return v;
  return `${v.slice(0, 10)}…${v.slice(-8)}`;
}

const WALLET_STORAGE_KEY = "spherio_wallet_address";
const WALLET_EVENT = "spherio:wallet-changed";

function readStoredWalletAddress() {
  if (typeof window === "undefined") return "";

  const candidates = [
    WALLET_STORAGE_KEY,
    "spherio_wallet_address",
    "riolight.activeAddress",
    "spherio.activeAddress",
    "spherio.connectedAddress",
    "wallet.activeAddress",
  ];

  for (const key of candidates) {
    const value = String(window.localStorage.getItem(key) || "").trim();
    if (value) return value;
  }

  return "";
}

function dispatchWalletChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WALLET_EVENT));
}

export default function LiquidityActionPage() {
  const searchParams = useSearchParams();

  const pool = String(searchParams.get("pool") || "").trim();
  const mode = String(searchParams.get("mode") || "add").trim();
  const source = String(searchParams.get("source") || "").trim();

  const [truth, setTruth] = useState<PoolTruthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState("");
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [walletNotice, setWalletNotice] = useState<string | null>(null);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);
  const [broadcastBusy, setBroadcastBusy] = useState(false);
  const [baseAmount, setBaseAmount] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTruth() {
      if (!pool) {
        setError("Missing pool address.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/riodex/pools/truth?pair=${encodeURIComponent(pool)}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as PoolTruthResponse;

        if (!res.ok || json.ok === false || !json.truth) {
          throw new Error(json.error || "Failed to load Pool Truth.");
        }

        if (!cancelled) setTruth(json.truth);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Pool Truth.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTruth();

    return () => {
      cancelled = true;
    };
  }, [pool]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setConnectedAddress(readStoredWalletAddress());

    function onStorage(event: StorageEvent) {
      if (
        event.key === WALLET_STORAGE_KEY ||
        event.key === "spherio_wallet_address" ||
        event.key === "riolight.activeAddress" ||
        event.key === "spherio.activeAddress" ||
        event.key === "spherio.connectedAddress" ||
        event.key === "wallet.activeAddress"
      ) {
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

  const walletConnected = Boolean(connectedAddress);
  const amountsReady = Boolean(baseAmount.trim()) && Boolean(quoteAmount.trim());
  const poolTruthReady = Boolean(truth && !loading && !error);

  const intelligence = useMemo(() => {
    const normalizedSource = normalizeLiquiditySource(
      source || truth?.launchContext?.source || "manual"
    );

    return getLiquidityIntelligence({
      source: normalizedSource,
      mode,
      walletConnected,
      amountsReady,
      pairAddress: pool,
      pairLabel: truth?.pairLabel,
      baseAssetSymbol: truth?.baseAsset?.symbol,
      quoteAssetSymbol: truth?.quoteAsset?.symbol || searchParams.get("token"),
      createdTokenSymbol: searchParams.get("token"),
      tvlRusd: truth?.valuation?.tvlRusd,
      poolTruthAvailable: poolTruthReady,
      liquidityActionHidden: truth?.capabilities?.liquidityAction === "hidden",
    });
  }, [
    source,
    truth,
    mode,
    walletConnected,
    amountsReady,
    pool,
    searchParams,
    poolTruthReady,
  ]);

  const executionMode = intelligence.title;
  const ctaLabel = intelligence.nextAction.label;

  const rioLightBroadcastReady =
    intelligence.nextAction.state === "review_in_riolight" &&
    !intelligence.nextAction.disabled;

  const readinessReason = intelligence.nextAction.reason;

  async function connectWallet() {
    setConnectingWallet(true);
    setWalletNotice(null);

    try {
      const existing = readStoredWalletAddress();

      if (existing) {
        setConnectedAddress(existing);
        setWalletNotice(null);
        dispatchWalletChanged();
        return;
      }

      const wallet = await Promise.race([
        connectRioLight(),
        new Promise<null>((resolve) => {
          window.setTimeout(() => resolve(null), 15000);
        }),
      ]);

      if (wallet?.address) {
        window.localStorage.setItem(WALLET_STORAGE_KEY, wallet.address);
        setConnectedAddress(wallet.address);
        setWalletNotice(null);
        dispatchWalletChanged();
        return;
      }

      const recovered = readStoredWalletAddress();

      if (recovered) {
        setConnectedAddress(recovered);
        setWalletNotice(null);
        dispatchWalletChanged();
        return;
      }

      setWalletNotice("RioLight opened but no account was returned yet. Unlock RioLight, then click Connect RioLight again.");
    } catch (error: any) {
      const recovered = readStoredWalletAddress();

      if (recovered) {
        setConnectedAddress(recovered);
        setWalletNotice(null);
        dispatchWalletChanged();
        return;
      }

      setWalletNotice(
        error?.message ||
          "Failed to connect RioLight. Open the RioLight extension, unlock it, then try again."
      );
    } finally {
      setConnectingWallet(false);
    }
  }

  function disconnectWallet() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(WALLET_STORAGE_KEY);
      window.localStorage.removeItem("spherio_wallet_address");
      window.localStorage.removeItem("riolight.activeAddress");
      window.localStorage.removeItem("spherio.activeAddress");
      window.localStorage.removeItem("spherio.connectedAddress");
      window.localStorage.removeItem("wallet.activeAddress");
    }

    setConnectedAddress("");
    setWalletNotice(null);
    dispatchWalletChanged();
  }


  function assetSymbol(asset: any, fallback = "ASSET") {
    return String(asset?.symbol || asset?.displaySymbol || asset?.displayName || fallback);
  }

  function assetId(asset: any) {
    return String(
      asset?.assetId ||
        asset?.asset_id ||
        asset?.denom ||
        asset?.spherioDenom ||
        asset?.spherio_denom ||
        asset?.contractAddress ||
        asset?.contract_address ||
        asset?.address ||
        "",
    );
  }

  function assetLogo(asset: any) {
    return String(asset?.logoUrl || asset?.logo_url || asset?.logo || "");
  }

  function isNativeAsset(asset: any) {
    const id = assetId(asset);
    const type = String(asset?.type || asset?.assetType || asset?.asset_type || "").toLowerCase();
    const symbol = assetSymbol(asset).toUpperCase();

    return type === "native" || id === "urio" || symbol === "RIO";
  }

  function nativeDenom(asset: any) {
    if (!isNativeAsset(asset)) return "";
    return assetId(asset) || "urio";
  }

  function liquidityFundsFromTruth(poolTruth: any, base: string, quote: string) {
    const baseAsset = poolTruth?.baseAsset || {};
    const quoteAsset = poolTruth?.quoteAsset || {};
    const funds: Array<{ denom: string; amount: string }> = [];

    const baseDenom = nativeDenom(baseAsset);
    const quoteDenom = nativeDenom(quoteAsset);

    if (baseDenom && base) funds.push({ denom: baseDenom, amount: base });
    if (quoteDenom && quote) funds.push({ denom: quoteDenom, amount: quote });

    return funds;
  }

  function tokenRegistryProof(poolTruth: any) {
    const baseAsset = poolTruth?.baseAsset || {};
    const quoteAsset = poolTruth?.quoteAsset || {};

    return {
      baseAsset: {
        symbol: assetSymbol(baseAsset, "RIO"),
        assetId: assetId(baseAsset),
        logoUrl: assetLogo(baseAsset),
        type: baseAsset?.type || (isNativeAsset(baseAsset) ? "native" : "token"),
        verified: Boolean(baseAsset?.verified ?? baseAsset?.isVerified ?? true),
      },
      quoteAsset: {
        symbol: assetSymbol(quoteAsset, "RUSD"),
        assetId: assetId(quoteAsset),
        logoUrl: assetLogo(quoteAsset),
        type: quoteAsset?.type || (isNativeAsset(quoteAsset) ? "native" : "token"),
        verified: Boolean(quoteAsset?.verified ?? quoteAsset?.isVerified ?? true),
      },
    };
  }

  async function requestRioLightReview() {
    if (!truth || !rioLightBroadcastReady || broadcastBusy) return;

    const request = {
      id: `liq-${Date.now()}`,
      kind: "riodex_liquidity_action",
      status: "pending_review",
      createdAt: new Date().toISOString(),
      chainId: "spherio-1",
      walletAddress: connectedAddress,
      poolAddress: pool,
      pairLabel: truth.pairLabel,
      mode,
      source: source || truth.launchContext?.source || "manual",
      action: mode === "remove" ? "remove_liquidity" : "add_liquidity",
      amounts: {
        base: baseAmount,
        quote: quoteAmount,
        baseSymbol: assetSymbol(truth.baseAsset, "RIO"),
        quoteSymbol: assetSymbol(truth.quoteAsset, "RUSD"),
      },
      poolTruth: {
        tvlRusd: truth.valuation.tvlRusd,
        valuationSource: truth.valuation.source,
        reserves: truth.reserves,
        feeBps: truth.pool.feeBps,
        lpTokenAddress: truth.pool.lpTokenAddress,
      },
      treasury: {
        recipient: truth.treasury.recipient,
        feePolicy: truth.treasury.feePolicy,
        confirmedOnChain: truth.treasury.confirmedOnChain,
      },
      launchContext: truth.launchContext,
      proof: {
        explorer: null,
        txHash: null,
      },
    };

    setBroadcastBusy(true);
    setBroadcastNotice(null);

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "spherio_riolight_broadcast_request",
          JSON.stringify(request)
        );

        window.dispatchEvent(
          new CustomEvent("spherio:riolight-broadcast-request", {
            detail: request,
          })
        );
      }

      const surfaceKey = mode === "remove" ? "liquidity_remove" : "liquidity_add";
      const requestId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `riolight-liquidity-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const execResult = await executeSpherioRioLightAction({
        surfaceKey,
        product: "Liquidity",
        action: mode === "remove" ? "lp_remove" : "lp_add",
        contractAddress: pool,
        msg: {
          liquidity_action: {
            mode,
            pool,
            base_amount: baseAmount,
            quote_amount: quoteAmount,
          },
        },
        funds:
          mode === "remove"
            ? []
            : liquidityFundsFromTruth(truth, baseAmount, quoteAmount),
        memo: mode === "remove" ? "RioDex Remove Liquidity" : "RioDex Add Liquidity",
        reviewTitle: mode === "remove" ? "Remove Liquidity" : "Add Liquidity",
        reviewSubtitle:
          mode === "remove"
            ? "Review this liquidity removal before RioLight signs and broadcasts."
            : "Review this liquidity contribution before RioLight signs and broadcasts.",
        spendAmount: baseAmount,
        spendSymbol: assetSymbol(truth.baseAsset, "RIO"),
        receiveAmount: quoteAmount,
        receiveSymbol: assetSymbol(truth.quoteAsset, "RUSD"),
        routeLabel: "RioDex liquidity pool",
        feeAmount: "Estimated",
        feeSymbol: "RIO",
        contractLabel: "RioDex Liquidity Action",
        handoverIntent: createRioLightGlobalHandoverIntent({
          requestId,
          surface: "riodex_liquidity",
          product: "RioDex",
          actionKind: mode === "remove" ? "remove_liquidity" : "add_liquidity",
          actionLabel: mode === "remove" ? "Remove Liquidity" : "Add Liquidity",
          walletAddress: connectedAddress,
          contractAddress: pool,
          contractLabel: "RioDex Liquidity Action",
          title: mode === "remove" ? "Remove Liquidity" : "Add Liquidity",
          subtitle:
            mode === "remove"
              ? "Review liquidity removal, approval, broadcast, and receipt in one RioLight flow."
              : "Review liquidity contribution, approval, broadcast, and receipt in one RioLight flow.",
          assets: [
            {
              label: "Base asset",
              symbol: assetSymbol(truth.baseAsset, "RIO"),
              assetId: assetId(truth.baseAsset),
              amount: baseAmount,
              logoUrl: assetLogo(truth.baseAsset),
              role: mode === "remove" ? "receive" : "spend",
            },
            {
              label: "Quote asset",
              symbol: assetSymbol(truth.quoteAsset, "RUSD"),
              assetId: assetId(truth.quoteAsset),
              amount: quoteAmount,
              logoUrl: assetLogo(truth.quoteAsset),
              role: mode === "remove" ? "receive" : "spend",
            },
            {
              label: "Network fee",
              symbol: "RIO",
              amount: "Estimated",
              role: "fee",
            },
          ],
          routeLabel: "RioDex liquidity pool",
          quoteSource: "pool_truth",
          feeAmount: "Estimated",
          feeSymbol: "RIO",
          feeRecipient: truth.treasury.recipient,
          treasuryRecipient: truth.treasury.recipient,
          pairAddress: pool,
          poolAddress: pool,
          msg: {
            liquidity_action: {
              mode,
              pool,
              base_amount: baseAmount,
              quote_amount: quoteAmount,
            },
          },
          funds:
            mode === "remove"
              ? []
              : liquidityFundsFromTruth(truth, baseAmount, quoteAmount),
          riskNotes: [
            "Liquidity actions change wallet balances and pool exposure.",
            "LP position proof resolves through RioExplorer once indexed.",
          ],
          truthNotes: [
            "Pool Truth is the source for reserves, TVL, fee policy, and treasury route.",
            truth.treasury.confirmedOnChain
              ? "Treasury route is confirmed on-chain."
              : "Treasury route is pending confirmation.",
          ],
          proofHref: rioLightExplorerProofHref({ pairAddress: pool }),
          explorerHref: rioLightExplorerProofHref({ pairAddress: pool }),
          metadata: {
            liquidityAction: request.action,
            pairLabel: truth.pairLabel,
            tvlRusd: truth.valuation.tvlRusd,
            valuationSource: truth.valuation.source,
            feeBps: truth.pool.feeBps,
            lpTokenAddress: truth.pool.lpTokenAddress,
          },
        }),
        metadata: {
          actionKind: "riodex_liquidity_action",
          liquidityAction: request.action,
          walletAddress: connectedAddress,
          poolAddress: pool,
          pairLabel: truth.pairLabel,
          quoteSnapshot: {
            source: "pool_truth",
            tvlRusd: truth.valuation.tvlRusd,
            valuationSource: truth.valuation.source,
            reserves: truth.reserves,
            feeBps: truth.pool.feeBps,
            treasury: request.treasury,
            launchContext: truth.launchContext,
          },
          executionDraft: request,
          tokenRegistryProof: tokenRegistryProof(truth),
          baseAssetId: assetId(truth.baseAsset),
          quoteAssetId: assetId(truth.quoteAsset),
          baseLogoUrl: assetLogo(truth.baseAsset),
          quoteLogoUrl: assetLogo(truth.quoteAsset),
        },
      });

      setBroadcastNotice(
        execResult?.status === "approval_opened"
          ? "RioLight approval opened. Complete review, confirmation, broadcast, and receipt in the single RioLight popup."
          : "RioLight liquidity execution submitted."
      );
    } catch (error: any) {
      setBroadcastNotice(
        error?.message ||
          "Failed to send the RioLight review request. Open or unlock RioLight, then try again."
      );
    } finally {
      setBroadcastBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#030816] px-6 py-8 text-white">
      <RioValuationBadge />

      <div className="mx-auto max-w-[1180px]">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={pool ? `/riodex/pools?pool=${encodeURIComponent(pool)}` : "/riodex/pools"}
            className="rounded-full border border-cyan-400/30 bg-cyan-400/8 px-5 py-3 text-sm font-semibold text-cyan-200"
          >
            ← Back to Liquidity
          </Link>

          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/8 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            Liquidity Action
          </div>
        </div>

        <section className="rounded-[36px] border border-cyan-400/16 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_92%_10%,rgba(139,92,246,0.16),transparent_36%),linear-gradient(145deg,rgba(7,18,49,0.96),rgba(3,10,29,0.99))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.5)]">
          <div className="text-[13px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
            Intelligent Execution Surface
          </div>

          <h1 className="mt-4 text-[72px] font-semibold leading-none tracking-[-0.06em]">
            Liquidity
          </h1>

          <div className="mt-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/8 px-5 py-2 text-[18px] font-semibold text-cyan-100">
            {truth?.pairLabel || "Selected Pool"}
          </div>

          <p className="mt-5 max-w-[760px] text-[20px] leading-[1.45] text-sky-100/75">
            Resolve Pool Truth, wallet readiness, launch context, treasury policy, and execution mode before liquidity enters the market.
          </p>

          {loading ? (
            <div className="mt-8 rounded-[28px] border border-cyan-400/14 bg-black/20 p-6 text-sky-100/75">
              Loading Pool Truth…
            </div>
          ) : error ? (
            <div className="mt-8 rounded-[28px] border border-amber-400/30 bg-amber-500/10 p-6 text-amber-100">
              {error}
            </div>
          ) : truth ? (
            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="space-y-5">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                  <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                    Pool Truth
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-sm text-white/45">TVL</div>
                      <div className="text-3xl font-semibold">{formatUsd(truth.valuation.tvlRusd)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-white/45">Source</div>
                      <div className="text-xl font-semibold">{truth.valuation.source}</div>
                    </div>
                    <div>
                      <div className="text-sm text-white/45">Reserves</div>
                      <div className="text-xl font-semibold">
                        {formatNum(truth.reserves.baseDisplay)} / {formatNum(truth.reserves.quoteDisplay)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-white/45">LP Supply</div>
                      <div className="text-xl font-semibold">
                        {truth.pool.totalShareDisplay ? formatNum(truth.pool.totalShareDisplay) : "Indexing pending"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                  <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                    Execution Intelligence
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Execution Mode</div>
                      <div className="mt-1 font-semibold">{executionMode}</div>
                    </div>

                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Launch Context</div>
                      <div className="mt-1 font-semibold">
                        {intelligence.subtitle}
                      </div>
                      {truth.launchContext.note ? (
                        <div className="mt-1 text-sm text-white/45">{truth.launchContext.note}</div>
                      ) : null}
                    </div>

                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">LP Position Status</div>
                      <div className="mt-1 font-semibold">
                        {truth.pool.lpTokenAddress ? "Ready for wallet position lookup" : "LP position indexing pending"}
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-cyan-300/14 bg-cyan-400/[0.04] px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Asset Selection Policy</div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Base Asset</div>
                          <div className="mt-1 text-lg font-semibold text-white">
                            {intelligence.assetSelection.baseAsset.defaultSymbol || "Selectable"}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-cyan-100/70">
                            {intelligence.assetSelection.baseAsset.locked ? "Locked" : "Selectable"}
                          </div>
                          <div className="mt-2 text-xs leading-5 text-white/45">
                            {intelligence.assetSelection.baseAsset.reason}
                          </div>
                        </div>

                        <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Quote Asset</div>
                          <div className="mt-1 text-lg font-semibold text-white">
                            {intelligence.assetSelection.quoteAsset.defaultSymbol || "Selectable"}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-cyan-100/70">
                            {intelligence.assetSelection.quoteAsset.locked ? "Locked" : "Selectable"}
                          </div>
                          <div className="mt-2 text-xs leading-5 text-white/45">
                            {intelligence.assetSelection.quoteAsset.reason}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">LP Disposition Policy</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {intelligence.lpDispositionOptions.map((option) => (
                          <span
                            key={option}
                            className="rounded-full border border-cyan-300/18 bg-cyan-400/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 text-sm leading-6 text-white/55">
                        Default LP posture:{" "}
                        <span className="font-semibold text-white">
                          {intelligence.defaultLpDisposition.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {intelligence.verification.primeVerifiedEligible ? (
                      <div className="rounded-[18px] border border-emerald-300/18 bg-emerald-400/[0.06] px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">
                          Prime Verified Liquidity
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">
                          {intelligence.verification.badgeLabel}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-white/60">
                          {intelligence.verification.explanation}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Minimum Vest</div>
                            <div className="mt-1 text-xl font-semibold text-white">
                              {intelligence.verification.minVestDays} days
                            </div>
                          </div>
                          <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Recommended Vest</div>
                            <div className="mt-1 text-xl font-semibold text-white">
                              {intelligence.verification.recommendedVestDays} days
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {intelligence.pumpGraduation.enabled ? (
                      <div className="rounded-[18px] border border-fuchsia-300/18 bg-fuchsia-400/[0.06] px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-fuchsia-200/75">
                          Pump Graduation Policy
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">
                          Protocol-Seeded Graduation Liquidity
                        </div>
                        <div className="mt-2 text-sm leading-6 text-white/60">
                          {intelligence.pumpGraduation.explanation}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Seed</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                              {intelligence.pumpGraduation.seedRusdEquivalent?.toLocaleString()} RUSD-eq
                            </div>
                          </div>
                          <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Seed Asset</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                              {intelligence.pumpGraduation.seedAssetSymbol}
                            </div>
                          </div>
                          <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">User Approval</div>
                            <div className="mt-1 text-lg font-semibold text-white">
                              {intelligence.pumpGraduation.userApprovalRequired ? "Required" : "Not Required"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Proof / Discovery Expectations</div>
                      <div className="mt-3 grid gap-2">
                        {intelligence.discovery.expectedProofs.map((proof) => (
                          <div
                            key={proof}
                            className="rounded-[14px] border border-white/8 bg-black/16 px-3 py-2 text-xs font-semibold text-white/60"
                          >
                            {proof}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs leading-5 text-cyan-100/60">
                        Expected discovery: Pool, Screener, RioEx, and RioExplorer.
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Execution Disclosures</div>
                      <div className="mt-3 grid gap-2">
                        {intelligence.disclosures.map((item) => (
                          <div
                            key={item}
                            className="rounded-[14px] border border-white/8 bg-black/16 px-3 py-2 text-xs font-semibold leading-5 text-white/60"
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      {intelligence.warnings.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {intelligence.warnings.map((warning) => (
                            <div
                              key={warning}
                              className="rounded-[14px] border border-amber-300/22 bg-amber-400/10 px-3 py-2 text-xs font-semibold leading-5 text-amber-100"
                            >
                              {warning}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-cyan-400/14 bg-cyan-400/5 p-6">
                  <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                    Wallet Status
                  </div>

                  <div className="mt-3 text-2xl font-semibold">
                    {walletConnected ? "Wallet connected" : "Wallet not connected"}
                  </div>

                  <div className="mt-2 text-sm text-white/55">
                    {walletConnected ? shortAddr(connectedAddress) : "RioLight connection required for execution."}
                  </div>

                  <button
                    type="button"
                    onClick={walletConnected ? disconnectWallet : connectWallet}
                    disabled={connectingWallet}
                    className="mt-5 rounded-[18px] border border-cyan-400 bg-cyan-400/8 px-6 py-4 font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {walletConnected ? "Disconnect Wallet" : connectingWallet ? "Connecting..." : "Connect RioLight"}
                  </button>

                  {walletNotice ? (
                    <div className="mt-4 rounded-[18px] border border-amber-400/28 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      {walletNotice}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                  <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                    Treasury / Fee Policy
                  </div>

                  <div className="mt-3 text-xl font-semibold">{truth.treasury.feePolicy}</div>
                  <div className="mt-2 text-sm text-white/55">{shortAddr(truth.treasury.recipient)}</div>
                  <div className="mt-2 text-sm text-white/45">
                    {truth.treasury.confirmedOnChain
                      ? "Treasury route confirmed by indexed contract truth."
                      : "Using global Spherio treasury policy fallback until contract-level proof is indexed."}
                  </div>
                </div>

                <div className="rounded-[28px] border border-cyan-400/14 bg-cyan-400/5 p-6">
                  <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                    RioLight Broadcast Readiness
                  </div>

                  <div className="mt-3 text-xl font-semibold">
                    {rioLightBroadcastReady ? "Ready for RioLight review" : "Broadcast guarded"}
                  </div>

                  <div className="mt-2 text-sm text-white/55">
                    {readinessReason}
                  </div>
                </div>

                <div className="rounded-[32px] border border-cyan-300/30 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.18),transparent_32%),linear-gradient(145deg,rgba(5,25,49,0.96),rgba(7,12,32,0.98))] p-7 shadow-[0_24px_90px_rgba(8,145,178,0.16)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                        Primary Execution
                      </div>
                      <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
                        {intelligence.source === "pump_graduation"
                          ? "Protocol Graduation Seed"
                          : mode === "remove"
                            ? "Remove Liquidity"
                            : "Add Liquidity"}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-cyan-50/60">
                        {intelligence.approval.reason}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                      <div className="rounded-[24px] border border-cyan-300/18 bg-black/24 p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200/70">
                          Selected liquidity pair
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                          <div className="rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Base asset</div>
                            <div className="mt-1 text-xl font-black text-white">{assetSymbol(truth.baseAsset, "RIO")}</div>
                            <div className="mt-1 truncate text-xs text-white/35">{assetId(truth.baseAsset) || "native"}</div>
                          </div>

                          <div className="hidden rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 sm:block">
                            +
                          </div>

                          <div className="rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Quote asset</div>
                            <div className="mt-1 text-xl font-black text-white">{assetSymbol(truth.quoteAsset, "RUSD")}</div>
                            <div className="mt-1 truncate text-xs text-white/35">{assetId(truth.quoteAsset) || "token"}</div>
                          </div>
                        </div>

                        <div className="mt-3 rounded-[16px] border border-emerald-300/18 bg-emerald-400/[0.06] px-4 py-3 text-sm font-semibold text-emerald-100">
                          Pair locked from Pool Truth: {truth.pairLabel || `${assetSymbol(truth.baseAsset, "RIO")} / ${assetSymbol(truth.quoteAsset, "RUSD")}`}
                        </div>
                      </div>

                    <input
                      value={baseAmount}
                      onChange={(event) => setBaseAmount(event.target.value)}
                      placeholder={`${assetSymbol(truth.baseAsset, "RIO")} amount`}
                      className="h-16 rounded-[20px] border border-cyan-300/18 bg-black/24 px-5 text-lg font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300/70"
                    />
                    <input
                      value={quoteAmount}
                      onChange={(event) => setQuoteAmount(event.target.value)}
                      placeholder={`${assetSymbol(truth.quoteAsset, "RUSD")} amount`}
                      className="h-16 rounded-[20px] border border-cyan-300/18 bg-black/24 px-5 text-lg font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300/70"
                    />

                    <button
                      type="button"
                      disabled={intelligence.nextAction.state !== "review_in_riolight" || broadcastBusy}
                      onClick={requestRioLightReview}
                      className={`h-16 rounded-[20px] border px-6 text-lg font-semibold transition ${
                        intelligence.nextAction.state === "review_in_riolight"
                          ? "border-cyan-300 bg-cyan-400/16 text-cyan-50 shadow-[0_0_34px_rgba(34,211,238,0.18)] hover:bg-cyan-400/22"
                          : "border-cyan-400/45 bg-cyan-400/8 text-cyan-100 opacity-70"
                      }`}
                    >
                      {broadcastBusy ? "Sending to RioLight..." : ctaLabel}
                    </button>

                    <div className={`rounded-[18px] border px-4 py-3 text-sm ${
                      rioLightBroadcastReady
                        ? "border-cyan-400/24 bg-cyan-500/10 text-cyan-100"
                        : "border-amber-400/28 bg-amber-500/10 text-amber-100"
                    }`}>
                      {rioLightBroadcastReady
                        ? "Pool Truth, wallet, amounts, and execution context are ready for RioLight review."
                        : readinessReason}
                    </div>

                    {broadcastNotice ? (
                      <div className="rounded-[18px] border border-emerald-400/24 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        {broadcastNotice}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
