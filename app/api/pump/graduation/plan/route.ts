import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const REQUIRED_SEED_VALUE_RUSD = 15_000;
const URIO_PER_RIO = 1_000_000;
const DEFAULT_RIO_REFERENCE_PRICE_RUSD = 0.1;
const SEED_TOLERANCE = 0.995;

const RPC_URL =
  process.env.SPHERIO_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
  "http://host.docker.internal:26657";

const LIQUIDITY_WALLET =
  process.env.PUMP_LIQUIDITY_WALLET ||
  "rio1e9hszjll3d4pkn74n2th47wwyyh228wn2vhmsf";

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

function toBaseString(value: unknown, fallback = "0") {
  const raw = String(value ?? "").trim();
  return /^\d+$/.test(raw) ? raw : fallback;
}


let wasmClient: CosmWasmClient | null = null;

async function getWasmClient() {
  if (!wasmClient) {
    wasmClient = await CosmWasmClient.connect(RPC_URL);
  }
  return wasmClient;
}

async function queryTokenInfo(tokenAddress: string) {
  try {
    const client = await getWasmClient();
    return await client.queryContractSmart(tokenAddress, { token_info: {} });
  } catch {
    return null;
  }
}

async function queryTokenBalance(tokenAddress: string, address: string) {
  try {
    const client = await getWasmClient();
    const result = await client.queryContractSmart(tokenAddress, {
      balance: { address },
    });

    return String(result || "0");
  } catch {
    return "0";
  }
}

function baseAmountGte(value: string, required: string) {
  try {
    return BigInt(value || "0") >= BigInt(required || "0");
  } catch {
    return false;
  }
}

async function getRioReferencePrice(): Promise<number> {
  // Current devnet policy source. Later this should call /api/rio/reference-price
  // and use RIO/RUSD TWAP as the canonical reference.
  return DEFAULT_RIO_REFERENCE_PRICE_RUSD;
}

async function getTokenGraduation(tokenAddress: string) {
  const db = getPool();

  const result = await db.query(
    `
    WITH latest_liquidity AS (
      SELECT DISTINCT ON (pair_address)
        pair_address,
        reserve_0,
        reserve_1,
        block_height,
        block_time
      FROM riodex_liquidity_snapshots
      ORDER BY pair_address, block_height DESC NULLS LAST, block_time DESC NULLS LAST
    )
    SELECT
      plt.token_address,
      plt.token_symbol,
      plt.token_name,
      plt.status AS token_status,

      pg.status AS graduation_status,
      pg.required_seed_value_rusd,
      pg.seed_rio_urio,
      pg.seed_token_base,
      pg.riodex_factory,
      pg.riodex_pair_address,
      pg.lp_token_amount,
      pg.completed_at,

      rp.asset_0_id,
      rp.asset_1_id,
      rp.asset_0_type,
      rp.asset_1_type,

      COALESCE(NULLIF(a0.symbol, ''), NULLIF(rp.asset_0_id, ''), 'RIO') AS asset_0_symbol,
      COALESCE(NULLIF(a1.symbol, ''), NULLIF(plt.token_symbol, ''), NULLIF(plt.token_name, ''), NULLIF(rp.asset_1_id, '')) AS asset_1_symbol,
      COALESCE(a0.decimals, 6) AS asset_0_decimals,
      COALESCE(a1.decimals, 6) AS asset_1_decimals,

      ll.reserve_0,
      ll.reserve_1,
      ll.block_height AS liquidity_height,
      ll.block_time AS liquidity_time
    FROM pump_live_tokens plt
    LEFT JOIN pump_live_graduations pg
      ON pg.token_address = plt.token_address
    LEFT JOIN riodex_pairs rp
      ON rp.pair_address = pg.riodex_pair_address
      OR rp.asset_1_id = plt.token_address
    LEFT JOIN rioex_assets a0
      ON a0.asset_id = rp.asset_0_id
    LEFT JOIN rioex_assets a1
      ON a1.asset_id = plt.token_address
      OR a1.asset_id = rp.asset_1_id
    LEFT JOIN latest_liquidity ll
      ON ll.pair_address = COALESCE(pg.riodex_pair_address, rp.pair_address)
    WHERE plt.token_address = $1
    LIMIT 1
    `,
    [tokenAddress]
  );

  return result.rows[0] || null;
}

