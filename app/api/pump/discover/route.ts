import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type DiscoverSort = "trending" | "progress" | "marketCap" | "new";

const RIO_REFERENCE_PRICE_RUSD_ESTIMATE = 0.1;
const GRADUATION_SEED_TOLERANCE = 0.995;

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
  raisedRusdEquivalent: number;
  impliedMarketCapRusd: number;
  impliedMarketCapRio: number;
  effectivePriceRio: number;
  participantCount: number;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  uniqueBuyers: number;
  watcherCount: number;
  momentumScore: number;
  earlyFloatPercent: number;
  volume24hRio: number;
  liquidityCommittedRio: number;
  trendDirection: "up" | "flat" | "down";
  createdAtLabel: string;
  score: number;

  pairAddress?: string | null;
  reserveLabel?: string | null;
  liquidityStatus?: string | null;
  graduationStatus?: string | null;

  requiredSeedValueRusd?: number | null;
  requiredSeedRio?: number | null;
  recordedSeedRio?: number | null;
  actualIndexedSeedRio?: number | null;
  graduationUnderseeded?: boolean;
  graduationDiagnostic?: string | null;

  createdHeight?: number | null;
  routes?: {
    trade: string;
    pool: string | null;
    screener: string;
    explorer: string;
  };
};

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        "postgresql://spherio:spherio@postgres:5432/spherio_indexer",
    });
  }

  return pool;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseLimit(value: unknown, fallback = 8, max = 50) {
  const n = Math.floor(toNumber(value, fallback));
  if (n <= 0) return fallback;
  return Math.min(n, max);
}

function compactAmount(raw: unknown, decimals = 6): string | null {
  if (raw === null || raw === undefined || raw === "") return null;

  const n = Number(raw);
  if (!Number.isFinite(n)) return null;

  const amount = n / Math.pow(10, decimals);

  if (!Number.isFinite(amount)) return null;

  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, "")}B`;
  }

  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
  }

  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(2).replace(/\.00$/, "")}K`;
  }

  return amount.toLocaleString("en-US", {
    maximumFractionDigits: amount < 1 ? 6 : 2,
  });
}

function reserveLabel(row: any): string | null {
  const reserve0 = compactAmount(row.reserve_0, Number(row.asset_0_decimals ?? 6));
  const reserve1 = compactAmount(row.reserve_1, Number(row.asset_1_decimals ?? 6));

  const symbol0 = String(row.asset_0_symbol || row.asset_0_id || "RIO").trim();
  const symbol1 = String(row.asset_1_symbol || row.token_symbol || row.token_name || "").trim();

  if (!reserve0 || !reserve1 || !symbol0 || !symbol1) return null;

  return `${reserve0} ${symbol0} / ${reserve1} ${symbol1}`;
}

function isRioLikeSymbol(value: unknown): boolean {
  const s = String(value || "").trim().toUpperCase();
  return s === "RIO" || s === "URIO" || s === "NATIVE:URIO";
}

function requiredSeedRio(row: any): number {
  const requiredRusd = toNumber(row.required_seed_value_rusd, 15_000);
  if (requiredRusd <= 0) return 0;
  return requiredRusd / RIO_REFERENCE_PRICE_RUSD_ESTIMATE;
}

function recordedSeedRio(row: any): number {
  return toNumber(row.seed_rio_urio, 0) / 1_000_000;
}

function indexedSeedRio(row: any): number {
  // 🔐 Canonical rule: RIO is ALWAYS native denom "urio"
  if (row.asset_0_type === "native" && row.asset_0_id === "urio") {
    return toNumber(row.reserve_0, 0) / 1_000_000;
  }

  if (row.asset_1_type === "native" && row.asset_1_id === "urio") {
    return toNumber(row.reserve_1, 0) / 1_000_000;
  }

  return 0;
}

function graduationUnderseeded(row: any): boolean {
  const target = requiredSeedRio(row);
  if (target <= 0) return false;

  const actual = indexedSeedRio(row);
  const recorded = recordedSeedRio(row);
  const status = String(row.graduation_status || "").toLowerCase();
  const hasPair = Boolean(row.riodex_pair_address || row.pair_address);

  if (!hasPair && (status === "pair_created" || status === "completed")) return true;

  const bestAvailableSeed = Math.max(actual, recorded);
  return bestAvailableSeed > 0 && bestAvailableSeed < target * GRADUATION_SEED_TOLERANCE;
}

