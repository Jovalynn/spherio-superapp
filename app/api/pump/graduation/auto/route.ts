import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const APP_BASE =
  process.env.NEXT_PUBLIC_SUPERAPP_URL ||
  process.env.SUPERAPP_URL ||
  "http://127.0.0.1:3000";

const RPC_URL =
  process.env.SPHERIO_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
  "http://host.docker.internal:26657";

const ADMIN_TOKEN = process.env.PUMP_FINALIZER_ADMIN_TOKEN || "";

const FINALIZER_ENABLED =
  String(process.env.PUMP_FINALIZER_ENABLED || "").toLowerCase() === "true";

const FINALIZER_MNEMONIC = process.env.PUMP_FINALIZER_MNEMONIC || "";
const EXPECTED_FINALIZER_ADDRESS =
  process.env.PUMP_FINALIZER_EXPECTED_ADDRESS ||
  "rio1e9hszjll3d4pkn74n2th47wwyyh228wn2vhmsf";

const RIODEX_FACTORY =
  process.env.RIODEX_FACTORY_ADDRESS ||
  "rio1nkp9nq5uval4uguef0hgea28sedmzs8vxhu6xqz890ddsxywm3eqsuyvu0";

const CREATE_POOL_FEE_AMOUNT =
  process.env.PUMP_RIODEX_CREATE_POOL_FEE_AMOUNT || "1000000";

const CREATE_POOL_FEE_DENOM =
  process.env.PUMP_RIODEX_CREATE_POOL_FEE_DENOM || "urio";

const URIO_PER_RIO = 1_000_000;
const REQUIRED_SEED_URIO = "150000000000";
const REQUIRED_TOKEN_RESERVE_BASE = "200000000000000";

type AutoFinalizeRequest = {
  tokenAddress?: string;
  limit?: number;
  dryRun?: boolean;
};

type GraduationPlan = {
  ok?: boolean;
  error?: string;
  token?: {
    tokenAddress?: string;
    symbol?: string;
    name?: string;
    status?: string;
  };
  policy?: {
    requiredSeedRio?: number;
    requiredSeedUrio?: string;
    seedTokenBase?: string;
  };
  reserveAuthority?: {
    finalizerHasTokenReserve?: boolean;
    hasReserveAuthority?: boolean;
  };
  graduation?: {
    status?: string | null;
    pairAddress?: string | null;
    actualIndexedSeedRio?: number;
    missingSeedRio?: number;
  };
  finalizer?: {
    status?: string;
    canExecuteFreshSeed?: boolean;
    requiredAction?: string;
  };
};

