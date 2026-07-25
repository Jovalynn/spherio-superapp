// lib/pump/pump-lifecycle-data.ts

import { Pool } from "pg";
import type { PumpLifecycleInput } from "@/lib/pump/pump-lifecycle-intelligence";

const URIO_PER_RIO = 1_000_000;
const DEFAULT_RIO_REFERENCE_PRICE_RUSD = 0.1;
const DEFAULT_GRADUATION_SEED_STABLE_EQUIVALENT = 15_000;

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

function status(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function normalizePumpTokenLookup(value: unknown): string {
  const raw = String(value || "").trim();

  // Accept exact token address, or extract the first rio1... address if the
  // value was accidentally copied with extra text.
  const match = raw.match(/rio1[0-9a-z]{20,}/i);
  return (match ? match[0] : raw).trim();
}

function urioToRio(value: unknown): number {
  return toNumber(value, 0) / URIO_PER_RIO;
}

function isRioNative(assetType: unknown, assetId: unknown): boolean {
  return String(assetType || "").toLowerCase() === "native" &&
    String(assetId || "").toLowerCase() === "urio";
}

function indexedRioReserve(row: any): number {
  if (!row) return 0;

  if (isRioNative(row.asset_0_type, row.asset_0_id)) {
    return urioToRio(row.reserve_0);
  }

  if (isRioNative(row.asset_1_type, row.asset_1_id)) {
    return urioToRio(row.reserve_1);
  }

  return 0;
}

function inferProgressPercent(row: any): number {
  const explicitProgress = toNumber(row?.progress_percent, -1);
  if (explicitProgress >= 0) {
    return Math.max(0, Math.min(explicitProgress, 100));
  }

  const tokenStatus = status(row?.token_status);
  const graduationStatus = status(row?.graduation_status);

  if (tokenStatus === "graduated" || graduationStatus === "completed") return 100;
  if (graduationStatus === "pair_created") return 92;
  if (tokenStatus === "graduating") return 88;

  const realRioReserve = urioToRio(row?.real_rio_reserve_urio);
  const targetMarketCapRusd = toNumber(row?.target_market_cap_rusd, 65_000);
  const impliedMarketCapRusd =
    realRioReserve > 0 ? realRioReserve * DEFAULT_RIO_REFERENCE_PRICE_RUSD : 0;

  if (targetMarketCapRusd <= 0) return 0;

  return Math.max(0, Math.min((impliedMarketCapRusd / targetMarketCapRusd) * 100, 100));
}

function inferRaisedStableEquivalent(row: any): number {
  const explicitRaised = toNumber(row?.raised_rusd_equivalent, -1);
  if (explicitRaised >= 0) return explicitRaised;

  const realRioReserve = urioToRio(row?.real_rio_reserve_urio);
  return realRioReserve * DEFAULT_RIO_REFERENCE_PRICE_RUSD;
}

function inferMarketCapUsd(row: any): number {
  const explicitMarketCap = toNumber(row?.implied_market_cap_rusd, -1);
  if (explicitMarketCap >= 0) return explicitMarketCap;

  const progress = inferProgressPercent(row);
  const target = toNumber(row?.target_market_cap_rusd, 65_000);
  return (progress / 100) * target;
}

function inferLiquidityUsd(row: any): number {
  const rioReserve = indexedRioReserve(row);
  if (rioReserve > 0) return rioReserve * DEFAULT_RIO_REFERENCE_PRICE_RUSD * 2;

  const seedRio = urioToRio(row?.seed_rio_urio);
  if (seedRio > 0) return seedRio * DEFAULT_RIO_REFERENCE_PRICE_RUSD * 2;

  return 0;
}

function inferStage(row: any): PumpLifecycleInput["stage"] {
  if (!row) return "draft";

  const tokenStatus = status(row.token_status);
  const graduationStatus = status(row.graduation_status);
  const hasPair = Boolean(row.riodex_pair_address || row.pair_address);
  const hasLiquidity = toNumber(row.reserve_0, 0) > 0 || toNumber(row.reserve_1, 0) > 0;
  const lpAmount = toNumber(row.lp_token_amount, 0);

  if (tokenStatus === "graduated" || graduationStatus === "completed") {
    if (hasLiquidity || lpAmount > 0) return "market_live";
    return "graduated_liquidity_seeded";
  }

  if (graduationStatus === "pair_created" || hasPair) {
    return hasLiquidity ? "graduated_liquidity_seeded" : "graduation_pending";
  }

  if (tokenStatus === "graduating") return "graduation_pending";

  return "bonding_curve_live";
}

export type PumpLifecycleDbResult = {
  ok: boolean;
  source: "indexer_postgres" | "fallback";
  input: PumpLifecycleInput;
  row: any | null;
  error?: string;
};

export async function getPumpLifecycleInputForToken(
  tokenAddress: string,
): Promise<PumpLifecycleDbResult> {
  const address = normalizePumpTokenLookup(tokenAddress);

  if (!address) {
    return {
      ok: false,
      source: "fallback",
      row: null,
      error: "Missing token address.",
      input: {
        tokenSymbol: "PUMP",
        stage: "draft",
        indexerReady: false,
      },
    };
  }

  try {
    const db = getPool();

    const tokenCheck = await db.query(
      `
      SELECT
        token_address,
        token_symbol,
        token_name,
        status AS token_status,
        created_height
      FROM pump_live_tokens
      WHERE
        LOWER(token_address) = LOWER($1)
        OR LOWER(token_symbol) = LOWER($1)
        OR LOWER(token_name) = LOWER($1)
      LIMIT 1
      `,
      [address],
    );

    const tokenBaseRow = tokenCheck.rows[0] || null;

    if (!tokenBaseRow) {
      return {
        ok: false,
        source: "fallback",
        row: null,
        error: `Token not found in pump_live_tokens for lookup: ${address}`,
        input: {
          tokenSymbol: "PUMP",
          stage: "draft",
          bondingCurveLive: false,
          bondingCurveProgressPercent: 0,
          bondingCurveRaisedStableEquivalent: 0,
          liquiditySeedStableEquivalent: DEFAULT_GRADUATION_SEED_STABLE_EQUIVALENT,
          indexerReady: false,
        },
      };
    }

    const canonicalAddress = String(tokenBaseRow.token_address || address).trim();

    let row: any = tokenBaseRow;
    let richQueryError: string | null = null;

    try {
      const result = await db.query(
        `
        WITH latest_liquidity AS (
          SELECT DISTINCT ON (pair_address)
            pair_address,
            reserve_0,
            reserve_1,
            block_height,
            block_time
          FROM riodex_liquidity_snapshots
          ORDER BY pair_address, block_height DESC NULLS LAST, block_time DESC NULLS LAST
        )
        SELECT
          plt.token_address,
          plt.token_symbol,
          plt.token_name,
          plt.status AS token_status,
          plt.created_height,

          pcs.real_rio_reserve_urio,
          pcs.real_token_reserve_base,
          pcs.virtual_rio_reserve_urio,
          pcs.virtual_token_reserve_base,
          pcs.target_market_cap_rusd,
          pcs.progress_percent,
          pcs.raised_rusd_equivalent,
          pcs.implied_market_cap_rusd,
          pcs.trade_count,
          pcs.buy_count,
          pcs.sell_count,
          pcs.unique_buyers,

          pg.status AS graduation_status,
          pg.required_seed_value_rusd,
          pg.seed_rio_urio,
          pg.seed_token_base,
          pg.riodex_pair_address,
          pg.lp_token_amount,
          pg.completed_at,

          rp.pair_address,
          rp.asset_0_id,
          rp.asset_1_id,
          rp.asset_0_type,
          rp.asset_1_type,

          ll.reserve_0,
          ll.reserve_1,
          ll.block_height AS liquidity_height,
          ll.block_time AS liquidity_time
        FROM pump_live_tokens plt
        LEFT JOIN pump_live_curve_state pcs
          ON pcs.token_address = plt.token_address
        LEFT JOIN pump_live_graduations pg
          ON pg.token_address = plt.token_address
        LEFT JOIN riodex_pairs rp
          ON rp.pair_address = pg.riodex_pair_address
          OR rp.asset_1_id = plt.token_address
        LEFT JOIN latest_liquidity ll
          ON ll.pair_address = COALESCE(pg.riodex_pair_address, rp.pair_address)
        WHERE
          LOWER(plt.token_address) = LOWER($1)
          OR LOWER(plt.token_symbol) = LOWER($1)
          OR LOWER(plt.token_name) = LOWER($1)
        LIMIT 1
        `,
        [canonicalAddress],
      );

      row = result.rows[0] || tokenBaseRow;
    } catch (error) {
      richQueryError =
        error instanceof Error ? error.message : "Rich lifecycle query failed.";
      row = tokenBaseRow;
    }

    const stage = inferStage(row);
    const graduationStatus = status(row.graduation_status);
    const liquiditySeeded =
      graduationStatus === "completed" ||
      graduationStatus === "pair_created" ||
      Boolean(row.riodex_pair_address || row.pair_address);

    const input: PumpLifecycleInput = {
      tokenName: row.token_name || row.token_symbol || "Pump Token",
      tokenSymbol: row.token_symbol || row.token_name || "PUMP",
      creatorAddress: null,
      stage,

      bondingCurveLive:
        stage === "bonding_curve_live" ||
        stage === "graduation_pending" ||
        stage === "graduated_liquidity_seeded" ||
        stage === "market_live",

      bondingCurveProgressPercent: inferProgressPercent(row),
      bondingCurveRaisedStableEquivalent: inferRaisedStableEquivalent(row),
      graduationThresholdReached:
        stage === "graduation_pending" ||
        stage === "graduated_liquidity_seeded" ||
        stage === "market_live",

      liquiditySeeded,
      liquiditySeedStableEquivalent: toNumber(
        row.required_seed_value_rusd,
        DEFAULT_GRADUATION_SEED_STABLE_EQUIVALENT,
      ),
      lpBurnedOrDeadWalleted: false,

      marketCapUsd: inferMarketCapUsd(row),
      marketCapSustainDays250k: 0,
      marketCapSustainDays500k: 0,
      liquidityUsd: inferLiquidityUsd(row),

      // These are not yet fully indexed into this page.
      // Keep them conservative until dedicated analytics tables/routes are wired.
      uniqueBuyers: toNumber(row.unique_buyers, 0),
      tradeCount: toNumber(row.trade_count, 0),
      buyCount: toNumber(row.buy_count, 0),
      sellCount: toNumber(row.sell_count, 0),
      holderCount: 0,
      suspiciousVolumeRatio: 0,
      sniperScore: 0,
      walletClusterRiskScore: 0,
      creatorSelfBuyRiskScore: 0,
      topHolderConcentrationPercent: 0,

      rewardStageOnePaid: false,
      rewardStageTwoPaid: false,

      indexerReady: true,
    };

    return {
      ok: true,
      source: "indexer_postgres",
      row: richQueryError ? { ...row, richQueryError } : row,
      input,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Pump lifecycle data.";

    return {
      ok: false,
      source: "fallback",
      row: null,
      error: message,
      input: {
        tokenSymbol: "PUMP",
        stage: "draft",
        bondingCurveLive: false,
        bondingCurveProgressPercent: 0,
        bondingCurveRaisedStableEquivalent: 0,
        liquiditySeedStableEquivalent: DEFAULT_GRADUATION_SEED_STABLE_EQUIVALENT,
        indexerReady: false,
      },
    };
  }
}