function graduationDiagnostic(row: any): string | null {
  if (!graduationUnderseeded(row)) return null;

  const target = requiredSeedRio(row);
  const actual = indexedSeedRio(row);
  const recorded = recordedSeedRio(row);

  return `Required ${target.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} RIO for 15K RUSD target at 0.1 RUSD/RIO; indexed ${actual.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  })} RIO; recorded ${recorded.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  })} RIO.`;
}

function createdAtLabelFromHeight(height: unknown): string {
  const h = toNumber(height, 0);
  if (!h) return "indexed";
  return `h${Math.floor(h)}`;
}

function mapStage(row: any): PumpBoardRow["stage"] {
  const tokenStatus = String(row.token_status || "").toLowerCase();
  const graduationStatus = String(row.graduation_status || "").toLowerCase();

  if (graduationUnderseeded(row)) return "ready";
  if (tokenStatus === "graduated" || graduationStatus === "completed") return "graduated";
  if (tokenStatus === "graduating" || graduationStatus === "pair_created") return "ready";
  if (toNumber(row.real_rio_reserve_urio, 0) > 0) return "watch";
  return "momentum";
}

function stageLabel(stage: PumpBoardRow["stage"], row: any): string {
  const graduationStatus = String(row.graduation_status || "").toLowerCase();

  if (graduationUnderseeded(row)) return "Graduated · LP underseeded";
  if (stage === "graduated") return "Graduated · RioDex Live";
  if (graduationStatus === "pair_created") return "Pair Created · Needs Finalization";
  if (stage === "ready") return "Graduation Watch";
  if (stage === "watch") return "Building Demand";
  return "Momentum";
}

const PUMP_BASELINE_MARKET_CAP_RIO = 0;

function targetMarketCapRio(row: any): number {
  return toNumber(row.target_market_cap_rusd, 65_000);
}

function progressFor(stage: PumpBoardRow["stage"], row: any, marketCapRio = 0): number {
  const indexedProgress = toNumber(row.progress_percent, -1);

  if (indexedProgress >= 0 && stage !== "graduated") {
    return Math.max(0, Math.min(indexedProgress, 100));
  }

  if (graduationUnderseeded(row)) return 96;
  if (stage === "graduated") return 100;

  const graduationStatus = String(row.graduation_status || "").toLowerCase();
  if (graduationStatus === "pair_created") return 92;
  if (stage === "ready") return 88;

  const target = targetMarketCapRio(row);
  if (target <= 0) return 0;

  const effectiveMarketCap = marketCapRio > 0 ? marketCapRio : 0;
  return Math.max(0, Math.min((effectiveMarketCap / target) * 100, 100));
}

