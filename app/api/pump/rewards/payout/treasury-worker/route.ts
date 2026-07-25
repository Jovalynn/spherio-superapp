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

function clean(value: unknown) {
  return String(value || "").trim();
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getConfiguredAdminSecret() {
  return String(
    process.env.PUMP_REWARD_ADMIN_SECRET ||
      process.env.ADMIN_API_SECRET ||
      "",
  ).trim();
}

function getProvidedAdminSecret(request: NextRequest) {
  const bearer = request.headers.get("authorization") || "";
  const headerSecret = request.headers.get("x-spherio-admin-secret") || "";

  if (bearer.toLowerCase().startsWith("bearer ")) {
    return bearer.slice(7).trim();
  }

  return headerSecret.trim();
}

function requireAdmin(request: NextRequest) {
  const configured = getConfiguredAdminSecret();
  const provided = getProvidedAdminSecret(request);

  if (!configured) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_treasury_worker_v1",
        error: "Pump reward admin secret is not configured.",
        requiredEnv: "PUMP_REWARD_ADMIN_SECRET",
      },
      { status: 503 },
    );
  }

  if (!provided || provided !== configured) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_treasury_worker_v1",
        error: "Unauthorized treasury worker request.",
      },
      { status: 401 },
    );
  }

  return null;
}

function maxBatch() {
  const configured = Number(process.env.PUMP_REWARD_WORKER_MAX_BATCH || 25);
  return Number.isFinite(configured) ? Math.max(1, Math.min(configured, 100)) : 25;
}

function maxDailyRusd() {
  const configured = Number(process.env.PUMP_REWARD_WORKER_MAX_DAILY_RUSD || 25000);
  return Number.isFinite(configured) ? Math.max(0, configured) : 25000;
}

function workerMode() {
  return clean(process.env.PUMP_REWARD_WORKER_MODE || "supervised") || "supervised";
}