type ExecuteResponse = {
  ok?: boolean;
  error?: string;
  txs?: Array<{
    step: string;
    txHash: string;
  }>;
  pairAddress?: string;
  requiredSeedUrio?: string;
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

function parseLimit(value: unknown, fallback = 10, max = 50) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

function checkAdmin(request: NextRequest) {
  if (!ADMIN_TOKEN) return true;

  const supplied =
    request.headers.get("x-pump-finalizer-token") ||
    request.nextUrl.searchParams.get("token") ||
    "";

  return supplied === ADMIN_TOKEN;
}

function assertBaseUnitAmount(value: unknown, label: string) {
  const raw = String(value ?? "").trim();

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${label} must be a base-unit integer string.`);
  }

  if (BigInt(raw) <= 0n) {
    throw new Error(`${label} must be greater than zero.`);
  }

  return raw;
}

async function getFinalizerClient() {
  if (!FINALIZER_ENABLED) {
    throw new Error("PUMP finalizer execution is disabled. Set PUMP_FINALIZER_ENABLED=true.");
  }

  if (!FINALIZER_MNEMONIC.trim()) {
    throw new Error("PUMP_FINALIZER_MNEMONIC is not configured.");
  }

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(FINALIZER_MNEMONIC, {
    prefix: "rio",
  });

  const [account] = await wallet.getAccounts();

  if (!account?.address) {
    throw new Error("Finalizer wallet has no account.");
  }

  if (EXPECTED_FINALIZER_ADDRESS && account.address !== EXPECTED_FINALIZER_ADDRESS) {
    throw new Error(
      `Finalizer signer mismatch. Expected ${EXPECTED_FINALIZER_ADDRESS}, got ${account.address}.`
    );
  }

  const client = await SigningCosmWasmClient.connectWithSigner(RPC_URL, wallet, {
    gasPrice: GasPrice.fromString("0.025urio"),
  });

  return {
    client,
    address: account.address,
  };
}

async function getCandidates(tokenAddress?: string, limit = 10) {
  const db = getPool();

  if (tokenAddress) {
    return [{ token_address: tokenAddress }];
  }

  const result = await db.query(
    `
    SELECT
      plt.token_address
    FROM pump_live_tokens plt
    LEFT JOIN pump_live_graduations pg
      ON pg.token_address = plt.token_address
    WHERE
      plt.status IN ('graduating', 'bonding')
      OR pg.status IN ('triggered', 'pair_created', 'liquidity_seeded', 'lp_locked')
    ORDER BY COALESCE(pg.block_height, plt.created_height, 0) DESC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${APP_BASE}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(ADMIN_TOKEN ? { "x-pump-finalizer-token": ADMIN_TOKEN } : {}),
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let json: any = null;

  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`${path} returned non-JSON (${res.status})`);
  }

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || `${path} failed with ${res.status}`);
  }

  return json as T;
}

async function fetchPlan(tokenAddress: string) {
  return postJson<GraduationPlan>("/api/pump/graduation/plan", {
    tokenAddress,
  });
}

function extractPoolAddressFromEvents(events: readonly any[]) {
  for (const event of events || []) {
    if (event?.type !== "wasm") continue;
    const attrs = Array.isArray(event.attributes) ? event.attributes : [];
    const action = attrs.find((a: any) => a?.key === "action")?.value;

    const poolAddress =
      attrs.find((a: any) => a?.key === "pool_address")?.value ||
      attrs.find((a: any) => a?.key === "pair_addr")?.value ||
      attrs.find((a: any) => a?.key === "pair_address")?.value;

    if (
      (action === "pool_created" || action === "reply_create_pair") &&
      typeof poolAddress === "string" &&
      poolAddress.startsWith("rio1")
    ) {
      return poolAddress;
    }
  }

  for (const event of events || []) {
    if (event?.type !== "instantiate") continue;
    const attrs = Array.isArray(event.attributes) ? event.attributes : [];
    const contract = attrs.find((a: any) => a?.key === "_contract_address")?.value;

    if (typeof contract === "string" && contract.startsWith("rio1")) {
      return contract;
    }
  }

  return null;
}

async function createRioDexPool(tokenAddress: string) {
  const { client, address } = await getFinalizerClient();

  const attempts = [
    {
      label: "create_pair",
      msg: {
        create_pair: {
          asset_infos: [
            {
              token: {
                contract_addr: tokenAddress,
              },
            },
            {
              native_token: {
                denom: "urio",
              },
            },
          ],
          swap_fee_bps: null,
          protocol_fee_bps: null,
          liquidity_fee_bps: null,
        },
      },
      funds: [{ denom: CREATE_POOL_FEE_DENOM, amount: CREATE_POOL_FEE_AMOUNT }],
    },
  ];

  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const result = await client.execute(
        address,
        RIODEX_FACTORY,
        attempt.msg,
        "auto",
        `PUMP graduation ${attempt.label} RioDex pool ${tokenAddress}`,
        attempt.funds
      );

      const pairAddress = extractPoolAddressFromEvents(result.events as any[]);

      if (!pairAddress) {
        throw new Error(
          `${attempt.label} tx succeeded, but pool/pair address was not found. tx=${result.transactionHash}`
        );
      }

      return {
        pairAddress,
        txHash: result.transactionHash,
        height: Number(result.height || 0),
        signer: address,
        variant: attempt.label,
      };
    } catch (error: any) {
      errors.push(`${attempt.label}: ${error?.message || String(error)}`);
    }
  }

  throw new Error(`RioDex pool creation failed for all factory variants: ${errors.join(" | ")}`);
}