function isRioLike(value: unknown) {
  const s = String(value || "").trim().toUpperCase();
  return s === "RIO" || s === "URIO" || s === "NATIVE:URIO";
}

function indexedRioReserve(row: any): number {
  if (!row) return 0;

  // Canonical rule: RIO is native denom "urio".
  // Never infer RIO reserve from display symbols.
  if (row.asset_0_type === "native" && row.asset_0_id === "urio") {
    return toNumber(row.reserve_0, 0) / URIO_PER_RIO;
  }

  if (row.asset_1_type === "native" && row.asset_1_id === "urio") {
    return toNumber(row.reserve_1, 0) / URIO_PER_RIO;
  }

  return 0;
}

function poolHasAnyLiquidity(row: any) {
  return toNumber(row?.reserve_0, 0) > 0 || toNumber(row?.reserve_1, 0) > 0;
}

function nativeAsset(denom: string, amount: string) {
  return {
    kind: "native",
    denom,
    amount,
    info: {
      native_token: {
        denom,
      },
    },
  };
}

function cw20Asset(contract: string, amount: string) {
  return {
    kind: "cw20",
    contract,
    amount,
    info: {
      token: {
        contract_addr: contract,
      },
    },
  };
}

function buildFreshSeedExecutionPlan(
  row: any,
  requiredSeedUrio: string,
  seedTokenBase: string,
  reserveAuthority?: {
    finalizerIsMinter: boolean;
    finalizerHasTokenReserve: boolean;
  }
) {
  const pairAddress = String(row.riodex_pair_address || "").trim();
  const tokenAddress = String(row.token_address || "").trim();

  if (!pairAddress) return null;

  const asset0IsRio = isRioLike(row.asset_0_symbol) || isRioLike(row.asset_0_id);
  const asset1IsRio = isRioLike(row.asset_1_symbol) || isRioLike(row.asset_1_id);

  const rioAsset = nativeAsset("urio", requiredSeedUrio);
  const tokenAsset = cw20Asset(tokenAddress, seedTokenBase);

  const orderedAssets = asset0IsRio
    ? [rioAsset, tokenAsset]
    : asset1IsRio
      ? [tokenAsset, rioAsset]
      : [rioAsset, tokenAsset];

  return {
    mode: "fresh_required_seed",
    warning:
      "This plan is intended for first/fresh graduation seeding. If an underseeded pool already has liquidity, do not one-sided top-up blindly; reset/recreate or use a controlled migration.",
    pairAddress,
    liquidityWallet: LIQUIDITY_WALLET,
    requiredSeedUrio,
    seedTokenBase,
    steps: [
      reserveAuthority?.finalizerIsMinter
        ? {
            kind: "mint_token_reserve_to_pair",
            contractAddress: tokenAddress,
            msg: {
              mint: {
                recipient: pairAddress,
                amount: seedTokenBase,
              },
            },
            funds: [],
            summary: `Mint PUMP graduation token reserve directly to pair for ${
              row.token_symbol || tokenAddress
            }`,
          }
        : {
            kind: "transfer_token_reserve",
            contractAddress: tokenAddress,
            msg: {
              transfer: {
                recipient: pairAddress,
                amount: seedTokenBase,
              },
            },
            funds: [],
            summary: `Transfer PUMP token reserve to pair for ${
              row.token_symbol || tokenAddress
            }`,
          },
      {
        kind: "add_liquidity",
        contractAddress: pairAddress,
        msg: {
          add_liquidity: {
            assets: orderedAssets.map((asset: any) => ({
              info: asset.info,
              amount: asset.amount,
            })),
          },
        },
        funds: [{ denom: "urio", amount: requiredSeedUrio }],
        summary: `Seed mandatory 15K RUSD worth of RIO into ${row.token_symbol || tokenAddress}`,
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tokenAddress = String(body?.tokenAddress || body?.token || "").trim();

    if (!tokenAddress) {
      return NextResponse.json(
        { ok: false, error: "tokenAddress is required" },
        { status: 400 }
      );
    }

    const row = await getTokenGraduation(tokenAddress);

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Pump token not found" },
        { status: 404 }
      );
    }

    const rioReferencePriceRusd = await getRioReferencePrice();
    const requiredSeedValueRusd = REQUIRED_SEED_VALUE_RUSD;
    const requiredSeedRio = requiredSeedValueRusd / rioReferencePriceRusd;
    const requiredSeedUrio = String(Math.ceil(requiredSeedRio * URIO_PER_RIO));

    const seedTokenBase = toBaseString(row.seed_token_base, "200000000000000");

    const tokenInfo = await queryTokenInfo(tokenAddress);
    const tokenMinter = String(tokenInfo?.minter || "").trim() || null;
    const finalizerTokenBalanceBase = await queryTokenBalance(tokenAddress, LIQUIDITY_WALLET);
    const finalizerHasTokenReserve = baseAmountGte(finalizerTokenBalanceBase, seedTokenBase);
    const finalizerIsMinter = Boolean(tokenMinter && tokenMinter === LIQUIDITY_WALLET);
    const hasReserveAuthority = finalizerHasTokenReserve || finalizerIsMinter;

    const recordedSeedRio = toNumber(row.seed_rio_urio, 0) / URIO_PER_RIO;
    const actualIndexedSeedRio = indexedRioReserve(row);
    const missingSeedRio = Math.max(requiredSeedRio - actualIndexedSeedRio, 0);
    const missingSeedUrio = String(Math.ceil(missingSeedRio * URIO_PER_RIO));

    const hasPair = Boolean(row.riodex_pair_address);
    const hasAnyLiquidity = poolHasAnyLiquidity(row);
    const alreadySufficient = actualIndexedSeedRio >= requiredSeedRio * SEED_TOLERANCE;

    const executionPlan = buildFreshSeedExecutionPlan(row, requiredSeedUrio, seedTokenBase, {
      finalizerIsMinter,
      finalizerHasTokenReserve,
    });

    const status = alreadySufficient
      ? "ready_completed"
      : hasPair && hasAnyLiquidity
        ? "underseeded_existing_pool_requires_reset_or_migration"
        : hasPair && !hasReserveAuthority
          ? "reserve_authority_missing"
          : hasPair
            ? "ready_for_mandatory_seed"
            : "needs_pair_creation";

    const canExecuteFreshSeed =
      hasPair &&
      !alreadySufficient &&
      !hasAnyLiquidity &&
      hasReserveAuthority &&
      Boolean(executionPlan);

    return NextResponse.json({
      ok: true,
      source: "pump_graduation_finalizer_plan",
      policy: {
        requiredSeedValueRusd,
        rioReferencePriceRusd,
        requiredSeedRio,
        requiredSeedUrio,
        seedTokenBase,
      },
      token: {
        tokenAddress: row.token_address,
        symbol: row.token_symbol || row.token_name,
        name: row.token_name,
        status: row.token_status,
      },
      reserveAuthority: {
        liquidityWallet: LIQUIDITY_WALLET,
        tokenMinter,
        finalizerIsMinter,
        finalizerTokenBalanceBase,
        requiredTokenReserveBase: seedTokenBase,
        finalizerHasTokenReserve,
        hasReserveAuthority,
      },
      graduation: {
        status: row.graduation_status,
        pairAddress: row.riodex_pair_address,
        recordedSeedRio,
        actualIndexedSeedRio,
        missingSeedRio,
        missingSeedUrio,
        currentReserveLabel:
          row.reserve_0 && row.reserve_1
            ? `${actualIndexedSeedRio.toLocaleString("en-US", {
                maximumFractionDigits: 6,
              })} RIO indexed`
            : null,
      },
      finalizer: {
        status,
        canExecuteFreshSeed,
        liquidityWallet: LIQUIDITY_WALLET,
        requiredAction: alreadySufficient
          ? "No action required; required RIO seed is already indexed."
          : hasPair && hasAnyLiquidity
            ? "Existing pool is already underseeded. Do not one-sided top-up. Reset/recreate/migrate this devnet pair, then execute the mandatory fresh seed plan."
            : hasPair && !hasReserveAuthority
              ? "Reserve authority missing. Future PUMP tokens must mint/escrow the graduation token reserve to the finalizer or make the finalizer the token minter."
              : hasPair
                ? "Execute the mandatory fresh seed plan exactly as returned. Amount is policy-locked to 15K RUSD worth of RIO."
                : "Create the RioDex pair first, then execute the mandatory fresh seed plan.",
      },
      executionPlan,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to build PUMP graduation finalizer plan",
      },
      { status: 500 }
    );
  }
}
