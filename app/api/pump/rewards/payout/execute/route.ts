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
        source: "pump_reward_payout_executor_v1",
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
        source: "pump_reward_payout_executor_v1",
        error: "Unauthorized Pump reward payout request.",
      },
      { status: 401 },
    );
  }

  return null;
}

function simulatedPayoutAllowed() {
  return String(process.env.PUMP_REWARD_ALLOW_SIMULATED_PAYOUT || "")
    .trim()
    .toLowerCase() === "true";
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getTreasuryAddress() {
  return String(
    process.env.PUMP_REWARD_TREASURY_ADDRESS ||
      process.env.SPHERIO_TREASURY_MULTISIG ||
      "rio1nnhxsa49cc5e9vyxj6r6s3hwlkymcrletx7wch",
  ).trim();
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
    const adminError = requireAdmin(request);
    if (adminError) return adminError;

    const body = await request.json().catch(() => ({}));

    const tokenAddress = clean(body.tokenAddress);
    const rewardStageFilter = clean(body.rewardStage);
    const dryRun = body.dryRun !== false;
    const payoutTxPrefix = clean(body.payoutTxPrefix || "PAYOUT_EXECUTOR_TX");
    const payoutExecutionIntent = clean(body.payoutExecutionIntent || body.confirmPayoutExecution || "");
    const executionMode = clean(body.executionMode || "simulated_multisig");
    const blockHeight = Number.isFinite(Number(body.blockHeight)) ? Number(body.blockHeight) : 557800;

    if (!dryRun && payoutExecutionIntent !== "EXECUTE_PAYOUT") {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_payout_executor_v1",
          error: "Write-mode payout execution requires payoutExecutionIntent=EXECUTE_PAYOUT.",
        },
        { status: 403 },
      );
    }

    if (!dryRun && executionMode !== "real_treasury" && !simulatedPayoutAllowed()) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_payout_executor_v1",
          error: "Simulated payout execution is disabled. Use real_treasury execution mode or enable PUMP_REWARD_ALLOW_SIMULATED_PAYOUT=true for devnet only.",
          executionMode,
        },
        { status: 403 },
      );
    }

    if (!tokenAddress) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_payout_executor_v1",
          error: "tokenAddress is required.",
        },
        { status: 400 },
      );
    }

    const allowedStages = new Set(["", "milestone_250k", "milestone_500k", "milestone_1m"]);
    if (!allowedStages.has(rewardStageFilter)) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_payout_executor_v1",
          error: "Invalid rewardStage. Use milestone_250k, milestone_500k, milestone_1m, or omit it.",
        },
        { status: 400 },
      );
    }

    const db = getPool();

    const params: unknown[] = [tokenAddress];
    let stageSql = "";

    if (rewardStageFilter) {
      params.push(rewardStageFilter);
      stageSql = "AND reward_stage = $2";
    }

    const escrowResult = await db.query(
      `
      SELECT
        id,
        token_address,
        creator_address,
        reward_stage,
        reward_amount_urio,
        escrow_status,
        funding_status,
        eligibility_status,
        payout_status,
        stable_funded_rusd,
        rio_funded_rusd,
        stable_required_rusd,
        rio_required_rusd
      FROM pump_live_reward_escrows
      WHERE token_address = $1
        ${stageSql}
      ORDER BY
        CASE reward_stage
          WHEN 'milestone_250k' THEN 1
          WHEN 'milestone_500k' THEN 2
          WHEN 'milestone_1m' THEN 3
          ELSE 99
        END,
        id ASC
      `,
      params,
    );

    const plans = escrowResult.rows.map((row) => {
      const fundingStatus = clean(row.funding_status).toLowerCase();
      const eligibilityStatus = clean(row.eligibility_status).toLowerCase();
      const payoutStatus = clean(row.payout_status).toLowerCase();

      const stableFunded = toNumber(row.stable_funded_rusd, 0);
      const rioFunded = toNumber(row.rio_funded_rusd, 0);
      const stableRequired = toNumber(row.stable_required_rusd, 0);
      const rioRequired = toNumber(row.rio_required_rusd, 0);

      const fundingComplete =
        (fundingStatus === "funded" || fundingStatus === "released") &&
        stableFunded >= stableRequired &&
        rioFunded >= rioRequired;

      const eligible = eligibilityStatus === "eligible";
      const notPaid = payoutStatus === "not_paid";

      const payable = fundingComplete && eligible && notPaid;

      return {
        escrowId: toNumber(row.id, 0),
        tokenAddress: row.token_address,
        creatorAddress: row.creator_address,
        rewardStage: row.reward_stage,
        rewardAmountUrio: String(row.reward_amount_urio || "0"),
        immediateAmountUrio: String(row.reward_amount_urio || "0"),
        vestedAmountUrio: "0",
        vestUnlockTime: null,
        fundingStatus,
        eligibilityStatus,
        payoutStatus,
        stableFundedRusd: stableFunded,
        stableRequiredRusd: stableRequired,
        rioFundedRusd: rioFunded,
        rioRequiredRusd: rioRequired,
        fundingComplete,
        eligible,
        notPaid,
        payable,
        skippedReason: payable
          ? null
          : !fundingComplete
            ? "funding_not_complete"
            : !eligible
              ? "eligibility_not_met"
              : !notPaid
                ? "already_paid"
                : "not_payable",
      };
    });

    let insertedRewardRows = 0;
    let updatedEscrowRows = 0;
    let preparedTransferRows = 0;

    if (!dryRun) {
      for (const plan of plans) {
        if (!plan.payable) continue;

        const order = stageOrder(plan.rewardStage);
        const tokenPart = tokenTxPart(plan.tokenAddress);
        const payoutTxHash = `${payoutTxPrefix}_${tokenPart}_${plan.rewardStage}`;

        if (executionMode === "real_treasury") {
          const stableAmountRusd = toNumber(plan.stableFundedRusd, 0);
          const rioAmountRusd = toNumber(plan.rioFundedRusd, 0);

          const transferInsert = await db.query(
            `
            INSERT INTO pump_live_reward_payout_transfers (
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
              metadata_json,
              updated_at
            )
            VALUES (
              $1,
              $2,
              $3,
              'real_treasury',
              'prepared',
              'USDT/RUSD',
              'RIO',
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              now(),
              jsonb_build_object(
                'source', 'pump_reward_payout_executor_v1',
                'mode', 'real_treasury_prepare_only',
                'escrow_id', $10::bigint,
                'requires_real_tx_confirmation', true,
                'does_not_mark_paid', true,
                'does_not_insert_creator_reward_row', true
              ),
              now()
            )
            ON CONFLICT (token_address, reward_stage, execution_mode)
            DO UPDATE SET
              payout_status = CASE
                WHEN pump_live_reward_payout_transfers.payout_status IN ('confirmed', 'submitted')
                THEN pump_live_reward_payout_transfers.payout_status
                ELSE 'prepared'
              END,
              stable_amount_rusd = EXCLUDED.stable_amount_rusd,
              rio_amount_rusd = EXCLUDED.rio_amount_rusd,
              stable_amount_base = EXCLUDED.stable_amount_base,
              rio_amount_urio = EXCLUDED.rio_amount_urio,
              treasury_address = EXCLUDED.treasury_address,
              destination_address = EXCLUDED.destination_address,
              metadata_json = EXCLUDED.metadata_json,
              updated_at = now()
            RETURNING id
            `,
            [
              plan.tokenAddress,
              plan.rewardStage,
              plan.creatorAddress,
              stableAmountRusd,
              rioAmountRusd,
              Math.round(stableAmountRusd * 1_000_000),
              plan.immediateAmountUrio,
              getTreasuryAddress(),
              plan.creatorAddress,
              plan.escrowId,
            ],
          );

          preparedTransferRows += transferInsert.rowCount || 0;
          continue;
        }

        const rewardInsert = await db.query(
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
            $5,
            $6,
            COALESCE($7::timestamptz, now()),
            TRUE,
            CASE WHEN $6::numeric <= 0 THEN TRUE ELSE FALSE END,
            FALSE,
            $8,
            $9
          )
          ON CONFLICT (tx_hash, event_index)
          DO UPDATE SET
            reward_amount_urio = EXCLUDED.reward_amount_urio,
            immediate_amount_urio = EXCLUDED.immediate_amount_urio,
            vested_amount_urio = EXCLUDED.vested_amount_urio,
            claimed_immediate = EXCLUDED.claimed_immediate,
            claimed_vested = EXCLUDED.claimed_vested,
            forfeited = FALSE
          `,
          [
            plan.tokenAddress,
            plan.creatorAddress,
            plan.rewardStage,
            plan.rewardAmountUrio,
            plan.immediateAmountUrio,
            plan.vestedAmountUrio,
            plan.vestUnlockTime,
            payoutTxHash,
            order,
          ],
        );

        insertedRewardRows += rewardInsert.rowCount || 0;

        const escrowUpdate = await db.query(
          `
          UPDATE pump_live_reward_escrows
          SET
            payout_status = 'paid',
            payout_tx_hash = $2,
            payout_height = $3,
            payout_indexed_at = now(),
            escrow_status = 'released',
            funding_status = 'released',
            updated_at = now()
          WHERE id = $1
            AND payout_status = 'not_paid'
            AND eligibility_status = 'eligible'
            AND funding_status = 'funded'
          `,
          [plan.escrowId, payoutTxHash, blockHeight + order],
        );

        updatedEscrowRows += escrowUpdate.rowCount || 0;
      }
    }

    return NextResponse.json({
      ok: true,
      source: "pump_reward_payout_executor_v1",
      mode: dryRun ? "dry_run" : "write",
      tokenAddress,
      rewardStage: rewardStageFilter || null,
      scanned: plans.length,
      payableStages: plans.filter((plan) => plan.payable).length,
      insertedRewardRows,
      updatedEscrowRows,
      preparedTransferRows,
      plans,
      guarantees: [
        "admin_secret_required",
        "does_not_move_real_funds",
        "does_not_pay_unfunded_stages",
        "does_not_pay_ineligible_stages",
        "does_not_double_pay_existing_paid_stages",
        "write_mode_requires_explicit_payout_intent",
        "real_treasury_mode_prepares_transfer_intent_only",
        "real_treasury_mode_does_not_mark_paid_without_tx_confirmation",
        "only_creates_payout_proof_rows",
        "releases_only_funded_eligible_not_paid_stages",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_payout_executor_v1",
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute Pump reward payout.",
      },
      { status: 500 },
    );
  }
}
