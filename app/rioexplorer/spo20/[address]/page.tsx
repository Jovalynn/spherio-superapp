"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  RIODEX_SCREENER_ROUTE,
  buildRioDexSurfaceHref,
} from "@/lib/riodex/routes";

type TokenMeta = {
  token_address: string;
  symbol: string | null;
  creator: string | null;
  factory_address: string | null;
  tx_hash: string | null;
  height: string | number;
  created_at: string;
  contract_address?: string;
  factory?: string;
  tx?: string;
  created_height?: string | number;
  created?: string;
  name?: string | null;
  description?: string | null;
  logo_url?: string | null;
  metadata_json?: Record<string, any> | null;
  source?: string | null;
  onchain?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    total_supply?: string;
  } | null;
};

type HolderRow = {
  token_address: string;
  address: string;
  balance: string;
  updated_height: string | number;
  updated_at: string;
};

type ActivityRow = {
  height: string | number;
  tx_hash: string;
  action: string;
  sender: string | null;
  recipient: string | null;
  amount: string | null;
  created_at: string;
};

type TokenPairRow = {
  pair_id: string;
  dex_contract: string | null;
  token0: string;
  token1: string;
  created_height: string | number | null;
  created_at: string | null;
  token0_symbol: string | null;
  token1_symbol: string | null;
  token0_decimals: number | null;
  token1_decimals: number | null;
  counterpart_token: string | null;
  counterpart_symbol: string | null;
};

type TokenPairsResponse = {
  token_address: string;
  count: number;
  items: TokenPairRow[];
};

type PumpRewardEligibilityResponse = {
  ok: boolean;
  source?: string;
  tokenAddress?: string;
  summary?: {
    escrowRows: number;
    graduationCompleted: boolean;
    lpSeeded: boolean;
    pairReady: boolean;
    lpProofIndexed: boolean;
    lpSeedProofPass: boolean;
    currentMarketCapRusd: number;
    currentUniqueBuyers: number;
    currentTradeCount: number;
    sustainabilityProofIndexed: boolean;
    antiAbuseProofIndexed: boolean;
    explanation: string;
  };
  stages?: Array<{
    id: number;
    rewardStage: string;
    escrowStatus: string;
    storedEligibilityStatus: string;
    computedEligibilityStatus: string;
    payoutStatus: string;
    rewardAmountRio: number;
    stableEquivalentRusd: number;
    marketCapRusdEquivalent: number;
    organicBuyersMin: number | null;
    organicBuyersTarget: number | null;
    sustainDaysRequired: number | null;
    requiredSwaps: number | null;
    checks: Array<{
      key: string;
      label?: string;
      required: boolean;
      pass: boolean;
      current: string | number | boolean | null;
      requiredValue: string | number | boolean | null;
    }>;
    notes: string | null;
  }>;
  error?: string;
};

type PumpProofResponse = {
  ok: boolean;
  source?: string;
  tokenAddress?: string;
  graduation?: {
    status?: string;
    triggerReason?: string;
    requiredSeedValueRusd?: number;
    seedRio?: number;
    seedRioUrio?: string;
    seedTokenBase?: string;
    riodexFactory?: string;
    riodexPairAddress?: string | null;
    lpTokenAmount?: string | null;
    lpLockUntil?: string | null;
    surplusRio?: number;
    creatorRewardTotalRio?: number;
    treasurySurplusRio?: number;
    txHash?: string;
    blockHeight?: number;
    completedAt?: string | null;
  } | null;
  eligibilityEvents?: Array<{
    id: number;
    rewardStage: string;
    proofType: string;
    proofStatus: string;
    currentValue: number | null;
    requiredValue: number | null;
    currentText: string | null;
    requiredText: string | null;
    txHash: string;
    eventIndex: number;
    blockHeight: number;
    indexedAt: string | null;
    metadata?: Record<string, unknown>;
  }>;
  fundingEvents?: Array<{
    id: number;
    rewardStage: string;
    fundingType: string;
    fundingSource: string;
    asset: string;
    amountRusd: number;
    amountBase: string;
    status: string;
    txHash: string;
    eventIndex: number;
    blockHeight: number;
    indexedAt: string | null;
    metadata?: Record<string, unknown>;
  }>;
  rewardEscrows?: Array<{
    id: number;
    creatorAddress: string;
    escrowStatus: string;
    rewardStage: string;
    rewardAmountRio: number;
    rewardAmountUrio: string;
    stableEquivalentRusd: number;
    stableRequiredRusd?: number;
    rioRequiredRusd?: number;
    stableFundedRusd?: number;
    rioFundedRusd?: number;
    stableAsset?: string;
    rioAsset?: string;
    fundingStatus?: string;
    fundingSource?: string | null;
    fundingTxHash?: string | null;
    fundingHeight?: number | null;
    fundingIndexedAt?: string | null;
    stablePayoutBps: number;
    rioPayoutBps: number;
    eligibilityStatus: string;
    payoutStatus: string;
    organicBuyersMin: number | null;
    organicBuyersTarget: number | null;
    sustainDaysRequired: number | null;
    requiredSwaps: number | null;
    marketCapRusdEquivalent: number | null;
    notes: string | null;
  }>;
  rewards?: Array<{
    id: number;
    rewardType: string;
    rewardAmountRio: number;
    claimedImmediate: boolean;
    claimedVested: boolean;
    forfeited: boolean;
    txHash: string;
  }>;
  traders?: {
    totalBuyRio: number;
    totalSellRio: number;
    netBuyRio: number;
    tradeCount: number;
    buyCount: number;
    sellCount: number;
    uniqueTraders: number;
    uniqueBuyers: number;
    uniqueSellers: number;
  };
  proofStatus?: {
    tokenIndexed: boolean;
    curveIndexed: boolean;
    graduationIndexed: boolean;
    graduationCompleted: boolean;
    lpSeeded: boolean;
    pairReady: boolean;
    lpProofIndexed: boolean;
    rewardsIndexed: boolean;
    rewardEscrowsIndexed: boolean;
    fundingEventsIndexed?: boolean;
    eligibilityEventsIndexed?: boolean;
    rewardSchemaStatus: string;
  };
  error?: string;
};

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function shortAddr(a?: string | null, left = 10, right = 6) {
  if (!a) return "—";
  if (a.length <= left + right + 3) return a;
  return `${a.slice(0, left)}…${a.slice(-right)}`;
}

