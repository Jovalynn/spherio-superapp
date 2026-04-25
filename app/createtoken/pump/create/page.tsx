"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getKeplrSigner, getSigningClient } from "@/lib/cosm";
import { PumpLiveGraduationPanel } from "../../../../src/components/pump-live/PumpLiveGraduationPanel";
import { PumpLiveIncentivesPanel } from "../../../../src/components/pump-live/PumpLiveIncentivesPanel";
import { PumpLiveSafetyPanel } from "../../../../src/components/pump-live/PumpLiveSafetyPanel";
import type { PumpLiveMarket } from "../../../../src/lib/pump-live/types";

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
  stage?: string;
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

type PumpLaunchSurfaceState = {
  apexLeader: LaunchCardState | null;
  newlyLaunched: LaunchCardState[];
  monitorCards: LaunchCardState[];
  lifecycle: LaunchLifecycleState;
};

type PumpLaunchSurfaceResponse = {
  ok: boolean;
  error?: string;
  state?: PumpLaunchSurfaceState;
  source?: string;
};

type PumpCreateApiSuccess = {
  ok: true;
  tokenAddress?: string;
  txHash?: string;
  symbol?: string;
  tokenName?: string;
  message?: string;
  discoveryUrl?: string;
  screenerUrl?: string;
  tradeUrl?: string;
  liquidityUrl?: string;
  rioExUrl?: string;
  rioExplorerUrl?: string;
  coinGeckoHintUrl?: string;
  coinMarketCapHintUrl?: string;
};

type PumpCreateApiError = {
  ok: false;
  error?: string;
};

type PumpCreateApiResponse = PumpCreateApiSuccess | PumpCreateApiError;

