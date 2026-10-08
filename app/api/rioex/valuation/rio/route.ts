import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const RIO_ASSET_IDS = ["urio", "rio", "RIO"];

// Important:
// RioDex currently stores canonical RUSD as a CW20 contract asset, not as leri.
// Keep leri/urusd for future native-denom compatibility, but include both known RUSD registry contracts.
const RUSD_ASSET_IDS = [
  "leri",
  "urusd",
  "rusd",
  "RUSD",

  // RioDex token registry RUSD
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df",

  // RioEx token registry RUSD
  "rio14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s2rgffs",
];

type RioDexPairWithLiquidity = {
  pair_address: string;
  pair_key: string | null;
  asset_0_id: string;
  asset_1_id: string;
  display_symbol: string | null;
  reserve_0: string | number | null;
  reserve_1: string | number | null;
  spot_price: string | number | null;
  block_height: string | number | null;
  block_time: string | null;
};

type RioDexRawLiquidity = {
  pair_address: string;
  reserve_0: string | number | null;
  reserve_1: string | number | null;
  block_height: string | number | null;
  block_time: string | null;
  tx_hash: string | null;
  raw_event: any;
};

type RioDexSwapPrice = {
  pair_address: string;
  offer_asset_id: string;
  ask_asset_id: string;
  offer_amount: string | number | null;
  return_amount: string | number | null;
  effective_price: string | number | null;
  block_height: string | number | null;
  block_time: string | null;
  tx_hash: string | null;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeAssetId(value: unknown): string {
  return String(value ?? "").trim();
}

function isRioAsset(value: unknown): boolean {
  return RIO_ASSET_IDS.includes(normalizeAssetId(value));
}

function isRusdAsset(value: unknown): boolean {
  return RUSD_ASSET_IDS.includes(normalizeAssetId(value));
}

function fromBaseUnits(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;

  // RIO and RUSD both use 6 decimals in current Spherio/RioDex registry state.
  return n / 1_000_000;
}

function computePriceFromLiquidity(row: RioDexPairWithLiquidity): number | null {
  const asset0IsRio = isRioAsset(row.asset_0_id);
  const asset1IsRio = isRioAsset(row.asset_1_id);
  const asset0IsRusd = isRusdAsset(row.asset_0_id);
  const asset1IsRusd = isRusdAsset(row.asset_1_id);

  const reserve0 = fromBaseUnits(row.reserve_0);
  const reserve1 = fromBaseUnits(row.reserve_1);

  if (!reserve0 || !reserve1 || reserve0 <= 0 || reserve1 <= 0) {
    return null;
  }

  if (asset0IsRio && asset1IsRusd) {
    return reserve1 / reserve0;
  }

  if (asset0IsRusd && asset1IsRio) {
    return reserve0 / reserve1;
  }

  return null;
}

function computePriceFromRawLiquidity(row: RioDexRawLiquidity): number | null {
  const raw = row.raw_event ?? {};

  const nativeAsset = normalizeAssetId(raw.native_asset);
  const cw20Contract = normalizeAssetId(raw.cw20_contract);

  const nativeIsRio =
    nativeAsset === "native:urio" ||
    nativeAsset === "urio" ||
    isRioAsset(nativeAsset.replace("native:", ""));

  const cw20IsRusd = isRusdAsset(cw20Contract);

  const reserve0 = fromBaseUnits(row.reserve_0);
  const reserve1 = fromBaseUnits(row.reserve_1);

  if (!nativeIsRio || !cw20IsRusd) {
    return null;
  }

  if (!reserve0 || !reserve1 || reserve0 <= 0 || reserve1 <= 0) {
    return null;
  }

  // Existing liquidity raw_event shows:
  // native_asset: native:urio
  // cw20_contract: RUSD contract
  // reserve_0 / pool_asset_0 = native RIO
  // reserve_1 / pool_asset_1 = CW20 RUSD
  return reserve1 / reserve0;
}

function computePriceFromSwap(row: RioDexSwapPrice): number | null {
  const offer = fromBaseUnits(row.offer_amount);
  const returned = fromBaseUnits(row.return_amount);

  if (!offer || !returned || offer <= 0 || returned <= 0) {
    return null;
  }

  if (isRioAsset(row.offer_asset_id) && isRusdAsset(row.ask_asset_id)) {
    return returned / offer;
  }

  if (isRusdAsset(row.offer_asset_id) && isRioAsset(row.ask_asset_id)) {
    return offer / returned;
  }

  return null;
}

async function findRioRusdPairWithLatestLiquidity(): Promise<{
  row: RioDexPairWithLiquidity | null;
  price: number | null;
}> {
  const result = await pg.query<RioDexPairWithLiquidity>(
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
          AND asset_1_id = ANY($2::text[])
        )
        OR
        (
          asset_0_id = ANY($2::text[])
          AND asset_1_id = ANY($1::text[])
        )
      ORDER BY is_canonical DESC NULLS LAST, is_live DESC NULLS LAST, updated_at DESC NULLS LAST
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
      p.pair_address,
      p.pair_key,
      p.asset_0_id,
      p.asset_1_id,
      p.display_symbol,
      l.reserve_0,
      l.reserve_1,
      l.spot_price,
      l.block_height,
      l.block_time
    FROM candidate_pairs p
    LEFT JOIN latest_liquidity l
      ON l.pair_address = p.pair_address
    `,
    [RIO_ASSET_IDS, RUSD_ASSET_IDS],
  );

  for (const row of result.rows) {
    const price = computePriceFromLiquidity(row);

    if (price && price > 0) {
      return { row, price };
    }
  }

  return { row: result.rows[0] ?? null, price: null };
}

async function findRioRusdFromRawLiquidityEvents(): Promise<{
  row: RioDexRawLiquidity | null;
  price: number | null;
}> {
  const result = await pg.query<RioDexRawLiquidity>(
    `
    SELECT
      pair_address,
      reserve_0,
      reserve_1,
      block_height,
      block_time,
      tx_hash,
      raw_event
    FROM riodex_liquidity_snapshots
    WHERE
      raw_event->>'native_asset' IN ('native:urio', 'urio')
      AND raw_event->>'cw20_contract' = ANY($1::text[])
      AND reserve_0 IS NOT NULL
      AND reserve_1 IS NOT NULL
      AND reserve_0 > 0
      AND reserve_1 > 0
    ORDER BY block_height DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT 20
    `,
    [RUSD_ASSET_IDS],
  );

  for (const row of result.rows) {
    const price = computePriceFromRawLiquidity(row);

    if (price && price > 0) {
      return { row, price };
    }
  }

  return { row: result.rows[0] ?? null, price: null };
}

async function findRioRusdPriceFromLatestSwap(): Promise<{
  row: RioDexSwapPrice | null;
  price: number | null;
}> {
  const result = await pg.query<RioDexSwapPrice>(
    `
    SELECT
      pair_address,
      offer_asset_id,
      ask_asset_id,
      offer_amount,
      return_amount,
      effective_price,
      block_height,
      block_time,
      tx_hash
    FROM riodex_swaps
    WHERE
      (
        offer_asset_id = ANY($1::text[])
        AND ask_asset_id = ANY($2::text[])
      )
      OR
      (
        offer_asset_id = ANY($2::text[])
        AND ask_asset_id = ANY($1::text[])
      )
    ORDER BY block_height DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT 10
    `,
    [RIO_ASSET_IDS, RUSD_ASSET_IDS],
  );

  for (const row of result.rows) {
    const price = computePriceFromSwap(row);

    if (price && price > 0) {
      return { row, price };
    }
  }

  return { row: result.rows[0] ?? null, price: null };
}

async function countRioPairs(): Promise<number> {
  const result = await pg.query(
    `
    SELECT COUNT(*)::int AS count
    FROM riodex_pairs
    WHERE asset_0_id = ANY($1::text[])
       OR asset_1_id = ANY($1::text[])
    `,
    [RIO_ASSET_IDS],
  );

  return Number(result.rows?.[0]?.count ?? 0);
}

async function countRusdPairs(): Promise<number> {
  const result = await pg.query(
    `
    SELECT COUNT(*)::int AS count
    FROM riodex_pairs
    WHERE asset_0_id = ANY($1::text[])
       OR asset_1_id = ANY($1::text[])
    `,
    [RUSD_ASSET_IDS],
  );

  return Number(result.rows?.[0]?.count ?? 0);
}

export async function GET() {
  const updatedAt = new Date().toISOString();

  try {
    const liquidity = await findRioRusdPairWithLatestLiquidity();

    if (liquidity.price && liquidity.row) {
      const rioInRusd = liquidity.price;

      return NextResponse.json({
        ok: true,
        source: "riodex_liquidity_snapshots",
        authority: "riodex_cpmm",
        pair: "RIO/RUSD",
        pool: {
          pair_address: liquidity.row.pair_address,
          pair_key: liquidity.row.pair_key,
          asset_0_id: liquidity.row.asset_0_id,
          asset_1_id: liquidity.row.asset_1_id,
          display_symbol: liquidity.row.display_symbol,
          reserve_0: liquidity.row.reserve_0,
          reserve_1: liquidity.row.reserve_1,
          block_height: liquidity.row.block_height,
          block_time: liquidity.row.block_time,
        },
        price: {
          rio: {
            rusd: rioInRusd,
            usd: null,
            usdt: null,
            btc: null,
          },
        },
        updated_at: updatedAt,
      });
    }

    const rawLiquidity = await findRioRusdFromRawLiquidityEvents();

    if (rawLiquidity.price && rawLiquidity.row) {
      const rioInRusd = rawLiquidity.price;

      return NextResponse.json({
        ok: true,
        source: "riodex_liquidity_snapshots.raw_event",
        authority: "riodex_cpmm_raw_event_fallback",
        pair: "RIO/RUSD",
        pool: {
          pair_address: rawLiquidity.row.pair_address,
          reserve_0: rawLiquidity.row.reserve_0,
          reserve_1: rawLiquidity.row.reserve_1,
          block_height: rawLiquidity.row.block_height,
          block_time: rawLiquidity.row.block_time,
          tx_hash: rawLiquidity.row.tx_hash,
          native_asset: rawLiquidity.row.raw_event?.native_asset ?? null,
          cw20_contract: rawLiquidity.row.raw_event?.cw20_contract ?? null,
        },
        price: {
          rio: {
            rusd: rioInRusd,
            usd: null,
            usdt: null,
            btc: null,
          },
        },
        updated_at: updatedAt,
      });
    }

    const swap = await findRioRusdPriceFromLatestSwap();

    if (swap.price && swap.row) {
      const rioInRusd = swap.price;

      return NextResponse.json({
        ok: true,
        source: "riodex_swaps",
        authority: "riodex_recent_swap_fallback",
        pair: "RIO/RUSD",
        swap: {
          pair_address: swap.row.pair_address,
          offer_asset_id: swap.row.offer_asset_id,
          ask_asset_id: swap.row.ask_asset_id,
          offer_amount: swap.row.offer_amount,
          return_amount: swap.row.return_amount,
          effective_price: swap.row.effective_price,
          block_height: swap.row.block_height,
          block_time: swap.row.block_time,
          tx_hash: swap.row.tx_hash,
        },
        price: {
          rio: {
            rusd: rioInRusd,
            usd: null,
            usdt: null,
            btc: null,
          },
        },
        updated_at: updatedAt,
      });
    }

    const rioPairs = await countRioPairs();
    const rusdPairs = await countRusdPairs();

    return NextResponse.json(
      {
        ok: false,
        source: "riodex_cpmm",
        authority: "riodex_pairs + riodex_liquidity_snapshots",
        pair: "RIO/RUSD",
        price: {
          rio: {
            rusd: null,
            usd: null,
            usdt: null,
            btc: null,
          },
        },
        diagnostics: {
          reason:
            "No RIO/RUSD pair with usable liquidity, raw liquidity event, or swap price was found.",
          checked_assets: {
            rio: RIO_ASSET_IDS,
            rusd: RUSD_ASSET_IDS,
          },
          rio_pair_count: rioPairs,
          rusd_pair_count: rusdPairs,
          found_candidate_pair_without_price: liquidity.row,
          found_candidate_raw_liquidity_without_price: rawLiquidity.row,
          found_candidate_swap_without_price: swap.row,
          expected_tables: [
            "riodex_pairs",
            "riodex_liquidity_snapshots",
            "riodex_swaps",
            "riodex_token_registry",
            "rioex_token_registry",
          ],
        },
        updated_at: updatedAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[/api/rioex/valuation/rio] valuation failed:", error);

    return NextResponse.json(
      {
        ok: false,
        source: "riodex_cpmm",
        authority: "riodex_pairs + riodex_liquidity_snapshots",
        pair: "RIO/RUSD",
        price: {
          rio: {
            rusd: null,
            usd: null,
            usdt: null,
            btc: null,
          },
        },
        error: error instanceof Error ? error.message : "Unknown valuation error",
        updated_at: updatedAt,
      },
      { status: 500 },
    );
  }
}
