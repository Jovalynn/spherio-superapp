import Link from "next/link";
import {
  getPumpLifecycleIntelligence,
  type PumpLifecycleInput,
} from "@/lib/pump/pump-lifecycle-intelligence";
import { getPumpLifecycleInputForToken } from "@/lib/pump/pump-lifecycle-data";
import { getPumpTradeChartData } from "@/lib/pump/pump-trade-chart-data";
import PumpTradePanel from "./PumpTradePanel";
import { PumpPhaseTabs } from "@/components/pump/PumpPhaseTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ address: string }>;
  searchParams?: Promise<{ created?: string; sim?: string }>;
};

function getPumpSimulationInput(sim?: string): PumpLifecycleInput | null {
  if (!sim) return null;

  const base: PumpLifecycleInput = {
    tokenName: "Simulated Pump Token",
    tokenSymbol: "SIM",
    creatorAddress: "rio1simulationcreator0000000000000000000000000",
    bondingCurveLive: true,
    indexerReady: true,
  };

  if (sim === "empty") {
    return {
      tokenName: "Simulated Pump Token",
      tokenSymbol: "SIM",
      creatorAddress: "rio1simulationcreator0000000000000000000000000",
      indexerReady: false,
    };
  }

  if (sim === "bonding") {
    return {
      ...base,
      bondingCurveProgressPercent: 25,
      bondingCurveRaisedStableEquivalent: 16_250,
      tradeCount: 40,
      buyCount: 30,
      sellCount: 10,
      uniqueBuyers: 25,
      marketCapUsd: 75_000,
    };
  }

  if (sim === "near-graduation") {
    return {
      ...base,
      bondingCurveProgressPercent: 92,
      bondingCurveRaisedStableEquivalent: 59_800,
      tradeCount: 220,
      buyCount: 160,
      sellCount: 60,
      uniqueBuyers: 120,
      marketCapUsd: 180_000,
      liquidityUsd: 25_000,
    };
  }

  if (sim === "graduation") {
    return {
      ...base,
      bondingCurveProgressPercent: 100,
      bondingCurveRaisedStableEquivalent: 65_000,
      graduationThresholdReached: true,
      tradeCount: 300,
      buyCount: 210,
      sellCount: 90,
      uniqueBuyers: 220,
      marketCapUsd: 250_000,
      marketCapSustainDays250k: 3,
    };
  }

  if (sim === "lp-missing") {
    return {
      ...base,
      bondingCurveProgressPercent: 100,
      bondingCurveRaisedStableEquivalent: 65_000,
      graduationThresholdReached: true,
      liquiditySeeded: true,
      liquiditySeedStableEquivalent: 15_000,
      lpBurnedOrDeadWalleted: false,
      tradeCount: 400,
      buyCount: 290,
      sellCount: 110,
      uniqueBuyers: 240,
      marketCapUsd: 260_000,
      marketCapSustainDays250k: 3,
      liquidityUsd: 45_000,
    };
  }

  if (sim === "stage1") {
    return {
      ...base,
      bondingCurveProgressPercent: 100,
      bondingCurveRaisedStableEquivalent: 65_000,
      graduationThresholdReached: true,
      liquiditySeeded: true,
      liquiditySeedStableEquivalent: 15_000,
      lpBurnedOrDeadWalleted: true,
      tradeCount: 500,
      buyCount: 360,
      sellCount: 140,
      uniqueBuyers: 220,
      marketCapUsd: 260_000,
      marketCapSustainDays250k: 3,
      liquidityUsd: 70_000,
      holderCount: 260,
      topHolderConcentrationPercent: 20,
      suspiciousVolumeRatio: 0.05,
      sniperScore: 0.1,
      walletClusterRiskScore: 0.1,
      creatorSelfBuyRiskScore: 0.02,
    };
  }

  if (sim === "stage2") {
    return {
      ...base,
      bondingCurveProgressPercent: 100,
      bondingCurveRaisedStableEquivalent: 65_000,
      graduationThresholdReached: true,
      liquiditySeeded: true,
      liquiditySeedStableEquivalent: 15_000,
      lpBurnedOrDeadWalleted: true,
      tradeCount: 800,
      buyCount: 570,
      sellCount: 230,
      uniqueBuyers: 280,
      marketCapUsd: 520_000,
      marketCapSustainDays250k: 3,
      marketCapSustainDays500k: 4,
      liquidityUsd: 90_000,
      holderCount: 420,
      topHolderConcentrationPercent: 18,
      suspiciousVolumeRatio: 0.04,
      sniperScore: 0.08,
      walletClusterRiskScore: 0.08,
      creatorSelfBuyRiskScore: 0.02,
    };
  }

  if (sim === "stage3") {
    return {
      ...base,
      bondingCurveProgressPercent: 100,
      bondingCurveRaisedStableEquivalent: 65_000,
      graduationThresholdReached: true,
      liquiditySeeded: true,
      liquiditySeedStableEquivalent: 15_000,
      lpBurnedOrDeadWalleted: true,
      tradeCount: 1_050,
      buyCount: 760,
      sellCount: 290,
      uniqueBuyers: 650,
      marketCapUsd: 1_050_000,
      marketCapSustainDays250k: 3,
      marketCapSustainDays500k: 4,
      marketCapSustainDays1m: 4,
      liquidityUsd: 120_000,
      holderCount: 900,
      topHolderConcentrationPercent: 16,
      suspiciousVolumeRatio: 0.03,
      sniperScore: 0.05,
      walletClusterRiskScore: 0.07,
      creatorSelfBuyRiskScore: 0.01,
    };
  }

  if (sim === "risk") {
    return {
      ...base,
      bondingCurveProgressPercent: 100,
      bondingCurveRaisedStableEquivalent: 65_000,
      graduationThresholdReached: true,
      liquiditySeeded: true,
      liquiditySeedStableEquivalent: 15_000,
      lpBurnedOrDeadWalleted: true,
      tradeCount: 1_200,
      buyCount: 900,
      sellCount: 300,
      uniqueBuyers: 700,
      marketCapUsd: 1_100_000,
      marketCapSustainDays250k: 3,
      marketCapSustainDays500k: 4,
      marketCapSustainDays1m: 4,
      liquidityUsd: 140_000,
      holderCount: 950,
      topHolderConcentrationPercent: 48,
      suspiciousVolumeRatio: 0.35,
      sniperScore: 0.48,
      walletClusterRiskScore: 0.5,
      creatorSelfBuyRiskScore: 0.3,
    };
  }

  if (sim === "paid") {
    return {
      ...base,
      bondingCurveProgressPercent: 100,
      bondingCurveRaisedStableEquivalent: 65_000,
      graduationThresholdReached: true,
      liquiditySeeded: true,
      liquiditySeedStableEquivalent: 15_000,
      lpBurnedOrDeadWalleted: true,
      tradeCount: 1_100,
      buyCount: 770,
      sellCount: 330,
      uniqueBuyers: 650,
      marketCapUsd: 1_050_000,
      marketCapSustainDays250k: 3,
      marketCapSustainDays500k: 4,
      marketCapSustainDays1m: 4,
      liquidityUsd: 120_000,
      holderCount: 900,
      topHolderConcentrationPercent: 16,
      suspiciousVolumeRatio: 0.03,
      sniperScore: 0.05,
      walletClusterRiskScore: 0.07,
      creatorSelfBuyRiskScore: 0.01,
      rewardStageOnePaid: true,
      rewardStageTwoPaid: true,
      rewardStageThreePaid: true,
    };
  }

  return null;
}

