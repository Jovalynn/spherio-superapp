import {createConfiguredPool} from "@/lib/db/configuredPool";
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { unavailablePumpDiscoveryMeasurements } from "@/lib/pump/price-authority.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

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
  progressPercent: number | null;
  raisedRusdEquivalent: number | null;
  impliedMarketCapRusd: number | null;
  impliedMarketCapRio: number | null;
  effectivePriceRio: number | null;
  participantCount: number;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  uniqueBuyers: number;
  watcherCount: number;
  momentumScore: number;
  earlyFloatPercent: number;
  volume24hRio: number | null;
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
  graduationUnderseeded?: boolean | null;
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
    pool = createConfiguredPool({
      connectionString:
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        "",
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

function graduationDiagnostic(_row: any): string {
  return "Seed valuation is unavailable until an approved canonical RIO/RUSD source is configured.";
}

function createdAtLabelFromHeight(height: unknown): string {
  const h = toNumber(height, 0);
  if (!h) return "indexed";
  return `h${Math.floor(h)}`;
}

function mapStage(row: any): PumpBoardRow["stage"] {
  const tokenStatus = String(row.token_status || "").toLowerCase();
  const graduationStatus = String(row.graduation_status || "").toLowerCase();

  if (tokenStatus === "graduated" || graduationStatus === "completed") return "graduated";
  if (tokenStatus === "graduating" || graduationStatus === "pair_created") return "ready";
  if (toNumber(row.real_rio_reserve_urio, 0) > 0) return "watch";
  return "momentum";
}

function stageLabel(stage: PumpBoardRow["stage"], row: any): string {
  const graduationStatus = String(row.graduation_status || "").toLowerCase();

  if (stage === "graduated") return "Graduated · RioDex Live";
  if (graduationStatus === "pair_created") return "Pair Created · Needs Finalization";
  if (stage === "ready") return "Graduation Watch";
  if (stage === "watch") return "Building Demand";
  return "Momentum";
}

function buildRows(dbRows: any[], totalSupply: number): PumpBoardRow[] {
  const rows = dbRows.map((row, index) => {
    const stage = mapStage(row);

    const realRioReserve = toNumber(row.real_rio_reserve_urio, 0) / 1_000_000;
    const hasPair = Boolean(row.riodex_pair_address || row.pair_address);
    const hasLiquidity = row.reserve_0 !== null && row.reserve_1 !== null;
    const reserves = reserveLabel(row);

    const requiredSeedValueRusd = toNumber(row.required_seed_value_rusd, 15_000);
    const recordedSeedRioValue = recordedSeedRio(row);
    const actualIndexedSeedRioValue = indexedSeedRio(row);
    const diagnostic = graduationDiagnostic(row);

    const score =
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
      ...unavailablePumpDiscoveryMeasurements(row),
      participantCount: toNumber(row.unique_buyers, 0),
      tradeCount: toNumber(row.trade_count, 0),
      buyCount: toNumber(row.buy_count, 0),
      sellCount: toNumber(row.sell_count, 0),
      uniqueBuyers: toNumber(row.unique_buyers, 0),
      watcherCount: 0,
      momentumScore: Math.round(score),
      earlyFloatPercent: 0,
      liquidityCommittedRio: realRioReserve,
      trendDirection,
      createdAtLabel: createdAtLabelFromHeight(row.created_height),
      score: Number(score.toFixed(4)),

      pairAddress,
      reserveLabel: reserves,
      liquidityStatus: hasLiquidity
          ? "reserves_indexed"
          : hasPair
            ? "pair_created"
            : "pending",
      graduationStatus: row.graduation_status || row.token_status || null,

      requiredSeedValueRusd,
      recordedSeedRio: recordedSeedRioValue,
      actualIndexedSeedRio: actualIndexedSeedRioValue,
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
    next.sort((a, b) => (b.progressPercent ?? -1) - (a.progressPercent ?? -1));
  } else if (sort === "marketCap") {
    next.sort((a, b) => (b.impliedMarketCapRio ?? -1) - (a.impliedMarketCapRio ?? -1));
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