function buildRows(dbRows: any[], totalSupply: number): PumpBoardRow[] {
  const rows = dbRows.map((row, index) => {
    const stage = mapStage(row);

    const realRioReserve = toNumber(row.real_rio_reserve_urio, 0) / 1_000_000;
    const realTokenReserve = toNumber(row.real_token_reserve_base, 0) / 1_000_000;
    const virtualRioReserve = toNumber(row.virtual_rio_reserve_urio, 0) / 1_000_000;
    const virtualTokenReserve = toNumber(row.virtual_token_reserve_base, 0) / 1_000_000;

    const hasRealCurveMovement = realRioReserve > 0;

    const effectiveRioReserve = hasRealCurveMovement
      ? realRioReserve + virtualRioReserve
      : 0;

    const effectiveTokenReserve = hasRealCurveMovement
      ? realTokenReserve + virtualTokenReserve
      : 0;

    const effectivePriceRio =
      effectiveTokenReserve > 0 && effectiveRioReserve > 0
        ? effectiveRioReserve / effectiveTokenReserve
        : 0;

    const curveMarketCapRio =
      hasRealCurveMovement && effectivePriceRio > 0 ? effectivePriceRio * totalSupply : 0;

    const indexedMarketCapRusd = toNumber(row.implied_market_cap_rusd, 0);
    const indexedMarketCapRio =
      indexedMarketCapRusd > 0
        ? indexedMarketCapRusd / RIO_REFERENCE_PRICE_RUSD_ESTIMATE
        : 0;

    const impliedMarketCapRio =
      indexedMarketCapRio > 0
        ? indexedMarketCapRio
        : curveMarketCapRio;

    const progressPercent = progressFor(stage, row, impliedMarketCapRio);

    const hasPair = Boolean(row.riodex_pair_address || row.pair_address);
    const hasLiquidity = row.reserve_0 !== null && row.reserve_1 !== null;
    const reserves = reserveLabel(row);

    const requiredSeedValueRusd = toNumber(row.required_seed_value_rusd, 15_000);
    const requiredSeedRioValue = requiredSeedRio(row);
    const recordedSeedRioValue = recordedSeedRio(row);
    const actualIndexedSeedRioValue = indexedSeedRio(row);
    const isUnderseeded = graduationUnderseeded(row);
    const diagnostic = graduationDiagnostic(row);

    const score =
      progressPercent * 0.7 +
      (hasPair ? 12 : 0) +
      (hasLiquidity ? 12 : 0) +
      Math.min(realRioReserve, 10);

    const pairAddress = row.riodex_pair_address || row.pair_address || null;
    const trendDirection: PumpBoardRow["trendDirection"] =
      stage === "graduated" || stage === "ready" ? "up" : "flat";

    return {
      rank: index + 1,
      tokenAddress: row.token_address,
      tokenName: row.token_name || row.token_symbol || row.token_address,
      symbol: row.token_symbol || row.token_name || String(row.token_address).slice(0, 10),
      launchRail: "pump.live" as const,
      standard: "SPO-20" as const,
      baseAsset: "RIO" as const,
      stage,
      stageLabel: stageLabel(stage, row),
      progressPercent,
      raisedRusdEquivalent: toNumber(row.raised_rusd_equivalent, 0),
      impliedMarketCapRusd: toNumber(row.implied_market_cap_rusd, 0),
      impliedMarketCapRio,
      effectivePriceRio: toNumber(row.implied_price_rio, effectivePriceRio),
      participantCount: toNumber(row.unique_buyers, 0),
      tradeCount: toNumber(row.trade_count, 0),
      buyCount: toNumber(row.buy_count, 0),
      sellCount: toNumber(row.sell_count, 0),
      uniqueBuyers: toNumber(row.unique_buyers, 0),
      watcherCount: 0,
      momentumScore: Math.round(score),
      earlyFloatPercent: 0,
      volume24hRio: toNumber(row.raised_rusd_equivalent, 0) / RIO_REFERENCE_PRICE_RUSD_ESTIMATE,
      liquidityCommittedRio: realRioReserve,
      trendDirection,
      createdAtLabel: createdAtLabelFromHeight(row.created_height),
      score: Number(score.toFixed(4)),

      pairAddress,
      reserveLabel: reserves,
      liquidityStatus: isUnderseeded
        ? "underseeded"
        : hasLiquidity
          ? "reserves_indexed"
          : hasPair
            ? "pair_created"
            : "pending",
      graduationStatus: row.graduation_status || row.token_status || null,

      requiredSeedValueRusd,
      requiredSeedRio: requiredSeedRioValue,
      recordedSeedRio: recordedSeedRioValue,
      actualIndexedSeedRio: actualIndexedSeedRioValue,
      graduationUnderseeded: isUnderseeded,
      graduationDiagnostic: diagnostic,

      createdHeight: row.created_height ? Number(row.created_height) : null,
      routes: {
        trade: pairAddress ? `/riodex/swap?pair=${encodeURIComponent(pairAddress)}` : "/riodex/swap",
        pool: pairAddress ? `/riodex/pool/${encodeURIComponent(pairAddress)}` : null,
        screener: "/riodex/screener",
        explorer: `/rioexplorer/spo20/${encodeURIComponent(row.token_address)}`,
      },
    };
  });

  return rows;
}

