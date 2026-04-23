import { getKeplrSigner, getSigningClient } from "@/lib/cosm";

const APP_BASE =
  process.env.NEXT_PUBLIC_SUPERAPP_URL ||
  process.env.SUPERAPP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://127.0.0.1:3000";

/**
 * IMPORTANT
 * ----------
 * This file assumes an Astroport-style / CosmWasm-style LP flow:
 *
 * 1) For CW20 assets, increase allowance to the pair contract
 * 2) Execute `provide_liquidity` on the pair with native funds attached
 * 3) For LP withdrawal, send LP tokens to the pair with embedded
 *    base64 msg `{ withdraw_liquidity: {} }`
 *
 * If your pair contract uses a different execute schema, only the
 * builder functions below need to be adjusted:
 * - buildProvideLiquidityPlan()
 * - buildWithdrawLiquidityPlan()
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

export type LiquidityStep =
  | {
      kind: "increase_allowance";
      contractAddress: string;
      msg: Record<string, unknown>;
      funds?: Array<{ denom: string; amount: string }>;
      summary: string;
    }
  | {
      kind: "execute_pair";
      contractAddress: string;
      msg: Record<string, unknown>;
      funds?: Array<{ denom: string; amount: string }>;
      summary: string;
    }
  | {
      kind: "send_lp";
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
  slippageTolerance?: string | null;
  autoStake?: boolean;
};

export type WithdrawLiquidityInput = {
  pairAddress: string;
  lpTokenAddress: string;
  amount: string;
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

function assetToProvideLiquidityEntry(asset: AssetInput) {
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

function nativeFundsFromAssets(...assets: AssetInput[]) {
  return assets
    .filter((a): a is Extract<AssetInput, { kind: "native" }> => a.kind === "native")
    .map((a) => ({
      denom: a.denom,
      amount: a.amount,
    }));
}

function encodeJsonToBase64(data: unknown) {
  const json = JSON.stringify(data);

  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(json);
  }

  return Buffer.from(json, "utf8").toString("base64");
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

export function buildProvideLiquidityPlan(
  input: ProvideLiquidityInput
): LiquidityPlan {
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
    kind: "execute_pair",
    contractAddress: input.pairAddress,
    msg: {
      provide_liquidity: {
        assets: assets.map(assetToProvideLiquidityEntry),
        slippage_tolerance: input.slippageTolerance ?? null,
        auto_stake: input.autoStake ?? false,
        receiver: input.walletAddress ?? null,
      },
    },
    funds: nativeFundsFromAssets(...assets),
    summary: "Provide liquidity",
  });

  return {
    pairAddress: input.pairAddress,
    steps,
  };
}

export function buildWithdrawLiquidityPlan(
  input: WithdrawLiquidityInput
): LiquidityPlan {
  assertPositiveBaseUnitAmount(input.amount, "amount");

  return {
    pairAddress: input.pairAddress,
    steps: [
      {
        kind: "send_lp",
        contractAddress: input.lpTokenAddress,
        msg: {
          send: {
            contract: input.pairAddress,
            amount: input.amount,
            msg: encodeJsonToBase64({
              withdraw_liquidity: {},
            }),
          },
        },
        summary: "Withdraw liquidity",
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
