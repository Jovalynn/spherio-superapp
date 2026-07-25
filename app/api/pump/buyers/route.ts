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

    const result = await db.query(
      `
      WITH buy_totals AS (
        SELECT
          token_address,
          SUM(rio_amount_urio) AS total_buy_urio
        FROM pump_live_trades
        WHERE side = 'buy'
          AND token_address = $1
        GROUP BY token_address
      )
      SELECT
        t.token_address,
        t.trader_address AS wallet,
        ROUND((SUM(t.rio_amount_urio) / 1000000.0)::numeric, 6) AS rio_bought,
        SUM(t.rio_amount_urio)::text AS rio_bought_urio,
        COUNT(*)::int AS buy_count,
        ROUND(((SUM(t.rio_amount_urio) / NULLIF(bt.total_buy_urio, 0)) * 100)::numeric, 4) AS contribution_pct,
        MAX(t.block_time) AS last_buy_at,
        MAX(t.block_height) AS last_buy_height
      FROM pump_live_trades t
      JOIN buy_totals bt ON bt.token_address = t.token_address
      WHERE t.side = 'buy'
        AND t.token_address = $1
      GROUP BY t.token_address, t.trader_address, bt.total_buy_urio
      ORDER BY SUM(t.rio_amount_urio) DESC
      LIMIT $2
      `,
      [tokenAddress, limit],
    );

    const totalResult = await db.query(
      `
      SELECT
        COALESCE(SUM(rio_amount_urio), 0)::text AS total_buy_urio,
        COUNT(*)::int AS buy_trade_count,
        COUNT(DISTINCT trader_address)::int AS unique_buyers
      FROM pump_live_trades
      WHERE side = 'buy'
        AND token_address = $1
      `,
      [tokenAddress],
    );

    const totalBuyUrio = toNumber(totalResult.rows[0]?.total_buy_urio, 0);

    return NextResponse.json({
      ok: true,
      source: "pump_live_trades",
      tokenAddress,
      summary: {
        totalBuyRio: totalBuyUrio / 1_000_000,
        totalBuyUrio: String(totalResult.rows[0]?.total_buy_urio || "0"),
        buyTradeCount: toNumber(totalResult.rows[0]?.buy_trade_count, 0),
        uniqueBuyers: toNumber(totalResult.rows[0]?.unique_buyers, 0),
      },
      buyers: result.rows.map((row) => ({
        tokenAddress: String(row.token_address || tokenAddress),
        wallet: String(row.wallet || ""),
        rioBought: toNumber(row.rio_bought, 0),
        rioBoughtUrio: String(row.rio_bought_urio || "0"),
        buyCount: toNumber(row.buy_count, 0),
        contributionPct: toNumber(row.contribution_pct, 0),
        lastBuyAt: row.last_buy_at ? new Date(row.last_buy_at).toISOString() : null,
        lastBuyHeight: row.last_buy_height ? toNumber(row.last_buy_height, 0) : null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_live_trades",
        error:
          error instanceof Error
            ? error.message
            : "Failed to load indexed Pump buyers.",
      },
      { status: 500 },
    );
  }
}
