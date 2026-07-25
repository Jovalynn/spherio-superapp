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

function clean(value: unknown) {
  return String(value || "").trim();
}

function tokenTxPart(tokenAddress: string) {
  const clean = String(tokenAddress || "").replace(/[^a-zA-Z0-9]/g, "");
  return clean.length > 18 ? `${clean.slice(0, 8)}_${clean.slice(-8)}` : clean;
}

function stageOrder(stage: string) {
  switch (stage) {
    case "milestone_250k":
      return 1;
    case "milestone_500k":
      return 2;
    case "milestone_1m":
      return 3;
    default:
      return 99;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const tokenAddress = clean(body.tokenAddress);
    const dryRun = body.dryRun !== false;
    const fundingSource = clean(body.fundingSource || "devnet_simulation");
    const stableAsset = clean(body.stableAsset || "USDT/RUSD");
    const rioAsset = clean(body.rioAsset || "RIO");
    const fundingTxPrefix = clean(body.fundingTxPrefix || "ALLOCATOR_FUNDING_EVENT");
    const blockHeight = Number.isFinite(Number(body.blockHeight)) ? Number(body.blockHeight) : 557500;

    if (!tokenAddress) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_funding_allocator_v1",
          error: "tokenAddress is required.",
        },
        { status: 400 },
      );
    }

    const allowedSources = new Set(["treasury", "riodex_converter", "bridge", "devnet_simulation"]);
    if (!allowedSources.has(fundingSource)) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_funding_allocator_v1",
          error: "Invalid fundingSource. Use treasury, riodex_converter, bridge, or devnet_simulation.",
        },
        { status: 400 },
      );
    }

    const db = getPool();

    const escrowResult = await db.query(
      `
      SELECT
        e.id,
        e.token_address,
        e.creator_address,
        e.reward_stage,
        e.escrow_status,
        e.funding_status,
        e.stable_required_rusd,
        e.rio_required_rusd,
        COALESCE(fe.stable_funded_rusd, 0) AS event_stable_funded_rusd,
        COALESCE(fe.rio_funded_rusd, 0) AS event_rio_funded_rusd,
        g.status AS graduation_status,
        g.seed_rio_urio,
        g.riodex_pair_address,
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
          ) AS rio_funded_rusd
        FROM pump_live_reward_funding_events
        GROUP BY token_address, reward_stage
      ) fe
        ON fe.token_address = e.token_address
       AND fe.reward_stage = e.reward_stage
      LEFT JOIN pump_live_graduations g
        ON g.token_address = e.token_address
      WHERE e.token_address = $1
      ORDER BY
        CASE e.reward_stage
          WHEN 'milestone_250k' THEN 1
          WHEN 'milestone_500k' THEN 2
          WHEN 'milestone_1m' THEN 3
          ELSE 99
        END,
        e.id ASC
      `,
      [tokenAddress],
    );

    const plans = escrowResult.rows.map((row) => {
      const graduationCompleted = String(row.graduation_status || "").toLowerCase() === "completed";
      const lpSeeded = toNumber(row.seed_rio_urio, 0) > 0;
      const pairReady = Boolean(row.riodex_pair_address);

      const stableRequired = toNumber(row.stable_required_rusd, 0);
      const rioRequired = toNumber(row.rio_required_rusd, 0);

      const stableFunded = toNumber(row.event_stable_funded_rusd, 0);
      const rioFunded = toNumber(row.event_rio_funded_rusd, 0);

      const missingStable = Math.max(stableRequired - stableFunded, 0);
      const missingRio = Math.max(rioRequired - rioFunded, 0);

      const alreadyReleased =
        String(row.escrow_status || "").toLowerCase() === "released" ||
        String(row.funding_status || "").toLowerCase() === "released";

      const canAllocate =
        graduationCompleted &&
        lpSeeded &&
        pairReady &&
        !alreadyReleased &&
        (missingStable > 0 || missingRio > 0);

      return {
        escrowId: toNumber(row.id, 0),
        tokenAddress: row.token_address,
        rewardStage: row.reward_stage,
        graduationCompleted,
        lpSeeded,
        pairReady,
        alreadyReleased,
        stableRequiredRusd: stableRequired,
        stableFundedRusd: stableFunded,
        stableMissingRusd: missingStable,
        rioRequiredRusd: rioRequired,
        rioFundedRusd: rioFunded,
        rioMissingRusd: missingRio,
        canAllocate,
        skippedReason: canAllocate
          ? null
          : alreadyReleased
            ? "already_released"
            : !graduationCompleted
              ? "graduation_not_completed"
              : !lpSeeded
                ? "lp_seed_not_indexed"
                : !pairReady
                  ? "pair_not_ready"
                  : "nothing_missing",
      };
    });

    let insertedEvents = 0;

    if (!dryRun) {
      for (const plan of plans) {
        if (!plan.canAllocate) continue;

        const order = stageOrder(plan.rewardStage);
        const tokenPart = tokenTxPart(plan.tokenAddress);

        if (plan.stableMissingRusd > 0) {
          await db.query(
            `
            INSERT INTO pump_live_reward_funding_events (
              token_address,
              reward_stage,
              funding_type,
              funding_source,
              asset,
              amount_rusd,
              amount_base,
              status,
              tx_hash,
              event_index,
              block_height,
              indexed_at,
              metadata_json
            )
            VALUES (
              $1,
              $2,
              'stable_bucket',
              $3,
              $4,
              $5,
              0,
              'confirmed',
              $6,
              $7,
              $8,
              now(),
              jsonb_build_object(
                'source', 'pump_reward_funding_allocator_v1',
                'dry_run', false,
                'does_not_move_real_funds', true
              )
            )
            ON CONFLICT (tx_hash, event_index)
            DO UPDATE SET
              amount_rusd = EXCLUDED.amount_rusd,
              status = EXCLUDED.status,
              indexed_at = now(),
              metadata_json = EXCLUDED.metadata_json
            `,
            [
              plan.tokenAddress,
              plan.rewardStage,
              fundingSource,
              stableAsset,
              plan.stableMissingRusd,
              `${fundingTxPrefix}_${tokenPart}_${plan.rewardStage}_stable`,
              order * 10 + 1,
              blockHeight + order,
            ],
          );

          insertedEvents += 1;
        }

        if (plan.rioMissingRusd > 0) {
          await db.query(
            `
            INSERT INTO pump_live_reward_funding_events (
              token_address,
              reward_stage,
              funding_type,
              funding_source,
              asset,
              amount_rusd,
              amount_base,
              status,
              tx_hash,
              event_index,
              block_height,
              indexed_at,
              metadata_json
            )
            VALUES (
              $1,
              $2,
              'rio_bucket',
              $3,
              $4,
              $5,
              0,
              'confirmed',
              $6,
              $7,
              $8,
              now(),
              jsonb_build_object(
                'source', 'pump_reward_funding_allocator_v1',
                'dry_run', false,
                'does_not_move_real_funds', true
              )
            )
            ON CONFLICT (tx_hash, event_index)
            DO UPDATE SET
              amount_rusd = EXCLUDED.amount_rusd,
              status = EXCLUDED.status,
              indexed_at = now(),
              metadata_json = EXCLUDED.metadata_json
            `,
            [
              plan.tokenAddress,
              plan.rewardStage,
              fundingSource,
              rioAsset,
              plan.rioMissingRusd,
              `${fundingTxPrefix}_${tokenPart}_${plan.rewardStage}_rio`,
              order * 10 + 2,
              blockHeight + order,
            ],
          );

          insertedEvents += 1;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      source: "pump_reward_funding_allocator_v1",
      mode: dryRun ? "dry_run" : "write",
      tokenAddress,
      fundingSource,
      scanned: plans.length,
      insertableEvents: plans.reduce((sum, plan) => {
        if (!plan.canAllocate) return sum;
        return sum + (plan.stableMissingRusd > 0 ? 1 : 0) + (plan.rioMissingRusd > 0 ? 1 : 0);
      }, 0),
      insertedEvents,
      plans,
      guarantees: [
        "does_not_move_real_funds",
        "does_not_create_payout_records",
        "does_not_release_escrow",
        "only_inserts_funding_event_proof_rows",
        "skips_already_released_stages",
        "requires_graduation_lp_seed_and_pair_ready",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_funding_allocator_v1",
        error:
          error instanceof Error
            ? error.message
            : "Failed to allocate Pump reward funding events.",
      },
      { status: 500 },
    );
  }
}
