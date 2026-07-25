import { Pool } from "pg";
import type { RioExAssetRecord, RioExPairRecord } from "./registry-types";

type PairRow = {
  pair_address: string;
  asset_0_id: string | null;
  asset_1_id: string | null;
  display_symbol: string | null;
  fee_bps: string | number | null;
  is_canonical: boolean | null;
  is_live: boolean | null;
};

type LiquidityRow = {
  pair_address: string;
  liquidity_usd: string | number | null;
  block_height: string | number | null;
  block_time: string | null;
};

type SwapRow = {
  pair_address: string;
  block_time: string | null;
  tx_hash: string | null;
};

type AssetTableRow = {
  asset_id: string;
  symbol: string | null;
  display_name: string | null;
  decimals: string | number | null;
  logo_url: string | null;
  asset_type: string | null;
  denom: string | null;
  contract_address: string | null;
  explorer_route: string | null;
  coingecko_id: string | null;
  coinmarketcap_id: string | null;
  dexscreener_chain_id: string | null;
  dexscreener_token_address: string | null;
};

type PairRegistryRow = {
  pair_address: string;
  base_asset_id: string | null;
  quote_asset_id: string | null;
  display_symbol: string | null;
  canonical_symbol: string | null;
  fee_bps: string | number | null;
  is_canonical: boolean | null;
  is_live: boolean | null;
  liquidity_usd: string | number | null;
  liquidity_height: string | number | null;
  liquidity_time: string | null;
  liquidity_source: string | null;
  liquidity_updated_at: string | null;
  last_swap_time: string | null;
  last_swap_tx_hash: string | null;
  fee_recipient_address: string | null;
  fee_policy: string | null;
};

type ColumnRow = {
  column_name: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __rioexRegistryPgPool: Pool | undefined;
}

export function getRioExRegistryPool() {
  if (global.__rioexRegistryPgPool) return global.__rioexRegistryPgPool;

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_CONNECTION_STRING ||
    process.env.SPHERIO_DATABASE_URL ||
    "";

  const pool = connectionString
    ? new Pool({ connectionString })
    : new Pool({
          host:
        process.env.POSTGRES_HOST ||
        process.env.PGHOST ||
        process.env.DB_HOST ||
        process.env.HOST_POSTGRES ||
        "127.0.0.1",
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
        connectionTimeoutMillis: 3_000,
      });

  global.__rioexRegistryPgPool = pool;
  return pool;
}