function sortRows(rows: PumpBoardRow[], sort: DiscoverSort): PumpBoardRow[] {
  const next = [...rows];

  if (sort === "progress") {
    next.sort((a, b) => b.progressPercent - a.progressPercent);
  } else if (sort === "marketCap") {
    next.sort((a, b) => b.impliedMarketCapRio - a.impliedMarketCapRio);
  } else if (sort === "new") {
    next.sort((a, b) => (b.createdHeight ?? 0) - (a.createdHeight ?? 0));
  } else {
    next.sort((a, b) => b.score - a.score);
  }

  return next.map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as PumpDiscoverRequest;

    const sort: DiscoverSort =
      body.sort === "progress" ||
      body.sort === "marketCap" ||
      body.sort === "new"
        ? body.sort
        : "trending";

    const limit = parseLimit(body.limit, 8, 50);
    const totalSupply = Math.max(toNumber(body.totalSupply, 1_000_000_000), 1);
    const symbolFilter = String(body.symbol || "").trim().toUpperCase();

    const db = getPool();

    const result = await db.query(
      `
      WITH latest_liquidity AS (
        SELECT DISTINCT ON (pair_address)
          pair_address,
          reserve_0,
          reserve_1,
          total_share,
          block_height AS liquidity_height,
          block_time AS liquidity_time
        FROM riodex_liquidity_snapshots
        WHERE NULLIF(pair_address, '') IS NOT NULL
        ORDER BY pair_address, block_height DESC NULLS LAST, created_at DESC NULLS LAST
      )
      SELECT
        plt.token_address,
        plt.token_symbol,
        plt.token_name,
        plt.status AS token_status,
        plt.created_height,
        plt.created_tx_hash,

        pcs.real_rio_reserve_urio,
        pcs.real_token_reserve_base,
        pcs.virtual_rio_reserve_urio,
        pcs.virtual_token_reserve_base,
        pcs.progress_percent,
        pcs.raised_rusd_equivalent,
        pcs.implied_price_rio,
        pcs.implied_market_cap_rusd,
        pcs.trade_count,
        pcs.buy_count,
        pcs.sell_count,
        pcs.unique_buyers,
        pcs.updated_height AS curve_updated_height,

        pg.status AS graduation_status,
        pg.required_seed_value_rusd,
        pg.seed_rio_urio,
        pg.seed_token_base,
        pg.surplus_rio_urio,
        pg.creator_reward_total_urio,
        pg.treasury_surplus_urio,
        pg.riodex_pair_address,
        pg.lp_token_amount,
        pg.block_height AS graduation_height,
        pg.completed_at,

        rp.pair_address,
        rp.display_symbol,
        rp.asset_0_id,
        rp.asset_1_id,
        rp.asset_0_type,
        rp.asset_1_type,
        rp.is_live,

        COALESCE(NULLIF(a0.symbol, ''), NULLIF(rp.asset_0_id, ''), 'RIO') AS asset_0_symbol,
        COALESCE(NULLIF(a1.symbol, ''), NULLIF(plt.token_symbol, ''), NULLIF(plt.token_name, ''), NULLIF(rp.asset_1_id, '')) AS asset_1_symbol,
        COALESCE(a0.decimals, 6) AS asset_0_decimals,
        COALESCE(a1.decimals, 6) AS asset_1_decimals,

        ll.reserve_0,
        ll.reserve_1,
        ll.total_share,
        ll.liquidity_height,
        ll.liquidity_time
      FROM pump_live_tokens plt
      LEFT JOIN pump_live_curve_state pcs
        ON pcs.token_address = plt.token_address
      LEFT JOIN pump_live_graduations pg
        ON pg.token_address = plt.token_address
      LEFT JOIN riodex_pairs rp
        ON rp.pair_address = pg.riodex_pair_address
        OR rp.asset_1_id = plt.token_address
      LEFT JOIN rioex_assets a0
        ON a0.asset_id = rp.asset_0_id
      LEFT JOIN rioex_assets a1
        ON a1.asset_id = plt.token_address
        OR a1.asset_id = rp.asset_1_id
      LEFT JOIN latest_liquidity ll
        ON ll.pair_address = COALESCE(pg.riodex_pair_address, rp.pair_address)
      WHERE NULLIF(plt.token_address, '') IS NOT NULL
        AND (
          $1 = ''
          OR UPPER(COALESCE(plt.token_symbol, '')) LIKE '%' || $1 || '%'
          OR UPPER(COALESCE(plt.token_name, '')) LIKE '%' || $1 || '%'
          OR UPPER(COALESCE(plt.token_address, '')) LIKE '%' || $1 || '%'
        )
      ORDER BY
        CASE
          WHEN plt.status = 'graduated' THEN 3
          WHEN plt.status = 'graduating' THEN 2
          ELSE 1
        END DESC,
        COALESCE(pg.block_height, pcs.updated_height, plt.created_height, 0) DESC
      LIMIT $2
      `,
      [symbolFilter, limit]
    );

    const rows = sortRows(buildRows(result.rows, totalSupply), sort);

    return NextResponse.json({
      ok: true,
      source: "pump_live_indexer_truth",
      count: rows.length,
      board: rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_live_indexer_truth",
        error:
          error instanceof Error
            ? error.message
            : "Failed to load real Pump.live discovery board.",
      },
      { status: 500 }
    );
  }
}
