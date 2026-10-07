import { NextRequest, NextResponse } from "next/server";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { isAuthorizedPumpFinalizer } from "@/lib/pump/finalizer-auth.mjs";

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

const FINALIZER_ENABLED =
  String(process.env.PUMP_FINALIZER_ENABLED || "").toLowerCase() === "true";

const FINALIZER_MNEMONIC = process.env.PUMP_FINALIZER_MNEMONIC || "";
const EXPECTED_FINALIZER_ADDRESS =
  process.env.PUMP_FINALIZER_EXPECTED_ADDRESS ||
  "rio1e9hszjll3d4pkn74n2th47wwyyh228wn2vhmsf";

type FinalizerStep = {
  kind: string;
  contractAddress: string;
  msg: Record<string, unknown>;
  funds?: Array<{ denom: string; amount: string }>;
  summary?: string;
};

type GraduationPlanResponse = {
  ok?: boolean;
  error?: string;
  source?: string;
  policy?: {
    requiredSeedValueRusd?: number;
    rioReferencePriceRusd?: number;
    requiredSeedRio?: number;
    requiredSeedUrio?: string;
    seedTokenBase?: string;
  };
  token?: {
    tokenAddress?: string;
    symbol?: string;
    name?: string;
    status?: string;
  };
  graduation?: {
    status?: string;
    pairAddress?: string;
    recordedSeedRio?: number;
    actualIndexedSeedRio?: number;
    missingSeedRio?: number;
    missingSeedUrio?: string;
  };
  finalizer?: {
    status?: string;
    canExecuteFreshSeed?: boolean;
    liquidityWallet?: string;
    requiredAction?: string;
  };
  executionPlan?: {
    mode?: string;
    warning?: string;
    pairAddress?: string;
    liquidityWallet?: string;
    requiredSeedUrio?: string;
    seedTokenBase?: string;
    steps?: FinalizerStep[];
  };
};

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

