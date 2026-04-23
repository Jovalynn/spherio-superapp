import { NextResponse } from "next/server";
import { Pool } from "pg";
import { buildRioDexSurfaceHref } from "@/lib/riodex/routes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CANONICAL_PAIR_ADDR =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";

const RIO_DENOM = "urio";
const RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";

type CanonicalMarketRow = {
  pair_address: string;
  asset_0_id: string;
  asset_1_id: string;
  display_symbol: string | null;
  fee_bps: number;
  is_canonical: boolean;
  is_live: boolean;
  created_time: string | null;

  reserve_0: string | null;
  reserve_1: string | null;
  total_share: string | null;
  liquidity_height: string | number | null;
  liquidity_time: string | null;

  last_swap_tx_hash: string | null;
  last_swap_effective_price: string | null;
  last_swap_height: string | number | null;
  last_swap_time: string | null;

  trades_24h: string | number | null;
  volume_return_raw_24h: string | null;
  volume_offer_raw_24h: string | null;

  last_activity_time: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __spherioRioExPgPool: Pool | undefined;
}

function getPgPool() {
  if (global.__spherioRioExPgPool) {
    return global.__spherioRioExPgPool;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_CONNECTION_STRING ||
    process.env.SPHERIO_DATABASE_URL ||
    "";

  const pool =
    connectionString
      ? new Pool({
          connectionString,
        })
      : new Pool({
          host:
            process.env.POSTGRES_HOST ||
            process.env.PGHOST ||
            process.env.DB_HOST ||
            "postgres",
          port: Number(
            process.env.POSTGRES_PORT ||
              process.env.PGPORT ||
              process.env.DB_PORT ||
              5432
          ),
          database:
            process.env.POSTGRES_DB ||
            process.env.PGDATABASE ||
            process.env.DB_NAME ||
            "spherio_indexer",
          user:
            process.env.POSTGRES_USER ||
            process.env.PGUSER ||
            process.env.DB_USER ||
            "spherio",
          password:
            process.env.POSTGRES_PASSWORD ||
            process.env.PGPASSWORD ||
            process.env.DB_PASSWORD ||
            "spherio",
          max: 5,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 10_000,
        });

  global.__spherioRioExPgPool = pool;
  return pool;
}

function toDisplay(raw?: string | number | null, decimals = 6) {
  const n = Number(raw ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n / 10 ** decimals;
}

function normalizeAssetLabel(assetId?: string | null) {
  const value = String(assetId || "").trim();
  if (!value) return "—";
  if (value === RIO_DENOM || value.toLowerCase() === "rio") return "RIO";
  if (value === RUSD_CONTRACT || value.toLowerCase() === "rusd") return "RUSD";
  if (value.startsWith("rio1")) return `${value.slice(0, 8)}…${value.slice(-6)}`;
  return value.toUpperCase();
}

function resolveMarketLabel(asset0Id?: string | null, asset1Id?: string | null) {
  return `${normalizeAssetLabel(asset0Id)} / ${normalizeAssetLabel(asset1Id)}`;
}

const CANONICAL_MARKET_SQL = `
WITH pair AS (
  SELECT
    p.pair_address,
    p.asset_0_id,
    p.asset_1_id,
    p.display_symbol,
    p.fee_bps,
    p.is_canonical,
    p.is_live,
    p.created_time
  FROM riodex_pairs p
  WHERE p.pair_address = $1
),
latest_liquidity AS (
  SELECT
    l.pair_address,
    l.reserve_0,
    l.reserve_1,
    l.total_share,
    l.block_height,
    l.block_time
  FROM riodex_liquidity_snapshots l
  WHERE l.pair_address = $1
  ORDER BY l.block_height DESC, l.block_time DESC
  LIMIT 1
),
latest_swap AS (
  SELECT
    s.pair_address,
    s.tx_hash,
    s.offer_asset_id,
    s.ask_asset_id,
    s.offer_amount,
    s.return_amount,
    s.commission_amount,
    s.effective_price,
    s.block_height,
    s.block_time
  FROM riodex_swaps s
  WHERE s.pair_address = $1
  ORDER BY s.block_height DESC, s.block_time DESC
  LIMIT 1
),
volume_24h AS (
  SELECT
    s.pair_address,
    COUNT(*) AS trades_24h,
    COALESCE(SUM(CAST(s.return_amount AS NUMERIC)), 0) AS volume_return_raw_24h,
    COALESCE(SUM(CAST(s.offer_amount AS NUMERIC)), 0) AS volume_offer_raw_24h
  FROM riodex_swaps s
  WHERE s.pair_address = $1
    AND s.block_time >= NOW() - INTERVAL '24 hours'
  GROUP BY s.pair_address
)
SELECT
  pair.pair_address,
  pair.asset_0_id,
  pair.asset_1_id,
  pair.display_symbol,
  pair.fee_bps,
  pair.is_canonical,
  pair.is_live,
  pair.created_time,

  latest_liquidity.reserve_0,
  latest_liquidity.reserve_1,
  latest_liquidity.total_share,
  latest_liquidity.block_height AS liquidity_height,
  latest_liquidity.block_time AS liquidity_time,

  latest_swap.tx_hash AS last_swap_tx_hash,
  latest_swap.effective_price AS last_swap_effective_price,
  latest_swap.block_height AS last_swap_height,
  latest_swap.block_time AS last_swap_time,

  COALESCE(volume_24h.trades_24h, 0) AS trades_24h,
  COALESCE(volume_24h.volume_return_raw_24h, 0) AS volume_return_raw_24h,
  COALESCE(volume_24h.volume_offer_raw_24h, 0) AS volume_offer_raw_24h,

  GREATEST(
    COALESCE(latest_swap.block_time, TIMESTAMPTZ 'epoch'),
    COALESCE(latest_liquidity.block_time, TIMESTAMPTZ 'epoch')
  ) AS last_activity_time
FROM pair
LEFT JOIN latest_liquidity ON latest_liquidity.pair_address = pair.pair_address
LEFT JOIN latest_swap ON latest_swap.pair_address = pair.pair_address
LEFT JOIN volume_24h ON volume_24h.pair_address = pair.pair_address;
`;

export async function GET() {
  try {
    const pool = getPgPool();
    const result = await pool.query<CanonicalMarketRow>(CANONICAL_MARKET_SQL, [
      CANONICAL_PAIR_ADDR,
    ]);

    const row = result.rows[0] || null;

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Canonical market not found." },
        { status: 404 }
      );
    }

    const reserve0Raw = row.reserve_0 || "0";
    const reserve1Raw = row.reserve_1 || "0";
    const totalShareRaw = row.total_share || "0";

    const reserve0Display = toDisplay(reserve0Raw);
    const reserve1Display = toDisplay(reserve1Raw);
    const totalShareDisplay = toDisplay(totalShareRaw);

    const reservePrice =
      reserve0Display > 0 ? reserve1Display / reserve0Display : null;

    const lastSwapEffectivePrice = Number(row.last_swap_effective_price || 0);
    const priceQuotePerBase =
      reservePrice && Number.isFinite(reservePrice) && reservePrice > 0
        ? reservePrice
        : Number.isFinite(lastSwapEffectivePrice) && lastSwapEffectivePrice > 0
        ? lastSwapEffectivePrice
        : 0;

    const routes = buildRioDexSurfaceHref(CANONICAL_PAIR_ADDR);

    return NextResponse.json({
      ok: true,
      source: {
        type: "direct_db_truth",
        database:
          process.env.POSTGRES_DB ||
          process.env.PGDATABASE ||
          process.env.DB_NAME ||
          "spherio_indexer",
        tables: [
          "riodex_pairs",
          "riodex_liquidity_snapshots",
          "riodex_swaps",
        ],
      },
      market: {
        pairAddress: row.pair_address,
        label: resolveMarketLabel(row.asset_0_id, row.asset_1_id),
        asset0Id: row.asset_0_id,
        asset1Id: row.asset_1_id,
        feeBps: Number(row.fee_bps ?? 0),
        isCanonical: Boolean(row.is_canonical),
        isLive: Boolean(row.is_live),
        class: Boolean(row.is_canonical) ? "canonical" : "standard",
        status: Boolean(row.is_live) ? "live" : "review",

        reserves: {
          asset0Raw: reserve0Raw,
          asset1Raw: reserve1Raw,
          asset0Display: reserve0Display,
          asset1Display: reserve1Display,
        },

        lp: {
          totalShareRaw,
          totalShareDisplay,
        },

        price: {
          quotePerBase: String(priceQuotePerBase || 0),
        },

        activity: {
          trades24h: Number(row.trades_24h ?? 0),
          volumeOfferRaw24h: String(row.volume_offer_raw_24h ?? "0"),
          volumeReturnRaw24h: String(row.volume_return_raw_24h ?? "0"),
          lastLiquidityTime: row.liquidity_time,
          lastSwapTime: row.last_swap_time,
          lastActivityTime: row.last_activity_time,
        },

        metadata: {
          displaySymbol: row.display_symbol,
          createdTime: row.created_time,
          liquidityHeight: row.liquidity_height,
          lastSwapTxHash: row.last_swap_tx_hash,
        },

        routes: {
          riodexHome: routes.home,
          screener: routes.screener,
          swap: routes.swap,
          liquidity: routes.liquidity,
          pool: routes.pool,
          explorer: "/rioexplorer",
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load canonical RioEx market.",
      },
      { status: 500 }
    );
  }
}
