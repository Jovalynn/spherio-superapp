import { getKeplrSigner, getSigningClient } from "@/lib/cosm";

const APP_BASE =
  process.env.NEXT_PUBLIC_SUPERAPP_URL ||
  process.env.SUPERAPP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://127.0.0.1:3000";

const DEFAULT_RIODEX_FACTORY =
  process.env.NEXT_PUBLIC_RIODEX_FACTORY_ADDRESS ||
  "rio1nkp9nq5uval4uguef0hgea28sedmzs8vxhu6xqz890ddsxywm3eqsuyvu0";

const DEFAULT_RUSD_ADDRESS =
  process.env.NEXT_PUBLIC_RUSD_ADDRESS ||
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";

/**
 * Canonical helper for RioDex v5 treasury-aware factory/pool flow.
 *
 * IMPORTANT:
 * - Factory execute path is CreatePool, not create_pair
 * - Pool execute path is AddLiquidity / RemoveLiquidity / Swap
 * - Pool creation fees and protocol trading fees are contract-level now
 * - Pump bonding-curve fee routing still requires separate contract patch
 */

export type AssetInput =
  | {
      kind: "native";
      denom: string;
      amount: string;
      label?: string;
    }
  | {
      kind: "cw20";
      contract: string;
      amount: string;
      label?: string;
    };

export type RioDexPositionResponse = {
  ok?: boolean;
  error?: string;
  address?: string;
  pair_address?: string;
  lp_token_address?: string;
  share_ledger_id?: string | null;
  pair_label?: string;
  asset_0_id?: string | null;
  asset_1_id?: string | null;
  asset_0_label?: string | null;
  asset_1_label?: string | null;
  wallet_lp_balance?: number;
  wallet_lp_balance_raw?: string;
  total_share?: number;
  total_share_raw?: string;
  share_ratio?: number;
  ownership_pct?: number;
  reserve_0?: number;
  reserve_0_raw?: string;
  reserve_1?: number;
  reserve_1_raw?: string;
  underlying_0?: number;
  underlying_1?: number;
  updated_at?: string;
};

export type TokenRegistryItem = {
  id?: string | number;
  asset_id: string;
  symbol: string;
  name: string;
  decimals?: number;
  logo_url?: string | null;
  logo_svg?: string | null;
  origin_type?: string;
  origin_chain?: string | null;
  bridge_provider?: string | null;
  external_symbol?: string | null;
  external_address?: string | null;
  spherio_contract_address?: string | null;
  spherio_denom?: string | null;
  is_verified?: boolean;
  is_tradeable?: boolean;
  is_canonical?: boolean;
  metadata_json?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type TokenRegistryResponse = {
  ok?: boolean;
  count?: number;
  items?: TokenRegistryItem[];
  error?: string;
};

export type LiquidityRow = {
  pairAddress: string;
  pairKey: string;
  displayLabel: string;
  isCanonical: boolean;
  isLive: boolean;
  asset0: number;
  asset1: number;
  price: number;
  lpShare: string | number;
  feeBps: number;
  liquidityUsd: number;
  liquiditySource: string | null;
  marketSource: string | null;
  createdAtHeight: string | number | null;
  createdAtTime: string | null;
  asset0Id: string | null;
  asset1Id: string | null;
  routes?: {
    assetTerminal?: string;
    marketBoard?: string;
    hero?: string;
    pool?: string;
    swap?: string;
    liquidity?: string;
  };
};

export type LiquidityRouteResponse = {
  ok?: boolean;
  count?: number;
  pools?: LiquidityRow[];
  error?: string;
};

export type LiquidityStep =
  | {
      kind: "create_pool";
      contractAddress: string;
      msg: Record<string, unknown>;
      funds?: Array<{ denom: string; amount: string }>;
      summary: string;
    }
  | {
      kind: "increase_allowance";
      contractAddress: string;
      msg: Record<string, unknown>;
      funds?: Array<{ denom: string; amount: string }>;
      summary: string;
    }
  | {
      kind: "add_liquidity";
      contractAddress: string;
      msg: Record<string, unknown>;
      funds?: Array<{ denom: string; amount: string }>;
      summary: string;
    }
  | {
      kind: "remove_liquidity";
      contractAddress: string;
      msg: Record<string, unknown>;
      funds?: Array<{ denom: string; amount: string }>;
      summary: string;
    };

export type LiquidityPlan = {
  pairAddress: string;
  steps: LiquidityStep[];
};

export type ProvideLiquidityInput = {
  pairAddress: string;
  asset0: AssetInput;
  asset1: AssetInput;
  walletAddress?: string | null;
};

export type WithdrawLiquidityInput = {
  pairAddress: string;
  amount: string;
};

export type CreatePoolInput = {
  tokenAddress: string;
  baseAssetId: string;
  factoryAddress?: string;
  swapFeeBps?: number | null;
  protocolFeeBps?: number | null;
  liquidityFeeBps?: number | null;
};

export type CreatePoolAndSeedInput = {
  tokenAddress: string;
  baseAssetId: string;
  tokenAmount: string;
  baseAmount: string;
  walletAddress?: string | null;
  factoryAddress?: string;
  swapFeeBps?: number | null;
  protocolFeeBps?: number | null;
  liquidityFeeBps?: number | null;
};

function apiUrl(path: string) {
  if (typeof window !== "undefined") return path;
  return `${APP_BASE}${path}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    cache: "no-store",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const raw = await res.text();
  let json: any = null;

  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Route returned non-JSON (${res.status})`);
  }

  if (!res.ok || (json && json.ok === false)) {
    throw new Error(json?.error || `Request failed: ${res.status}`);
  }

  return json as T;
}