async function upsertPairAndGraduation(params: {
  tokenAddress: string;
  symbol: string;
  pairAddress: string;
  createPoolTxHash: string;
  height: number;
}) {
  const db = getPool();
  const height = Number.isFinite(params.height) && params.height > 0 ? Math.trunc(params.height) : 0;

  await db.query(
    `
    INSERT INTO riodex_pairs (
      pair_address,
      factory_address,
      pair_key,
      asset_0_type,
      asset_0_id,
      asset_1_type,
      asset_1_id,
      display_symbol,
      fee_bps,
      created_height,
      is_canonical,
      is_live,
      last_synced_height,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      'native',
      'urio',
      'token',
      $4,
      $5,
      30,
      $6,
      false,
      true,
      $6,
      now(),
      now()
    )
    ON CONFLICT (pair_address) DO UPDATE SET
      factory_address = EXCLUDED.factory_address,
      pair_key = EXCLUDED.pair_key,
      asset_0_type = EXCLUDED.asset_0_type,
      asset_0_id = EXCLUDED.asset_0_id,
      asset_1_type = EXCLUDED.asset_1_type,
      asset_1_id = EXCLUDED.asset_1_id,
      display_symbol = EXCLUDED.display_symbol,
      fee_bps = EXCLUDED.fee_bps,
      created_height = COALESCE(NULLIF(riodex_pairs.created_height, 0), EXCLUDED.created_height),
      is_live = true,
      last_synced_height = EXCLUDED.last_synced_height,
      updated_at = now()
    `,
    [
      params.pairAddress,
      RIODEX_FACTORY,
      `native:urio|token:${params.tokenAddress}`,
      params.tokenAddress,
      `RIO / ${params.symbol || "PUMP"}`,
      height,
    ]
  );

  await db.query(
    `
    INSERT INTO pump_live_graduations (
      token_address,
      status,
      trigger_reason,
      required_seed_value_rusd,
      seed_rio_urio,
      seed_token_base,
      riodex_factory,
      riodex_pair_address,
      surplus_rio_urio,
      creator_reward_total_urio,
      treasury_surplus_urio,
      tx_hash,
      block_height,
      completed_at
    )
    VALUES (
      $1,
      'pair_created',
      'reserve_authority_ready',
      15000.000000,
      $2,
      $3,
      $4,
      $5,
      0,
      0,
      0,
      $6,
      $7,
      null
    )
    ON CONFLICT (token_address) DO UPDATE SET
      status = CASE
        WHEN pump_live_graduations.status = 'completed' THEN pump_live_graduations.status
        ELSE 'pair_created'
      END,
      riodex_factory = EXCLUDED.riodex_factory,
      riodex_pair_address = EXCLUDED.riodex_pair_address,
      seed_rio_urio = EXCLUDED.seed_rio_urio,
      seed_token_base = EXCLUDED.seed_token_base,
      tx_hash = EXCLUDED.tx_hash,
      block_height = EXCLUDED.block_height,
      completed_at = CASE
        WHEN pump_live_graduations.status = 'completed' THEN pump_live_graduations.completed_at
        ELSE null
      END
    `,
    [
      params.tokenAddress,
      REQUIRED_SEED_URIO,
      REQUIRED_TOKEN_RESERVE_BASE,
      RIODEX_FACTORY,
      params.pairAddress,
      params.createPoolTxHash,
      height,
    ]
  );

  await db.query(
    `
    UPDATE pump_live_tokens
    SET status = 'graduating'
    WHERE token_address = $1
      AND status <> 'graduated'
    `,
    [params.tokenAddress]
  );
}

