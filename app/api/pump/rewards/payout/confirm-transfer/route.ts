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
        source: "pump_reward_payout_confirm_transfer_v1",
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
        source: "pump_reward_payout_confirm_transfer_v1",
        error: "Unauthorized Pump reward transfer confirmation request.",
      },
      { status: 401 },
    );
  }

  return null;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
    const adminError = requireAdmin(request);
    if (adminError) return adminError;

    const body = await request.json().catch(() => ({}));

    const tokenAddress = clean(body.tokenAddress);
    const rewardStage = clean(body.rewardStage);
    const txHash = clean(body.txHash);
    const confirmationIntent = clean(body.confirmationIntent || body.payoutConfirmationIntent || "");
    const blockHeight = Number.isFinite(Number(body.blockHeight)) ? Number(body.blockHeight) : null;
    const eventIndex = Number.isFinite(Number(body.eventIndex))
      ? Number(body.eventIndex)
      : stageOrder(rewardStage);

    if (!tokenAddress || !rewardStage || !txHash) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_payout_confirm_transfer_v1",
          error: "tokenAddress, rewardStage, and txHash are required.",
        },
        { status: 400 },
      );
    }

    if (confirmationIntent !== "CONFIRM_REAL_TRANSFER") {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_payout_confirm_transfer_v1",
          error: "Transfer confirmation requires confirmationIntent=CONFIRM_REAL_TRANSFER.",
        },
        { status: 403 },
      );
    }

    const db = getPool();
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const transferResult = await client.query(
        `
        SELECT
          id,
          token_address,
          reward_stage,
          creator_address,
          execution_mode,
          payout_status,
          stable_amount_rusd,
          rio_amount_rusd,
          rio_amount_urio,
          destination_address
        FROM pump_live_reward_payout_transfers
        WHERE token_address = $1
          AND reward_stage = $2
          AND execution_mode IN ('real_treasury', 'riolight_treasury', 'multisig_treasury')
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE
        `,
        [tokenAddress, rewardStage],
      );

      const transfer = transferResult.rows[0];

      if (!transfer) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            ok: false,
            source: "pump_reward_payout_confirm_transfer_v1",
            error: "No prepared real treasury transfer found for token/stage.",
          },
          { status: 404 },
        );
      }

      if (String(transfer.payout_status).toLowerCase() === "confirmed") {
        await client.query("ROLLBACK");
        return NextResponse.json({
          ok: true,
          source: "pump_reward_payout_confirm_transfer_v1",
          alreadyConfirmed: true,
          transferId: toNumber(transfer.id, 0),
          tokenAddress,
          rewardStage,
          txHash,
        });
      }

      const escrowResult = await client.query(
        `
        SELECT
          id,
          token_address,
          creator_address,
          reward_stage,
          reward_amount_urio,
          funding_status,
          eligibility_status,
          payout_status
        FROM pump_live_reward_escrows
        WHERE token_address = $1
          AND reward_stage = $2
        LIMIT 1
        FOR UPDATE
        `,
        [tokenAddress, rewardStage],
      );

      const escrow = escrowResult.rows[0];

      if (!escrow) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            ok: false,
            source: "pump_reward_payout_confirm_transfer_v1",
            error: "No matching reward escrow found.",
          },
          { status: 404 },
        );
      }

      const fundingStatus = String(escrow.funding_status || "").toLowerCase();
      const eligibilityStatus = String(escrow.eligibility_status || "").toLowerCase();
      const payoutStatus = String(escrow.payout_status || "").toLowerCase();

      if (!(fundingStatus === "funded" || fundingStatus === "released")) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            ok: false,
            source: "pump_reward_payout_confirm_transfer_v1",
            error: "Cannot confirm payout: funding is not complete.",
            fundingStatus,
          },
          { status: 409 },
        );
      }

      if (eligibilityStatus !== "eligible") {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            ok: false,
            source: "pump_reward_payout_confirm_transfer_v1",
            error: "Cannot confirm payout: eligibility is not eligible.",
            eligibilityStatus,
          },
          { status: 409 },
        );
      }

      if (payoutStatus === "paid") {
        await client.query("ROLLBACK");
        return NextResponse.json({
          ok: true,
          source: "pump_reward_payout_confirm_transfer_v1",
          alreadyPaid: true,
          tokenAddress,
          rewardStage,
          txHash,
        });
      }

      const rewardAmountUrio = String(escrow.reward_amount_urio || transfer.rio_amount_urio || "0");

      const transferUpdate = await client.query(
        `
        UPDATE pump_live_reward_payout_transfers
        SET
          payout_status = 'confirmed',
          tx_hash = $3,
          block_height = $4,
          event_index = $5,
          confirmed_at = now(),
          updated_at = now(),
          metadata_json = metadata_json || jsonb_build_object(
            'confirmed_by', 'pump_reward_payout_confirm_transfer_v1',
            'real_tx_confirmed', true
          )
        WHERE id = $1
          AND token_address = $2
        RETURNING id
        `,
        [
          transfer.id,
          tokenAddress,
          txHash,
          blockHeight,
          eventIndex,
        ],
      );

      const rewardInsert = await client.query(
        `
        INSERT INTO pump_live_creator_rewards (
          token_address,
          creator_address,
          reward_type,
          reward_amount_urio,
          immediate_amount_urio,
          vested_amount_urio,
          vest_unlock_time,
          claimed_immediate,
          claimed_vested,
          forfeited,
          tx_hash,
          event_index
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $4,
          0,
          now(),
          TRUE,
          TRUE,
          FALSE,
          $5,
          $6
        )
        ON CONFLICT (tx_hash, event_index)
        DO UPDATE SET
          reward_amount_urio = EXCLUDED.reward_amount_urio,
          immediate_amount_urio = EXCLUDED.immediate_amount_urio,
          vested_amount_urio = EXCLUDED.vested_amount_urio,
          claimed_immediate = TRUE,
          claimed_vested = TRUE,
          forfeited = FALSE
        `,
        [
          tokenAddress,
          escrow.creator_address || transfer.creator_address,
          rewardStage,
          rewardAmountUrio,
          txHash,
          eventIndex,
        ],
      );

      const escrowUpdate = await client.query(
        `
        UPDATE pump_live_reward_escrows
        SET
          payout_status = 'paid',
          payout_tx_hash = $3,
          payout_height = $4,
          payout_indexed_at = now(),
          escrow_status = 'released',
          funding_status = 'released',
          updated_at = now()
        WHERE id = $1
          AND token_address = $2
          AND payout_status = 'not_paid'
        `,
        [
          escrow.id,
          tokenAddress,
          txHash,
          blockHeight,
        ],
      );

      await client.query("COMMIT");

      return NextResponse.json({
        ok: true,
        source: "pump_reward_payout_confirm_transfer_v1",
        tokenAddress,
        rewardStage,
        transferId: toNumber(transfer.id, 0),
        transferRowsUpdated: transferUpdate.rowCount || 0,
        rewardRowsInserted: rewardInsert.rowCount || 0,
        escrowRowsUpdated: escrowUpdate.rowCount || 0,
        txHash,
        blockHeight,
        eventIndex,
        guarantees: [
          "admin_secret_required",
          "requires_confirmed_real_transfer_intent",
          "requires_existing_prepared_transfer",
          "requires_funded_eligible_not_paid_escrow",
          "marks_paid_only_after_tx_hash_is_provided",
          "inserts_creator_reward_proof_after_confirmation",
        ],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_payout_confirm_transfer_v1",
        error:
          error instanceof Error
            ? error.message
            : "Failed to confirm Pump reward payout transfer.",
      },
      { status: 500 },
    );
  }
}
