import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type EligibilityStage = {
  rewardStage: string;
  storedEligibilityStatus?: string;
  computedEligibilityStatus?: string;
  checks?: Array<{
    key: string;
    pass: boolean;
    required?: boolean;
  }>;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function requiredChecksPass(stage: EligibilityStage) {
  const checks = Array.isArray(stage.checks) ? stage.checks : [];
  const requiredChecks = checks.filter((check) => check.required !== false);
  return requiredChecks.length > 0 && requiredChecks.every((check) => check.pass === true);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tokenAddress = clean(body.tokenAddress);
    const dryRun = body.dryRun !== false;

    if (!tokenAddress) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_eligibility_sync_v1",
          error: "tokenAddress is required.",
        },
        { status: 400 },
      );
    }

    const origin = new URL(request.url).origin;
    const eligibilityUrl = `${origin}/api/pump/rewards/eligibility?tokenAddress=${encodeURIComponent(
      tokenAddress,
    )}`;

    const eligibilityResponse = await fetch(eligibilityUrl, {
      cache: "no-store",
    });

    const eligibilityData = await eligibilityResponse.json().catch(() => null);

    if (!eligibilityResponse.ok || !eligibilityData?.ok) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_eligibility_sync_v1",
          error: "Unable to read eligibility evaluator.",
          evaluatorStatus: eligibilityResponse.status,
          evaluator: eligibilityData,
        },
        { status: 500 },
      );
    }

    const stages = Array.isArray(eligibilityData.stages)
      ? (eligibilityData.stages as EligibilityStage[])
      : [];

    const updates = stages.map((stage) => {
      const storedStatus = clean(stage.storedEligibilityStatus || "pending");
      const computedStatus = clean(stage.computedEligibilityStatus || "pending");
      const allRequiredChecksPass = requiredChecksPass(stage);

      let nextEligibilityStatus = storedStatus;

      if (computedStatus === "blocked") {
        nextEligibilityStatus = "blocked";
      } else if (computedStatus === "eligible" && allRequiredChecksPass) {
        nextEligibilityStatus = "eligible";
      } else {
        nextEligibilityStatus = storedStatus === "eligible" ? "eligible" : "pending";
      }

      return {
        rewardStage: stage.rewardStage,
        storedEligibilityStatus: storedStatus,
        computedEligibilityStatus: computedStatus,
        allRequiredChecksPass,
        nextEligibilityStatus,
        wouldUpdate: storedStatus !== nextEligibilityStatus,
        failedChecks: (stage.checks || [])
          .filter((check) => check.required !== false && !check.pass)
          .map((check) => check.key),
      };
    });

    let updatedRows = 0;

    if (!dryRun) {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString:
          process.env.DATABASE_URL ||
          process.env.POSTGRES_URL ||
          "postgresql://spherio:spherio@postgres:5432/spherio_indexer",
      });

      try {
        for (const update of updates) {
          if (!update.wouldUpdate) continue;

          const result = await pool.query(
            `
            UPDATE pump_live_reward_escrows
            SET
              eligibility_status = $3,
              eligibility_tx_hash = $4,
              eligibility_height = NULL,
              eligibility_indexed_at = now(),
              updated_at = now()
            WHERE token_address = $1
              AND reward_stage = $2
            `,
            [
              tokenAddress,
              update.rewardStage,
              update.nextEligibilityStatus,
              `ELIGIBILITY_SYNC_${update.nextEligibilityStatus}_${update.rewardStage}`,
            ],
          );

          updatedRows += result.rowCount || 0;
        }
      } finally {
        await pool.end().catch(() => {});
      }
    }

    return NextResponse.json({
      ok: true,
      source: "pump_reward_eligibility_sync_v1",
      mode: dryRun ? "dry_run" : "write",
      tokenAddress,
      scanned: updates.length,
      updatedRows,
      updates,
      guarantees: [
        "does_not_move_real_funds",
        "does_not_create_payout_records",
        "does_not_release_escrow",
        "only_updates_eligibility_status",
        "requires_computed_eligibility_and_required_checks",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_eligibility_sync_v1",
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync Pump reward eligibility.",
      },
      { status: 500 },
    );
  }
}