export async function POST(request: NextRequest) {
  try {
    const adminError = requireAdmin(request);
    if (adminError) return adminError;

    const body = await request.json().catch(() => ({}));

    const dryRun = body.dryRun !== false;
    const action = clean(body.action || "review");
    const workerIntent = clean(body.workerIntent || "");
    const requestedLimit = Number(body.limit || maxBatch());
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(Math.floor(requestedLimit), maxBatch()))
      : maxBatch();

    if (!["review", "mark_submitted"].includes(action)) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_treasury_worker_v1",
          error: "Invalid action. Use review or mark_submitted.",
        },
        { status: 400 },
      );
    }

    if (!dryRun && workerIntent !== "RUN_TREASURY_WORKER") {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_treasury_worker_v1",
          error: "Write-mode treasury worker requires workerIntent=RUN_TREASURY_WORKER.",
        },
        { status: 403 },
      );
    }

    const db = getPool();

    if (action === "review") {
      const result = await db.query(
        `
        SELECT
          id,
          token_address,
          reward_stage,
          creator_address,
          execution_mode,
          payout_status,
          stable_asset,
          rio_asset,
          stable_amount_rusd,
          rio_amount_rusd,
          stable_amount_base,
          rio_amount_urio,
          treasury_address,
          destination_address,
          prepared_at,
          tx_hash,
          block_height,
          metadata_json
        FROM pump_live_reward_payout_transfers
        WHERE payout_status = 'prepared'
          AND execution_mode IN ('real_treasury', 'riolight_treasury', 'multisig_treasury')
        ORDER BY prepared_at ASC, id ASC
        LIMIT $1
        `,
        [limit],
      );

      const transfers = result.rows.map((row) => ({
        id: toNumber(row.id, 0),
        tokenAddress: row.token_address,
        rewardStage: row.reward_stage,
        creatorAddress: row.creator_address,
        executionMode: row.execution_mode,
        payoutStatus: row.payout_status,
        stableAsset: row.stable_asset,
        rioAsset: row.rio_asset,
        stableAmountRusd: toNumber(row.stable_amount_rusd, 0),
        rioAmountRusd: toNumber(row.rio_amount_rusd, 0),
        stableAmountBase: String(row.stable_amount_base || "0"),
        rioAmountUrio: String(row.rio_amount_urio || "0"),
        treasuryAddress: row.treasury_address,
        destinationAddress: row.destination_address,
        preparedAt: row.prepared_at,
        txHash: row.tx_hash || null,
        blockHeight: row.block_height || null,
        metadata: row.metadata_json || {},
      }));

      const totalStableRusd = transfers.reduce((sum, row) => sum + row.stableAmountRusd, 0);
      const totalRioRusd = transfers.reduce((sum, row) => sum + row.rioAmountRusd, 0);
      const totalRusd = totalStableRusd + totalRioRusd;
      const overDailyLimit = maxDailyRusd() > 0 && totalRusd > maxDailyRusd();

      return NextResponse.json({
        ok: true,
        source: "pump_reward_treasury_worker_v1",
        mode: dryRun ? "dry_run" : "write",
        action,
        workerMode: workerMode(),
        limit,
        transferCount: transfers.length,
        totals: {
          stableRusd: totalStableRusd,
          rioRusd: totalRioRusd,
          totalRusd,
          maxDailyRusd: maxDailyRusd(),
          overDailyLimit,
        },
        transfers,
        signableBatch: transfers.map((row) => ({
          transferId: row.id,
          from: row.treasuryAddress,
          to: row.destinationAddress,
          tokenAddress: row.tokenAddress,
          rewardStage: row.rewardStage,
          stableAsset: row.stableAsset,
          stableAmountBase: row.stableAmountBase,
          rioAsset: row.rioAsset,
          rioAmountUrio: row.rioAmountUrio,
        })),
        guarantees: [
          "admin_secret_required",
          "dry_run_by_default",
          "supervised_worker_mode",
          "does_not_mark_paid",
          "does_not_insert_reward_rows",
          "review_action_only_reads_prepared_transfers",
          "daily_batch_limit_reported",
        ],
      });
    }

    if (action === "mark_submitted") {
      const transferId = toNumber(body.transferId, 0);
      const txHash = clean(body.txHash);

      if (!transferId || !txHash) {
        return NextResponse.json(
          {
            ok: false,
            source: "pump_reward_treasury_worker_v1",
            error: "transferId and txHash are required for mark_submitted.",
          },
          { status: 400 },
        );
      }

      if (dryRun) {
        return NextResponse.json({
          ok: true,
          source: "pump_reward_treasury_worker_v1",
          mode: "dry_run",
          action,
          wouldMarkSubmitted: true,
          transferId,
          txHash,
        });
      }

      const update = await db.query(
        `
        UPDATE pump_live_reward_payout_transfers
        SET
          payout_status = 'submitted',
          tx_hash = $2,
          submitted_at = now(),
          updated_at = now(),
          metadata_json = metadata_json || jsonb_build_object(
            'submitted_by', 'pump_reward_treasury_worker_v1',
            'requires_indexer_confirmation', true
          )
        WHERE id = $1
          AND payout_status = 'prepared'
        RETURNING
          id,
          token_address,
          reward_stage,
          payout_status,
          tx_hash
        `,
        [transferId, txHash],
      );

      return NextResponse.json({
        ok: true,
        source: "pump_reward_treasury_worker_v1",
        mode: "write",
        action,
        updatedRows: update.rowCount || 0,
        transfer: update.rows[0] || null,
        guarantees: [
          "admin_secret_required",
          "requires_worker_intent",
          "marks_submitted_only",
          "does_not_mark_paid",
          "confirm_transfer_endpoint_required_for_paid_state",
        ],
      });
    }

    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_treasury_worker_v1",
        error: "Unhandled worker action.",
      },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_treasury_worker_v1",
        error:
          error instanceof Error
            ? error.message
            : "Failed to run Pump treasury worker.",
      },
      { status: 500 },
    );
  }
}