async function queryPoolState(pairAddress: string) {
  const { client } = await getFinalizerClient();
  return client.queryContractSmart(pairAddress, { pool: {} });
}

function getPoolReservesAlignedToDb(poolState: any) {
  // v5 pool shape:
  // {
  //   asset_infos: [{ token: ... }, { native_token: { denom: "urio" } }],
  //   reserve_0: "...",
  //   reserve_1: "...",
  //   total_lp: "..."
  // }
  if (Array.isArray(poolState?.asset_infos)) {
    const assetInfos = poolState.asset_infos;
    const reserve0 = String(poolState?.reserve_0 || "0");
    const reserve1 = String(poolState?.reserve_1 || "0");

    let rioReserve = "0";
    let tokenReserve = "0";

    if (assetInfos[0]?.native_token?.denom === "urio") {
      rioReserve = reserve0;
    } else if (assetInfos[0]?.token?.contract_addr) {
      tokenReserve = reserve0;
    }

    if (assetInfos[1]?.native_token?.denom === "urio") {
      rioReserve = reserve1;
    } else if (assetInfos[1]?.token?.contract_addr) {
      tokenReserve = reserve1;
    }

    return {
      rioReserve,
      tokenReserve,
      totalShare: String(poolState?.total_lp || poolState?.total_share || "0"),
    };
  }

  // legacy pair shape:
  // { assets: [{ info, amount }, ...], total_share: "..." }
  const assets = Array.isArray(poolState?.assets) ? poolState.assets : [];

  let rioReserve = "0";
  let tokenReserve = "0";

  for (const asset of assets) {
    if (asset?.info?.native_token?.denom === "urio") {
      rioReserve = String(asset.amount || "0");
    } else if (asset?.info?.token?.contract_addr) {
      tokenReserve = String(asset.amount || "0");
    }
  }

  return {
    rioReserve,
    tokenReserve,
    totalShare: String(poolState?.total_share || poolState?.total_lp || "0"),
  };
}

async function completeGraduation(params: {
  tokenAddress: string;
  pairAddress: string;
  seedTxHash: string;
}) {
  const db = getPool();

  const poolState = await queryPoolState(params.pairAddress);
  const { rioReserve, tokenReserve, totalShare } = getPoolReservesAlignedToDb(poolState);

  const seedTx = params.seedTxHash;
  const height = await resolveTxHeight(seedTx);

  await db.query(
    `
    INSERT INTO riodex_liquidity_snapshots (
      tx_hash,
      msg_index,
      event_index,
      pair_address,
      provider,
      event_type,
      asset_0_amount,
      asset_1_amount,
      liquidity_amount,
      reserve_0,
      reserve_1,
      total_share,
      spot_price,
      tvl_quote,
      block_height,
      block_time,
      created_at,
      raw_event
    )
    VALUES (
      $1::text,
      0,
      0,
      $2::text,
      $3::text,
      'add_liquidity',
      $4::numeric,
      $5::numeric,
      $6::numeric,
      $4::numeric,
      $5::numeric,
      $6::numeric,
      CASE WHEN $4::numeric > 0 THEN $5::numeric / $4::numeric ELSE null END,
      30000.000000000000000000,
      $7::bigint,
      now(),
      now(),
      jsonb_build_object(
        'source', 'pump_graduation_auto_finalizer',
        'token_address', $8::text,
        'pair_address', $2::text,
        'seed_rio_urio', $4::text,
        'seed_token_base', $5::text
      )
    )
    ON CONFLICT (tx_hash, msg_index, event_index, event_type) DO UPDATE SET
      pair_address = EXCLUDED.pair_address,
      provider = EXCLUDED.provider,
      asset_0_amount = EXCLUDED.asset_0_amount,
      asset_1_amount = EXCLUDED.asset_1_amount,
      liquidity_amount = EXCLUDED.liquidity_amount,
      reserve_0 = EXCLUDED.reserve_0,
      reserve_1 = EXCLUDED.reserve_1,
      total_share = EXCLUDED.total_share,
      spot_price = EXCLUDED.spot_price,
      tvl_quote = EXCLUDED.tvl_quote,
      block_height = EXCLUDED.block_height,
      block_time = EXCLUDED.block_time,
      raw_event = EXCLUDED.raw_event
    `,
    [
      seedTx,
      params.pairAddress,
      EXPECTED_FINALIZER_ADDRESS,
      rioReserve,
      tokenReserve,
      totalShare,
      height,
      params.tokenAddress,
    ]
  );

  await db.query(
    `
    UPDATE pump_live_tokens
    SET status = 'graduated'
    WHERE token_address = $1
    `,
    [params.tokenAddress]
  );

  await db.query(
    `
    UPDATE pump_live_graduations
    SET
      status = 'completed',
      riodex_pair_address = $2,
      lp_token_amount = $3,
      tx_hash = $4,
      block_height = $5,
      completed_at = now()
    WHERE token_address = $1
    `,
    [params.tokenAddress, params.pairAddress, totalShare, seedTx, height]
  );

  return {
    poolState,
    rioReserve,
    tokenReserve,
    totalShare,
    height,
  };
}

