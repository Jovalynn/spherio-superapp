import { NextRequest, NextResponse } from "next/server";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SPHERIO_CHAIN } from "@/lib/spherioChain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAIR_ADDR =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";
const RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";
const RIO_DENOM = "urio";

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
  return Number(amount) / 10 ** decimals;
}

async function fetchLatestLiquidity() {
  const res = await fetch(
    `${INDEXER_BASE}/api/riodex/pairs/${encodeURIComponent(PAIR_ADDR)}/liquidity?limit=1`,
    {
      cache: "no-store",
      headers: { accept: "application/json" },
    }
  );

  const raw = await res.text();
  let json: any = null;

  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Liquidity truth route returned non-JSON (${res.status})`);
  }

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `Liquidity truth request failed: ${res.status}`);
  }

  return json?.liquidity?.[0] || null;
}

function fallbackReserveQuote(fromToken: "RIO" | "RUSD", amount: string, latestLiquidity: any) {
  if (!latestLiquidity) {
    return {
      amount_out: "0",
      commission: "0",
      spread: "0",
      fallback: true,
      fallback_reason: "liquidity_unavailable",
      reserve_price: null,
    };
  }

  const reserve0 = fromBaseUnits(latestLiquidity.reserve_0 || "0");
  const reserve1 = fromBaseUnits(latestLiquidity.reserve_1 || "0");

  if (!Number.isFinite(reserve0) || !Number.isFinite(reserve1) || reserve0 <= 0 || reserve1 <= 0) {
    return {
      amount_out: "0",
      commission: "0",
      spread: "0",
      fallback: true,
      fallback_reason: "invalid_reserves",
      reserve_price: null,
    };
  }

  const n = Number(amount || "0");
  const reservePrice = reserve1 / reserve0;

  let amountOut = 0;
  if (fromToken === "RIO") {
    amountOut = n * reservePrice;
  } else {
    amountOut = reservePrice > 0 ? n / reservePrice : 0;
  }

  return {
    amount_out: String(amountOut),
    commission: "0",
    spread: "0",
    fallback: true,
    fallback_reason: "reserve_truth_quote",
    reserve_price: String(reservePrice),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fromToken: "RIO" | "RUSD" = body?.fromToken === "RUSD" ? "RUSD" : "RIO";
    const amount = String(body?.amount || "0");

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({
        ok: true,
        mode: "empty",
        fromToken,
        toToken: fromToken === "RIO" ? "RUSD" : "RIO",
        amount_in: amount,
        amount_out: "0",
        commission: "0",
        spread: "0",
        rpc_endpoint: rpcEndpoint(),
      });
    }

    try {
      const client = await CosmWasmClient.connect(rpcEndpoint());

      const simulationMsg =
        fromToken === "RIO"
          ? {
              simulation: {
                offer_asset: {
                  info: { native_token: { denom: RIO_DENOM } },
                  amount: toBaseUnits(amount),
                },
                ask_asset_info: {
                  token: { contract_addr: RUSD_CONTRACT },
                },
              },
            }
          : {
              simulation: {
                offer_asset: {
                  info: { token: { contract_addr: RUSD_CONTRACT } },
                  amount: toBaseUnits(amount),
                },
                ask_asset_info: {
                  native_token: { denom: RIO_DENOM },
                },
              },
            };

      const sim = await client.queryContractSmart(PAIR_ADDR, simulationMsg);

      return NextResponse.json({
        ok: true,
        mode: "onchain_simulation",
        fromToken,
        toToken: fromToken === "RIO" ? "RUSD" : "RIO",
        amount_in: amount,
        amount_out: String(fromBaseUnits(sim?.return_amount || "0")),
        commission: String(fromBaseUnits(sim?.commission_amount || "0")),
        spread: String(fromBaseUnits(sim?.spread_amount || "0")),
        raw: sim,
        rpc_endpoint: rpcEndpoint(),
      });
    } catch (simulationError: any) {
      const latestLiquidity = await fetchLatestLiquidity();
      const fallback = fallbackReserveQuote(fromToken, amount, latestLiquidity);

      return NextResponse.json({
        ok: true,
        mode: "reserve_fallback",
        fromToken,
        toToken: fromToken === "RIO" ? "RUSD" : "RIO",
        amount_in: amount,
        amount_out: fallback.amount_out,
        commission: fallback.commission,
        spread: fallback.spread,
        reserve_price: fallback.reserve_price,
        fallback: true,
        warning: simulationError?.message || "On-chain simulation unavailable; reserve truth fallback used.",
        rpc_endpoint: rpcEndpoint(),
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to simulate swap",
        rpc_endpoint: rpcEndpoint(),
      },
      { status: 500 }
    );
  }
}

