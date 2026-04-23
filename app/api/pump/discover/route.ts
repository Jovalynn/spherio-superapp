import { NextRequest, NextResponse } from "next/server";
import { getPumpLaunchSurfaceState } from "@/lib/launch/authority";

type DiscoverSort = "trending" | "progress" | "marketCap" | "new";

type PumpDiscoverRequest = {
  sort?: DiscoverSort;
  limit?: number;
  symbol?: string;
  totalSupply?: string | number;
};

type PumpBoardRow = {
  rank: number;
  tokenAddress: string;
  tokenName: string;
  symbol: string;
  launchRail: "pump.live";
  standard: "SPO-20";
  baseAsset: "RIO";
  stage: "momentum" | "watch" | "ready" | "graduated";
  stageLabel: string;
  progressPercent: number;
  impliedMarketCapRio: number;
  effectivePriceRio: number;
  participantCount: number;
  watcherCount: number;
  momentumScore: number;
  earlyFloatPercent: number;
  volume24hRio: number;
  liquidityCommittedRio: number;
  trendDirection: "up" | "flat" | "down";
  createdAtLabel: string;
  score: number;
};

type IndexerSpo20Item = {
  asset_id: string;
  token_address: string;
  contract_address: string;
  symbol: string;
  display_name: string;
  decimals: number;
  logo: string | null;
  asset_type: string;
  explorer_route: string;
  creator: string | null;
  height: number | null;
  created_at: string | null;
  is_verified: boolean;
  is_tradeable: boolean;
  is_canonical: boolean;
  source: string;
  market?: {
    pair_address: string | null;
    display_symbol: string | null;
    pair_created_time: string | null;
    effective_price: string | null;
    last_trade_time: string | null;
    reserve_0: string | null;
    reserve_1: string | null;
    total_share: string | null;
    trades_24h: number;
    volume_24h: string;
  } | null;
};

type IndexerSpo20Response = {
  ok: boolean;
  count?: number;
  registry_present?: boolean;
  items?: IndexerSpo20Item[];
};

function getIndexerBaseUrl() {
  return (
    process.env.INTERNAL_INDEXER_URL ||
    process.env.INDEXER_URL ||
    "http://indexer:4000"
  );
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function ageLabelToMinutes(label: string): number {
  const normalized = label.trim().toLowerCase();

  if (normalized === "just now") return 0;

  const match = normalized.match(/^(\d+)\s*([mhdw]|mo|y)$/);
  if (!match) return 999999;

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "m") return value;
  if (unit === "h") return value * 60;
  if (unit === "d") return value * 60 * 24;
  if (unit === "w") return value * 60 * 24 * 7;
  if (unit === "mo") return value * 60 * 24 * 30;
  if (unit === "y") return value * 60 * 24 * 365;

  return 999999;
}

function minutesSince(dateLike?: string | null) {
  if (!dateLike) return null;
  const ts = new Date(dateLike).getTime();
  if (!Number.isFinite(ts)) return null;
  const diff = Date.now() - ts;
  if (diff < 0) return null;
  return Math.max(1, Math.floor(diff / 60000));
}

function labelFromDate(index: number, createdAt?: string | null) {
  const minutes = minutesSince(createdAt);
  if (minutes !== null) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
  return index === 0 ? "3m" : index === 1 ? "7m" : `${(index + 1) * 5}m`;
}