async function recoverAlreadySeededPool(params: {
  tokenAddress: string;
  symbol?: string | null;
  pairAddress?: string | null;
  dryRun: boolean;
}) {
  const pairAddress = String(params.pairAddress || "").trim();

  if (!pairAddress || !pairAddress.startsWith("rio1")) {
    return null;
  }

  const poolState = await queryPoolState(pairAddress);
  const { rioReserve, tokenReserve, totalShare } = getPoolReservesAlignedToDb(poolState);

  const hasRequiredRio = BigInt(rioReserve || "0") >= BigInt(REQUIRED_SEED_URIO);
  const hasRequiredToken = BigInt(tokenReserve || "0") >= BigInt(REQUIRED_TOKEN_RESERVE_BASE);
  const hasLp = BigInt(totalShare || "0") > 0n;

  if (!hasRequiredRio || !hasRequiredToken || !hasLp) {
    return null;
  }

  if (params.dryRun) {
    return {
      recovered: false,
      wouldRecover: true,
      pairAddress,
      rioReserve,
      tokenReserve,
      totalShare,
      reason: "Pool is already seeded on-chain. Dry run would insert snapshot and mark graduation completed.",
    };
  }

  const recoveryTxHash =
    "AUTO_RECOVERY_" +
    params.tokenAddress.replace(/[^a-zA-Z0-9]/g, "").slice(0, 48);

  const completed = await completeGraduation({
    tokenAddress: params.tokenAddress,
    pairAddress,
    seedTxHash: recoveryTxHash,
  });

  return {
    recovered: true,
    wouldRecover: false,
    pairAddress,
    rioReserve,
    tokenReserve,
    totalShare,
    completed,
    reason: "Recovered already-seeded pool without sending another transaction.",
  };
}