async function fetchGraduationPlan(tokenAddress: string): Promise<GraduationPlanResponse> {
  const res = await fetch(`${APP_BASE}/api/pump/graduation/plan`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ tokenAddress }),
  });

  const raw = await res.text();
  let json: GraduationPlanResponse | null = null;

  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Graduation plan returned non-JSON (${res.status})`);
  }

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `Graduation plan failed: ${res.status}`);
  }

  return json;
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

  if (
    EXPECTED_FINALIZER_ADDRESS &&
    account.address !== EXPECTED_FINALIZER_ADDRESS
  ) {
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

async function assertRioBalance(address: string, requiredUrio: string, client: SigningCosmWasmClient) {
  const balance = await client.getBalance(address, "urio");
  const available = BigInt(balance.amount || "0");
  const required = BigInt(requiredUrio);

  if (available < required) {
    throw new Error(
      `Insufficient finalizer RIO balance. Required ${requiredUrio} urio, available ${balance.amount} urio.`
    );
  }

  return balance.amount;
}

function validateExecutionPlan(plan: GraduationPlanResponse) {
  const finalizer = plan.finalizer;
  const executionPlan = plan.executionPlan;

  if (!finalizer || !executionPlan) {
    throw new Error("Graduation plan is missing finalizer execution data.");
  }

  if (finalizer.status !== "ready_for_mandatory_seed") {
    throw new Error(
      `Graduation is not ready for automatic seed execution. Current status: ${finalizer.status}. ${finalizer.requiredAction || ""}`
    );
  }

  if (finalizer.canExecuteFreshSeed !== true) {
    throw new Error("Graduation plan is not executable as a fresh mandatory seed.");
  }

  if (!executionPlan.pairAddress) {
    throw new Error("Execution plan is missing pairAddress.");
  }

  if (!executionPlan.steps?.length) {
    throw new Error("Execution plan has no steps.");
  }

  const requiredSeedUrio = assertBaseUnitAmount(
    plan.policy?.requiredSeedUrio || executionPlan.requiredSeedUrio,
    "requiredSeedUrio"
  );

  const addLiquidityStep = executionPlan.steps.find(
    (step) => step.kind === "add_liquidity"
  );

  if (!addLiquidityStep) {
    throw new Error("Execution plan is missing add_liquidity step.");
  }

  const attachedRio = addLiquidityStep.funds?.find((fund) => fund.denom === "urio");

  if (!attachedRio) {
    throw new Error("add_liquidity step is missing native RIO funds.");
  }

  if (attachedRio.amount !== requiredSeedUrio) {
    throw new Error(
      `Execution plan RIO fund mismatch. Expected ${requiredSeedUrio}, got ${attachedRio.amount}.`
    );
  }

  return {
    requiredSeedUrio,
    steps: executionPlan.steps,
  };
}

function liquidityFallbackMsgs(msg: Record<string, unknown>, tokenAddress: string) {
  const addLiquidity = (msg as any)?.add_liquidity;

  if (!addLiquidity) return null;

  const assets = Array.isArray(addLiquidity.assets) ? addLiquidity.assets : [];
  const tokenAsset = assets.find((asset: any) => asset?.info?.token?.contract_addr === tokenAddress);
  const nativeAsset = assets.find((asset: any) => asset?.info?.native_token?.denom === "urio");

  if (!tokenAsset?.amount || !nativeAsset?.amount) return null;

  return {
    registerMsg: {
      register_prefunded_liquidity: {
        token_asset: tokenAsset,
        counter_native_asset: nativeAsset,
        min_liquidity: addLiquidity.min_liquidity ?? null,
        receiver: addLiquidity.receiver ?? null,
      },
    },
    finalizeMsg: {
      finalize_prefunded_liquidity: {},
    },
    nativeFunds: [
      {
        denom: "urio",
        amount: String(nativeAsset.amount),
      },
    ],
  };
}

async function executeFinalizerStepWithFallback(params: {
  client: SigningCosmWasmClient;
  address: string;
  step: FinalizerStep;
  tokenAddress: string;
}) {
  const { client, address, step, tokenAddress } = params;

  try {
    return await client.execute(
      address,
      step.contractAddress,
      step.msg,
      "auto",
      step.summary || `PUMP graduation finalizer ${tokenAddress}`,
      step.funds || [],
    );
  } catch (error: any) {
    const message = String(error?.message || error || "");

    const fallback = step.kind === "add_liquidity" ? liquidityFallbackMsgs(step.msg, tokenAddress) : null;

    if (!fallback || !message.includes("unknown variant `add_liquidity`")) {
      throw error;
    }

    const registerTx = await client.execute(
      address,
      step.contractAddress,
      fallback.registerMsg,
      "auto",
      step.summary
        ? `${step.summary} (register_prefunded_liquidity)`
        : `PUMP graduation finalizer ${tokenAddress} register_prefunded_liquidity`,
      [],
    );

    const finalizeTx = await client.execute(
      address,
      step.contractAddress,
      fallback.finalizeMsg,
      "auto",
      step.summary
        ? `${step.summary} (finalize_prefunded_liquidity)`
        : `PUMP graduation finalizer ${tokenAddress} finalize_prefunded_liquidity`,
      fallback.nativeFunds,
    );

    return {
      ...finalizeTx,
      prefundedTxs: [
        {
          step: "register_prefunded_liquidity",
          txHash: registerTx.transactionHash,
          height: registerTx.height,
        },
        {
          step: "finalize_prefunded_liquidity",
          txHash: finalizeTx.transactionHash,
          height: finalizeTx.height,
        },
      ],
    };
  }
}
export async function POST(request: NextRequest) {
  if (!isAuthorizedPumpFinalizer(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized PUMP finalizer request." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const tokenAddress = String(body?.tokenAddress || body?.token || "").trim();

    if (!tokenAddress) {
      return NextResponse.json(
        { ok: false, error: "tokenAddress is required." },
        { status: 400 }
      );
    }

    const plan = await fetchGraduationPlan(tokenAddress);
    const { requiredSeedUrio, steps } = validateExecutionPlan(plan);

    const { client, address } = await getFinalizerClient();
    const availableUrio = await assertRioBalance(address, requiredSeedUrio, client);

    const results: Array<{
      step: string;
      summary: string | null;
      contractAddress: string;
      txHash: string;
    }> = [];

    for (const step of steps) {
      const res = await executeFinalizerStepWithFallback({
        client,
        address,
        step,
        tokenAddress,
      });

      if (Array.isArray((res as any).prefundedTxs)) {
        for (const prefundedTx of (res as any).prefundedTxs) {
          results.push({
            step: prefundedTx.step,
            summary: step.summary || null,
            contractAddress: step.contractAddress,
            txHash: prefundedTx.txHash,
          });
        }
      } else {
        results.push({
          step: step.kind,
          summary: step.summary || null,
          contractAddress: step.contractAddress,
          txHash: res.transactionHash,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      source: "pump_graduation_finalizer_execute",
      tokenAddress,
      requiredSeedUrio,
      availableUrioBeforeExecution: availableUrio,
      pairAddress: plan.executionPlan?.pairAddress,
      policy: plan.policy,
      txs: results,
      next: {
        status: "broadcasted_pending_indexer",
        message:
          "Finalizer transactions were broadcast. Wait for indexer liquidity proof, then /api/pump/discover should move from underseeded to completed once reserves meet the 15K RUSD seed policy.",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        source: "pump_graduation_finalizer_execute",
        error: error?.message || "Failed to execute PUMP graduation finalizer.",
      },
      { status: 400 }
    );
  }
}