function fmtTs(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function fmtAmount(raw?: string | null, decimals = 6) {
  if (!raw) return "—";
  const s = String(raw);
  if (!/^\d+$/.test(s)) return s;

  if (decimals <= 0) return s;

  const pad = s.padStart(decimals + 1, "0");
  const whole = pad.slice(0, -decimals);
  const frac = pad.slice(-decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export default function RioExplorerSpo20TokenPage() {
  const params = useParams<{ address: string }>();
  const searchParams = useSearchParams();
  const address = useMemo(() => String(params?.address ?? "").trim(), [params]);
  const proofMode = String(searchParams.get("proof") || "").trim().toLowerCase();

  const proofTitle =
    proofMode === "graduation"
      ? "Graduation Proof"
      : proofMode === "lp"
        ? "LP Proof"
        : proofMode === "reward-eligibility"
          ? "Reward Eligibility Proof"
          : proofMode === "reward-payment"
            ? "Reward Payment Proof"
            : "Token Contract Proof";

  const proofDescription =
    proofMode === "graduation"
      ? "Verifies graduation status, curve completion, and handoff readiness for this SPO-20 token."
      : proofMode === "lp"
        ? "Verifies protocol LP seed, liquidity status, LP burn/dead-wallet proof, and post-graduation market safety."
        : proofMode === "reward-eligibility"
          ? "Verifies creator reward eligibility using market health, organic buyers, sustainability, risk checks, and graduation proof."
          : proofMode === "reward-payment"
            ? "Verifies whether a creator reward payout has been executed and can be traced through indexed payment records."
            : "Verifies this SPO-20 token contract address and its indexed RioExplorer token history.";

  const [meta, setMeta] = useState<TokenMeta | null>(null);
  const [holders, setHolders] = useState<HolderRow[]>([]);
  const [txs, setTxs] = useState<ActivityRow[]>([]);
  const [pairs, setPairs] = useState<TokenPairRow[]>([]);
  const [pumpProof, setPumpProof] = useState<PumpProofResponse | null>(null);
  const [pumpProofError, setPumpProofError] = useState<string | null>(null);
  const [pumpEligibility, setPumpEligibility] = useState<PumpRewardEligibilityResponse | null>(null);
  const [pumpEligibilityError, setPumpEligibilityError] = useState<string | null>(null);
  const [tab, setTab] = useState<"holders" | "activity" | "pairs">("pairs");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const card =
    "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]";
  const chip =
    "rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold";
  const chipActive =
    "border-[#FF8A32]/40 bg-[#FF8A32]/10 text-white shadow-[0_0_0_1px_rgba(255,138,50,0.15)_inset]";
  const tableWrap = "mt-4 overflow-hidden rounded-2xl border border-white/10";
  const th =
    "px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-300 bg-black/30";
  const td = "px-4 py-3 text-slate-200";

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const [mRes, hRes, tRes, pRes, proofRes, eligibilityRes] = await Promise.all([
          fetch(`/api/spo20/token/${address}`, { cache: "no-store" }),
          fetch(`/api/spo20/token/${address}/holders?limit=50&offset=0`, {
            cache: "no-store",
          }),
          fetch(`/api/spo20/token/${address}/txs?limit=50&offset=0`, {
            cache: "no-store",
          }),
          fetch(`/api/dex/token-pairs/${address}`, { cache: "no-store" }),
          fetch(`/api/rioexplorer/spo20/${address}/pump-proof`, {
            cache: "no-store",
          }),
          fetch(`/api/pump/rewards/eligibility?tokenAddress=${encodeURIComponent(address)}`, {
            cache: "no-store",
          }),
        ]);

        if (!mRes.ok) {
          throw new Error(
            mRes.status === 404
              ? "This token address is valid for proof navigation, but SPO-20 metadata is not indexed yet. RioExplorer will populate token metadata, holders, pairs, and activity after the indexer records this token."
              : `Token metadata request failed with HTTP ${mRes.status}.`
          );
        }

        const mJson = (await mRes.json()) as TokenMeta;

        const hJson = hRes.ok
          ? await hRes.json().catch(() => ({ items: [] }))
          : { items: [] };

        const tJson = tRes.ok
          ? await tRes.json().catch(() => ({ items: [] }))
          : { items: [] };

        const pJson = pRes.ok
          ? ((await pRes.json().catch(() => ({ items: [] }))) as TokenPairsResponse)
          : { token_address: address, count: 0, items: [] };

        const proofJson = proofRes.ok
          ? ((await proofRes.json().catch(() => null)) as PumpProofResponse | null)
          : null;

        const eligibilityJson = eligibilityRes.ok
          ? ((await eligibilityRes.json().catch(() => null)) as PumpRewardEligibilityResponse | null)
          : null;

        if (cancelled) return;

        setMeta(mJson);
        setHolders(Array.isArray(hJson.items) ? (hJson.items as HolderRow[]) : []);
        setTxs(Array.isArray(tJson.items) ? (tJson.items as ActivityRow[]) : []);
        setPairs(Array.isArray(pJson.items) ? pJson.items : []);
        setPumpProof(proofJson?.ok ? proofJson : null);
        setPumpProofError(
          proofJson && !proofJson.ok
            ? proofJson.error || "Pump proof is not indexed yet."
            : null,
        );
        setPumpEligibility(eligibilityJson?.ok ? eligibilityJson : null);
        setPumpEligibilityError(
          eligibilityJson && !eligibilityJson.ok
            ? eligibilityJson.error || "Pump reward eligibility is not indexed yet."
            : null,
        );
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message ?? "Token metadata pending");
        setMeta(null);
        setHolders([]);
        setTxs([]);
        setPairs([]);
        setPumpProof(null);
        setPumpProofError(null);
        setPumpEligibility(null);
        setPumpEligibilityError(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const decimals = meta?.onchain?.decimals ?? 6;
  const metadata = meta?.metadata_json || {};
  const displayName =
    meta?.name ||
    meta?.onchain?.name ||
    metadata?.name ||
    metadata?.display_name ||
    meta?.symbol ||
    "SPO-20 Token";
  const displaySymbol =
    meta?.symbol ||
    meta?.onchain?.symbol ||
    metadata?.symbol ||
    "TOKEN";
  const displayDescription =
    meta?.description ||
    metadata?.description ||
    metadata?.token_description ||
    "";
  const displayLogoUrl =
    meta?.logo_url ||
    metadata?.logo_url ||
    metadata?.logoUrl ||
    metadata?.logo ||
    metadata?.image ||
    metadata?.image_url ||
    "";

  const metadataRail =
    metadata?.rail ||
    metadata?.launch_rail ||
    metadata?.source_rail ||
    metadata?.source ||
    "spo20";

  const metadataStandard =
    metadata?.metadata_standard ||
    metadata?.standard ||
    "spo20_shared_metadata";

  const metadataSource =
    metadata?.source ||
    metadata?.indexed_via ||
    meta?.source ||
    "spo20_indexer";

  const metadataUpdatedAt =
    metadata?.updated_at ||
    metadata?.backfilled_at ||
    metadata?.discovered_at ||
    metadata?.created_at ||
    meta?.created_at ||
    null;

  const metadataProofHash =
    metadata?.metadata_hash ||
    metadata?.metadata_proof_hash ||
    metadata?.proof_hash ||
    metadata?.content_hash ||
    "";

  const metadataSocials = [
    {
      label: "Website",
      value: metadata?.website || metadata?.site || "",
    },
    {
      label: "X / Twitter",
      value: metadata?.twitter || metadata?.x_handle || metadata?.xHandle || metadata?.x || "",
    },
    {
      label: "Telegram",
      value: metadata?.telegram || "",
    },
    {
      label: "Discord",
      value: metadata?.discord || "",
    },
    {
      label: "YouTube",
      value: metadata?.youtube || "",
    },
  ].filter((item) => String(item.value || "").trim());

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden bg-[#060B16] text-white">

      {proofMode ? (
        <section className="mb-5 rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,rgba(7,15,30,0.96),rgba(4,8,18,0.99))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/75">
                RioExplorer Proof View
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-white">
                {proofTitle}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
                {proofDescription}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-xs leading-5 text-white/58">
              Token: <span className="font-mono text-cyan-100">{shortAddr(address, 12, 8)}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Proof Type</div>
              <div className="mt-1 text-sm font-bold text-white">{proofTitle}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Indexer Status</div>
              <div className="mt-1 text-sm font-bold text-cyan-100">
                {pumpProof?.proofStatus?.graduationIndexed || pumpProof?.proofStatus?.rewardEscrowsIndexed
                  ? "Pump proof indexed"
                  : "Token history loaded"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Audit Surface</div>
              <div className="mt-1 text-sm font-bold text-white">SPO-20 Token</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Next Step</div>
              <div className="mt-1 text-sm font-bold text-white">
                {pumpProof?.proofStatus?.rewardEscrowsIndexed ? "Review escrow proof" : "Review indexed records"}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-black/24 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.20em] text-cyan-200/70">
                  Pump Proof Records
                </div>
                <div className="mt-1 text-lg font-bold text-white">
                  Graduation, LP, reward escrow, and payment proof
                </div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-white/55">
                  RioExplorer reads indexed Pump proof records directly from the indexer tables. Escrow proof confirms reward reserves/stages exist; payment proof appears only after payout records are indexed.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60">
                Source: {pumpProof?.source || "pending"}
              </div>
            </div>

            {pumpProofError ? (
              <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {pumpProofError}
              </div>
            ) : null}

            {pumpEligibilityError ? (
              <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {pumpEligibilityError}
              </div>
            ) : null}

            {pumpEligibility?.summary ? (
              <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-500/[0.05] px-3 py-2 text-xs leading-5 text-cyan-100/75">
                {pumpEligibility.summary.explanation}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Graduation</div>
                <div className="mt-1 text-sm font-bold text-white">
                  {pumpProof?.proofStatus?.graduationCompleted ? "Completed" : pumpProof?.proofStatus?.graduationIndexed ? "Indexed" : "Pending"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">LP / Pair</div>
                <div className="mt-1 text-sm font-bold text-white">
                  {pumpProof?.proofStatus?.pairReady ? "Pair ready" : "Pending"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Reward Escrow</div>
                <div className="mt-1 text-sm font-bold text-white">
                  {pumpProof?.proofStatus?.rewardEscrowsIndexed ? `${pumpProof.rewardEscrows?.length || 0} stages` : "No escrow rows"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Reward Payment</div>
                <div className="mt-1 text-sm font-bold text-white">
                  {pumpProof?.proofStatus?.rewardsIndexed ? `${pumpProof.rewards?.length || 0} records` : "Not paid"}
                </div>
              </div>
            </div>

            {pumpProof?.graduation ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Graduation Proof</div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">Status</div>
                    <div className="mt-1 text-sm font-bold text-white">{pumpProof.graduation.status || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">Seed RIO</div>
                    <div className="mt-1 text-sm font-bold text-white">{pumpProof.graduation.seedRio?.toLocaleString?.() || "0"} RIO</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">Block</div>
                    <div className="mt-1 text-sm font-bold text-white">h{pumpProof.graduation.blockHeight || "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">RioDex Pair</div>
                    <div className="mt-1 break-all font-mono text-xs text-cyan-100">{pumpProof.graduation.riodexPairAddress || "Pending"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">Graduation Tx</div>
                    <div className="mt-1 break-all font-mono text-xs text-cyan-100">{pumpProof.graduation.txHash || "Pending"}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Reward Escrow Proof</div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {pumpProof?.rewardEscrows?.length ? "Escrow stages indexed" : "No reward escrow indexed yet"}
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/55">
                  {pumpProof?.proofStatus?.rewardSchemaStatus || "pending"}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {pumpProof?.rewardEscrows?.length ? (
                  pumpProof.rewardEscrows.map((escrow) => {
                    const eligibilityStage = pumpEligibility?.stages?.find(
                      (stage) => stage.rewardStage === escrow.rewardStage,
                    );

                    return (
                      <div key={escrow.rewardStage} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs">
                        <div className="grid gap-2 md:grid-cols-[1fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr]">
                          <div>
                            <div className="font-bold text-white">{escrow.rewardStage}</div>
                            <div className="mt-1 text-white/45">{escrow.notes || "Policy-gated reward stage"}</div>
                          </div>
                          <div>
                            <div className="text-white/35">Escrow</div>
                            <div className="mt-1 font-bold text-cyan-100">{escrow.escrowStatus}</div>
                          </div>
                          <div>
                            <div className="text-white/35">Stored Eligibility</div>
                            <div className="mt-1 font-bold text-amber-100">{escrow.eligibilityStatus}</div>
                          </div>
                          <div>
                            <div className="text-white/35">Computed</div>
                            <div className="mt-1 font-bold text-cyan-100">
                              {eligibilityStage?.computedEligibilityStatus || "pending"}
                            </div>
                          </div>
                          <div>
                            <div className="text-white/35">Payout</div>
                            <div className="mt-1 font-bold text-white">{escrow.payoutStatus}</div>
                          </div>
                          <div>
                            <div className="text-white/35">Reward</div>
                            <div className="mt-1 font-bold text-emerald-100">
                              ${escrow.stableEquivalentRusd.toLocaleString()} eq.
                            </div>
                            <div className="mt-1 text-white/40">
                              {escrow.marketCapRusdEquivalent ? `${escrow.marketCapRusdEquivalent.toLocaleString()} mcap` : "—"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <div className="rounded-lg border border-cyan-300/15 bg-cyan-500/[0.04] px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[10px] uppercase tracking-[0.12em] text-cyan-100/45">
                                Stable bucket
                              </div>
                              <div className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
                                {escrow.fundingStatus || "reserved"}
                              </div>
                            </div>
                            <div className="mt-2 text-sm font-bold text-white">
                              ${(escrow.stableFundedRusd || 0).toLocaleString()} / ${(escrow.stableRequiredRusd || 0).toLocaleString()}
                            </div>
                            <div className="mt-1 text-[11px] text-white/45">
                              {escrow.stableAsset || "USDT/RUSD"} target funding
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-cyan-300"
                                style={{
                                  width: `${Math.min(
                                    Math.max(
                                      ((escrow.stableFundedRusd || 0) /
                                        Math.max(escrow.stableRequiredRusd || 0, 1)) *
                                        100,
                                      0,
                                    ),
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="rounded-lg border border-emerald-300/15 bg-emerald-500/[0.04] px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-100/45">
                                RIO bucket
                              </div>
                              <div className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
                                {escrow.fundingStatus || "reserved"}
                              </div>
                            </div>
                            <div className="mt-2 text-sm font-bold text-white">
                              ${(escrow.rioFundedRusd || 0).toLocaleString()} / ${(escrow.rioRequiredRusd || 0).toLocaleString()}
                            </div>
                            <div className="mt-1 text-[11px] text-white/45">
                              {escrow.rioAsset || "RIO"} value target
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-emerald-300"
                                style={{
                                  width: `${Math.min(
                                    Math.max(
                                      ((escrow.rioFundedRusd || 0) /
                                        Math.max(escrow.rioRequiredRusd || 0, 1)) *
                                        100,
                                      0,
                                    ),
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {escrow.fundingTxHash ? (
                          <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                            <div className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                              Funding proof
                            </div>
                            <div className="mt-1 break-all font-mono text-cyan-100">
                              {escrow.fundingTxHash}
                            </div>
                          </div>
                        ) : null}

                        {eligibilityStage?.checks?.length ? (
                          <div className="mt-3 grid gap-2 md:grid-cols-3">
                            {eligibilityStage.checks.map((check) => (
                              <div
                                key={`${escrow.rewardStage}-${check.key}`}
                                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                                    {check.key.replaceAll("_", " ")}
                                  </div>
                                  <div
                                    className={
                                      check.pass
                                        ? "rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-100"
                                        : "rounded-full border border-amber-300/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-100"
                                    }
                                  >
                                    {check.pass ? "pass" : "pending"}
                                  </div>
                                </div>
                                <div className="mt-1 text-white/55">
                                  Current: {String(check.current)}
                                </div>
                                <div className="mt-1 text-white/40">
                                  Required: {String(check.requiredValue)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-sm text-white/50">
                    No reward escrow rows have been indexed for this token yet.
                  </div>
                )}
              <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-500/[0.035] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-amber-100/45">
                      Eligibility Event Proof
                    </div>
                    <div className="mt-1 text-sm font-bold text-white">
                      {pumpProof?.eligibilityEvents?.length ? `${pumpProof.eligibilityEvents.length} eligibility proofs indexed` : "No eligibility proofs indexed yet"}
                    </div>
                  </div>

                  <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/55">
                    {pumpProof?.proofStatus?.eligibilityEventsIndexed ? "proofs indexed" : "pending proofs"}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {pumpProof?.eligibilityEvents?.length ? (
                    pumpProof.eligibilityEvents.map((event) => (
                      <div
                        key={`${event.rewardStage}-${event.proofType}-${event.txHash}-${event.eventIndex}`}
                        className="grid gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs md:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_1.6fr]"
                      >
                        <div>
                          <div className="text-white/35">Stage</div>
                          <div className="mt-1 font-bold text-white">{event.rewardStage}</div>
                          <div className="mt-1 text-white/40">{event.proofType.replaceAll("_", " ")}</div>
                        </div>

                        <div>
                          <div className="text-white/35">Current</div>
                          <div className="mt-1 font-bold text-amber-100">
                            {event.currentText || event.currentValue?.toLocaleString?.() || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-white/35">Required</div>
                          <div className="mt-1 font-bold text-white">
                            {event.requiredText || event.requiredValue?.toLocaleString?.() || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-white/35">Status</div>
                          <div className={event.proofStatus === "passed" ? "mt-1 font-bold text-emerald-100" : "mt-1 font-bold text-amber-100"}>
                            {event.proofStatus}
                          </div>
                          <div className="mt-1 text-white/40">h{event.blockHeight || "—"}</div>
                        </div>

                        <div>
                          <div className="text-white/35">Proof Tx</div>
                          <div className="mt-1 break-all font-mono text-cyan-100">
                            {event.txHash || "pending"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-sm text-white/50">
                      No eligibility proof event rows have been indexed for this token yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.035] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/45">
                      Escrow Funding Event Proof
                    </div>
                    <div className="mt-1 text-sm font-bold text-white">
                      {pumpProof?.fundingEvents?.length ? `${pumpProof.fundingEvents.length} funding events indexed` : "No funding events indexed yet"}
                    </div>
                  </div>

                  <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/55">
                    {pumpProof?.proofStatus?.fundingEventsIndexed ? "events indexed" : "pending events"}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {pumpProof?.fundingEvents?.length ? (
                    pumpProof.fundingEvents.map((event) => (
                      <div
                        key={`${event.rewardStage}-${event.fundingType}-${event.txHash}-${event.eventIndex}`}
                        className="grid gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs md:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_1.6fr]"
                      >
                        <div>
                          <div className="text-white/35">Stage</div>
                          <div className="mt-1 font-bold text-white">{event.rewardStage}</div>
                          <div className="mt-1 text-white/40">{event.fundingType.replaceAll("_", " ")}</div>
                        </div>

                        <div>
                          <div className="text-white/35">Amount</div>
                          <div className="mt-1 font-bold text-cyan-100">
                            ${event.amountRusd.toLocaleString()} eq.
                          </div>
                          <div className="mt-1 text-white/40">{event.asset}</div>
                        </div>

                        <div>
                          <div className="text-white/35">Source</div>
                          <div className="mt-1 font-bold text-white">{event.fundingSource}</div>
                        </div>

                        <div>
                          <div className="text-white/35">Status</div>
                          <div className="mt-1 font-bold text-emerald-100">{event.status}</div>
                          <div className="mt-1 text-white/40">h{event.blockHeight || "—"}</div>
                        </div>

                        <div>
                          <div className="text-white/35">Funding Tx</div>
                          <div className="mt-1 break-all font-mono text-cyan-100">
                            {event.txHash || "pending"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-sm text-white/50">
                      No funding event proof rows have been indexed for this token yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-500/[0.035] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100/45">
                      Reward Payment Proof
                    </div>
                    <div className="mt-1 text-sm font-bold text-white">
                      {pumpProof?.rewards?.length ? `${pumpProof.rewards.length} payment records indexed` : "No payment records indexed yet"}
                    </div>
                  </div>

                  <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/55">
                    {pumpProof?.proofStatus?.rewardsIndexed ? "payments indexed" : "not paid"}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {pumpProof?.rewards?.length ? (
                    pumpProof.rewards.map((reward) => (
                      <div
                        key={`${reward.rewardType}-${reward.txHash}`}
                        className="grid gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs md:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_1.6fr]"
                      >
                        <div>
                          <div className="text-white/35">Stage</div>
                          <div className="mt-1 font-bold text-white">{reward.rewardType}</div>
                        </div>

                        <div>
                          <div className="text-white/35">Reward Amount</div>
                          <div className="mt-1 font-bold text-emerald-100">
                            {reward.rewardAmountRio.toLocaleString()} RIO
                          </div>
                        </div>

                        <div>
                          <div className="text-white/35">Immediate</div>
                          <div className={reward.claimedImmediate ? "mt-1 font-bold text-emerald-100" : "mt-1 font-bold text-amber-100"}>
                            {reward.claimedImmediate ? "claimed" : "pending"}
                          </div>
                        </div>

                        <div>
                          <div className="text-white/35">Vested</div>
                          <div className={reward.claimedVested ? "mt-1 font-bold text-emerald-100" : "mt-1 font-bold text-amber-100"}>
                            {reward.claimedVested ? "claimed" : "pending"}
                          </div>
                          <div className={reward.forfeited ? "mt-1 text-rose-100" : "mt-1 text-white/35"}>
                            {reward.forfeited ? "forfeited" : "not forfeited"}
                          </div>
                        </div>

                        <div>
                          <div className="text-white/35">Payment Tx</div>
                          <div className="mt-1 break-all font-mono text-cyan-100">
                            {reward.txHash || "pending"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-sm text-white/50">
                      No creator reward payment rows have been indexed for this token yet.
                    </div>
                  )}
                </div>
              </div>

              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-[560px] w-[560px] rounded-full bg-[#FF8A32]/14 blur-[170px]" />
        <div className="absolute top-16 right-[-160px] h-[560px] w-[560px] rounded-full bg-[#8b1039]/12 blur-[180px]" />
        <div className="absolute bottom-[-220px] left-[18%] h-[720px] w-[720px] rounded-full bg-[#1F2937]/34 blur-[210px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),rgba(0,0,0,0.70))]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-8">
        <div className={clsx(card, "p-6")}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 flex-1 gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_18px_70px_rgba(0,0,0,0.35)]">
                {displayLogoUrl ? (
                  <img
                    src={displayLogoUrl}
                    alt={`${displaySymbol} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-black text-cyan-100">
                    {displaySymbol.slice(0, 2)}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.20em] text-slate-300/90">
                  RioExplorer • SPO-20
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="text-2xl font-semibold tracking-tight text-white">
                    {displayName}
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-100">
                    {displaySymbol}
                  </span>
                </div>

                {displayDescription ? (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                    {displayDescription}
                  </p>
                ) : (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    No public token description has been indexed yet.
                  </p>
                )}

                <div className="mt-2 break-all font-mono text-sm text-slate-200">
                  {address}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/rioexplorer/spo20"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Back to Tokens
              </Link>
              <Link
                href={RIODEX_SCREENER_ROUTE}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Screener
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              className={clsx(chip, tab === "pairs" && chipActive)}
              onClick={() => setTab("pairs")}
              type="button"
            >
              Pairs ({pairs.length})
            </button>
            <button
              className={clsx(chip, tab === "holders" && chipActive)}
              onClick={() => setTab("holders")}
              type="button"
            >
              Holders ({holders.length})
            </button>
            <button
              className={clsx(chip, tab === "activity" && chipActive)}
              onClick={() => setTab("activity")}
              type="button"
            >
              Activity ({txs.length})
            </button>
          </div>

          {meta ? (
            <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(8,18,32,0.78),rgba(4,8,18,0.92))] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-200/70">
                    Metadata Intelligence
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">
                    Shared SPO-20 metadata for Pump, Prime, CreateToken, and future token rails.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-100">
                    {metadataStandard}
                  </span>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-100">
                    Rail: {String(metadataRail)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold text-white/75">
                    Source: {String(metadataSource)}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                    Description Status
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {displayDescription ? "Indexed" : "Pending"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                    Logo Status
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {displayLogoUrl ? "Indexed" : "Fallback initials"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                    Metadata Updated
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {metadataUpdatedAt ? fmtTs(String(metadataUpdatedAt)) : "Pending"}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                    Social Links
                  </div>

                  {metadataSocials.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {metadataSocials.map((item) => (
                        <a
                          key={item.label}
                          href={String(item.value)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500/15"
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-slate-400">
                      No public social links indexed yet.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                    Immutable Metadata Proof
                  </div>
                  <div className="mt-2 break-all font-mono text-sm text-slate-300">
                    {metadataProofHash || "Pending metadata proof hash"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 text-sm text-slate-300">Loading…</div>
          ) : err ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="text-sm font-bold text-red-200">
                Token metadata pending
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-red-200/80">
                {err}
              </pre>
            </div>
          ) : meta ? (
            <div className={tableWrap}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Field</th>
                    <th className={th}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/10">
                    <td className={td}>Symbol</td>
                    <td className={clsx(td, "font-semibold text-white")}>
                      {displaySymbol}
                    </td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Name</td>
                    <td className={td}>{displayName}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Description</td>
                    <td className={td}>{displayDescription || "—"}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Logo</td>
                    <td className={clsx(td, "break-all")}>
                      {displayLogoUrl ? (
                        <a
                          href={displayLogoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-200 hover:underline"
                        >
                          {displayLogoUrl}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Decimals</td>
                    <td className={td}>{String(meta.onchain?.decimals ?? 6)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Total Supply</td>
                    <td className={td}>
                      {meta.onchain?.total_supply
                        ? fmtAmount(meta.onchain.total_supply, decimals)
                        : "—"}
                    </td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Creator</td>
                    <td className={td}>{shortAddr(meta.creator)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Factory</td>
                    <td className={td}>{shortAddr(meta.factory_address)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Created Height</td>
                    <td className={td}>{String(meta.height)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Created At</td>
                    <td className={td}>{fmtTs(meta.created_at)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Tx Hash</td>
                    <td className={clsx(td, "break-all font-mono")}>
                      {meta.tx_hash ? (
                        <Link
                          href={`/rioexplorer/tx/${meta.tx_hash}`}
                          className="hover:underline"
                        >
                          {meta.tx_hash}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-300">Token not found.</div>
          )}
        </div>

        <div className={clsx(card, "mt-6 p-6")}>
          {loading ? (
            <div className="text-sm text-slate-300">Loading…</div>
          ) : err ? (
            <div className="text-sm text-slate-300">—</div>
          ) : tab === "pairs" ? (
            pairs.length ? (
              <div className={tableWrap}>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={th}>Counterpart</th>
                      <th className={th}>Pair</th>
                      <th className={th}>Pool</th>
                      <th className={th}>Created</th>
                      <th className={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pairs.map((p) => {
                      const pairLabel = `${p.token0_symbol || p.token0}/${p.token1_symbol || p.token1}`;
                      const pairRoutes = buildRioDexSurfaceHref(p.pair_id);
                      return (
                        <tr key={p.pair_id} className="border-t border-white/10">
                          <td className={clsx(td, "font-semibold text-white")}>
                            {p.counterpart_symbol || shortAddr(p.counterpart_token)}
                          </td>
                          <td className={td}>{pairLabel}</td>
                          <td className={clsx(td, "font-mono")}>
                            {shortAddr(p.pair_id, 14, 8)}
                          </td>
                          <td className={td}>{fmtTs(p.created_at)}</td>
                          <td className={td}>
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={pairRoutes.pool}
                                className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                              >
                                Open Terminal
                              </Link>
                              <Link
                                href={RIODEX_SCREENER_ROUTE}
                                className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                              >
                                Screener
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-300">No market pairs indexed yet.</div>
            )
          ) : tab === "holders" ? (
            holders.length ? (
              <div className={tableWrap}>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={th}>Holder</th>
                      <th className={th}>Balance</th>
                      <th className={th}>Updated Height</th>
                      <th className={th}>Updated At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.map((h) => (
                      <tr key={h.address} className="border-t border-white/10">
                        <td className={clsx(td, "font-mono")}>
                          {shortAddr(h.address, 14, 8)}
                        </td>
                        <td className={clsx(td, "font-mono")}>
                          {fmtAmount(h.balance, decimals)}
                        </td>
                        <td className={td}>{String(h.updated_height)}</td>
                        <td className={td}>{fmtTs(h.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-300">No holders indexed yet.</div>
            )
          ) : txs.length ? (
            <div className={tableWrap}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Time</th>
                    <th className={th}>Action</th>
                    <th className={th}>From</th>
                    <th className={th}>To</th>
                    <th className={th}>Amount</th>
                    <th className={th}>Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t, i) => (
                    <tr key={`${t.tx_hash}-${i}`} className="border-t border-white/10">
                      <td className={td}>{fmtTs(t.created_at)}</td>
                      <td className={clsx(td, "font-semibold text-white")}>{t.action}</td>
                      <td className={clsx(td, "font-mono")}>{shortAddr(t.sender, 12, 8)}</td>
                      <td className={clsx(td, "font-mono")}>{shortAddr(t.recipient, 12, 8)}</td>
                      <td className={clsx(td, "font-mono")}>{fmtAmount(t.amount, decimals)}</td>
                      <td className={clsx(td, "font-mono")}>
                        {t.tx_hash ? (
                          <Link
                            href={`/rioexplorer/tx/${t.tx_hash}`}
                            className="hover:underline"
                            title={t.tx_hash}
                          >
                            {t.tx_hash.slice(0, 12)}…{t.tx_hash.slice(-8)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-slate-300">No activity indexed yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
