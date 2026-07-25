import { SPHERIO_FEE_POLICY, SPHERIO_TREASURY_MULTISIG } from "@/lib/protocol/treasury";
import { NextRequest, NextResponse } from "next/server";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SPHERIO_CHAIN } from "@/lib/spherioChain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_PAIR_ADDR =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";
const RIO_DENOM = "urio";

function treasuryPolicyPayload() {
  return {
    feeRecipient: SPHERIO_TREASURY_MULTISIG,
    treasuryRecipient: SPHERIO_TREASURY_MULTISIG,
    feePolicy: SPHERIO_FEE_POLICY.policy,
    feePolicySource: SPHERIO_FEE_POLICY.source,
  };
}


const INDEXER_BASE =
  process.env.INDEXER_BASE_URL ||
  process.env.NEXT_PUBLIC_INDEXER_BASE_URL ||
  "http://indexer:4000";

function rpcEndpoint() {
  return (
    process.env.SPHERIO_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
    (SPHERIO_CHAIN as any)?.apis?.rpc?.[0]?.address ||
    (SPHERIO_CHAIN as any)?.rpc ||
    "http://127.0.0.1:26657"
  );
}

function toBaseUnits(displayAmount: string, decimals = 6) {
  const n = Number(displayAmount || "0");
  if (!Number.isFinite(n) || n <= 0) return "0";
  return String(Math.floor(n * 10 ** decimals));
}

function fromBaseUnits(amount: string | number, decimals = 6) {
  return Number(amount || 0) / 10 ** decimals;
}

function isNativeAsset(assetId: string, assetType?: string | null) {
  return assetType === "native" || assetId === RIO_DENOM || assetId === "urio";
}

function makeAssetInfo(assetId: string, assetType?: string | null) {
  if (isNativeAsset(assetId, assetType)) return { native_token: { denom: assetId } };
  return { token: { contract_addr: assetId } };
}

async function fetchLatestLiquidity(pairAddress: string) {
  const res = await fetch(
    `${INDEXER_BASE}/api/riodex/pairs/${encodeURIComponent(pairAddress)}/liquidity?limit=1`,
    { cache: "no-store", headers: { accept: "application/json" } }
  );

  const raw = await res.text();
  let json: any = null;
  try { json = raw ? JSON.parse(raw) : null; }
  catch { throw new Error(`Liquidity truth route returned non-JSON (${res.status})`); }

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `Liquidity truth request failed: ${res.status}`);
  }

  return json?.liquidity?.[0] || null;
}

function reserveQuote(input: {
  amount: string;
  latestLiquidity: any;
  fromAssetId: string;
  toAssetId: string;
  asset0Id: string;
  asset1Id: string;
}) {
  const { amount, latestLiquidity, fromAssetId, toAssetId, asset0Id, asset1Id } = input;

  if (!latestLiquidity) {
    return { amount_out: "0", commission: "0", spread: "0", reserve_price: null, fallback_reason: "liquidity_unavailable" };
  }

  const reserve0 = fromBaseUnits(latestLiquidity.reserve_0 || "0");
  const reserve1 = fromBaseUnits(latestLiquidity.reserve_1 || "0");

  if (!Number.isFinite(reserve0) || !Number.isFinite(reserve1) || reserve0 <= 0 || reserve1 <= 0) {
    return { amount_out: "0", commission: "0", spread: "0", reserve_price: null, fallback_reason: "invalid_reserves" };
  }

  const n = Number(amount || "0");
  let out = 0;
  let price: number | null = null;

  if (fromAssetId === asset0Id && toAssetId === asset1Id) {
    price = reserve1 / reserve0;
    out = n * price;
  } else if (fromAssetId === asset1Id && toAssetId === asset0Id) {
    price = reserve0 / reserve1;
    out = n * price;
  } else {
    return { amount_out: "0", commission: "0", spread: "0", reserve_price: null, fallback_reason: "asset_not_in_pair" };
  }

  return { amount_out: String(out), commission: "0", spread: "0", reserve_price: String(price), fallback_reason: "selected_pair_reserve_truth_quote" };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pairAddress = String(body?.pairAddress || body?.pair || body?.pool || DEFAULT_PAIR_ADDR);
    const amount = String(body?.amount || "0");

    const asset0Id = String(body?.asset0Id || body?.asset_0_id || RIO_DENOM);
    const asset1Id = String(body?.asset1Id || body?.asset_1_id || "");
    const asset0Type = body?.asset0Type || body?.asset_0_type || null;
    const asset1Type = body?.asset1Type || body?.asset_1_type || null;

    const fromAssetId = String(body?.fromAssetId || asset0Id);
    const toAssetId = String(body?.toAssetId || (fromAssetId === asset0Id ? asset1Id : asset0Id));
    const fromAssetType = body?.fromAssetType || (fromAssetId === asset0Id ? asset0Type : asset1Type);
    const toAssetType = body?.toAssetType || (toAssetId === asset0Id ? asset0Type : asset1Type);

    const fromToken = String(body?.fromToken || fromAssetId);
    const toToken = String(body?.toToken || toAssetId);

    if (!pairAddress || !asset0Id || !asset1Id) {
      return NextResponse.json({ ok: false, error: "Missing selected pair or pair assets.", rpc_endpoint: rpcEndpoint() }, { status: 400 });
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({
        ok: true,
        mode: "empty",
        pairAddress,
        fromToken,
        toToken,
        fromAssetId,
        toAssetId,
        amount_in: amount,
        amount_out: "0",
        commission: "0",
        spread: "0",
        rpc_endpoint: rpcEndpoint(),
        ...treasuryPolicyPayload(),
      });
    }

    try {
      const client = await CosmWasmClient.connect(rpcEndpoint());
      const simulationMsg = {
        simulation: {
          offer_asset: {
            info: makeAssetInfo(fromAssetId, fromAssetType),
            amount: toBaseUnits(amount),
          },
          ask_asset_info: makeAssetInfo(toAssetId, toAssetType),
        },
      };

      const sim = await client.queryContractSmart(pairAddress, simulationMsg);

      return NextResponse.json({
        ok: true,
        mode: "selected_pair_onchain_simulation",
        pairAddress,
        fromToken,
        toToken,
        fromAssetId,
        toAssetId,
        amount_in: amount,
        amount_out: String(fromBaseUnits(sim?.return_amount || "0")),
        commission: String(fromBaseUnits(sim?.commission_amount || "0")),
        spread: String(fromBaseUnits(sim?.spread_amount || "0")),
        raw: sim,
        rpc_endpoint: rpcEndpoint(),
        ...treasuryPolicyPayload(),
      });
    } catch (simulationError: any) {
      const latestLiquidity = await fetchLatestLiquidity(pairAddress);
      const fallback = reserveQuote({ amount, latestLiquidity, fromAssetId, toAssetId, asset0Id, asset1Id });

      return NextResponse.json({
        ok: true,
        mode: "selected_pair_reserve_fallback",
        pairAddress,
        fromToken,
        toToken,
        fromAssetId,
        toAssetId,
        amount_in: amount,
        amount_out: fallback.amount_out,
        commission: fallback.commission,
        spread: fallback.spread,
        reserve_price: fallback.reserve_price,
        fallback: true,
        warning: simulationError?.message || "On-chain simulation unavailable; selected pair reserve truth fallback used.",
        rpc_endpoint: rpcEndpoint(),
        ...treasuryPolicyPayload(),
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to simulate swap", rpc_endpoint: rpcEndpoint() },
      { status: 500 }
    );
  }
}