function toNumber(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseEnvAssetMetadata() {
  const raw =
    process.env.RIOEX_ASSET_METADATA_JSON ||
    process.env.NEXT_PUBLIC_RIOEX_ASSET_METADATA_JSON ||
    "";

  if (!raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function inferAssetType(assetId: string) {
  if (assetId.startsWith("u")) return "native";
  if (assetId.startsWith("rio1")) return "spo20";
  if (assetId.includes(":")) return "bridged";
  return "unknown";
}

function inferSymbol(assetId: string) {
  if (assetId === "urio") return "RIO";
  if (assetId === "leri") return "RUSD";
  if (assetId.startsWith("u") && assetId.length > 1) {
    return assetId.slice(1).toUpperCase();
  }
  if (assetId.startsWith("rio1")) {
    return assetId.slice(0, 8).toUpperCase();
  }
  return assetId.toUpperCase();
}

function inferDisplayName(symbol: string, assetType: string) {
  if (symbol === "RIO") return "RIO";
  if (symbol === "RUSD") return "RUSD";
  if (assetType === "spo20") return `${symbol} Token`;
  return symbol;
}

function inferDecimals(assetId: string) {
  if (assetId === "urio" || assetId === "leri") return 6;
  if (assetId.startsWith("u")) return 6;
  return 6;
}

function inferExplorerRoute(assetId: string) {
  return `/rioexplorer/assets/${encodeURIComponent(assetId)}`;
}

async function tableExists(pool: Pool, tableName: string) {
  const result = await pool.query<{ exists: string | null }>(
    "select to_regclass($1) as exists",
    [tableName]
  );
  return Boolean(result.rows[0]?.exists);
}

async function getTableColumns(pool: Pool, tableName: string) {
  const [schema, table] = tableName.includes(".")
    ? tableName.split(".", 2)
    : ["public", tableName];

  const result = await pool.query<ColumnRow>(
    `
    select column_name
    from information_schema.columns
    where table_schema = $1 and table_name = $2
    order by ordinal_position
    `,
    [schema, table]
  );

  return new Set(result.rows.map((row) => String(row.column_name || "").trim()));
}

function pickFirstExisting(
  columns: Set<string>,
  candidates: string[],
  fallback?: string
) {
  for (const candidate of candidates) {
    if (columns.has(candidate)) return candidate;
  }

  return fallback || null;
}

function buildAssetFromEnvOrHeuristic(
  assetId: string,
  envMap: Record<string, any>
): RioExAssetRecord {
  const meta = envMap[assetId] || {};
  const assetType = meta.assetType || meta.type || inferAssetType(assetId);

  return {
    assetId,
    symbol: meta.symbol || inferSymbol(assetId),
    displayName:
      meta.displayName ||
      meta.name ||
      inferDisplayName(meta.symbol || inferSymbol(assetId), assetType),
    decimals: Number.isFinite(Number(meta.decimals))
      ? Number(meta.decimals)
      : inferDecimals(assetId),
    logoUrl: meta.logoUrl || null,
    assetType,
    denom: assetId.startsWith("u") ? assetId : null,
    contractAddress: assetId.startsWith("rio1") ? assetId : null,
    explorerRoute: meta.explorerRoute || inferExplorerRoute(assetId),
    externalIds: {
      coingeckoId: meta.coingeckoId || null,
      coinmarketcapId: meta.coinmarketcapId || null,
      dexscreenerChainId: meta.dexscreenerChainId || null,
      dexscreenerTokenAddress: meta.dexscreenerTokenAddress || null,
    },
    source: meta.symbol || meta.logoUrl ? "env_asset_metadata" : "heuristic_fallback",
  };
}

async function readAssetTable(pool: Pool) {
  const hasTable = await tableExists(pool, "public.rioex_assets");
  if (!hasTable) return new Map<string, RioExAssetRecord>();

  const columns = await getTableColumns(pool, "public.rioex_assets");

  const denomSelect = columns.has("denom")
    ? "denom"
    : "null::text as denom";

  const contractAddressSelect = columns.has("contract_address")
    ? "contract_address"
    : "null::text as contract_address";

  const explorerRouteSelect = columns.has("explorer_route")
    ? "explorer_route"
    : "null::text as explorer_route";

  const coingeckoIdSelect = columns.has("coingecko_id")
    ? "coingecko_id"
    : "null::text as coingecko_id";

  const coinmarketcapIdSelect = columns.has("coinmarketcap_id")
    ? "coinmarketcap_id"
    : "null::text as coinmarketcap_id";

  const dexscreenerChainIdSelect = columns.has("dexscreener_chain_id")
    ? "dexscreener_chain_id"
    : "null::text as dexscreener_chain_id";

  const dexscreenerTokenAddressSelect = columns.has("dexscreener_token_address")
    ? "dexscreener_token_address"
    : "null::text as dexscreener_token_address";

  const result = await pool.query<AssetTableRow>(`
    select
      asset_id,
      symbol,
      display_name,
      decimals,
      logo_url,
      asset_type,
      ${denomSelect},
      ${contractAddressSelect},
      ${explorerRouteSelect},
      ${coingeckoIdSelect},
      ${coinmarketcapIdSelect},
      ${dexscreenerChainIdSelect},
      ${dexscreenerTokenAddressSelect}
    from rioex_assets
  `);

  const map = new Map<string, RioExAssetRecord>();

  for (const row of result.rows) {
    const assetId = String(row.asset_id || "").trim();
    if (!assetId) continue;

    map.set(assetId, {
      assetId,
      symbol: row.symbol || inferSymbol(assetId),
      displayName:
        row.display_name ||
        row.symbol ||
        inferDisplayName(
          inferSymbol(assetId),
          row.asset_type || inferAssetType(assetId)
        ),
      decimals: toNumber(row.decimals) || inferDecimals(assetId),
      logoUrl: row.logo_url || null,
      assetType:
        (row.asset_type as RioExAssetRecord["assetType"]) ||
        inferAssetType(assetId),
      denom: row.denom || (assetId.startsWith("u") ? assetId : null),
      contractAddress:
        row.contract_address || (assetId.startsWith("rio1") ? assetId : null),
      explorerRoute: row.explorer_route || inferExplorerRoute(assetId),
      externalIds: {
        coingeckoId: row.coingecko_id || null,
        coinmarketcapId: row.coinmarketcap_id || null,
        dexscreenerChainId: row.dexscreener_chain_id || null,
        dexscreenerTokenAddress: row.dexscreener_token_address || null,
      },
      source: "rioex_assets_table",
    });
  }

  return map;
}

export async function resolveAssetRegistry(pool?: Pool) {
  const db = pool || getRioExRegistryPool();
  const envMap = parseEnvAssetMetadata();
  const assetTableMap = await readAssetTable(db);

  const pairResult = await db.query<PairRow>(`
    select pair_address, asset_0_id, asset_1_id, display_symbol, fee_bps, is_canonical, is_live
    from riodex_pairs
  `);

  const assetIds = new Set<string>();

  for (const row of pairResult.rows) {
    if (row.asset_0_id) assetIds.add(String(row.asset_0_id));
    if (row.asset_1_id) assetIds.add(String(row.asset_1_id));
  }

  const registry = new Map<string, RioExAssetRecord>();

  for (const assetId of assetIds) {
    const fromTable = assetTableMap.get(assetId);
    if (fromTable) {
      registry.set(assetId, fromTable);
      continue;
    }

    registry.set(assetId, buildAssetFromEnvOrHeuristic(assetId, envMap));
  }

  return registry;
}

async function readDerivedLiquidity(pool: Pool) {
  const tableName = "public.riodex_liquidity_snapshots";
  const hasTable = await tableExists(pool, tableName);
  const map = new Map<string, LiquidityRow>();

  if (!hasTable) return map;

  const columns = await getTableColumns(pool, tableName);
  const pairColumn = pickFirstExisting(columns, ["pair_address"], "pair_address");
  const liquidityUsdColumn = pickFirstExisting(columns, [
    "liquidity_usd",
    "usd_liquidity",
    "total_liquidity_usd",
    "tvl_usd",
    "liquidity_value_usd",
  ]);
  const heightColumn = pickFirstExisting(columns, [
    "block_height",
    "height",
    "liquidity_height",
  ]);
  const timeColumn = pickFirstExisting(columns, [
    "block_time",
    "snapshot_time",
    "liquidity_time",
    "created_at",
    "updated_at",
  ]);

  if (!pairColumn) return map;

  const liquiditySelect = liquidityUsdColumn
    ? `${liquidityUsdColumn} as liquidity_usd`
    : `0::numeric as liquidity_usd`;
  const heightSelect = heightColumn
    ? `${heightColumn} as block_height`
    : `null::text as block_height`;
  const timeSelect = timeColumn
    ? `${timeColumn} as block_time`
    : `null::timestamptz as block_time`;
  const orderBy = timeColumn
    ? `${timeColumn} desc nulls last`
    : heightColumn
    ? `${heightColumn} desc nulls last`
    : pairColumn;

  const sql = `
    with ranked as (
      select
        ${pairColumn} as pair_address,
        ${liquiditySelect},
        ${heightSelect},
        ${timeSelect},
        row_number() over (
          partition by ${pairColumn}
          order by ${orderBy}
        ) as rn
      from riodex_liquidity_snapshots
    )
    select pair_address, liquidity_usd, block_height, block_time
    from ranked
    where rn = 1
  `;

  const result = await pool.query<LiquidityRow>(sql);

  for (const row of result.rows) {
    if (!row.pair_address) continue;
    map.set(String(row.pair_address), row);
  }

  return map;
}

async function readDerivedSwaps(pool: Pool) {
  const result = await pool.query<SwapRow>(`
    with ranked as (
      select
        pair_address,
        block_time,
        tx_hash,
        row_number() over (partition by pair_address order by block_time desc nulls last) as rn
      from riodex_swaps
    )
    select pair_address, block_time, tx_hash
    from ranked
    where rn = 1
  `);

  const map = new Map<string, SwapRow>();

  for (const row of result.rows) {
    if (!row.pair_address) continue;
    map.set(String(row.pair_address), row);
  }

  return map;
}

async function readPairRegistryTable(pool: Pool) {
  const hasTable = await tableExists(pool, "public.rioex_pairs_registry");
  if (!hasTable) return null;

  const result = await pool.query<PairRegistryRow>(`
    select
      pair_address,
      base_asset_id,
      quote_asset_id,
      display_symbol,
      canonical_symbol,
      fee_bps,
      is_canonical,
      is_live,
      liquidity_usd,
      liquidity_height,
      liquidity_time,
      liquidity_source,
      liquidity_updated_at,
      last_swap_time,
      last_swap_tx_hash,
      fee_recipient_address,
      fee_policy
    from rioex_pairs_registry
  `);

  return result.rows;
}

function buildRoutes(pairAddress: string) {
  return {
    assetTerminal: `/rioex/markets/${encodeURIComponent(pairAddress)}`,
    marketBoard: "/rioex",
    hero: "/rioex",
    pool: `/riodex/pools?pool=${encodeURIComponent(pairAddress)}`,
    swap: `/riodex/swap?pair=${encodeURIComponent(pairAddress)}`,
    liquidity: `/riodex/liquidity/action?pool=${encodeURIComponent(pairAddress)}&mode=add&source=rioex`,
  };
}

async function resolvePairByAddressDirect(pairAddress: string, pool: Pool) {
  const cleanPairAddress = String(pairAddress || "").trim();
  if (!cleanPairAddress) return null;

  const assets = await readAssetTable(pool);

  const pairRegistryExists = await tableExists(pool, "public.rioex_pairs_registry");

  if (pairRegistryExists) {
    const result = await pool.query<PairRegistryRow>(
      `
      select
        pair_address,
        base_asset_id,
        quote_asset_id,
        display_symbol,
        canonical_symbol,
        fee_bps,
        is_canonical,
        is_live,
        liquidity_usd,
        liquidity_height,
        liquidity_time,
        liquidity_source,
        liquidity_updated_at,
        last_swap_time,
        last_swap_tx_hash,
        fee_recipient_address,
        fee_policy
      from rioex_pairs_registry
      where pair_address = $1
      limit 1
      `,
      [cleanPairAddress]
    );

    const row = result.rows[0];
    if (row) {
      const baseAssetId = String(row.base_asset_id || "").trim();
      const quoteAssetId = String(row.quote_asset_id || "").trim();
      if (!baseAssetId || !quoteAssetId) return null;

      const envMap = parseEnvAssetMetadata();
      const baseAsset =
        assets.get(baseAssetId) || buildAssetFromEnvOrHeuristic(baseAssetId, envMap);
      const quoteAsset =
        assets.get(quoteAssetId) || buildAssetFromEnvOrHeuristic(quoteAssetId, envMap);

      return {
        pairAddress: cleanPairAddress,
        baseAssetId,
        quoteAssetId,
        displaySymbol:
          row.display_symbol || `${baseAsset.symbol} / ${quoteAsset.symbol}`,
        canonicalSymbol:
          row.canonical_symbol || `${baseAsset.symbol}/${quoteAsset.symbol}`,
        feeBps: toNumber(row.fee_bps),
        isCanonical: toBoolean(row.is_canonical, false),
        isLive: toBoolean(row.is_live, false),
        liquidityUsd: toNumber(row.liquidity_usd),
        liquidityHeight: row.liquidity_height || null,
        liquidityTime: row.liquidity_time || null,
        liquiditySource: row.liquidity_source || null,
        liquidityUpdatedAt: row.liquidity_updated_at || null,
        lastSwapTime: row.last_swap_time || null,
        lastSwapTxHash: row.last_swap_tx_hash || null,
        quoteConvention: "asset_1_per_asset_0" as const,
        feeRecipientAddress: row.fee_recipient_address || null,
        feePolicy: row.fee_policy || null,
        baseAsset,
        quoteAsset,
        routes: buildRoutes(cleanPairAddress),
        source: "rioex_pairs_registry_table" as const,
      };
    }
  }

  const pairsResult = await pool.query<PairRow>(
    `
    select pair_address, asset_0_id, asset_1_id, display_symbol, fee_bps, is_canonical, is_live
    from riodex_pairs
    where pair_address = $1
    limit 1
    `,
    [cleanPairAddress]
  );

  const pairRow = pairsResult.rows[0];
  if (!pairRow) return null;

  const baseAssetId = String(pairRow.asset_0_id || "").trim();
  const quoteAssetId = String(pairRow.asset_1_id || "").trim();
  if (!baseAssetId || !quoteAssetId) return null;

  const envMap = parseEnvAssetMetadata();
  const baseAsset =
    assets.get(baseAssetId) || buildAssetFromEnvOrHeuristic(baseAssetId, envMap);
  const quoteAsset =
    assets.get(quoteAssetId) || buildAssetFromEnvOrHeuristic(quoteAssetId, envMap);

  const liquidityResult = await pool.query<LiquidityRow>(
    `
    select
      pair_address,
      0::numeric as liquidity_usd,
      block_height,
      block_time
    from riodex_liquidity_snapshots
    where pair_address = $1
    order by block_time desc nulls last
    limit 1
    `,
    [cleanPairAddress]
  );

  const swapResult = await pool.query<SwapRow>(
    `
    select
      pair_address,
      block_time,
      tx_hash
    from riodex_swaps
    where pair_address = $1
    order by block_time desc nulls last
    limit 1
    `,
    [cleanPairAddress]
  );

  const liquidity = liquidityResult.rows[0] || null;
  const swap = swapResult.rows[0] || null;

  return {
    pairAddress: cleanPairAddress,
    baseAssetId,
    quoteAssetId,
    displaySymbol:
      pairRow.display_symbol || `${baseAsset.symbol} / ${quoteAsset.symbol}`,
    canonicalSymbol: `${baseAsset.symbol}/${quoteAsset.symbol}`,
    feeBps: toNumber(pairRow.fee_bps),
    isCanonical: toBoolean(pairRow.is_canonical, false),
    isLive: toBoolean(pairRow.is_live, true),
    liquidityUsd: toNumber(liquidity?.liquidity_usd),
    liquidityHeight: liquidity?.block_height || null,
    liquidityTime: liquidity?.block_time || null,
    liquiditySource: null,
    liquidityUpdatedAt: null,
    lastSwapTime: swap?.block_time || null,
    lastSwapTxHash: swap?.tx_hash || null,
    quoteConvention: "asset_1_per_asset_0" as const,
    feeRecipientAddress: null,
    feePolicy: null,
    baseAsset,
    quoteAsset,
    routes: buildRoutes(cleanPairAddress),
    source: "derived_from_pairs_and_snapshots" as const,
  };
}

export async function resolvePairRegistry(pool?: Pool) {
  const db = pool || getRioExRegistryPool();
  const assets = await resolveAssetRegistry(db);
  const registry = new Map<string, RioExPairRecord>();

  const pairRegistryRows = await readPairRegistryTable(db);

  if (pairRegistryRows?.length) {
    for (const row of pairRegistryRows) {
      const pairAddress = String(row.pair_address || "").trim();
      const baseAssetId = String(row.base_asset_id || "").trim();
      const quoteAssetId = String(row.quote_asset_id || "").trim();
      if (!pairAddress || !baseAssetId || !quoteAssetId) continue;

      const envMap = parseEnvAssetMetadata();

const baseAsset =
  assets.get(baseAssetId) ||
  buildAssetFromEnvOrHeuristic(baseAssetId, envMap);

const quoteAsset =
  assets.get(quoteAssetId) ||
  buildAssetFromEnvOrHeuristic(quoteAssetId, envMap);

      registry.set(pairAddress, {
        pairAddress,
        baseAssetId,
        quoteAssetId,
        displaySymbol:
          row.display_symbol || `${baseAsset.symbol} / ${quoteAsset.symbol}`,
        canonicalSymbol:
          row.canonical_symbol || `${baseAsset.symbol}/${quoteAsset.symbol}`,
        feeBps: toNumber(row.fee_bps),
        isCanonical: toBoolean(row.is_canonical, false),
        isLive: toBoolean(row.is_live, false),
        liquidityUsd: toNumber(row.liquidity_usd),
        liquidityHeight: row.liquidity_height || null,
        liquidityTime: row.liquidity_time || null,
        liquiditySource: row.liquidity_source || null,
        liquidityUpdatedAt: row.liquidity_updated_at || null,
        lastSwapTime: row.last_swap_time || null,
        lastSwapTxHash: row.last_swap_tx_hash || null,
        quoteConvention: "asset_1_per_asset_0",
        feeRecipientAddress: row.fee_recipient_address || null,
        feePolicy: row.fee_policy || null,
        baseAsset,
        quoteAsset,
        routes: buildRoutes(pairAddress),
        source: "rioex_pairs_registry_table",
      });
    }

    return registry;
  }

  const pairs = await db.query<PairRow>(`
    select pair_address, asset_0_id, asset_1_id, display_symbol, fee_bps, is_canonical, is_live
    from riodex_pairs
  `);

  const liquidityByPair = await readDerivedLiquidity(db);
  const swapsByPair = await readDerivedSwaps(db);

  for (const row of pairs.rows) {
    const pairAddress = String(row.pair_address || "").trim();
    const baseAssetId = String(row.asset_0_id || "").trim();
    const quoteAssetId = String(row.asset_1_id || "").trim();
    if (!pairAddress || !baseAssetId || !quoteAssetId) continue;

    const envMap = parseEnvAssetMetadata();

const baseAsset =
  assets.get(baseAssetId) ||
  buildAssetFromEnvOrHeuristic(baseAssetId, envMap);

const quoteAsset =
  assets.get(quoteAssetId) ||
  buildAssetFromEnvOrHeuristic(quoteAssetId, envMap);

    const liquidity = liquidityByPair.get(pairAddress);
    const swap = swapsByPair.get(pairAddress);

    registry.set(pairAddress, {
      pairAddress,
      baseAssetId,
      quoteAssetId,
      displaySymbol:
        row.display_symbol || `${baseAsset.symbol} / ${quoteAsset.symbol}`,
      canonicalSymbol: `${baseAsset.symbol}/${quoteAsset.symbol}`,
      feeBps: toNumber(row.fee_bps),
      isCanonical: toBoolean(row.is_canonical, false),
      isLive: toBoolean(row.is_live, true),
      liquidityUsd: toNumber(liquidity?.liquidity_usd),
      liquidityHeight: liquidity?.block_height || null,
      liquidityTime: liquidity?.block_time || null,
      liquiditySource: null,
      liquidityUpdatedAt: null,
      lastSwapTime: swap?.block_time || null,
      lastSwapTxHash: swap?.tx_hash || null,
      quoteConvention: "asset_1_per_asset_0",
      feeRecipientAddress: null,
      feePolicy: null,
      baseAsset,
      quoteAsset,
      routes: buildRoutes(pairAddress),
      source: "derived_from_pairs_and_snapshots",
    });
  }

  return registry;
}

export async function resolvePairByAddress(pairAddress: string, pool?: Pool) {
  const db = pool || getRioExRegistryPool();

  const direct = await resolvePairByAddressDirect(pairAddress, db);
  if (direct) return direct;

  const registry = await resolvePairRegistry(db);
  return registry.get(pairAddress) || null;
}

export async function resolveAssetById(assetId: string, pool?: Pool) {
  const registry = await resolveAssetRegistry(pool);
  return registry.get(assetId) || null;
}
