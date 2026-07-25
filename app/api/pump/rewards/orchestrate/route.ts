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
        source: "pump_reward_multi_orchestrator_v1",
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
        source: "pump_reward_multi_orchestrator_v1",
        error: "Unauthorized Pump reward orchestration request.",
      },
      { status: 401 },
    );
  }

  return null;
}

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => clean(value))
        .filter(Boolean),
    ),
  );
}

async function postJson(origin: string, path: string, body: Record<string, unknown>) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await response.json().catch(() => null);

  return {
    ok: response.ok && Boolean(json?.ok),
    status: response.status,
    json,
  };
}

export async function POST(request: NextRequest) {
  try {
    const adminError = requireAdmin(request);
    if (adminError) return adminError;

    const body = await request.json().catch(() => ({}));

    const dryRun = body.dryRun !== false;
    const includePayout = body.includePayout === true;
    const payoutExecutionIntent = clean(body.payoutExecutionIntent || body.confirmPayoutExecution || "");

    if (includePayout && !dryRun && payoutExecutionIntent !== "EXECUTE_PAYOUT") {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_multi_orchestrator_v1",
          error: "Write-mode payout execution requires payoutExecutionIntent=EXECUTE_PAYOUT.",
          safeDefault: "includePayout is false unless explicitly requested by an authorized worker.",
        },
        { status: 403 },
      );
    }
    const fundingSource = clean(body.fundingSource || "devnet_simulation");
    const fundingTxPrefix = clean(body.fundingTxPrefix || "MULTI_PUMP_FUNDING_EVENT");
    const payoutTxPrefix = clean(body.payoutTxPrefix || "MULTI_PUMP_PAYOUT_TX");
    const explicitTokenAddresses = uniqueStrings(body.tokenAddresses);

    const limitRaw = Number(body.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(Math.floor(limitRaw), 100))
      : 25;

    const db = getPool();

    let tokenAddresses = explicitTokenAddresses;

    if (tokenAddresses.length === 0) {
      const tokenResult = await db.query(
        `
        SELECT DISTINCT e.token_address
        FROM pump_live_reward_escrows e
        LEFT JOIN pump_live_graduations g
          ON g.token_address = e.token_address
        WHERE g.status = 'completed'
          AND e.payout_status IN ('not_paid', 'pending')
        ORDER BY e.token_address
        LIMIT $1
        `,
        [limit],
      );

      tokenAddresses = tokenResult.rows.map((row) => String(row.token_address));
    }

    const origin = new URL(request.url).origin;

    const results = [];

    for (const tokenAddress of tokenAddresses.slice(0, limit)) {
      const fundingAllocate = await postJson(origin, "/api/pump/rewards/funding/allocate", {
        tokenAddress,
        dryRun,
        fundingSource,
        fundingTxPrefix,
      });

      const fundingSync = await postJson(origin, "/api/pump/rewards/funding/sync", {
        tokenAddress,
        dryRun,
      });

      const eligibilitySync = await postJson(origin, "/api/pump/rewards/eligibility/sync", {
        tokenAddress,
        dryRun,
      });

      let payoutExecute: Awaited<ReturnType<typeof postJson>> | null = null;

      if (includePayout) {
        payoutExecute = await postJson(origin, "/api/pump/rewards/payout/execute", {
          tokenAddress,
          dryRun,
          payoutTxPrefix,
          payoutExecutionIntent,
          executionMode: body.executionMode || "simulated_multisig",
        });
      }

      results.push({
        tokenAddress,
        fundingAllocate: {
          ok: fundingAllocate.ok,
          status: fundingAllocate.status,
          scanned: fundingAllocate.json?.scanned ?? null,
          insertableEvents: fundingAllocate.json?.insertableEvents ?? null,
          insertedEvents: fundingAllocate.json?.insertedEvents ?? null,
        },
        fundingSync: {
          ok: fundingSync.ok,
          status: fundingSync.status,
          scanned: fundingSync.json?.scanned ?? null,
          updatedRows: fundingSync.json?.updatedRows ?? null,
        },
        eligibilitySync: {
          ok: eligibilitySync.ok,
          status: eligibilitySync.status,
          scanned: eligibilitySync.json?.scanned ?? null,
          updatedRows: eligibilitySync.json?.updatedRows ?? null,
        },
        payoutExecute: payoutExecute
          ? {
              ok: payoutExecute.ok,
              status: payoutExecute.status,
              scanned: payoutExecute.json?.scanned ?? null,
              payableStages: payoutExecute.json?.payableStages ?? null,
              insertedRewardRows: payoutExecute.json?.insertedRewardRows ?? null,
              updatedEscrowRows: payoutExecute.json?.updatedEscrowRows ?? null,
            }
          : null,
        errors: [
          fundingAllocate.ok ? null : { step: "fundingAllocate", response: fundingAllocate.json },
          fundingSync.ok ? null : { step: "fundingSync", response: fundingSync.json },
          eligibilitySync.ok ? null : { step: "eligibilitySync", response: eligibilitySync.json },
          payoutExecute && !payoutExecute.ok ? { step: "payoutExecute", response: payoutExecute.json } : null,
        ].filter(Boolean),
      });
    }

    const totals = results.reduce(
      (acc, result) => {
        acc.tokens += 1;
        acc.fundingEventsInsertable += Number(result.fundingAllocate.insertableEvents || 0);
        acc.fundingEventsInserted += Number(result.fundingAllocate.insertedEvents || 0);
        acc.fundingSyncUpdatedRows += Number(result.fundingSync.updatedRows || 0);
        acc.eligibilitySyncUpdatedRows += Number(result.eligibilitySync.updatedRows || 0);
        acc.payoutPayableStages += Number(result.payoutExecute?.payableStages || 0);
        acc.payoutRewardRowsInserted += Number(result.payoutExecute?.insertedRewardRows || 0);
        acc.payoutEscrowRowsUpdated += Number(result.payoutExecute?.updatedEscrowRows || 0);
        acc.errorTokens += result.errors.length > 0 ? 1 : 0;
        return acc;
      },
      {
        tokens: 0,
        fundingEventsInsertable: 0,
        fundingEventsInserted: 0,
        fundingSyncUpdatedRows: 0,
        eligibilitySyncUpdatedRows: 0,
        payoutPayableStages: 0,
        payoutRewardRowsInserted: 0,
        payoutEscrowRowsUpdated: 0,
        errorTokens: 0,
      },
    );

    return NextResponse.json({
      ok: true,
      source: "pump_reward_multi_orchestrator_v1",
      mode: dryRun ? "dry_run" : "write",
      includePayout,
      limit,
      discoveredTokens: tokenAddresses.length,
      totals,
      results,
      guarantees: [
        "admin_secret_required",
        "dry_run_by_default",
        "batch_limited_to_100_tokens",
        "does_not_fake_eligibility_proofs",
        "funding_allocator_only_inserts_funding_event_proof_rows",
        "funding_sync_derives_escrow_state_from_events",
        "eligibility_sync_requires_evaluator_checks",
        "payout_optional_and_disabled_by_default",
        "write_payout_requires_explicit_execution_intent",
        "payout_executor_blocks_unfunded_ineligible_or_paid_stages",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_multi_orchestrator_v1",
        error:
          error instanceof Error
            ? error.message
            : "Failed to orchestrate Pump reward lifecycle.",
      },
      { status: 500 },
    );
  }
}
