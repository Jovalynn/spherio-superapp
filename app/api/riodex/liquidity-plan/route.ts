import { SPHERIO_TREASURY_MULTISIG } from "@/lib/protocol/treasury";
import { NextResponse } from "next/server";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SPHERIO_CHAIN } from "@/lib/spherioChain";

export const dynamic = "force-dynamic";

const PAIR_ADDR =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";
const RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";
const TREASURY_MULTISIG =
  SPHERIO_TREASURY_MULTISIG;

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

function toDisplay(amount: string | number, decimals = 6) {
  return Number(amount) / 10 ** decimals;
}

function formatNum(value: number, max = 6) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
    minimumFractionDigits: 0,
  }).format(value);
}

export async function GET() {
  try {
    const client = await CosmWasmClient.connect(rpcEndpoint());

    const pool = await client.queryContractSmart(PAIR_ADDR, {
      pool: {},
    });

    const assets = Array.isArray(pool?.assets) ? pool.assets : [];
    const rioAsset = assets.find(
      (a: any) => a?.info?.native_token?.denom === "urio"
    );
    const rusdAsset = assets.find(
      (a: any) => a?.info?.token?.contract_addr === RUSD_CONTRACT
    );

    const rioRaw = rioAsset?.amount || "0";
    const rusdRaw = rusdAsset?.amount || "0";

    const rio = toDisplay(rioRaw);
    const rusd = toDisplay(rusdRaw);

    const rusdPerRio = rio > 0 ? rusd / rio : 0;
    const rioPerRusd = rusd > 0 ? rio / rusd : 0;

    return NextResponse.json({
      venue: "RioDex",
      pair: "RIO/RUSD",
      treasury_multisig: TREASURY_MULTISIG,
      active_liquidity: {
        rusd: formatNum(rusd, 6),
        rio: formatNum(rio, 6),
      },
      reserve_liquidity: {
        rusd: "0",
        rio: "0",
      },
      total_deployable_inventory: {
        rusd: formatNum(rusd, 6),
        rio: formatNum(rio, 6),
      },
      implied_launch_price: {
        rusd_per_rio: formatNum(rusdPerRio, 6),
        rio_per_rusd: formatNum(rioPerRusd, 6),
      },
      policy: {
        only_active_and_reserve_buckets_are_deployable: false,
        utility_buckets_excluded: true,
      },
      live: true,
      pool_contract: PAIR_ADDR,
      rusd_contract: RUSD_CONTRACT,
      total_share: String(pool?.total_share || "0"),
      rpc_endpoint: rpcEndpoint(),
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Failed to load RioDex live pool",
        rpc_endpoint: rpcEndpoint(),
      },
      { status: 500 }
    );
  }
}
