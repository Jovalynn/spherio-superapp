import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const RIO_ASSET_IDS = ["urio", "rio", "RIO"];

function n(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function baseToHuman(value: unknown): number | null {
  const parsed = n(value);
  return parsed === null ? null : parsed / 1_000_000;
}

async function getRioPriceRusd(origin: string): Promise<{
  rioRusd: number | null;
  source: string | null;
  authority: string | null;
}> {
  try {
    const response = await fetch(`${origin}/api/rioex/valuation/rio`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const json = await response.json();

    if (!response.ok || !json?.ok) {
      return {
        rioRusd: null,
        source: json?.source ?? null,
        authority: json?.authority ?? null,
      };
    }

    const rioRusd = n(json?.price?.rio?.rusd);

    return {
      rioRusd,
      source: json?.source ?? null,
      authority: json?.authority ?? null,
    };
  } catch {
    return {
      rioRusd: null,
      source: null,
      authority: null,
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const asset = String(searchParams.get("asset") ?? "").trim();

  if (!asset) {
    return NextResponse.json(
      {
        ok: false,
        error: "asset query parameter is required.",
        expected: "/api/spo20/valuation?asset=rio1...",
      },
      { status: 400 },
    );
  }

  try {
    const rioValuation = await getRioPriceRusd(origin);

    const result = await pg.query(
      `
      WITH candidate_pairs AS (
        SELECT
          pair_address,
          pair_key,
          asset_0_id,
          asset_1_id,
          display_symbol
        FROM riodex_pairs
        WHERE
          (
            asset_0_id = ANY($1::text[])
            AND asset_1_id = $2
          )
          OR
          (
            asset_1_id = ANY($1::text[])
            AND asset_0_id = $2
          )
        ORDER BY is_live DESC NULLS LAST, is_canonical DESC NULLS LAST, updated_at DESC NULLS LAST
        LIMIT 10
      ),
      latest_liquidity AS (
        SELECT DISTINCT ON (pair_address)
          pair_address,
          reserve_0,
          reserve_1,
          spot_price,
          block_height,
          block_time
        FROM riodex_liquidity_snapshots
        WHERE pair_address IN (SELECT pair_address FROM candidate_pairs)
        ORDER BY pair_address, block_height DESC NULLS LAST, created_at DESC NULLS LAST
      )
      SELECT
        p.*,
        l.reserve_0,
        l.reserve_1,
        l.spot_price,
        l.block_height,
        l.block_time
      FROM candidate_pairs p
      LEFT JOIN latest_liquidity l ON l.pair_address = p.pair_address
      `,
      [RIO_ASSET_IDS, asset],
    );

    for (const row of result.rows) {
      const reserve0 = baseToHuman(row.reserve_0);
      const reserve1 = baseToHuman(row.reserve_1);

      if (!reserve0 || !reserve1 || reserve0 <= 0 || reserve1 <= 0) {
        continue;
      }

      const asset0IsRio = RIO_ASSET_IDS.includes(row.asset_0_id);
      const asset1IsRio = RIO_ASSET_IDS.includes(row.asset_1_id);

      let priceRio: number | null = null;

      // asset_0 = RIO, asset_1 = SPO-20
      if (asset0IsRio && row.asset_1_id === asset) {
        priceRio = reserve0 / reserve1;
      }

      // asset_0 = SPO-20, asset_1 = RIO
      if (asset1IsRio && row.asset_0_id === asset) {
        priceRio = reserve1 / reserve0;
      }

      if (priceRio && priceRio > 0) {
        const priceRusd =
          rioValuation.rioRusd !== null ? priceRio * rioValuation.rioRusd : null;

        return NextResponse.json({
          ok: true,
          source: "riodex_liquidity_snapshots",
          authority: "riodex_cpmm",
          asset,
          pair: {
            pair_address: row.pair_address,
            pair_key: row.pair_key,
            asset_0_id: row.asset_0_id,
            asset_1_id: row.asset_1_id,
            display_symbol: row.display_symbol,
            reserve_0: row.reserve_0,
            reserve_1: row.reserve_1,
            block_height: row.block_height,
            block_time: row.block_time,
          },
          price: {
            asset: {
              rio: priceRio,
              rusd: priceRusd,
              usd: priceRusd,
              usdt: priceRusd,
              btc: null,
            },
            rio: {
              rusd: rioValuation.rioRusd,
              source: rioValuation.source,
              authority: rioValuation.authority,
            },
          },
          updated_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      ok: false,
      source: "riodex_liquidity_snapshots",
      authority: "riodex_cpmm",
      asset,
      reason: "No usable RioDex CPMM liquidity found for this SPO-20 asset.",
      candidates: result.rows,
      price: {
        asset: {
          rio: null,
          rusd: null,
          usd: null,
          usdt: null,
          btc: null,
        },
        rio: {
          rusd: rioValuation.rioRusd,
          source: rioValuation.source,
          authority: rioValuation.authority,
        },
      },
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[/api/spo20/valuation] failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown SPO-20 valuation error",
      },
      { status: 500 },
    );
  }
}
