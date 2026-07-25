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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tokenAddress = String(body.tokenAddress || "").trim();
    const limit = Math.max(1, Math.min(Math.floor(toNumber(body.limit, 80)), 200));

    if (!tokenAddress) {
      return NextResponse.json(
        { ok: false, error: "Missing tokenAddress." },
        { status: 400 },
      );
    }

    const db = getPool();

    const result = await db.query(
      `
      SELECT
        side,
        trader_address,
        price_rusd,
        rio_amount_urio,
        token_amount_base,
        tx_hash,
        block_height,
        block_time
      FROM pump_live_trades
      WHERE token_address = $1
      ORDER BY block_height ASC NULLS LAST, block_time ASC NULLS LAST, tx_hash ASC
      LIMIT $2
      `,
      [tokenAddress, limit],
    );

    const points = result.rows.map((row, index) => {
      const price = toNumber(row.price_rusd, 0);
      const rioAmount = toNumber(row.rio_amount_urio, 0) / 1_000_000;

      return {
        t: String(index + 1),
        open: price,
        high: price,
        low: price,
        close: price,
        volume: rioAmount,
        marketCap: price * 1_000_000_000,
        side: row.side === "sell" ? "sell" : "buy",
        traderAddress: String(row.trader_address || ""),
        txHash: String(row.tx_hash || ""),
        blockHeight: toNumber(row.block_height, 0),
      };
    });

    return NextResponse.json({
      ok: true,
      source: "pump_live_trades",
      tokenAddress,
      count: points.length,
      points,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_live_trades",
        error:
          error instanceof Error
            ? error.message
            : "Failed to load Pump trade chart.",
      },
      { status: 500 },
    );
  }
}
