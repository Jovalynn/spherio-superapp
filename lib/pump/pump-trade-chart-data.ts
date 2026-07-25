// lib/pump/pump-trade-chart-data.ts

import { Pool } from "pg";

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

export type PumpTradeChartPoint = {
  index: number;
  side: "buy" | "sell";
  priceRio: number;
  rioAmount: number;
  tokenAmount: number;
  traderAddress: string;
  txHash: string;
  blockHeight: number;
  blockTime: string | null;
};

export type PumpTradeChartData = {
  ok: boolean;
  source: "pump_live_trades" | "empty" | "error";
  points: PumpTradeChartPoint[];
  latestPriceRio: number;
  tradeCount: number;
  error?: string;
};

export async function getPumpTradeChartData(
  tokenAddress: string,
  limit = 80,
): Promise<PumpTradeChartData> {
  const address = String(tokenAddress || "").trim();

  if (!address) {
    return {
      ok: false,
      source: "empty",
      points: [],
      latestPriceRio: 0,
      tradeCount: 0,
      error: "Missing token address.",
    };
  }

  try {
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
      [address, limit],
    );

    const points: PumpTradeChartPoint[] = result.rows.map((row, i) => ({
      index: i + 1,
      side: row.side === "sell" ? "sell" : "buy",
      traderAddress: String(row.trader_address || ""),
      priceRio: toNumber(row.price_rusd, 0),
      rioAmount: toNumber(row.rio_amount_urio, 0) / 1_000_000,
      tokenAmount: toNumber(row.token_amount_base, 0) / 1_000_000,
      txHash: String(row.tx_hash || ""),
      blockHeight: toNumber(row.block_height, 0),
      blockTime: row.block_time ? new Date(row.block_time).toISOString() : null,
    }));

    return {
      ok: true,
      source: points.length > 0 ? "pump_live_trades" : "empty",
      points,
      latestPriceRio: points.at(-1)?.priceRio || 0,
      tradeCount: points.length,
    };
  } catch (error) {
    return {
      ok: false,
      source: "error",
      points: [],
      latestPriceRio: 0,
      tradeCount: 0,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load Pump trade chart data.",
    };
  }
}