function isPumpCreateError(data: PumpCreateApiResponse): data is PumpCreateApiError {
  return data.ok === false;
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function RailButton({
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
        "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
        active
          ? "border-cyan-400/50 bg-cyan-400/12 text-cyan-200"
          : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function accentClasses(accent?: LaunchCardAccent) {
  switch (accent) {
    case "aqua":
      return "from-cyan-500/18 via-sky-500/8 to-transparent border-cyan-400/30";
    case "sunset":
      return "from-orange-500/18 via-amber-500/8 to-transparent border-orange-400/30";
    case "violet":
      return "from-fuchsia-500/18 via-violet-500/8 to-transparent border-fuchsia-400/30";
    case "gold":
      return "from-yellow-500/18 via-amber-500/8 to-transparent border-yellow-400/30";
    case "mint":
      return "from-emerald-500/18 via-teal-500/8 to-transparent border-emerald-400/30";
    case "amber":
      return "from-amber-500/18 via-yellow-500/8 to-transparent border-amber-400/30";
    case "slate":
      return "from-slate-400/18 via-zinc-400/8 to-transparent border-slate-400/30";
    case "emerald":
      return "from-emerald-500/18 via-lime-500/8 to-transparent border-emerald-400/30";
    default:
      return "from-cyan-500/18 via-sky-500/8 to-transparent border-cyan-400/30";
  }
}

function compactMoney(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function isGraduated(card: LaunchCardState) {
  const stage = (card.stage || "").toLowerCase();
  return stage.includes("graduated");
}

function discoverHref(card: LaunchCardState) {
  const q = encodeURIComponent(card.tokenAddress || card.id);
  return `/createtoken/pump/board?token=${q}`;
}

function extractContractAddressFromExecute(result: any): string | null {
  const logs = result?.logs ?? [];
  for (const log of logs) {
    const events = log?.events ?? [];
    for (const event of events) {
      const attrs = event?.attributes ?? [];
      for (const attr of attrs) {
        const key = String(attr?.key || "");
        const value = String(attr?.value || "");
        if (key === "_contract_address" || key === "contract_address" || key === "token_address") {
          return value || null;
        }
      }
    }
  }

  const events = result?.events ?? [];
  for (const event of events) {
    const attrs = event?.attributes ?? [];
    for (const attr of attrs) {
      const key = String(attr?.key || "");
      const value = String(attr?.value || "");
      if (key === "_contract_address" || key === "contract_address" || key === "token_address") {
        return value || null;
      }
    }
  }

  return null;
}

function toBaseUnits(value: string, decimals = 6): bigint {
  const raw = value.trim();
  if (!raw) return 0n;
  const [wholePart, fracPart = ""] = raw.split(".");
  const whole = wholePart.replace(/[^\d]/g, "") || "0";
  const frac = fracPart.replace(/[^\d]/g, "").slice(0, decimals).padEnd(decimals, "0");
  return BigInt(`${whole}${frac}`);
}

function PumpTokenCard({ card }: { card: LaunchCardState }) {
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${accentClasses(card.accent)} bg-[#08101d] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm font-bold text-white">
            {card.symbol.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{card.tokenName}</div>
            <div className="text-[11px] text-white/45">{card.symbol}</div>
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/70">
          {card.trend}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-2xl font-semibold tracking-tight text-white">
          {compactMoney(card.marketCapUsd)}
        </div>
        <div className="mt-1 text-[11px] text-white/50">{card.ageLabel}</div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[11px] text-white/55">
          <span>Bonding curve progression</span>
          <span>{card.progressPercent.toFixed(2)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-300"
            style={{ width: `${Math.min(card.progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-white/65">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          Discovery surface
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          Live indexed state
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          RioExplorer route
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          Curve-tracked
        </div>
      </div>

      <div className="mt-4">
        <Link
          href={discoverHref(card)}
          className="inline-flex h-8 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/15"
        >
          Discover
        </Link>
      </div>
    </div>
  );
}

export default function PumpCreatePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [surfaceState, setSurfaceState] = useState<PumpLaunchSurfaceState | null>(null);
  const [loadingSurface, setLoadingSurface] = useState(true);
  const [surfaceError, setSurfaceError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showSocialLinks, setShowSocialLinks] = useState(true);

  const [walletAddress, setWalletAddress] = useState("");
  const [connectingWallet, setConnectingWallet] = useState(false);

  const [coinName, setCoinName] = useState("");
  const [ticker, setTicker] = useState("");
  const [supply, setSupply] = useState("1000000000");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFilePreview, setSelectedFilePreview] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(null);
  const [createdTxHash, setCreatedTxHash] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const factoryAddress =
    process.env.NEXT_PUBLIC_PUMP_FACTORY_ADDRESS ||
    process.env.NEXT_PUBLIC_SPO20_FACTORY_ADDRESS ||
    "";

  const factoryFeeUrio =
    process.env.NEXT_PUBLIC_PUMP_CREATE_FEE_URIO ||
    process.env.NEXT_PUBLIC_CREATE_TOKEN_FEE_URIO ||
    "5000000";

  async function loadSurface() {
    try {
      setLoadingSurface(true);
      setSurfaceError(null);

      const response = await fetch("/api/launches/pump", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as PumpLaunchSurfaceResponse;

      if (!response.ok || !data.ok || !data.state) {
        throw new Error(data.error || "Failed to load pump launch surface.");
      }

      setSurfaceState(data.state);
    } catch (err) {
      setSurfaceError(err instanceof Error ? err.message : "Failed to load pump launch surface.");
      setSurfaceState(null);
    } finally {
      setLoadingSurface(false);
    }
  }

  useEffect(() => {
    void loadSurface();
  }, []);

  const apexLeader = surfaceState?.apexLeader ?? null;

  const newlyCreated = useMemo(() => {
    return (surfaceState?.newlyLaunched ?? []).filter((card) => !isGraduated(card));
  }, [surfaceState]);

  const filteredCards = useMemo(() => {
    const source = (surfaceState?.monitorCards ?? []).filter((card) => !isGraduated(card));
    const q = search.trim().toLowerCase();

    if (!q) return source;

    return source.filter((card) => {
      return (
        card.tokenName.toLowerCase().includes(q) ||
        card.symbol.toLowerCase().includes(q) ||
        card.tokenAddress.toLowerCase().includes(q) ||
        card.id.toLowerCase().includes(q)
      );
    });
  }, [surfaceState, search]);

  async function connectWallet() {
    try {
      setConnectingWallet(true);
      const { address } = await getKeplrSigner();
      setWalletAddress(address);
      setSubmitError(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to connect wallet.");
    } finally {
      setConnectingWallet(false);
    }
  }

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setSelectedFileName(file?.name ?? "");
    setSelectedFilePreview(file ? URL.createObjectURL(file) : "");
  }

  async function handleCreatePumpToken() {
    setSubmitError(null);
    setSubmitNotice(null);
    setCreatedTokenAddress(null);
    setCreatedTxHash(null);
    setCopyNotice(null);

    if (!factoryAddress) {
      setSubmitError("Missing NEXT_PUBLIC_PUMP_FACTORY_ADDRESS or NEXT_PUBLIC_SPO20_FACTORY_ADDRESS.");
      return;
    }

    if (!coinName.trim()) {
      setSubmitError("Coin name is required.");
      return;
    }

    if (!ticker.trim()) {
      setSubmitError("Ticker is required.");
      return;
    }

    if (!description.trim()) {
      setSubmitError("Description is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const baseSupply = toBaseUnits(supply, 6);
      if (baseSupply <= 0n) {
        throw new Error("Supply must be greater than zero.");
      }

      const { signer, address: sender } = await getKeplrSigner();
      setWalletAddress(sender);

      const client = await getSigningClient(signer);

      const msg = {
        create_token: {
          name: coinName.trim(),
          symbol: ticker.trim().toUpperCase(),
          initial_supply: baseSupply.toString(),
          mintable: false,
        },
      };

      const funds = [{ denom: "urio", amount: factoryFeeUrio }];

      const execResult = await client.execute(
        sender,
        factoryAddress,
        msg,
        "auto",
        "Pump.live Create Token",
        funds,
      );

      const tokenAddress = extractContractAddressFromExecute(execResult);
      const txHash = execResult?.transactionHash || "";

      if (!tokenAddress) {
        throw new Error("Create transaction succeeded, but no token address was found in the result.");
      }

      const formData = new FormData();
      formData.append("coinName", coinName.trim());
      formData.append("tokenName", coinName.trim());
      formData.append("ticker", ticker.trim().toUpperCase());
      formData.append("symbol", ticker.trim().toUpperCase());
      formData.append("totalSupply", supply.trim());
      formData.append("description", description.trim());
      formData.append("website", website.trim());
      formData.append("twitter", twitter.trim());
      formData.append("telegram", telegram.trim());
      formData.append("discord", discord.trim());
      formData.append("tokenAddress", tokenAddress);
      formData.append("txHash", txHash);
      formData.append("creatorAddress", sender);

      if (selectedFile) {
        formData.append("logo", selectedFile);
      }

      const response = await fetch("/api/pump/create", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as PumpCreateApiResponse;

      if (!response.ok || isPumpCreateError(data)) {
        throw new Error(
          isPumpCreateError(data) ? data.error || "Pump token publish failed." : "Pump token publish failed.",
        );
      }

      setSubmitNotice(
        data.message ||
          "Pump token created and published. It will propagate through discovery surfaces as indexer state updates.",
      );
      setCreatedTokenAddress(data.tokenAddress || tokenAddress);
      setCreatedTxHash(data.txHash || txHash);

      await loadSurface();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Pump token creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyNotice("Copied");
      window.setTimeout(() => setCopyNotice(null), 1500);
    } catch {
      setCopyNotice("Copy failed");
      window.setTimeout(() => setCopyNotice(null), 1500);
    }
  }

  const pumpLiveMarket = useMemo<PumpLiveMarket>(() => {
    const progress = surfaceState?.lifecycle?.progressPercent ?? apexLeader?.progressPercent ?? 0;
    const reserveValueRUSD =
      apexLeader?.marketCapUsd && apexLeader.progressPercent
        ? Math.min(15000, (apexLeader.marketCapUsd * apexLeader.progressPercent) / 100)
        : 0;

    return {
      token: {
        tokenAddress: createdTokenAddress || apexLeader?.tokenAddress || "pending",
        name: coinName || apexLeader?.tokenName || "Pump.live Token",
        symbol: ticker || apexLeader?.symbol || "PUMP",
        logoUri: selectedFilePreview || apexLeader?.logoUrl || null,
        creator: walletAddress || null,
        status: "bonding",
        route: "pump_live",
        riodexPairAddress: null,
        createdTxHash,
        createdBlockHeight: null
      },
      graduation: {
        enabled: true,
        status: "bonding",
        targetMarketCapRusd: "69000.000000",
        targetCurveRioReserveRusd: "15000.000000",
        graduationQuoteValueRusd: "15000.000000",
        graduationQuoteAsset: "urio",
        pairQuoteDisplayAsset: "RUSD",
        autoCreateRioDexPair: true,
        rioDexFactory: "rio14ph4e660eyqz0j36zlkaey4zgzexm5twkmjlqaequxr2cjm9eprqguevzw",
        postGraduationCurveDisabled: true,
        postGraduationTradingSurface: "riodex",
        liquiditySeeded: false,
        lpLocked: false,
        lpLockDurationSeconds: 31536000,
        lpOwner: "protocol_locked",
        pairAddress: null,
        reserveValueRusd: reserveValueRUSD.toFixed(6),
        marketCapRusd: String(apexLeader?.marketCapUsd ?? 0),
        seededTokenAmount: "200000000000000",
        seededUrioAmount: null
      },
      creatorIncentives: {
        enabled: true,
        rewardSource: "graduation_surplus_only",
        neverFromRequiredLiquidity: true,
        baseRewardBps: 500,
        milestoneRewards: [
          {
            name: "market_cap_250k",
            conditionType: "market_cap_rusd",
            thresholdRusd: "250000.000000",
            rewardBps: 250,
            achieved: Boolean(apexLeader && apexLeader.marketCapUsd >= 250000)
          },
          {
            name: "market_cap_500k",
            conditionType: "market_cap_rusd",
            thresholdRusd: "500000.000000",
            rewardBps: 250,
            achieved: Boolean(apexLeader && apexLeader.marketCapUsd >= 500000)
          }
        ],
        maxTotalCreatorRewardBps: 1000,
        vesting: {
          enabled: true,
          immediateReleaseBps: 5000,
          delayedReleaseBps: 5000,
          delayedReleaseSeconds: 604800,
          forfeitIfEmergencyFlagged: true
        },
        rewardStatus: "none",
        surplusUrio: null,
        creatorRewardUrio: null,
        vestedImmediateUrio: null,
        vestedDelayedUrio: null,
        unlockTime: null
      },
      userIncentives: {
        enabled: true,
        type: "voluntary_lock_rewards",
        rewardAccounting: "points_first",
        lockOptions: [
          { lockPeriodSeconds: 604800, label: "7 days", pointsMultiplierBps: 10500 },
          { lockPeriodSeconds: 1209600, label: "14 days", pointsMultiplierBps: 11500 },
          { lockPeriodSeconds: 2592000, label: "30 days", pointsMultiplierBps: 13500 },
          { lockPeriodSeconds: 7776000, label: "90 days", pointsMultiplierBps: 17500 }
        ],
        nonLockingUsers: {
          canTradeNormally: true,
          penaltyEnabled: false
        },
        possibleRewards: [
          "pump_live_points",
          "fee_rebates",
          "holder_badges",
          "future_launch_eligibility",
          "creator_campaign_rewards"
        ]
      },
      safetyControls: {
        antiSniper: {
          enabled: true,
          launchProtectionBlocks: 10,
          maxBuyPerTxDuringLaunch: {
            display: "1000000",
            baseUnits: "1000000000000",
            denom: "token"
          },
          maxWalletDuringLaunch: {
            display: "5000000",
            baseUnits: "5000000000000",
            denom: "token"
          },
          sameBlockSellBlocked: true,
          oneTradePerWalletPerBlock: true
        },
        bulkBuyProtection: {
          enabled: true,
          rollingWindowSeconds: 600,
          maxWalletAccumulationDuringWindow: {
            display: "10000000",
            baseUnits: "10000000000000",
            denom: "token"
          },
          repeatedBuyCooldownSeconds: 5
        },
        mevProtection: {
          enabled: true,
          requiredSlippageBps: true,
          defaultMaxSlippageBps: 500,
          maxPriceImpactBps: 1000,
          sameBlockBuySellBlocked: true,
          commitRevealForLargeBuys: {
            enabled: false,
            futureUpgrade: true
          }
        },
        antiRug: {
          enabled: true,
          creatorAllocationDefaultBps: 0,
          requiredLiquiditySeedFirst: true,
          lpLockRequired: true,
          lpLockDurationSeconds: 31536000,
          creatorRewardVestingRequired: true,
          ownerCanWithdrawRequiredLiquidity: false,
          ownerCanMintAfterLaunch: false,
          ownerCanChangeFeesAfterLaunch: false,
          ownerCanDisableSells: false,
          emergencyPause: {
            enabled: true,
            allowedOnlyForExploitResponse: true,
            requiresPublicReason: true
          }
        }
      },
      disclosures: {
        showLauncherWarning: true,
        showNoGuaranteeWarning: true,
        showLiquidityLockStatus: true,
        showCreatorAllocation: true,
        showFeeBreakdown: true,
        showSurplusPolicy: true,
        showUserLockRewards: true,
        showSafetyControls: true
      },
      status: "bonding",
      graduationProgressPct: Math.max(0, Math.min(100, progress)),
      requiredGraduationRUSD: 15000,
      reserveValueRUSD,
      riodexPairAddress: null,
      creatorReward: {
        baseRewardPct: 5,
        milestone250kPct: 2.5,
        milestone500kPct: 2.5,
        maxRewardPct: 10,
        vestingLabel: "50% immediate, 50% after 7 days"
      },
      userLocks: [
        { lockPeriodSeconds: 604800, seconds: 604800, label: "7 days", pointsMultiplierBps: 10500, multiplier: "1.05x" },
        { lockPeriodSeconds: 1209600, seconds: 1209600, label: "14 days", pointsMultiplierBps: 11500, multiplier: "1.15x" },
        { lockPeriodSeconds: 2592000, seconds: 2592000, label: "30 days", pointsMultiplierBps: 13500, multiplier: "1.35x" },
        { lockPeriodSeconds: 7776000, seconds: 7776000, label: "90 days", pointsMultiplierBps: 17500, multiplier: "1.75x" }
      ],
      safety: {
        antiSniper: true,
        launchProtectionBlocks: 10,
        bulkBuyProtection: true,
        maxWalletLaunchTokens: "5,000,000 tokens",
        mevProtection: true,
        antiRug: true,
        lpLockRequired: true
      }
    };
  }, [
    apexLeader,
    coinName,
    createdTokenAddress,
    createdTxHash,
    selectedFilePreview,
    surfaceState?.lifecycle?.progressPercent,
    ticker,
    walletAddress
  ]);

  return (
    <main className="min-h-screen bg-[#030813] text-white">
      <div className="mx-auto w-full max-w-[1680px] px-4 pb-10 pt-6 md:px-6 xl:px-8">
        <section className="rounded-2xl border border-[#23314f] bg-[linear-gradient(180deg,rgba(12,20,38,.88),rgba(7,12,24,.98))] px-5 py-4 shadow-[0_20px_80px_rgba(0,0,0,.25)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] uppercase tracking-[0.24em] text-fuchsia-200/75">
                Pump.live / Create
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Create → Curve → LP → Market
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                Launch from the Pump create surface, discover live momentum,
                and route into Screener, Prime, RioExplorer, and Trade.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatPill
                label="Lifecycle"
                value={surfaceState?.lifecycle ? `${surfaceState.lifecycle.progressPercent.toFixed(2)}%` : "—"}
              />
              <StatPill label="Active Cards" value={`${filteredCards.length}`} />
              <StatPill label="Mode" value="Create Surface" />
              <StatPill label="Network" value="Devnet" />
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="mx-auto max-w-[760px] rounded-2xl border border-[#23314f] bg-[#09111f] p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.22em] text-fuchsia-200/70">
                  Create PUMP
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                  Create PUMP Token
                </h2>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <RailButton href="/createtoken/pump/board" label="Discovery" />
                <RailButton href="/riodex/screener" label="Screener" />
                <RailButton href="/rioexplorer" label="RioExplorer" />
                <RailButton href="/createtoken/prime" label="Prime" />
                <RailButton href="/riodex/swap" label="Trade" />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={connectingWallet}
                  className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 disabled:opacity-50"
                >
                  {connectingWallet ? "Connecting..." : walletAddress ? "Wallet connected" : "Connect wallet"}
                </button>

                {walletAddress ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/75">
                    {walletAddress}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#0a1220] p-4 md:p-5">
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">Coin name</label>
                    <input
                      value={coinName}
                      onChange={(e) => setCoinName(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-white/25"
                      placeholder="Name your coin"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">Ticker</label>
                    <input
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-white/25"
                      placeholder="DOGE"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-white/75">Total supply</label>
                  <input
                    value={supply}
                    onChange={(e) => setSupply(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-white/25"
                    placeholder="1000000000"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-white/75">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full rounded-2xl border border-white/10 bg-[#040916] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                    placeholder="Write a short description"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-[#040916] p-4">
                  <button
                    type="button"
                    onClick={() => setShowSocialLinks((prev) => !prev)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium text-white">
                      Add social links <span className="text-white/45">(Optional)</span>
                    </span>
                    <span className="text-white/50">{showSocialLinks ? "−" : "+"}</span>
                  </button>

                  {showSocialLinks ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">Website</label>
                        <input
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="h-11 w-full rounded-xl border border-white/10 bg-[#08101d] px-4 text-sm text-white outline-none placeholder:text-white/25"
                          placeholder="https://"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">X / Twitter</label>
                        <input
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          className="h-11 w-full rounded-xl border border-white/10 bg-[#08101d] px-4 text-sm text-white outline-none placeholder:text-white/25"
                          placeholder="@project"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">Telegram</label>
                        <input
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          className="h-11 w-full rounded-xl border border-white/10 bg-[#08101d] px-4 text-sm text-white outline-none placeholder:text-white/25"
                          placeholder="t.me/..."
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">Discord</label>
                        <input
                          value={discord}
                          onChange={(e) => setDiscord(e.target.value)}
                          className="h-11 w-full rounded-xl border border-white/10 bg-[#08101d] px-4 text-sm text-white outline-none placeholder:text-white/25"
                          placeholder="discord.gg/..."
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-white/75">Logo / image / GIF</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="rounded-2xl border border-white/10 bg-[#040916] p-4">
                    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/30 bg-[#061022] px-6 text-center">
                      {selectedFilePreview ? (
                        <img
                          src={selectedFilePreview}
                          alt="Selected logo preview"
                          className="mb-4 max-h-28 rounded-xl border border-white/10 object-contain"
                        />
                      ) : null}

                      <div className="text-base font-medium text-white/70">
                        {selectedFileName || "Drag and drop an image or GIF"}
                      </div>

                      <button
                        type="button"
                        onClick={handlePickFile}
                        className="mt-5 rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/15"
                      >
                        Select a file
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreatePumpToken}
                  disabled={isSubmitting}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-5 text-sm font-semibold text-[#04111d] transition hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create PUMP Token"}
                </button>

                {submitError ? (
                  <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {submitError}
                  </div>
                ) : null}

                {submitNotice ? (
                  <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {submitNotice}
                  </div>
                ) : null}

                {createdTokenAddress || createdTxHash ? (
                  <div className="mt-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                    <div className="font-medium">Launch output</div>

                    {createdTokenAddress ? (
                      <div className="mt-2">
                        <div className="text-xs text-cyan-50/80">Created token address</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <div className="break-all rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs text-cyan-50">
                            {createdTokenAddress}
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(createdTokenAddress)}
                            className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200"
                          >
                            Copy
                          </button>
                          <Link
                            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/85"
                            href={`/rioexplorer?address=${encodeURIComponent(createdTokenAddress)}`}
                          >
                            RioExplorer
                          </Link>
                          <Link
                            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/85"
                            href={`/riodex/liquidity?token=${encodeURIComponent(createdTokenAddress)}`}
                          >
                            LP
                          </Link>
                          <Link
                            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/85"
                            href={`/createtoken/pump/board?token=${encodeURIComponent(createdTokenAddress)}`}
                          >
                            Discover now
                          </Link>
                        </div>
                      </div>
                    ) : null}

                    {createdTxHash ? (
                      <div className="mt-3">
                        <div className="text-xs text-cyan-50/80">Transaction hash</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <div className="break-all rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs text-cyan-50">
                            {createdTxHash}
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(createdTxHash)}
                            className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200"
                          >
                            Copy
                          </button>
                          <Link
                            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/85"
                            href={`/rioexplorer/tx/${encodeURIComponent(createdTxHash)}`}
                          >
                            Open tx
                          </Link>
                        </div>
                      </div>
                    ) : null}

                    {copyNotice ? <div className="mt-3 text-xs text-cyan-200">{copyNotice}</div> : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#23314f] bg-[#09111f] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.20em] text-white/45">Apex Leader</div>
                    <div className="mt-1 text-lg font-semibold text-white">{apexLeader?.tokenName || "—"}</div>
                  </div>
                  <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-1 text-[10px] font-medium text-fuchsia-200">
                    Apex
                  </span>
                </div>

                {apexLeader ? (
                  <div className={`rounded-2xl border bg-gradient-to-br ${accentClasses(apexLeader.accent)} p-4`}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-bold text-white">
                        {apexLeader.symbol.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-white">{apexLeader.tokenName}</div>
                        <div className="mt-1 text-[11px] text-white/55">
                          Highest momentum card on Pump.live, pulled from indexed launch state.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-3xl font-semibold tracking-tight text-yellow-300">
                      {compactMoney(apexLeader.marketCapUsd)}
                    </div>
                    <div className="mt-1 text-[11px] text-white/50">{apexLeader.ageLabel}</div>

                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-white/55">
                        <span>Bonding curve progression</span>
                        <span>{apexLeader.progressPercent.toFixed(2)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-300"
                          style={{ width: `${Math.min(apexLeader.progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-white/60">
                    {loadingSurface ? "Loading apex leader..." : "No apex leader available."}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#23314f] bg-[#09111f] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                <div className="text-[10px] uppercase tracking-[0.20em] text-white/45">Newly Created</div>
                <div className="mt-3 space-y-3">
                  {newlyCreated.length ? (
                    newlyCreated.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.04] px-3 py-3"
                      >
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                          New token created
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white">{item.tokenName}</div>
                        <div className="mt-1 text-[11px] text-white/55">{item.ageLabel}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/60">
                      No newly created active pump tokens.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
              <PumpLiveGraduationPanel market={pumpLiveMarket} />
              <PumpLiveIncentivesPanel market={pumpLiveMarket} />
              <PumpLiveSafetyPanel market={pumpLiveMarket} />
            </div>

            <div className="mt-6 rounded-2xl border border-[#23314f] bg-[#09111f] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.20em] text-white/45">Search & Route</div>
                  <div className="mt-1 text-sm text-white/60">
                    Search token cards and route into discovery surfaces.
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search token cards..."
                    className="h-11 min-w-[240px] rounded-xl border border-white/10 bg-[#040916] px-4 text-sm text-white outline-none placeholder:text-white/25"
                  />
                  <button
                    type="button"
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/75 transition hover:bg-white/[0.08]"
                  >
                    Open filter
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <RailButton href="/createtoken/pump/board" label="Discovery" />
                <RailButton href="/riodex/screener" label="Screener" />
                <RailButton href="/rioexplorer" label="RioExplorer" />
                <RailButton href="/createtoken/prime" label="Prime" />
                <RailButton href="/riodex/swap" label="Trade" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#23314f] bg-[#09111f] p-4 md:p-5">
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.20em] text-white/45">Live Pump Cards</div>
            <div className="mt-1 text-sm text-white/60">
              Indexed launch cards from the authoritative pump launch surface.
            </div>
          </div>

          {surfaceError ? (
            <div className="mb-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {surfaceError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {filteredCards.map((card) => (
              <PumpTokenCard key={card.tokenAddress || card.id} card={card} />
            ))}
          </div>

          {!filteredCards.length && !loadingSurface ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/60">
              No active pump cards available right now.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
