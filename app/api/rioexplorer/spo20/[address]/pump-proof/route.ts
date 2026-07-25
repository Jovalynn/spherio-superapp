import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ address: string }> | { address: string };
};

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

function iso(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const resolvedParams = await context.params;
    const address = String(resolvedParams.address || "").trim();

    if (!address) {
      return NextResponse.json(
        { ok: false, error: "Token address is required." },
        { status: 400 },
      );
    }

    const db = getPool();

    const [tokenResult, curveResult, graduationResult, lockResult, rewardResult, rewardEscrowResult, fundingEventResult, eligibilityEventResult, traderResult] =
      await Promise.all([
        db.query(
          `
          SELECT
            token_address,
            creator_address,
            token_name,
            token_symbol,
            status,
            settlement_denom,
            fee_denom,
            created_height,
            created_tx_hash,
            created_at,
            description,
            logo_url,
            metadata_json
          FROM pump_live_tokens
          WHERE token_address = $1
          LIMIT 1
          `,
          [address],
        ),

        db.query(
          `
          SELECT
            token_address,
            target_graduation_value_rusd,
            target_market_cap_rusd,
            progress_percent,
            raised_rusd_equivalent,
            implied_price_rio,
            implied_market_cap_rusd,
            trade_count,
            buy_count,
            sell_count,
            unique_buyers,
            last_trade_height,
            last_trade_tx_hash,
            updated_height,
            updated_at
          FROM pump_live_curve_state
          WHERE token_address = $1
          LIMIT 1
          `,
          [address],
        ),

        db.query(
          `
          SELECT
            token_address,
            status,
            trigger_reason,
            required_seed_value_rusd,
            seed_rio_urio,
            seed_token_base,
            riodex_factory,
            riodex_pair_address,
            lp_token_amount,
            lp_lock_until,
            surplus_rio_urio,
            creator_reward_total_urio,
            treasury_surplus_urio,
            tx_hash,
            block_height,
            completed_at
          FROM pump_live_graduations
          WHERE token_address = $1
          LIMIT 1
          `,
          [address],
        ),

        db.query(
          `
          SELECT
            id,
            token_address,
            wallet_address,
            locked_amount_base,
            lock_period_seconds,
            points_multiplier_bps,
            unlock_time,
            tx_hash,
            event_index,
            created_at
          FROM pump_live_locks
          WHERE token_address = $1
          ORDER BY created_at DESC
          LIMIT 25
          `,
          [address],
        ),

        db.query(
          `
          SELECT
            id,
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
          FROM pump_live_creator_rewards
          WHERE token_address = $1
          ORDER BY id DESC
          LIMIT 25
          `,
          [address],
        ),

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
            stable_required_rusd,
            rio_required_rusd,
            stable_funded_rusd,
            rio_funded_rusd,
            stable_asset,
            rio_asset,
            funding_status,
            funding_source,
            funding_tx_hash,
            funding_height,
            funding_indexed_at,
            stable_payout_bps,
            rio_payout_bps,
            eligibility_status,
            eligibility_tx_hash,
            eligibility_height,
            eligibility_indexed_at,
            payout_status,
            payout_tx_hash,
            payout_height,
            payout_indexed_at,
            requires_lp_seed_proof,
            requires_anti_abuse_clearance,
            requires_sustainability,
            requires_organic_buyers,
            organic_buyers_min,
            organic_buyers_target,
            sustain_days_required,
            required_swaps,
            market_cap_rusd_equivalent,
            notes,
            created_at,
            updated_at
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
          LIMIT 25
          `,
          [address],
        ),

        db.query(
          `
          SELECT
            id,
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
          FROM pump_live_reward_funding_events
          WHERE token_address = $1
          ORDER BY
            CASE reward_stage
              WHEN 'milestone_250k' THEN 1
              WHEN 'milestone_500k' THEN 2
              WHEN 'milestone_1m' THEN 3
              ELSE 99
            END,
            CASE funding_type
              WHEN 'stable_bucket' THEN 1
              WHEN 'rio_bucket' THEN 2
              ELSE 99
            END,
            id ASC
          LIMIT 100
          `,
          [address],
        ),

        db.query(
          `
          SELECT
            id,
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
          ORDER BY
            CASE reward_stage
              WHEN 'milestone_250k' THEN 1
              WHEN 'milestone_500k' THEN 2
              WHEN 'milestone_1m' THEN 3
              ELSE 99
            END,
            proof_type,
            indexed_at DESC
          LIMIT 100
          `,
          [address],
        ),

        db.query(
          `
          SELECT
            COALESCE(SUM(CASE WHEN side = 'buy' THEN rio_amount_urio ELSE 0 END), 0)::text AS total_buy_urio,
            COALESCE(SUM(CASE WHEN side = 'sell' THEN rio_amount_urio ELSE 0 END), 0)::text AS total_sell_urio,
            COUNT(*)::int AS trade_count,
            COUNT(*) FILTER (WHERE side = 'buy')::int AS buy_count,
            COUNT(*) FILTER (WHERE side = 'sell')::int AS sell_count,
            COUNT(DISTINCT trader_address)::int AS unique_traders,
            COUNT(DISTINCT trader_address) FILTER (WHERE side = 'buy')::int AS unique_buyers,
            COUNT(DISTINCT trader_address) FILTER (WHERE side = 'sell')::int AS unique_sellers
          FROM pump_live_trades
          WHERE token_address = $1
          `,
          [address],
        ),
      ]);

    const token = tokenResult.rows[0] || null;
    const curve = curveResult.rows[0] || null;
    const graduation = graduationResult.rows[0] || null;
    const trader = traderResult.rows[0] || {};

    const graduationVerified = Boolean(graduation);
    const graduationCompleted = String(graduation?.status || "").toLowerCase() === "completed";
    const lpSeeded = toNumber(graduation?.seed_rio_urio, 0) > 0;
    const pairReady = Boolean(graduation?.riodex_pair_address);
    const lpProofIndexed =
      Boolean(graduation?.lp_lock_until) ||
      Boolean(graduation?.lp_token_amount) ||
      lockResult.rows.length > 0;

    return NextResponse.json({
      ok: true,
      source: "rioexplorer_pump_proof_v1",
      tokenAddress: address,
      token: token
        ? {
            tokenAddress: token.token_address,
            creatorAddress: token.creator_address,
            tokenName: token.token_name,
            tokenSymbol: token.token_symbol,
            status: token.status,
            settlementDenom: token.settlement_denom,
            feeDenom: token.fee_denom,
            createdHeight: toNumber(token.created_height, 0),
            createdTxHash: token.created_tx_hash,
            createdAt: iso(token.created_at),
            description: token.description,
            logoUrl: token.logo_url,
            metadata: token.metadata_json || {},
          }
        : null,
      curve: curve
        ? {
            targetGraduationValueRusd: toNumber(curve.target_graduation_value_rusd, 0),
            targetMarketCapRusd: toNumber(curve.target_market_cap_rusd, 0),
            progressPercent: toNumber(curve.progress_percent, 0),
            raisedRusdEquivalent: toNumber(curve.raised_rusd_equivalent, 0),
            impliedPriceRio: toNumber(curve.implied_price_rio, 0),
            impliedMarketCapRusd: toNumber(curve.implied_market_cap_rusd, 0),
            tradeCount: toNumber(curve.trade_count, 0),
            buyCount: toNumber(curve.buy_count, 0),
            sellCount: toNumber(curve.sell_count, 0),
            uniqueBuyers: toNumber(curve.unique_buyers, 0),
            lastTradeHeight: curve.last_trade_height ? toNumber(curve.last_trade_height, 0) : null,
            lastTradeTxHash: curve.last_trade_tx_hash || null,
            updatedHeight: toNumber(curve.updated_height, 0),
            updatedAt: iso(curve.updated_at),
          }
        : null,
      graduation: graduation
        ? {
            status: graduation.status,
            triggerReason: graduation.trigger_reason,
            requiredSeedValueRusd: toNumber(graduation.required_seed_value_rusd, 0),
            seedRio: toRio(graduation.seed_rio_urio),
            seedRioUrio: String(graduation.seed_rio_urio || "0"),
            seedTokenBase: String(graduation.seed_token_base || "0"),
            riodexFactory: graduation.riodex_factory,
            riodexPairAddress: graduation.riodex_pair_address || null,
            lpTokenAmount: graduation.lp_token_amount ? String(graduation.lp_token_amount) : null,
            lpLockUntil: iso(graduation.lp_lock_until),
            surplusRio: toRio(graduation.surplus_rio_urio),
            creatorRewardTotalRio: toRio(graduation.creator_reward_total_urio),
            treasurySurplusRio: toRio(graduation.treasury_surplus_urio),
            txHash: graduation.tx_hash,
            blockHeight: toNumber(graduation.block_height, 0),
            completedAt: iso(graduation.completed_at),
          }
        : null,
      locks: lockResult.rows.map((row) => ({
        id: toNumber(row.id, 0),
        walletAddress: row.wallet_address,
        lockedAmountBase: String(row.locked_amount_base || "0"),
        lockPeriodSeconds: toNumber(row.lock_period_seconds, 0),
        pointsMultiplierBps: toNumber(row.points_multiplier_bps, 0),
        unlockTime: iso(row.unlock_time),
        txHash: row.tx_hash,
        eventIndex: toNumber(row.event_index, 0),
        createdAt: iso(row.created_at),
      })),
      rewards: rewardResult.rows.map((row) => ({
        id: toNumber(row.id, 0),
        creatorAddress: row.creator_address,
        rewardType: row.reward_type,
        rewardAmountRio: toRio(row.reward_amount_urio),
        immediateAmountRio: toRio(row.immediate_amount_urio),
        vestedAmountRio: toRio(row.vested_amount_urio),
        vestUnlockTime: iso(row.vest_unlock_time),
        claimedImmediate: Boolean(row.claimed_immediate),
        claimedVested: Boolean(row.claimed_vested),
        forfeited: Boolean(row.forfeited),
        txHash: row.tx_hash,
        eventIndex: toNumber(row.event_index, 0),
      })),
      eligibilityEvents: eligibilityEventResult.rows.map((row) => ({
        id: toNumber(row.id, 0),
        rewardStage: row.reward_stage,
        proofType: row.proof_type,
        proofStatus: row.proof_status,
        currentValue: row.current_value === null || row.current_value === undefined ? null : toNumber(row.current_value, 0),
        requiredValue: row.required_value === null || row.required_value === undefined ? null : toNumber(row.required_value, 0),
        currentText: row.current_text || null,
        requiredText: row.required_text || null,
        txHash: row.tx_hash,
        eventIndex: toNumber(row.event_index, 0),
        blockHeight: toNumber(row.block_height, 0),
        indexedAt: iso(row.indexed_at),
        metadata: row.metadata_json || {},
      })),
      fundingEvents: fundingEventResult.rows.map((row) => ({
        id: toNumber(row.id, 0),
        rewardStage: row.reward_stage,
        fundingType: row.funding_type,
        fundingSource: row.funding_source,
        asset: row.asset,
        amountRusd: toNumber(row.amount_rusd, 0),
        amountBase: String(row.amount_base || "0"),
        status: row.status,
        txHash: row.tx_hash,
        eventIndex: toNumber(row.event_index, 0),
        blockHeight: toNumber(row.block_height, 0),
        indexedAt: iso(row.indexed_at),
        metadata: row.metadata_json || {},
      })),
      rewardEscrows: rewardEscrowResult.rows.map((row) => ({
        id: toNumber(row.id, 0),
        creatorAddress: row.creator_address,
        escrowStatus: row.escrow_status,
        rewardStage: row.reward_stage,
        rewardAmountRio: toRio(row.reward_amount_urio),
        rewardAmountUrio: String(row.reward_amount_urio || "0"),
        stableEquivalentRusd: toNumber(row.stable_equivalent_rusd, 0),
        stableRequiredRusd: toNumber(row.stable_required_rusd, 0),
        rioRequiredRusd: toNumber(row.rio_required_rusd, 0),
        stableFundedRusd: toNumber(row.stable_funded_rusd, 0),
        rioFundedRusd: toNumber(row.rio_funded_rusd, 0),
        stableAsset: row.stable_asset || "USDT/RUSD",
        rioAsset: row.rio_asset || "RIO",
        fundingStatus: row.funding_status || "reserved",
        fundingSource: row.funding_source || null,
        fundingTxHash: row.funding_tx_hash || null,
        fundingHeight: row.funding_height ? toNumber(row.funding_height, 0) : null,
        fundingIndexedAt: iso(row.funding_indexed_at),
        stablePayoutBps: toNumber(row.stable_payout_bps, 0),
        rioPayoutBps: toNumber(row.rio_payout_bps, 0),
        eligibilityStatus: row.eligibility_status,
        eligibilityTxHash: row.eligibility_tx_hash || null,
        eligibilityHeight: row.eligibility_height ? toNumber(row.eligibility_height, 0) : null,
        eligibilityIndexedAt: iso(row.eligibility_indexed_at),
        payoutStatus: row.payout_status,
        payoutTxHash: row.payout_tx_hash || null,
        payoutHeight: row.payout_height ? toNumber(row.payout_height, 0) : null,
        payoutIndexedAt: iso(row.payout_indexed_at),
        requiresLpSeedProof: Boolean(row.requires_lp_seed_proof),
        requiresAntiAbuseClearance: Boolean(row.requires_anti_abuse_clearance),
        requiresSustainability: Boolean(row.requires_sustainability),
        requiresOrganicBuyers: Boolean(row.requires_organic_buyers),
        organicBuyersMin: row.organic_buyers_min ? toNumber(row.organic_buyers_min, 0) : null,
        organicBuyersTarget: row.organic_buyers_target ? toNumber(row.organic_buyers_target, 0) : null,
        sustainDaysRequired: row.sustain_days_required ? toNumber(row.sustain_days_required, 0) : null,
        requiredSwaps: row.required_swaps ? toNumber(row.required_swaps, 0) : null,
        marketCapRusdEquivalent: row.market_cap_rusd_equivalent ? toNumber(row.market_cap_rusd_equivalent, 0) : null,
        notes: row.notes || null,
        createdAt: iso(row.created_at),
        updatedAt: iso(row.updated_at),
      })),
      traders: {
        totalBuyRio: toRio(trader.total_buy_urio),
        totalSellRio: toRio(trader.total_sell_urio),
        netBuyRio: toRio(toNumber(trader.total_buy_urio, 0) - toNumber(trader.total_sell_urio, 0)),
        tradeCount: toNumber(trader.trade_count, 0),
        buyCount: toNumber(trader.buy_count, 0),
        sellCount: toNumber(trader.sell_count, 0),
        uniqueTraders: toNumber(trader.unique_traders, 0),
        uniqueBuyers: toNumber(trader.unique_buyers, 0),
        uniqueSellers: toNumber(trader.unique_sellers, 0),
      },
      proofStatus: {
        tokenIndexed: Boolean(token),
        curveIndexed: Boolean(curve),
        graduationIndexed: graduationVerified,
        graduationCompleted,
        lpSeeded,
        pairReady,
        lpProofIndexed,
        rewardsIndexed: rewardResult.rows.length > 0,
        rewardEscrowsIndexed: rewardEscrowResult.rows.length > 0,
        fundingEventsIndexed: fundingEventResult.rows.length > 0,
        eligibilityEventsIndexed: eligibilityEventResult.rows.length > 0,
        rewardSchemaStatus:
          rewardResult.rows.length > 0 || rewardEscrowResult.rows.length > 0
            ? "reward_or_escrow_records_indexed"
            : "no_rewards_indexed_yet",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "rioexplorer_pump_proof_v1",
        error:
          error instanceof Error
            ? error.message
            : "Failed to load RioExplorer Pump proof.",
      },
      { status: 500 },
    );
  }
}
