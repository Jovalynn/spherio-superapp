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

function parseLimit(value: string | null, fallback = 25, max = 100) {
  const n = Math.floor(toNumber(value, fallback));
  if (n <= 0) return fallback;
  return Math.min(n, max);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tokenAddress = String(
      url.searchParams.get("tokenAddress") ||
        url.searchParams.get("token") ||
        "",
    ).trim();

    const limit = parseLimit(url.searchParams.get("limit"));

    if (!tokenAddress) {
      return NextResponse.json(
        {
          ok: false,
          source: "pump_live_trades",
          error: "Missing tokenAddress.",
        },
        { status: 400 },
      );
    }

    const db = getPool();

    const summaryResult = await db.query(
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
      [tokenAddress],
    );

    const traderResult = await db.query(
      `
      WITH token_totals AS (
        SELECT
          token_address,
          COALESCE(SUM(CASE WHEN side = 'buy' THEN rio_amount_urio ELSE 0 END), 0) AS total_buy_urio,
          COALESCE(SUM(CASE WHEN side = 'sell' THEN rio_amount_urio ELSE 0 END), 0) AS total_sell_urio
        FROM pump_live_trades
        WHERE token_address = $1
        GROUP BY token_address
      )
      SELECT
        t.token_address,
        t.trader_address AS wallet,

        COALESCE(SUM(CASE WHEN t.side = 'buy' THEN t.rio_amount_urio ELSE 0 END), 0)::text AS buy_urio,
        COALESCE(SUM(CASE WHEN t.side = 'sell' THEN t.rio_amount_urio ELSE 0 END), 0)::text AS sell_urio,
        COALESCE(SUM(CASE WHEN t.side = 'buy' THEN t.token_amount_base ELSE 0 END), 0)::text AS token_bought_base,
        COALESCE(SUM(CASE WHEN t.side = 'sell' THEN t.token_amount_base ELSE 0 END), 0)::text AS token_sold_base,

        COUNT(*) FILTER (WHERE t.side = 'buy')::int AS buy_count,
        COUNT(*) FILTER (WHERE t.side = 'sell')::int AS sell_count,
        COUNT(*)::int AS trade_count,

        ROUND(
          (
            COALESCE(SUM(CASE WHEN t.side = 'buy' THEN t.rio_amount_urio ELSE 0 END), 0)
            / NULLIF(tt.total_buy_urio, 0)
          ) * 100,
          4
        ) AS buy_contribution_pct,

        ROUND(
          (
            COALESCE(SUM(CASE WHEN t.side = 'sell' THEN t.rio_amount_urio ELSE 0 END), 0)
            / NULLIF(tt.total_sell_urio, 0)
          ) * 100,
          4
        ) AS sell_contribution_pct,

        MAX(t.block_time) AS last_activity_at,
        MAX(t.block_height) AS last_activity_height
      FROM pump_live_trades t
      JOIN token_totals tt ON tt.token_address = t.token_address
      WHERE t.token_address = $1
      GROUP BY t.token_address, t.trader_address, tt.total_buy_urio, tt.total_sell_urio
      ORDER BY
        (
          COALESCE(SUM(CASE WHEN t.side = 'buy' THEN t.rio_amount_urio ELSE 0 END), 0) +
          COALESCE(SUM(CASE WHEN t.side = 'sell' THEN t.rio_amount_urio ELSE 0 END), 0)
        ) DESC
      LIMIT $2
      `,
      [tokenAddress, limit],
    );

    const summary = summaryResult.rows[0] || {};
    const totalBuyUrio = toNumber(summary.total_buy_urio, 0);
    const totalSellUrio = toNumber(summary.total_sell_urio, 0);

    return NextResponse.json({
      ok: true,
      source: "pump_live_trades",
      tokenAddress,
      summary: {
        totalBuyRio: totalBuyUrio / 1_000_000,
        totalSellRio: totalSellUrio / 1_000_000,
        netBuyRio: (totalBuyUrio - totalSellUrio) / 1_000_000,
        totalBuyUrio: String(summary.total_buy_urio || "0"),
        totalSellUrio: String(summary.total_sell_urio || "0"),
        tradeCount: toNumber(summary.trade_count, 0),
        buyCount: toNumber(summary.buy_count, 0),
        sellCount: toNumber(summary.sell_count, 0),
        uniqueTraders: toNumber(summary.unique_traders, 0),
        uniqueBuyers: toNumber(summary.unique_buyers, 0),
        uniqueSellers: toNumber(summary.unique_sellers, 0),
      },
      traders: traderResult.rows.map((row) => {
        const buyUrio = toNumber(row.buy_urio, 0);
        const sellUrio = toNumber(row.sell_urio, 0);

        return {
          tokenAddress: String(row.token_address || tokenAddress),
          wallet: String(row.wallet || ""),
          rioBought: buyUrio / 1_000_000,
          rioSold: sellUrio / 1_000_000,
          netRio: (buyUrio - sellUrio) / 1_000_000,
          buyUrio: String(row.buy_urio || "0"),
          sellUrio: String(row.sell_urio || "0"),
          tokenBoughtBase: String(row.token_bought_base || "0"),
          tokenSoldBase: String(row.token_sold_base || "0"),
          buyCount: toNumber(row.buy_count, 0),
          sellCount: toNumber(row.sell_count, 0),
          tradeCount: toNumber(row.trade_count, 0),
          buyContributionPct: toNumber(row.buy_contribution_pct, 0),
          sellContributionPct: toNumber(row.sell_contribution_pct, 0),
          lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at).toISOString() : null,
          lastActivityHeight: row.last_activity_height ? toNumber(row.last_activity_height, 0) : null,
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_live_trades",
        error:
          error instanceof Error
            ? error.message
            : "Failed to load indexed Pump traders.",
      },
      { status: 500 },
    );
  }
}