async function resolveTxHeight(txHash: string) {
  const hash = String(txHash || "").trim().toUpperCase();
  if (!hash) return 0;

  try {
    const url = `${RPC_URL.replace(/\/$/, "")}/tx?hash=0x${encodeURIComponent(hash)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return 0;

    const json = await res.json();
    const height = Number(json?.result?.tx_result?.height || json?.result?.height || 0);

    return Number.isFinite(height) && height > 0 ? Math.trunc(height) : 0;
  } catch {
    return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkAdmin(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized PUMP finalizer worker request.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as AutoFinalizeRequest;
    const tokenAddress = String(body.tokenAddress || "").trim();
    const dryRun = body.dryRun !== false;
    const limit = parseLimit(body.limit, 10, 50);

    const candidates = await getCandidates(tokenAddress || undefined, limit);

    const results: Array<{
      tokenAddress: string;
      symbol?: string | null;
      action: "executed" | "skipped" | "failed" | "would_execute";
      status?: string | null;
      reason?: string | null;
      pairAddress?: string | null;
      createPoolTxHash?: string | null;
      seedTxHash?: string | null;
      requiredSeedRio?: number | null;
      requiredSeedUrio?: string | null;
      actualIndexedSeedRio?: number | null;
      missingSeedRio?: number | null;
      txs?: ExecuteResponse["txs"];
      completed?: unknown;
    }> = [];

    for (const candidate of candidates) {
      const candidateToken = String(candidate.token_address || "").trim();
      if (!candidateToken) continue;

      try {
        let plan = await fetchPlan(candidateToken);
        let status = plan.finalizer?.status || null;
        let pairAddress = plan.graduation?.pairAddress || null;
        let createPoolTxHash: string | null = null;

        const seededPoolRecovery = await recoverAlreadySeededPool({
          tokenAddress: candidateToken,
          symbol: plan.token?.symbol || null,
          pairAddress,
          dryRun,
        });

        if (seededPoolRecovery) {
          results.push({
            tokenAddress: candidateToken,
            symbol: plan.token?.symbol || null,
            action: dryRun ? "would_execute" : "executed",
            status: dryRun ? "already_seeded_recovery_available" : "ready_completed",
            reason: seededPoolRecovery.reason,
            pairAddress: seededPoolRecovery.pairAddress,
            createPoolTxHash: null,
            seedTxHash: dryRun ? null : "auto_recovery_existing_seed",
            requiredSeedRio: plan.policy?.requiredSeedRio ?? null,
            requiredSeedUrio: plan.policy?.requiredSeedUrio ?? null,
            actualIndexedSeedRio: Number(seededPoolRecovery.rioReserve || 0) / URIO_PER_RIO,
            missingSeedRio: 0,
            completed: seededPoolRecovery,
          });
          continue;
        }

        if (status === "ready_completed") {
          results.push({
            tokenAddress: candidateToken,
            symbol: plan.token?.symbol || null,
            action: "skipped",
            status,
            reason: "Already completed; required RIO seed is indexed.",
            pairAddress,
            requiredSeedRio: plan.policy?.requiredSeedRio ?? null,
            requiredSeedUrio: plan.policy?.requiredSeedUrio ?? null,
            actualIndexedSeedRio: plan.graduation?.actualIndexedSeedRio ?? null,
            missingSeedRio: plan.graduation?.missingSeedRio ?? null,
          });
          continue;
        }

        if (status === "needs_pair_creation") {
          if (dryRun) {
            results.push({
              tokenAddress: candidateToken,
              symbol: plan.token?.symbol || null,
              action: "would_execute",
              status,
              reason: "Dry run only. Would create RioDex pool, then execute mandatory seed.",
              pairAddress: null,
              requiredSeedRio: plan.policy?.requiredSeedRio ?? null,
              requiredSeedUrio: plan.policy?.requiredSeedUrio ?? null,
              actualIndexedSeedRio: plan.graduation?.actualIndexedSeedRio ?? null,
              missingSeedRio: plan.graduation?.missingSeedRio ?? null,
            });
            continue;
          }

          const created = await createRioDexPool(candidateToken);
          pairAddress = created.pairAddress;
          createPoolTxHash = created.txHash;

          await upsertPairAndGraduation({
            tokenAddress: candidateToken,
            symbol: plan.token?.symbol || "",
            pairAddress,
            createPoolTxHash,
            height: created.height,
          });

          plan = await fetchPlan(candidateToken);
          status = plan.finalizer?.status || null;
        }

        const canExecuteFreshSeed = plan.finalizer?.canExecuteFreshSeed === true;

        if (status === "ready_for_mandatory_seed" && canExecuteFreshSeed) {
          if (dryRun) {
            results.push({
              tokenAddress: candidateToken,
              symbol: plan.token?.symbol || null,
              action: "would_execute",
              status,
              reason: "Dry run only. Would execute mandatory 15K RUSD seed.",
              pairAddress: plan.graduation?.pairAddress || pairAddress,
              createPoolTxHash,
              requiredSeedRio: plan.policy?.requiredSeedRio ?? null,
              requiredSeedUrio: plan.policy?.requiredSeedUrio ?? null,
              actualIndexedSeedRio: plan.graduation?.actualIndexedSeedRio ?? null,
              missingSeedRio: plan.graduation?.missingSeedRio ?? null,
            });
            continue;
          }

          const execution = await postJson<ExecuteResponse>(
            "/api/pump/graduation/execute",
            {
              tokenAddress: candidateToken,
            }
          );

          const addLiquidityTx =
            execution.txs?.find((tx) => tx.step === "add_liquidity")?.txHash ||
            execution.txs?.[execution.txs.length - 1]?.txHash ||
            "";

          if (!execution.ok || !addLiquidityTx) {
            throw new Error(execution.error || "Graduation execute failed or returned no seed tx.");
          }

          const completed = await completeGraduation({
            tokenAddress: candidateToken,
            pairAddress: execution.pairAddress || plan.graduation?.pairAddress || pairAddress || "",
            seedTxHash: addLiquidityTx,
          });

          const finalPlan = await fetchPlan(candidateToken);

          results.push({
            tokenAddress: candidateToken,
            symbol: finalPlan.token?.symbol || plan.token?.symbol || null,
            action: "executed",
            status: finalPlan.finalizer?.status || "ready_completed",
            reason: "PUMP graduation fully automated: pool created if needed, seed executed, snapshot inserted, token graduated.",
            pairAddress: finalPlan.graduation?.pairAddress || pairAddress,
            createPoolTxHash,
            seedTxHash: addLiquidityTx,
            requiredSeedRio: finalPlan.policy?.requiredSeedRio ?? null,
            requiredSeedUrio: finalPlan.policy?.requiredSeedUrio ?? null,
            actualIndexedSeedRio: finalPlan.graduation?.actualIndexedSeedRio ?? null,
            missingSeedRio: finalPlan.graduation?.missingSeedRio ?? null,
            txs: execution.txs || [],
            completed,
          });

          continue;
        }

        results.push({
          tokenAddress: candidateToken,
          symbol: plan.token?.symbol || null,
          action: "skipped",
          status,
          reason:
            plan.finalizer?.requiredAction ||
            "Token is not ready for automated graduation.",
          pairAddress: plan.graduation?.pairAddress || pairAddress,
          requiredSeedRio: plan.policy?.requiredSeedRio ?? null,
          requiredSeedUrio: plan.policy?.requiredSeedUrio ?? null,
          actualIndexedSeedRio: plan.graduation?.actualIndexedSeedRio ?? null,
          missingSeedRio: plan.graduation?.missingSeedRio ?? null,
        });
      } catch (error: any) {
        results.push({
          tokenAddress: candidateToken,
          action: "failed",
          reason: error?.message || "Auto-finalizer failed for token.",
        });
      }
    }

    const executed = results.filter((r) => r.action === "executed").length;
    const wouldExecute = results.filter((r) => r.action === "would_execute").length;
    const skipped = results.filter((r) => r.action === "skipped").length;
    const failed = results.filter((r) => r.action === "failed").length;

    return NextResponse.json({
      ok: failed === 0,
      source: "pump_graduation_auto_finalizer",
      dryRun,
      count: results.length,
      summary: {
        executed,
        wouldExecute,
        skipped,
        failed,
      },
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_graduation_auto_finalizer",
        error: error?.message || "Failed to run PUMP graduation auto-finalizer.",
      },
      { status: 500 }
    );
  }
}
