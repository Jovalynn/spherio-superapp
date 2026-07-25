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

function toRio(urio: unknown): number {
  return toNumber(urio, 0) / 1_000_000;
}

function statusFromChecks(checks: Array<{ required: boolean; pass: boolean; hardBlock?: boolean }>) {
  if (checks.some((check) => check.required && check.hardBlock)) return "blocked";
  if (checks.every((check) => !check.required || check.pass)) return "eligible";
  return "pending";
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tokenAddress = String(
      url.searchParams.get("tokenAddress") ||
        url.searchParams.get("token") ||
        "",
    ).trim();

    if (!tokenAddress) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_reward_eligibility_v1",
          error: "Missing tokenAddress.",
        },
        { status: 400 },
      );
    }

    const db = getPool();

    const [escrowResult, curveResult, graduationResult, tradeResult, eligibilityEventResult] =
      await Promise.all([
        db.query(
          `
          SELECT
            id,
            token_address,
            creator_address,
            escrow_status,
            reward_stage,
            reward_amount_urio,
            stable_equivalent_rusd,
            stable_payout_bps,
            rio_payout_bps,
            eligibility_status,
            payout_status,
            stable_required_rusd,
            rio_required_rusd,
            stable_funded_rusd,
            rio_funded_rusd,
            funding_status,
            requires_lp_seed_proof,
            requires_anti_abuse_clearance,
            requires_sustainability,
            requires_organic_buyers,
            organic_buyers_min,
            organic_buyers_target,
            sustain_days_required,
            required_swaps,
            market_cap_rusd_equivalent,
            notes
          FROM pump_live_reward_escrows
          WHERE token_address = $1
          ORDER BY
            CASE reward_stage
              WHEN 'milestone_250k' THEN 1
              WHEN 'milestone_500k' THEN 2
              WHEN 'milestone_1m' THEN 3
              ELSE 99
            END,
            id ASC
          `,
          [tokenAddress],
        ),

        db.query(
          `
          SELECT
            token_address,
            progress_percent,
            raised_rusd_equivalent,
            implied_market_cap_rusd,
            trade_count,
            buy_count,
            sell_count,
            unique_buyers,
            updated_height,
            updated_at
          FROM pump_live_curve_state
          WHERE token_address = $1
          LIMIT 1
          `,
          [tokenAddress],
        ),

        db.query(
          `
          SELECT
            token_address,
            status,
            seed_rio_urio,
            seed_token_base,
            riodex_pair_address,
            lp_token_amount,
            lp_lock_until,
            tx_hash,
            block_height,
            completed_at
          FROM pump_live_graduations
          WHERE token_address = $1
          LIMIT 1
          `,
          [tokenAddress],
        ),

        db.query(
          `
          SELECT
            COUNT(*)::int AS trade_count,
            COUNT(*) FILTER (WHERE side = 'buy')::int AS buy_count,
            COUNT(*) FILTER (WHERE side = 'sell')::int AS sell_count,
            COUNT(DISTINCT trader_address)::int AS unique_traders,
            COUNT(DISTINCT trader_address) FILTER (WHERE side = 'buy')::int AS unique_buyers,
            COUNT(DISTINCT tx_hash)::int AS unique_trade_txs
          FROM pump_live_trades
          WHERE token_address = $1
          `,
          [tokenAddress],
        ),

        db.query(
          `
          SELECT
            token_address,
            reward_stage,
            proof_type,
            proof_status,
            current_value,
            required_value,
            current_text,
            required_text,
            tx_hash,
            event_index,
            block_height,
            indexed_at,
            metadata_json
          FROM pump_live_reward_eligibility_events
          WHERE token_address = $1
            AND proof_status IN ('passed', 'failed', 'blocked', 'warning')
          ORDER BY
            CASE reward_stage
              WHEN 'milestone_250k' THEN 1
              WHEN 'milestone_500k' THEN 2
              WHEN 'milestone_1m' THEN 3
              ELSE 99
            END,
            proof_type,
            indexed_at DESC
          `,
          [tokenAddress],
        ),
      ]);

    const curve = curveResult.rows[0] || null;
    const graduation = graduationResult.rows[0] || null;
    const trade = tradeResult.rows[0] || {};

    const eligibilityProofByStage: Record<string, Record<string, any>> = {};
    for (const proof of eligibilityEventResult.rows) {
      const stage = String(proof.reward_stage || "");
      const proofType = String(proof.proof_type || "");
      if (!stage || !proofType) continue;
      eligibilityProofByStage[stage] ||= {};
      if (!eligibilityProofByStage[stage][proofType]) {
        eligibilityProofByStage[stage][proofType] = proof;
      }
    }

    const proofPassed = (stage: string, proofType: string) =>
      String(eligibilityProofByStage[stage]?.[proofType]?.proof_status || "").toLowerCase() === "passed";

    const proofFailedOrBlocked = (stage: string, proofType: string) => {
      const status = String(eligibilityProofByStage[stage]?.[proofType]?.proof_status || "").toLowerCase();
      return status === "failed" || status === "blocked";
    };

    const proofCurrent = (stage: string, proofType: string, fallback: unknown) => {
      const proof = eligibilityProofByStage[stage]?.[proofType];
      if (!proof) return fallback;
      if (proof.current_value !== null && proof.current_value !== undefined) return toNumber(proof.current_value, 0);
      if (proof.current_text) return proof.current_text;
      return fallback;
    };

    const proofRequired = (stage: string, proofType: string, fallback: unknown) => {
      const proof = eligibilityProofByStage[stage]?.[proofType];
      if (!proof) return fallback;
      if (proof.required_value !== null && proof.required_value !== undefined) return toNumber(proof.required_value, 0);
      if (proof.required_text) return proof.required_text;
      return fallback;
    };

    const graduationCompleted = String(graduation?.status || "").toLowerCase() === "completed";
    const lpSeeded = toNumber(graduation?.seed_rio_urio, 0) > 0;
    const pairReady = Boolean(graduation?.riodex_pair_address);
    const lpProofIndexed =
      Boolean(graduation?.lp_token_amount) ||
      Boolean(graduation?.lp_lock_until);

    const lpSeedProofPass = graduationCompleted && lpSeeded && pairReady && lpProofIndexed;

    const currentMarketCap = toNumber(curve?.implied_market_cap_rusd, 0);
    const currentUniqueBuyers = Math.max(
      toNumber(curve?.unique_buyers, 0),
      toNumber(trade?.unique_buyers, 0),
    );
    const currentTradeCount = Math.max(
      toNumber(curve?.trade_count, 0),
      toNumber(trade?.trade_count, 0),
    );

    const stages = escrowResult.rows.map((row) => {
      const rewardStage = String(row.reward_stage || "");
      const requiredMarketCap = toNumber(row.market_cap_rusd_equivalent, 0);
      const requiredBuyers = toNumber(row.organic_buyers_min, 0);
      const requiredSwaps = row.required_swaps === null ? null : toNumber(row.required_swaps, 0);

      const marketCapProofPass = proofPassed(rewardStage, "market_cap");
      const marketCapPass =
        marketCapProofPass ||
        (requiredMarketCap > 0 && currentMarketCap >= requiredMarketCap);

      const organicBuyersProofPass = proofPassed(rewardStage, "organic_buyers");
      const organicBuyersPass =
        organicBuyersProofPass ||
        !Boolean(row.requires_organic_buyers) ||
        (requiredBuyers > 0 && currentUniqueBuyers >= requiredBuyers);

      const swapsProofPass = proofPassed(rewardStage, "swaps");
      const swapsPass =
        swapsProofPass ||
        requiredSwaps === null ||
        requiredSwaps <= 0 ||
        currentTradeCount >= requiredSwaps;

      const stableRequired = toNumber(row.stable_required_rusd, 0);
      const rioRequired = toNumber(row.rio_required_rusd, 0);
      const stableFunded = toNumber(row.stable_funded_rusd, 0);
      const rioFunded = toNumber(row.rio_funded_rusd, 0);
      const fundingStatus = String(row.funding_status || "").toLowerCase();
      const fundingPass =
        stableFunded >= stableRequired &&
        rioFunded >= rioRequired &&
        (fundingStatus === "funded" || fundingStatus === "released");

      const sustainabilityPass =
        !Boolean(row.requires_sustainability) ||
        proofPassed(rewardStage, "sustainability");

      const antiAbusePass =
        !Boolean(row.requires_anti_abuse_clearance) ||
        proofPassed(rewardStage, "anti_abuse");

      const checks = [
        {
          key: "market_cap",
          label: "Market cap requirement",
          required: true,
          pass: marketCapPass,
          hardBlock: proofFailedOrBlocked(rewardStage, "market_cap"),
          current: proofCurrent(rewardStage, "market_cap", currentMarketCap),
          requiredValue: proofRequired(rewardStage, "market_cap", requiredMarketCap),
        },
        {
          key: "organic_buyers",
          label: "Organic buyers requirement",
          required: Boolean(row.requires_organic_buyers),
          pass: organicBuyersPass,
          hardBlock: proofFailedOrBlocked(rewardStage, "organic_buyers"),
          current: proofCurrent(rewardStage, "organic_buyers", currentUniqueBuyers),
          requiredValue: proofRequired(rewardStage, "organic_buyers", requiredBuyers),
        },
        {
          key: "swaps",
          label: "Swap count requirement",
          required: requiredSwaps !== null && requiredSwaps > 0,
          pass: swapsPass,
          hardBlock: proofFailedOrBlocked(rewardStage, "swaps"),
          current: proofCurrent(rewardStage, "swaps", currentTradeCount),
          requiredValue: proofRequired(rewardStage, "swaps", requiredSwaps),
        },
        {
          key: "lp_seed_proof",
          label: "LP seed / graduation proof",
          required: Boolean(row.requires_lp_seed_proof),
          pass: !Boolean(row.requires_lp_seed_proof) || lpSeedProofPass,
          current: lpSeedProofPass,
          requiredValue: true,
        },
        {
          key: "funding_buckets",
          label: "Stable/RIO funding buckets",
          required: true,
          pass: fundingPass,
          current: `${stableFunded}/${stableRequired} stable, ${rioFunded}/${rioRequired} RIO`,
          requiredValue: "stable and RIO buckets funded",
        },
        {
          key: "sustainability",
          label: "Sustainability proof",
          required: Boolean(row.requires_sustainability),
          pass: sustainabilityPass,
          hardBlock: proofFailedOrBlocked(rewardStage, "sustainability"),
          current: proofCurrent(rewardStage, "sustainability", "not_indexed_yet"),
          requiredValue: proofRequired(rewardStage, "sustainability", `${row.sustain_days_required || 0} days`),
        },
        {
          key: "anti_abuse",
          label: "Anti-abuse clearance",
          required: Boolean(row.requires_anti_abuse_clearance),
          pass: antiAbusePass,
          hardBlock: proofFailedOrBlocked(rewardStage, "anti_abuse"),
          current: proofCurrent(rewardStage, "anti_abuse", "not_indexed_yet"),
          requiredValue: proofRequired(rewardStage, "anti_abuse", "clearance indexed"),
        },
      ];

      const computedEligibilityStatus = statusFromChecks(checks);

      return {
        id: toNumber(row.id, 0),
        rewardStage: row.reward_stage,
        escrowStatus: row.escrow_status,
        storedEligibilityStatus: row.eligibility_status,
        computedEligibilityStatus,
        payoutStatus: row.payout_status,
        rewardAmountRio: toRio(row.reward_amount_urio),
        stableEquivalentRusd: toNumber(row.stable_equivalent_rusd, 0),
        stablePayoutBps: toNumber(row.stable_payout_bps, 0),
        rioPayoutBps: toNumber(row.rio_payout_bps, 0),
        marketCapRusdEquivalent: requiredMarketCap,
        organicBuyersMin: row.organic_buyers_min ? toNumber(row.organic_buyers_min, 0) : null,
        organicBuyersTarget: row.organic_buyers_target ? toNumber(row.organic_buyers_target, 0) : null,
        sustainDaysRequired: row.sustain_days_required ? toNumber(row.sustain_days_required, 0) : null,
        requiredSwaps,
        checks,
        notes: row.notes || null,
      };
    });

    return NextResponse.json({
      ok: true,
      source: "pump_reward_eligibility_v1",
      tokenAddress,
      summary: {
        escrowRows: escrowResult.rows.length,
        graduationCompleted,
        lpSeeded,
        pairReady,
        lpProofIndexed,
        lpSeedProofPass,
        currentMarketCapRusd: currentMarketCap,
        currentUniqueBuyers,
        currentTradeCount,
        sustainabilityProofIndexed: eligibilityEventResult.rows.some((row) => row.proof_type === "sustainability"),
        antiAbuseProofIndexed: eligibilityEventResult.rows.some((row) => row.proof_type === "anti_abuse"),
        eligibilityProofEventsIndexed: eligibilityEventResult.rows.length > 0,
        eligibilityProofEventCount: eligibilityEventResult.rows.length,
        explanation:
          "Eligibility is computed from indexed Pump proof records and reward eligibility proof events.",
      },
      stages,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_reward_eligibility_v1",
        error:
          error instanceof Error
            ? error.message
            : "Failed to evaluate Pump reward eligibility.",
      },
      { status: 500 },
    );
  }
}
