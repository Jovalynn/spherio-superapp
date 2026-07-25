import { NextResponse } from "next/server";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SPHERIO_CHAIN } from "@/lib/spherioChain";

export const dynamic = "force-dynamic";

const CANONICAL_PAIR_ADDR =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";

const FACTORY_ADDR =
  process.env.NEXT_PUBLIC_RIODEX_FACTORY_ADDRESS ||
  "rio1nkp9nq5uval4uguef0hgea28sedmzs8vxhu6xqz890ddsxywm3eqsuyvu0";

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

export async function GET() {
  try {
    const client = await CosmWasmClient.connect(rpcEndpoint());

    const pool = await client.queryContractSmart(CANONICAL_PAIR_ADDR, {
      pool: {},
    });

    return NextResponse.json({
      ok: true,
      factory: FACTORY_ADDR,
      canonical_pair: CANONICAL_PAIR_ADDR,
      count: 1,
      items: [
        {
          pairKey:
            "native:urio|token:rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df",
          pairAddress: CANONICAL_PAIR_ADDR,
          liquidityToken: null,
          createdAtHeight: null,
          createdAtTime: null,
          label: "RIO / RUSD",
          assetLabels: ["RIO", "RUSD"],
          pool,
          isCanonical: true,
        },
      ],
      rpc_endpoint: rpcEndpoint(),
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load canonical RioDex pair",
        items: [],
        rpc_endpoint: rpcEndpoint(),
      },
      { status: 500 }
    );
  }
}