function formatUsd(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPercent(value?: number | null) {
  return `${Number(value || 0).toFixed(0)}%`;
}

function formatPrecisePercent(value?: number | null) {
  const n = Number(value || 0);

  if (!Number.isFinite(n)) return "0.00%";
  if (n > 0 && n < 1) return `${n.toFixed(2)}%`;
  if (n < 10) return `${n.toFixed(2)}%`;

  return `${n.toFixed(1)}%`;
}

function shortAddress(value: string) {
  if (!value) return "—";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}


function PumpTradeMiniChart({
  points,
  progressPercent,
}: {
  progressPercent: number;
  points: {
    index: number;
    priceRio: number;
    side: "buy" | "sell";
    rioAmount?: number;
    tokenAmount?: number;
    traderAddress?: string;
    txHash?: string;
    blockHeight?: number;
  }[];
}) {
  const width = 520;
  const height = 180;
  const padding = 18;
  const normalizedProgress = Math.max(0, Math.min(Number(progressPercent || 0), 100));
  const progressX = padding + (normalizedProgress / 100) * (width - padding * 2);
  if (!points.length) {
    return (
      <div className="rounded-[28px] border border-cyan-300/18 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.10),transparent_34%),linear-gradient(180deg,rgba(6,17,32,0.78),rgba(3,7,15,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.26)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">
              Bonding Curve Chart
            </div>
            <div className="mt-1 text-xs text-white/42">
              Indexed buy/sell price path from pump_live_trades.
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-right">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[9px] uppercase tracking-[0.14em] text-white/35">Trades</div>
              <div className="mt-1 text-xs font-bold text-white">0</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[9px] uppercase tracking-[0.14em] text-white/35">Min Price</div>
              <div className="mt-1 text-xs font-bold text-white">—</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[9px] uppercase tracking-[0.14em] text-white/35">Max Price</div>
              <div className="mt-1 text-xs font-bold text-white">—</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex min-h-[340px] flex-col items-center justify-center rounded-[24px] border border-dashed border-cyan-300/24 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.10),transparent_36%),linear-gradient(180deg,rgba(3,12,24,0.72),rgba(1,5,12,0.94))] px-6 text-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            No trades yet
          </div>

          <div className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-white">
            This bonding curve is live.
          </div>

          <p className="mt-3 max-w-lg text-sm leading-6 text-white/58">
            The chart will begin drawing after the first indexed buy or sell. Use the Pump Trade panel below to start the curve.
          </p>

          <div className="mt-7 w-full max-w-xl">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-white/35">
              <span>Curve progress</span>
              <span>{normalizedProgress.toFixed(2)}%</span>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-cyan-300"
                style={{ width: `${normalizedProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/24 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/60">
                Recent Trades
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                No indexed trades yet.
              </div>
            </div>

            <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
              0 trades
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-white/52">
            The first buy or sell will appear here and draw the bonding curve chart.
          </p>
        </div>
      </div>
    );
  }

  const prices = points.map((point) => point.priceRio).filter((value) => value > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const tradeCount = points.length;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, max * 0.02, 0.00000001);

  const coords = points.map((point, i) => {
    const x =
      padding +
      (points.length === 1
        ? (width - padding * 2) / 2
        : (i / (points.length - 1)) * (width - padding * 2));

    const y =
      height -
      padding -
      ((point.priceRio - min) / range) * (height - padding * 2);

    return {
      ...point,
      x,
      y,
    };
  });

  const pathData = coords
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="rounded-[28px] border border-cyan-300/18 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.10),transparent_34%),linear-gradient(180deg,rgba(6,17,32,0.78),rgba(3,7,15,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.26)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-100/72">
            Bonding Curve Chart
          </div>
          <div className="mt-1 text-xs text-white/52">
            Indexed buy/sell price path from pump_live_trades.
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right">
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-white/35">Trades</div>
            <div className="mt-1 text-xs font-bold text-white">{tradeCount}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-white/35">Min Price</div>
            <div className="mt-1 text-xs font-bold text-white">{minPrice.toFixed(8)} RIO</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-white/35">Max Price</div>
            <div className="mt-1 text-xs font-bold text-white">{maxPrice.toFixed(8)} RIO</div>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-5 h-[340px] w-full overflow-visible rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(2,10,22,0.86),rgba(0,3,10,0.96))]"
        role="img"
        aria-label="Pump bonding curve trade chart"
      >
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-cyan-300"
        />

        {coords.map((point) => (
          <circle
            key={`${point.index}-${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r={point.side === "buy" ? 3.5 : 3}
            className={point.side === "buy" ? "fill-emerald-300" : "fill-rose-300"}
          />
        ))}
      </svg>

      <div className="mt-3 flex items-center justify-between text-xs text-white/45">
        <span>First trade</span>
        <span>Latest price: {points.at(-1)?.priceRio.toFixed(10)} RIO</span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/24 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">
            Recent Trades
          </div>
          <div className="text-xs text-white/35">
            Last {Math.min(points.length, 12)}
          </div>
        </div>

        <div className="mt-3 grid max-h-[260px] gap-2 overflow-y-auto pr-1 [scrollbar-color:rgba(34,211,238,0.45)_rgba(255,255,255,0.06)] [scrollbar-width:thin]">
          {points.slice(-12).reverse().map((trade) => (
            <div
              key={`${trade.index}-${trade.txHash || trade.blockHeight || trade.priceRio}`}
              className="grid grid-cols-[0.55fr_0.9fr_0.9fr_1fr] items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs"
            >
              <div
                className={
                  trade.side === "buy"
                    ? "font-semibold uppercase tracking-[0.12em] text-emerald-200"
                    : "font-semibold uppercase tracking-[0.12em] text-rose-200"
                }
              >
                {trade.side}
              </div>

              <div>
                <div className="text-white/35">RIO</div>
                <div className="font-semibold text-white">
                  {(trade.rioAmount || 0).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}
                </div>
              </div>

              <div>
                <div className="text-white/35">Tokens</div>
                <div className="font-semibold text-white">
                  {(trade.tokenAmount || 0).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-white/35">
                  {String(trade.traderAddress || "").startsWith("backend:")
                    ? "Source"
                    : "Trader"}
                </div>
                <div className="truncate font-mono text-white/65">
                  {String(trade.traderAddress || "").startsWith("backend:")
                    ? "Backend Test"
                    : trade.traderAddress
                      ? `${trade.traderAddress.slice(0, 10)}…${trade.traderAddress.slice(-6)}`
                      : trade.txHash
                        ? `${trade.txHash.slice(0, 10)}…${trade.txHash.slice(-6)}`
                        : "pending"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function PumpTokenPage({ params, searchParams }: PageProps) {
  const { address } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const showCreatedBanner = String(resolvedSearchParams?.created || "") === "1";
  const sim = String(resolvedSearchParams?.sim || "");

  const lifecycleData = await getPumpLifecycleInputForToken(address);
  const tradeChart = await getPumpTradeChartData(address);
  const simulationInput = getPumpSimulationInput(sim);
  const intelligence = getPumpLifecycleIntelligence(simulationInput || lifecycleData.input);
  const lifecycleInput = (simulationInput || lifecycleData.input) as any;
  const anyRewardPaid = intelligence.rewards.stages.some((stage) => stage.paid);
  const anyRewardEligible = intelligence.rewards.stages.some(
    (stage) => stage.eligible && !stage.blocked,
  );
  const displayedSustainDays =
    Number(lifecycleInput.marketCapSustainDays1m || 0) > 0
      ? {
          current: Number(lifecycleInput.marketCapSustainDays1m || 0),
          required: 4,
        }
      : Number(lifecycleInput.marketCapSustainDays500k || 0) > 0
        ? {
            current: Number(lifecycleInput.marketCapSustainDays500k || 0),
            required: 4,
          }
        : {
            current: Number(lifecycleInput.marketCapSustainDays250k || 0),
            required: 3,
          };
  const graduationChecklistItems = [
    intelligence.bondingCurve.progressPercent >= 100,
    intelligence.graduation.pending || intelligence.graduation.liquiditySeeded,
    intelligence.graduation.liquiditySeeded,
    intelligence.graduation.lpBurnedOrDeadWalleted,
    intelligence.graduation.lpBurnedOrDeadWalleted,
    intelligence.graduation.lpBurnedOrDeadWalleted,
  ];
  const graduationVerifiedCount = graduationChecklistItems.filter(Boolean).length;
  const graduationRequiredCount = graduationChecklistItems.length;
  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const tokenPagePath = `/createtoken/pump/token/${encodeURIComponent(address)}`;
  const tokenPageUrl = `${appBaseUrl}${tokenPagePath}`;

  const titleTickerMatch = intelligence.title.match(/\(([^)]+)\)/);
  const titleNameMatch = intelligence.title.match(/^([^()]+?)(?:\s*\(|$)/);

  const tokenSymbol =
    titleTickerMatch?.[1]?.trim() ||
    lifecycleInput?.ticker ||
    lifecycleInput?.symbol ||
    lifecycleInput?.tokenSymbol ||
    lifecycleInput?.token?.ticker ||
    lifecycleInput?.token?.symbol ||
    lifecycleInput?.asset?.ticker ||
    lifecycleInput?.asset?.symbol ||
    lifecycleInput?.metadata?.ticker ||
    lifecycleInput?.metadata?.symbol ||
    titleNameMatch?.[1]?.trim() ||
    "TOKEN";

  return (
    <main className="min-h-screen bg-[#05060a] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        {showCreatedBanner ? (
          <section className="rounded-3xl border border-emerald-300/25 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.18),transparent_34%),linear-gradient(145deg,rgba(8,18,28,0.98),rgba(4,7,15,0.99))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.34)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200/80">
                  Token Created
                </div>

                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-white">
                  {tokenSymbol} Created Successfully
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                  Congratulations — {tokenSymbol} is now live in the Bonding Curve phase.
                </p>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">
                  Next step: start market activity and monitor organic buyers, curve progress, graduation readiness, and reward eligibility.
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-xs leading-5 text-cyan-100/80">
                Lifecycle handoff complete: Creation → Bonding Curve → Graduation → Rewards.
              </div>
            </div>
          </section>
        ) : null}

        {simulationInput ? (
          <section className="rounded-3xl border border-amber-300/25 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="font-bold uppercase tracking-[0.18em]">Simulation Mode</div>
            <div className="mt-1 text-amber-100/75">
              Viewing simulated Pump lifecycle state: {sim}. This does not represent indexed on-chain token data.
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(217,70,239,0.18),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(34,211,238,0.12),transparent_36%),linear-gradient(145deg,rgba(12,16,32,0.98),rgba(4,7,15,0.99))] p-6 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/70">
                Pump.live lifecycle
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
                {intelligence.title}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
                {intelligence.subtitle}
              </p>
            </div>

            <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 px-5 py-4 text-right">
              <div className="text-xs uppercase tracking-[0.22em] text-fuchsia-100/60">
                Lifecycle phase
              </div>
              <div className="mt-2 text-xl font-semibold capitalize text-white">
                {intelligence.phase.replace("_", " ")}
              </div>
              <div className="mt-1 text-xs text-white/45">
                {intelligence.stage.replaceAll("_", " ")}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                {String(lifecycleData.input.tokenName || "Pump Token")}
                {lifecycleData.input.tokenSymbol ? ` (${lifecycleData.input.tokenSymbol})` : ""}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.22em] text-white/40">
                Token Address
              </div>
            </div>
            <div className="mt-2 break-all font-mono text-sm text-white">
              {address}
            </div>
            <div className="mt-2 text-xs text-white/45">
              Short ID: {shortAddress(address)}
            </div>

            <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-500/[0.06] px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/45">
                Token Page URL
              </div>
              <div className="mt-1 select-all break-all font-mono text-xs text-cyan-100">
                {tokenPageUrl}
              </div>
              <div className="mt-1 text-[11px] leading-5 text-white/42">
                Creator can copy this route and access the token lifecycle page from any browser on the deployed app domain.
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-500/[0.06] px-3 py-2 text-xs text-cyan-100/70">
              Lifecycle source: {lifecycleData.source}
              {lifecycleData.error ? ` · ${lifecycleData.error}` : ""}
              {lifecycleData.row?.richQueryError ? ` · rich query warning: ${lifecycleData.row.richQueryError}` : ""}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/createtoken/pump/board?token=${encodeURIComponent(address)}`}
              className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15 px-4 py-2 text-sm text-fuchsia-100"
            >
              View on PUMP Board
            </Link>

            <Link
              href={`/riodex/swap?token=${encodeURIComponent(address)}`}
              className="rounded-full border border-orange-300/30 bg-orange-500/15 px-4 py-2 text-sm text-orange-100"
            >
              Trade on RioDex
            </Link>

            <Link
              href={`/rioex/assets/${encodeURIComponent(address)}`}
              className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100"
            >
              View on RioEx
            </Link>

            <Link
              href={`/rioexplorer/spo20/${encodeURIComponent(address)}`}
              className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm text-white/80"
            >
              Explorer Proof
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-300/15 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.10),transparent_30%),linear-gradient(145deg,rgba(8,14,28,0.96),rgba(4,7,15,0.99))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/75">
                Lifecycle Intelligence
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-white">
                Understand Your Token Path
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
                This page tracks the full Pump lifecycle from bonding activity to graduation readiness and creator reward eligibility.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-xs leading-5 text-white/58">
              Live token state is resolved from indexed curve activity, LP proof, market health, and reward checks.
            </div>
          </div>
        </section>

        <PumpPhaseTabs>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
              Phase 1
            </div>
            <h2 className="mt-2 text-2xl font-semibold">Bonding Curve</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {intelligence.bondingCurve.explanation}
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Curve status
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {intelligence.bondingCurve.live ? "Live" : "Not live"}
                </div>
                <div className="mt-2 rounded-xl border border-cyan-300/15 bg-cyan-500/[0.06] px-3 py-2 text-xs font-semibold text-cyan-100/70">
                  {intelligence.bondingCurve.tradingStatus === "awaiting_first_trade"
                    ? "Awaiting first trade"
                    : intelligence.bondingCurve.tradingStatus === "active_trading"
                      ? "Active trading"
                      : intelligence.bondingCurve.tradingStatus === "graduation_threshold_reached"
                        ? "Graduation threshold reached"
                        : "Curve not live"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Progress
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatPrecisePercent(intelligence.bondingCurve.progressPercent)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Raised
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatUsd(intelligence.bondingCurve.raisedStableEquivalent)}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.05] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">
                  Participation
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Trades
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {intelligence.bondingCurve.tradeCount.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Buys
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {intelligence.bondingCurve.buyCount.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Sells
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {intelligence.bondingCurve.sellCount.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Buyers
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {intelligence.bondingCurve.uniqueBuyers.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.05] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">
                  Curve Progress Summary
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Raised
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {formatUsd(intelligence.bondingCurve.raisedStableEquivalent)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Target
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {formatUsd(intelligence.bondingCurve.graduationTargetStableEquivalent)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Remaining
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {formatUsd(intelligence.bondingCurve.remainingToGraduationStableEquivalent)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Progress
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {formatPrecisePercent(intelligence.bondingCurve.progressPercent)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-300"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(intelligence.bondingCurve.progressPercent, 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <PumpTradeMiniChart
                points={tradeChart.points}
                progressPercent={intelligence.bondingCurve.progressPercent}
              />

              <PumpTradePanel
                tokenAddress={address}
                symbol={String(lifecycleData.input.tokenSymbol || "PUMP")}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-orange-200/70">
                  Phase 2
                </div>
                <h2 className="mt-2 text-2xl font-semibold">Graduation</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
                  {intelligence.graduation.explanation}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-300/20 bg-orange-500/[0.08] px-4 py-3 text-right">
                <div className="text-[10px] uppercase tracking-[0.16em] text-orange-100/55">
                  Graduation Status
                </div>
                <div className="mt-1 text-lg font-bold text-white">
                  {intelligence.graduation.liquiditySeeded && intelligence.graduation.lpBurnedOrDeadWalleted
                    ? "Ready / Verified"
                    : intelligence.bondingCurve.progressPercent >= 100
                      ? "Graduation Pending"
                      : "Awaiting Curve Target"}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Curve Target
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatUsd(intelligence.bondingCurve.graduationTargetStableEquivalent)}
                </div>
                <div className="mt-2 text-xs text-white/45">
                  Progress: {formatPrecisePercent(intelligence.bondingCurve.progressPercent)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Protocol LP Seed
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatUsd(intelligence.graduation.liquiditySeedStableEquivalent)}
                </div>
                <div className="mt-2 text-xs text-white/45">
                  Required before post-graduation market readiness.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Finalization
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {intelligence.graduation.liquiditySeeded ? "LP Seeded" : "Pending"}
                </div>
                <div className="mt-2 text-xs text-white/45">
                  Graduation completes after LP proof and market handoff.
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-orange-300/15 bg-orange-500/[0.05] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-orange-100/60">
                    Graduation Checklist
                  </div>
                  <div className="mt-1 text-sm text-white/55">
                    Requirements that must be satisfied before the token is fully graduated.
                  </div>
                </div>

                <div className="rounded-full border border-orange-300/20 bg-black/20 px-3 py-1 text-xs font-bold text-orange-100">
                  {graduationVerifiedCount} / {graduationRequiredCount} verified
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  {
                    label: "Curve target reached",
                    status: intelligence.bondingCurve.progressPercent >= 100,
                    detail: `${formatPrecisePercent(intelligence.bondingCurve.progressPercent)} of curve target reached.`,
                  },
                  {
                    label: "Graduation event indexed",
                    status: intelligence.bondingCurve.progressPercent >= 100,
                    detail: "Indexer must observe the graduation threshold or finalization event.",
                  },
                  {
                    label: "Protocol LP seed",
                    status: intelligence.graduation.liquiditySeeded,
                    detail: `${formatUsd(intelligence.graduation.liquiditySeedStableEquivalent)} protocol LP seed requirement.`,
                  },
                  {
                    label: "LP proof / burn proof",
                    status: intelligence.graduation.lpBurnedOrDeadWalleted,
                    detail: "LP must be burned, dead-walleted, or otherwise verifiably locked.",
                  },
                  {
                    label: "RioDex pair readiness",
                    status: intelligence.graduation.liquiditySeeded,
                    detail: "Trading pair becomes the post-graduation market surface.",
                  },
                  {
                    label: "RioExplorer proof",
                    status: intelligence.graduation.lpBurnedOrDeadWalleted,
                    detail: "Explorer records should prove graduation, LP seed, and liquidity safety.",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-black/24 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {item.label}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-white/48">
                          {item.detail}
                        </div>
                      </div>

                      <div
                        className={
                          item.status
                            ? "rounded-full border border-emerald-300/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100"
                            : "rounded-full border border-amber-300/25 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-100"
                        }
                      >
                        {item.status ? "Verified" : "Pending"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.05] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">
                Graduation Handoff
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                Bonding Curve → LP Seed → LP Proof → RioDex Pair → RioExplorer Proof → Creator Rewards
              </div>
              <p className="mt-2 text-xs leading-5 text-white/52">
                Creator rewards remain locked until graduation proof, liquidity proof, organic buyer checks, sustainability checks, and risk checks are satisfied.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Link
                  href={`/rioexplorer/spo20/${encodeURIComponent(address)}`}
                  className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-center text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/16"
                >
                  Token Contract Proof
                </Link>

                <Link
                  href={`/rioexplorer/spo20/${encodeURIComponent(address)}?proof=graduation`}
                  className="rounded-xl border border-orange-300/20 bg-orange-500/10 px-3 py-2 text-center text-xs font-bold text-orange-100 transition hover:bg-orange-500/16"
                >
                  Graduation Proof
                </Link>

                <Link
                  href={`/rioexplorer/spo20/${encodeURIComponent(address)}?proof=lp`}
                  className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-center text-xs font-bold text-emerald-100 transition hover:bg-emerald-500/16"
                >
                  LP Proof
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-emerald-200/70">
              Phase 3
            </div>
            <h2 className="mt-2 text-2xl font-semibold">Creator Rewards</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {intelligence.rewards.explanation}
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/[0.07] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/65">
                  Reward Status
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Reward Eligible
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {anyRewardPaid ? "Completed" : anyRewardEligible ? "Eligible" : "Not yet"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Market Health
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {intelligence.health.total >= 80
                        ? "Strong"
                        : intelligence.health.total >= 60
                          ? "Improving"
                          : "Needs activity"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Organic Buyers
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {intelligence.bondingCurve.uniqueBuyers} / 200 minimum
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Sustainability
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {displayedSustainDays.current} / {displayedSustainDays.required} days
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Risk
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {intelligence.health.total >= 60 ? "Low / monitored" : "Monitoring required"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Payment Status
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {intelligence.rewards.stages.some((stage) => stage.paid)
                        ? "Paid"
                        : intelligence.rewards.stages.some((stage) => stage.eligible && !stage.blocked)
                          ? "Payment pending"
                          : "Not eligible"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 sm:col-span-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Reward Lock
                    </div>
                    <div className="mt-1 text-xs leading-5 text-white/45">
                      Reward checks remain locked until LP seed/proof, market sustainability, organic buyer thresholds, and anti-manipulation checks pass.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.05] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/50">
                  Reward Path
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  LP Proof → Sustain Market → Organic Buyers → Risk Pass → Reward Unlock
                </div>
                <div className="mt-2 text-xs leading-5 text-white/50">
                  Creator rewards are progress-based. Graduation alone does not unlock payout.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                  RioExplorer Reward Proofs
                </div>
                <p className="mt-2 text-xs leading-5 text-white/52">
                  Reward status should remain verifiable through token history, eligibility records, and payout proof.
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Link
                    href={`/rioexplorer/spo20/${encodeURIComponent(address)}?proof=reward-eligibility`}
                    className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-center text-xs font-bold text-emerald-100 transition hover:bg-emerald-500/16"
                  >
                    Eligibility Proof
                  </Link>

                  <Link
                    href={`/rioexplorer/spo20/${encodeURIComponent(address)}?proof=reward-payment`}
                    className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/10 px-3 py-2 text-center text-xs font-bold text-fuchsia-100 transition hover:bg-fuchsia-500/16"
                  >
                    Payment Proof
                  </Link>

                  <Link
                    href={`/rioexplorer/spo20/${encodeURIComponent(address)}`}
                    className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-center text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/16"
                  >
                    Token History
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.05] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">
                  Graduation Economics
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">
                      Graduation target
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      $65,000
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">
                      Protocol LP seed
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      $15,000
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">
                      Remaining after seed
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      {formatUsd(intelligence.rewards.remainingAfterSeedStableEquivalent)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">
                      Creator rewards
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      {formatUsd(intelligence.rewards.creatorRewardReserveStableEquivalent)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-cyan-300/15 bg-black/20 px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/50">
                    Projected Ecosystem Development Reserve
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {formatUsd(intelligence.rewards.ecosystemDevelopmentReserveStableEquivalent)}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/50">
                    Supports ecosystem development, protocol sustainability, safety systems, analytics, and market operations.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Remaining after LP seed
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatUsd(intelligence.rewards.remainingAfterSeedStableEquivalent)}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-300/15 bg-emerald-500/[0.05] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/50">
                    Projected Creator Reward Reserve
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {formatUsd(intelligence.rewards.creatorRewardReserveStableEquivalent)}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-white/50">
                    Projected after protocol LP seed. Rewards unlock only after LP proof, market milestones, sustainability, organic buyer thresholds, and risk checks.
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.05] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/50">
                    Projected Ecosystem Development Reserve
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {formatUsd(intelligence.rewards.ecosystemDevelopmentReserveStableEquivalent)}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-white/50">
                    Projected after protocol LP seed. Supports ecosystem development, protocol sustainability, liquidity operations, analytics, safety systems, market infrastructure, and ecosystem growth.
                  </div>
                </div>
              </div>



              {intelligence.rewards.stages.map((stage) => (
                <div
                  key={stage.id}
                  className="rounded-2xl border border-emerald-300/15 bg-emerald-500/[0.05] p-4"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/50">
                    {stage.label}
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {stage.rewardPercentOfRemainingFunds}% at{" "}
                    {formatUsd(stage.milestoneMarketCapUsd)}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-white/55">
                    {stage.sustainDays > 0 ? `Sustain: ${stage.sustainDays} days · ` : ""}
                    Payout: {stage.stableWeightPercent}% stable / {stage.rioWeightPercent}% RIO
                  </div>
                  <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60">
                    {stage.reason}
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-amber-300/15 bg-amber-500/[0.05] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-amber-100/50">
                  Reward integrity checks
                </div>
                <div className="mt-2 grid gap-2 text-xs leading-5 text-white/60">
                  <div>No reward before LP seed/proof.</div>
                  <div>No instant reward immediately after graduation.</div>
                  <div>No wash trading, suspicious wallet clusters, fake organic buyers, or creator self-buy manipulation.</div>
                  <div>Reward path should show eligibility, market health, organic buyers, sustainability, and risk status.</div>
                </div>
              </div>


            </div>
          </div>
        </PumpPhaseTabs>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
              Market Health
            </div>
            <div className="mt-2 text-5xl font-semibold">
              {intelligence.health.total}
              <span className="text-xl text-white/40">/100</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {intelligence.health.explanation}
            </p>

            <div className="mt-5 grid gap-2">
              {[
                ["Liquidity stability", intelligence.health.liquidityStability],
                ["Holder distribution", intelligence.health.holderDistribution],
                ["Organic volume", intelligence.health.organicVolume],
                ["Low bot activity", intelligence.health.lowBotActivity],
                ["Market cap sustainability", intelligence.health.marketCapSustainability],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm"
                >
                  <span className="text-white/55">{label}</span>
                  <span className="font-semibold text-white">{value}/20</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-amber-200/70">
              Risk / Indexer Requirements
            </div>

            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
              <div className="text-sm font-semibold text-amber-100">
                Risk flags
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {intelligence.riskFlags.length > 0 ? (
                  intelligence.riskFlags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100"
                    >
                      {flag.replaceAll("_", " ")}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    No active risk flags
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/24 p-4">
              <div className="text-sm font-semibold text-white">
                Indexer requirements
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {intelligence.indexerRequirements.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55"
                  >
                    {item.replaceAll("_", " ")}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-fuchsia-300/15 bg-fuchsia-500/[0.06] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-fuchsia-100/70">
              Creator view
            </div>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {intelligence.creatorFacingExplanation}
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-500/[0.06] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-cyan-100/70">
              Public view
            </div>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {intelligence.publicFacingExplanation}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs uppercase tracking-[0.25em] text-white/40">
            Next lifecycle action
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {intelligence.nextAction.label}
          </div>
          <p className="mt-2 text-sm leading-6 text-white/60">
            {intelligence.nextAction.reason}
          </p>
        </section>
      </div>
    </main>
  );
}
