import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

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
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function deriveFundingStatus(row: any) {
  const stableRequired = toNumber(row.stable_required_rusd, 0);
  const rioRequired = toNumber(row.rio_required_rusd, 0);
  const stableFunded = toNumber(row.stable_funded_rusd, 0);
  const rioFunded = toNumber(row.rio_funded_rusd, 0);

  const stableReady = stableRequired <= 0 || stableFunded >= stableRequired;
  const rioReady = rioRequired <= 0 || rioFunded >= rioRequired;

  if (stableReady && rioReady) return "funded";
  if (stableFunded > 0 || rioFunded > 0) return "partially_funded";
  return "reserved";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tokenAddress = String(body.tokenAddress || "").trim();
    const dryRun = body.dryRun !== false;

    const db = getPool();

    const params: any[] = [];
    let tokenFilter = "";

    if (tokenAddress) {
      params.push(tokenAddress);
      tokenFilter = "AND e.token_address = $1";
    }

    const escrowResult = await db.query(
      `
      SELECT
        e.id,
        e.token_address,
        e.reward_stage,
        e.escrow_status,
        e.funding_status,
        e.stable_required_rusd,
        e.rio_required_rusd,
        e.stable_funded_rusd,
        e.rio_funded_rusd,
        e.funding_source,
        e.funding_tx_hash,
        COALESCE(fe.stable_funded_rusd, 0) AS event_stable_funded_rusd,
        COALESCE(fe.rio_funded_rusd, 0) AS event_rio_funded_rusd,
        fe.last_funding_tx_hash AS event_last_funding_tx_hash,
        fe.last_funding_height AS event_last_funding_height,
        fe.funding_sources AS event_funding_sources,
        g.status AS graduation_status,
        g.required_seed_value_rusd,
        g.seed_rio_urio,
        g.riodex_pair_address,
        g.lp_token_amount,
        g.completed_at
      FROM pump_live_reward_escrows e
      LEFT JOIN (
        SELECT
          token_address,
          reward_stage,
          SUM(amount_rusd) FILTER (
            WHERE funding_type = 'stable_bucket'
              AND status IN ('indexed', 'confirmed')
          ) AS stable_funded_rusd,
          SUM(amount_rusd) FILTER (
            WHERE funding_type = 'rio_bucket'
              AND status IN ('indexed', 'confirmed')
          ) AS rio_funded_rusd,
          MAX(tx_hash) AS last_funding_tx_hash,
          MAX(block_height) AS last_funding_height,
          string_agg(DISTINCT funding_source, ', ' ORDER BY funding_source) AS funding_sources
        FROM pump_live_reward_funding_events
        GROUP BY token_address, reward_stage
      ) fe
        ON fe.token_address = e.token_address
       AND fe.reward_stage = e.reward_stage
      LEFT JOIN pump_live_graduations g
        ON g.token_address = e.token_address
      WHERE 1 = 1
        ${tokenFilter}
      ORDER BY
        e.token_address,
        CASE e.reward_stage
          WHEN 'milestone_250k' THEN 1
          WHEN 'milestone_500k' THEN 2
          WHEN 'milestone_1m' THEN 3
          ELSE 99
        END,
        e.id ASC
      `,
      params,
    );

    const rows = escrowResult.rows;

    const updates = rows.map((row) => {
      const graduationCompleted = String(row.graduation_status || "").toLowerCase() === "completed";
      const lpSeeded = toNumber(row.seed_rio_urio, 0) > 0;
      const pairReady = Boolean(row.riodex_pair_address);
      const rowWithEventFunding = {
        ...row,
        stable_funded_rusd: row.event_stable_funded_rusd,
        rio_funded_rusd: row.event_rio_funded_rusd,
      };

      const derivedFundingStatus = deriveFundingStatus(rowWithEventFunding);

      let nextFundingStatus = derivedFundingStatus;

      if (!graduationCompleted || !lpSeeded || !pairReady) {
        nextFundingStatus = "reserved";
      }

      if (row.escrow_status === "released" || row.funding_status === "released") {
        nextFundingStatus = "released";
      }

      return {
        id: toNumber(row.id, 0),
        tokenAddress: row.token_address,
        rewardStage: row.reward_stage,
        currentFundingStatus: row.funding_status,
        nextFundingStatus,
        graduationCompleted,
        lpSeeded,
        pairReady,
        stableRequiredRusd: toNumber(row.stable_required_rusd, 0),
        stableFundedRusd: toNumber(row.event_stable_funded_rusd, 0),
        currentStableFundedRusd: toNumber(row.stable_funded_rusd, 0),
        rioRequiredRusd: toNumber(row.rio_required_rusd, 0),
        rioFundedRusd: toNumber(row.event_rio_funded_rusd, 0),
        currentRioFundedRusd: toNumber(row.rio_funded_rusd, 0),
        fundingSource: row.event_funding_sources || row.funding_source || null,
        fundingTxHash: row.event_last_funding_tx_hash || row.funding_tx_hash || null,
        fundingHeight: row.event_last_funding_height ? toNumber(row.event_last_funding_height, 0) : null,
        wouldUpdate:
          row.funding_status !== nextFundingStatus ||
          toNumber(row.stable_funded_rusd, 0) !== toNumber(row.event_stable_funded_rusd, 0) ||
          toNumber(row.rio_funded_rusd, 0) !== toNumber(row.event_rio_funded_rusd, 0) ||
          (row.event_last_funding_tx_hash && row.funding_tx_hash !== row.event_last_funding_tx_hash),
      };
    });

    let updatedRows = 0;

    if (!dryRun) {
      for (const update of updates) {
        if (!update.wouldUpdate) continue;

        await db.query(
          `
          UPDATE pump_live_reward_escrows
          SET
            stable_funded_rusd = $2,
            rio_funded_rusd = $3,
            funding_status = $4,
            funding_source = $5,
            funding_tx_hash = $6,
            funding_height = $7,
            funding_indexed_at = now(),
            updated_at = now()
          WHERE id = $1
          `,
          [
            update.id,
            update.stableFundedRusd,
            update.rioFundedRusd,
            update.nextFundingStatus,
            update.fundingSource,
            update.fundingTxHash,
            update.fundingHeight,
          ],
        );

        updatedRows += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      source: "pump_reward_funding_sync_v1",
      mode: dryRun ? "dry_run" : "write",
      tokenAddress: tokenAddress || null,
      scanned: rows.length,
      updatedRows,
      updates,
      guarantees: [
        "does_not_move_real_funds",
        "does_not_fake_stable_conversion",
        "does_not_mark_released_unless_already_released",
        "funding_status_derived_from_indexed_funding_events",
        "escrow_bucket_amounts_synced_from_funding_events",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_funding_sync_v1",
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync Pump reward funding status.",
      },
      { status: 500 },
    );
  }
}