function sortBoard(rows: PumpBoardRow[], sort: DiscoverSort): PumpBoardRow[] {
  const next = [...rows];

  if (sort === "progress") {
    next.sort((a, b) => b.progressPercent - a.progressPercent);
  } else if (sort === "marketCap") {
    next.sort((a, b) => b.impliedMarketCapRio - a.impliedMarketCapRio);
  } else if (sort === "new") {
    next.sort(
      (a, b) => ageLabelToMinutes(a.createdAtLabel) - ageLabelToMinutes(b.createdAtLabel),
    );
  } else {
    next.sort((a, b) => b.score - a.score);
  }

  return next.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function scoreBoard(rows: PumpBoardRow[]): PumpBoardRow[] {
  return rows.map((row) => {
    const score =
      row.progressPercent * 0.4 +
      row.momentumScore * 0.25 +
      row.watcherCount * 0.12 +
      row.participantCount * 0.08 +
      row.liquidityCommittedRio * 0.0001 +
      row.volume24hRio * 0.00005;

    return {
      ...row,
      score: Number(score.toFixed(4)),
    };
  });
}

function buildFallbackRows(totalSupply: number): PumpBoardRow[] {
  const state = getPumpLaunchSurfaceState();

  const cards = [
    ...(state.apexLeader ? [state.apexLeader] : []),
    ...state.monitorCards.filter(
      (card) => card.tokenAddress !== state.apexLeader?.tokenAddress,
    ),
    ...state.newlyLaunched.filter(
      (card) =>
        card.tokenAddress !== state.apexLeader?.tokenAddress &&
        !state.monitorCards.some((m) => m.tokenAddress === card.tokenAddress),
    ),
  ];

  return cards.map((card, index) => {
    const stage =
      card.trend === "ready" ? "ready" : card.trend === "hot" ? "watch" : "momentum";

    return {
      rank: index + 1,
      tokenAddress: card.tokenAddress,
      tokenName: card.tokenName,
      symbol: card.symbol,
      launchRail: "pump.live",
      standard: "SPO-20",
      baseAsset: "RIO",
      stage,
      stageLabel:
        stage === "ready" ? "Graduation Watch" : stage === "watch" ? "Building Demand" : "Momentum",
      progressPercent: card.progressPercent,
      impliedMarketCapRio: card.marketCapUsd,
      effectivePriceRio: Math.max(card.marketCapUsd / totalSupply, 0.000001),
      participantCount: stage === "ready" ? 180 : stage === "watch" ? 124 : 68,
      watcherCount: card.trend === "hot" ? 144 : card.trend === "ready" ? 112 : 64,
      momentumScore: card.trend === "hot" ? 82 : card.trend === "ready" ? 76 : 58,
      earlyFloatPercent: stage === "ready" ? 1.62 : 1.21,
      volume24hRio: Math.max(card.marketCapUsd * 0.08, 100),
      liquidityCommittedRio: Math.max(card.marketCapUsd * 0.03, 75),
      trendDirection: card.trend === "watch" ? "flat" : "up",
      createdAtLabel: card.ageLabel,
      score: 0,
    };
  });
}

function buildIndexerRows(items: IndexerSpo20Item[], totalSupply: number): PumpBoardRow[] {
  return items.slice(0, 12).map((item, index) => {
    const effectivePrice = toNumber(item.market?.effective_price, 0.00053);
    const reserve0 = toNumber(item.market?.reserve_0, 0);
    const reserve1 = toNumber(item.market?.reserve_1, 0);
    const volume24h = toNumber(item.market?.volume_24h, 0);
    const trades24h = Number(item.market?.trades_24h ?? 0);

    const impliedMarketCapRio =
      effectivePrice > 0
        ? Math.max(effectivePrice * totalSupply, 2400)
        : index === 0
          ? 707580
          : index === 1
            ? 621740
            : Math.max(2400, 540000 - index * 60000);

    const progressPercent =
      reserve1 > 0
        ? Math.max(8, Math.min(100, Math.round((reserve1 / 62500) * 100)))
        : index === 0
          ? 76
          : index === 1
            ? 64
            : Math.max(16, 54 - index * 5);

    const watcherCount =
      trades24h > 0
        ? Math.max(24, trades24h * 3)
        : index === 0
          ? 144
          : index === 1
            ? 112
            : Math.max(28, 90 - index * 8);

    const participantCount =
      reserve0 > 0
        ? Math.max(12, Math.round(reserve0 / 1500))
        : index === 0
          ? 180
          : index === 1
            ? 124
            : Math.max(20, 76 - index * 5);

    const momentumScore =
      Math.max(
        18,
        Math.min(
          95,
          Math.round(progressPercent * 0.6 + watcherCount * 0.15 + Math.min(volume24h / 5000, 20)),
        ),
      );

    const stage =
      progressPercent >= 70 ? "ready" : progressPercent >= 35 ? "watch" : "momentum";

    return {
      rank: index + 1,
      tokenAddress: item.token_address,
      tokenName: item.display_name,
      symbol: item.symbol,
      launchRail: "pump.live",
      standard: "SPO-20",
      baseAsset: "RIO",
      stage,
      stageLabel:
        stage === "ready" ? "Graduation Watch" : stage === "watch" ? "Building Demand" : "Momentum",
      progressPercent,
      impliedMarketCapRio,
      effectivePriceRio: Math.max(effectivePrice, impliedMarketCapRio / totalSupply),
      participantCount,
      watcherCount,
      momentumScore,
      earlyFloatPercent: stage === "ready" ? 1.62 : 1.21,
      volume24hRio: Math.max(volume24h, 100),
      liquidityCommittedRio: Math.max(reserve1, 75),
      trendDirection: trades24h > 0 ? "up" : "flat",
      createdAtLabel: labelFromDate(index, item.market?.last_trade_time ?? item.created_at),
      score: 0,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PumpDiscoverRequest;

    const sort: DiscoverSort =
      body.sort === "progress" ||
      body.sort === "marketCap" ||
      body.sort === "new"
        ? body.sort
        : "trending";

    const limit = Math.min(Math.max(Math.floor(toNumber(body.limit, 8)), 1), 50);
    const totalSupply = Math.max(toNumber(body.totalSupply, 1_000_000_000), 1);
    const symbolFilter = (body.symbol || "").toString().trim().toUpperCase();

    let rows: PumpBoardRow[] = [];
    let source = "fallback_authority_shape";

    try {
      const response = await fetch(`${getIndexerBaseUrl()}/api/spo20`, {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as IndexerSpo20Response;

      if (response.ok && data.ok && Array.isArray(data.items) && data.items.length > 0) {
        rows = buildIndexerRows(data.items, totalSupply);
        source = "indexer_registry_market_bridge";
      }
    } catch {
      // fallback below
    }

    if (!rows.length) {
      rows = buildFallbackRows(totalSupply);
    }

    rows = scoreBoard(rows);

    if (symbolFilter) {
      rows = rows.filter(
        (row) =>
          row.symbol.toUpperCase().includes(symbolFilter) ||
          row.tokenName.toUpperCase().includes(symbolFilter),
      );
    }

    rows = sortBoard(rows, sort).slice(0, limit);

    return NextResponse.json({
      ok: true,
      source,
      board: rows,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Pump discovery board.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