function assertPositiveBaseUnitAmount(amount: string, field: string) {
  if (!/^\d+$/.test(amount || "")) {
    throw new Error(`${field} must be a base-unit integer string`);
  }
  if (BigInt(amount) <= 0n) {
    throw new Error(`${field} must be greater than zero`);
  }
}

function assetToPoolAsset(asset: AssetInput) {
  if (asset.kind === "native") {
    return {
      info: {
        native_token: {
          denom: asset.denom,
        },
      },
      amount: asset.amount,
    };
  }

  return {
    info: {
      token: {
        contract_addr: asset.contract,
      },
    },
    amount: asset.amount,
  };
}

function assetToFactoryInfo(asset: AssetInput) {
  if (asset.kind === "native") {
    return {
      native_token: {
        denom: asset.denom,
      },
    };
  }

  return {
    token: {
      contract_addr: asset.contract,
    },
  };
}

function nativeFundsFromAssets(...assets: AssetInput[]) {
  return assets
    .filter((a): a is Extract<AssetInput, { kind: "native" }> => a.kind === "native")
    .map((a) => ({
      denom: a.denom,
      amount: a.amount,
    }));
}

function normalizeAssetId(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function buildBaseAssetInput(baseAssetId: string, amount: string): AssetInput {
  const normalized = normalizeAssetId(baseAssetId);

  if (normalized === "urio" || normalized === "rio") {
    return {
      kind: "native",
      denom: "urio",
      amount,
      label: "RIO",
    };
  }

  const rusdAddress = normalizeAssetId(DEFAULT_RUSD_ADDRESS);

  if (normalized === rusdAddress || normalized === "rusd") {
    return {
      kind: "cw20",
      contract: DEFAULT_RUSD_ADDRESS,
      amount,
      label: "RUSD",
    };
  }

  if (normalized.startsWith("rio1")) {
    return {
      kind: "cw20",
      contract: baseAssetId,
      amount,
      label: "Base Asset",
    };
  }

  return {
    kind: "native",
    denom: baseAssetId,
    amount,
    label: baseAssetId.toUpperCase(),
  };
}

export async function getRioDexPosition(
  pairAddress: string,
  address: string
): Promise<RioDexPositionResponse> {
  const qs = new URLSearchParams({ address });
  return fetchJson<RioDexPositionResponse>(
    `/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/position?${qs.toString()}`
  );
}

export async function resolveTokenRegistryEntry(query: string): Promise<TokenRegistryItem | null> {
  const q = String(query || "").trim();
  if (!q) return null;

  const res = await fetchJson<TokenRegistryResponse>(
    `/api/riodex/token-registry?query=${encodeURIComponent(q)}`
  );

  const items = res?.items || [];
  if (!items.length) return null;

  const needle = q.toLowerCase();

  const exact =
    items.find((item) => normalizeAssetId(item.asset_id) === needle) ||
    items.find((item) => normalizeAssetId(item.spherio_contract_address) === needle) ||
    items.find((item) => String(item.symbol || "").trim().toLowerCase() === needle);

  return exact || items[0] || null;
}

export async function findExistingPoolForTokenBase(
  tokenAddress: string,
  baseAssetId: string
): Promise<LiquidityRow | null> {
  const token = normalizeAssetId(tokenAddress);
  const base = normalizeAssetId(baseAssetId);

  const res = await fetchJson<LiquidityRouteResponse>("/api/riodex/liquidity");
  const pools = res?.pools || [];

  return (
    pools.find((pool) => {
      const a0 = normalizeAssetId(pool.asset0Id);
      const a1 = normalizeAssetId(pool.asset1Id);

      const tokenMatch = a0 === token || a1 === token;
      const baseMatch =
        a0 === base ||
        a1 === base ||
        (base === "rusd" &&
          (a0 === normalizeAssetId(DEFAULT_RUSD_ADDRESS) ||
            a1 === normalizeAssetId(DEFAULT_RUSD_ADDRESS))) ||
        (base === normalizeAssetId(DEFAULT_RUSD_ADDRESS) && (a0 === "rusd" || a1 === "rusd"));

      return tokenMatch && baseMatch;
    }) || null
  );
}

export async function waitForPoolByTokenBase(
  tokenAddress: string,
  baseAssetId: string,
  options?: { attempts?: number; delayMs?: number }
): Promise<LiquidityRow | null> {
  const attempts = Math.max(1, Number(options?.attempts ?? 12));
  const delayMs = Math.max(500, Number(options?.delayMs ?? 2500));

  for (let i = 0; i < attempts; i++) {
    const row = await findExistingPoolForTokenBase(tokenAddress, baseAssetId);
    if (row) return row;

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return null;
}

export function buildCreatePoolPlan(input: CreatePoolInput): LiquidityPlan {
  const tokenAddress = String(input.tokenAddress || "").trim();
  const baseAssetId = String(input.baseAssetId || "").trim();

  if (!tokenAddress) {
    throw new Error("tokenAddress is required");
  }
  if (!baseAssetId) {
    throw new Error("baseAssetId is required");
  }

  const tokenAsset: AssetInput = {
    kind: "cw20",
    contract: tokenAddress,
    amount: "1",
    label: "Token",
  };

  const baseAsset = buildBaseAssetInput(baseAssetId, "1");

  return {
    pairAddress: `pending:${tokenAddress}:${normalizeAssetId(baseAssetId)}`,
    steps: [
      {
        kind: "create_pool",
        contractAddress: input.factoryAddress || DEFAULT_RIODEX_FACTORY,
        msg: {
          create_pool: {
            asset_infos: [assetToFactoryInfo(tokenAsset), assetToFactoryInfo(baseAsset)],
            swap_fee_bps: input.swapFeeBps ?? null,
            protocol_fee_bps: input.protocolFeeBps ?? null,
            liquidity_fee_bps: input.liquidityFeeBps ?? null,
          },
        },
        funds: [],
        summary: `Create ${tokenAddress} / ${baseAssetId} pool`,
      },
    ],
  };
}

export function buildProvideLiquidityPlan(input: ProvideLiquidityInput): LiquidityPlan {
  assertPositiveBaseUnitAmount(input.asset0.amount, "asset0.amount");
  assertPositiveBaseUnitAmount(input.asset1.amount, "asset1.amount");

  const steps: LiquidityStep[] = [];
  const assets = [input.asset0, input.asset1];

  for (const asset of assets) {
    if (asset.kind === "cw20") {
      steps.push({
        kind: "increase_allowance",
        contractAddress: asset.contract,
        msg: {
          increase_allowance: {
            spender: input.pairAddress,
            amount: asset.amount,
          },
        },
        summary: `Increase allowance for ${asset.label || asset.contract}`,
      });
    }
  }

  steps.push({
    kind: "add_liquidity",
    contractAddress: input.pairAddress,
    msg: {
      add_liquidity: {
        assets: assets.map(assetToPoolAsset),
      },
    },
    funds: nativeFundsFromAssets(...assets),
    summary: "Add liquidity",
  });

  return {
    pairAddress: input.pairAddress,
    steps,
  };
}

export function buildWithdrawLiquidityPlan(input: WithdrawLiquidityInput): LiquidityPlan {
  assertPositiveBaseUnitAmount(input.amount, "amount");

  return {
    pairAddress: input.pairAddress,
    steps: [
      {
        kind: "remove_liquidity",
        contractAddress: input.pairAddress,
        msg: {
          remove_liquidity: {
            lp_amount: input.amount,
          },
        },
        summary: "Remove liquidity",
      },
    ],
  };
}

export async function executeLiquidityPlan(plan: LiquidityPlan, memo = "") {
  const { signer, address } = await getKeplrSigner();
  const client = await getSigningClient(signer);

  const results: Array<{
    step: LiquidityStep["kind"];
    txHash: string;
  }> = [];

  for (const step of plan.steps) {
    const res = await client.execute(
      address,
      step.contractAddress,
      step.msg,
      "auto",
      memo || step.summary,
      step.funds || []
    );

    results.push({
      step: step.kind,
      txHash: res.transactionHash,
    });
  }

  return {
    ok: true,
    address,
    pairAddress: plan.pairAddress,
    results,
  };
}

export async function createPoolAndProvideInitialLiquidity(
  input: CreatePoolAndSeedInput
) {
  assertPositiveBaseUnitAmount(input.tokenAmount, "tokenAmount");
  assertPositiveBaseUnitAmount(input.baseAmount, "baseAmount");

  const { address } = await getKeplrSigner();

  const createPlan = buildCreatePoolPlan({
    tokenAddress: input.tokenAddress,
    baseAssetId: input.baseAssetId,
    factoryAddress: input.factoryAddress,
    swapFeeBps: input.swapFeeBps,
    protocolFeeBps: input.protocolFeeBps,
    liquidityFeeBps: input.liquidityFeeBps,
  });

  const createRes = await executeLiquidityPlan(createPlan, "Create RioDex Pool");

  const createdPool = await waitForPoolByTokenBase(input.tokenAddress, input.baseAssetId, {
    attempts: 14,
    delayMs: 2500,
  });

  if (!createdPool?.pairAddress) {
    throw new Error(
      "Pool creation transaction submitted, but the new pool did not appear in the authoritative registry yet."
    );
  }

  const tokenAsset: AssetInput = {
    kind: "cw20",
    contract: input.tokenAddress,
    amount: input.tokenAmount,
    label: "Token",
  };

  const baseAsset = buildBaseAssetInput(input.baseAssetId, input.baseAmount);

  const tokenIsAsset0 =
    normalizeAssetId(createdPool.asset0Id) === normalizeAssetId(input.tokenAddress);

  const providePlan = buildProvideLiquidityPlan({
    pairAddress: createdPool.pairAddress,
    walletAddress: input.walletAddress || address,
    asset0: tokenIsAsset0 ? tokenAsset : baseAsset,
    asset1: tokenIsAsset0 ? baseAsset : tokenAsset,
  });

  const provideRes = await executeLiquidityPlan(
    providePlan,
    `Seed ${input.baseAssetId.toUpperCase()} Liquidity`
  );

  return {
    ok: true,
    address: input.walletAddress || address,
    factoryAddress: input.factoryAddress || DEFAULT_RIODEX_FACTORY,
    pairAddress: createdPool.pairAddress,
    pool: createdPool,
    createResults: createRes.results,
    provideResults: provideRes.results,
    baseAssetId: input.baseAssetId,
    tokenAddress: input.tokenAddress,
  };
}

export async function getDefaultBaseChoices() {
  const rio: TokenRegistryItem = {
    asset_id: "urio",
    symbol: "RIO",
    name: "Spherio",
    spherio_denom: "urio",
    is_canonical: true,
    is_tradeable: true,
  };

  const rusd = await resolveTokenRegistryEntry(DEFAULT_RUSD_ADDRESS).catch(() => null);

  return [rio, rusd].filter(Boolean) as TokenRegistryItem[];
}
