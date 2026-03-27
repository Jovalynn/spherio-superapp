import { NextRequest, NextResponse } from "next/server";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SPHERIO_CHAIN } from "@/lib/spherioChain";

export const dynamic = "force-dynamic";

const RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";
const RIO_DENOM = "urio";

function rpcEndpoint() {
  return (
    process.env.SPHERIO_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    (SPHERIO_CHAIN as any)?.apis?.rpc?.[0]?.address ||
    (SPHERIO_CHAIN as any)?.rpc ||
    "http://host.docker.internal:26657"
  );
}

function restEndpoint() {
  const explicit =
    process.env.SPHERIO_REST_URL || process.env.NEXT_PUBLIC_REST_URL;

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  return rpcEndpoint().replace(":26657", ":1317").replace(/\/$/, "");
}

function toDisplay(amount: string | number, decimals = 6) {
  return Number(amount || 0) / 10 ** decimals;
}

async function queryRusdBalance(address: string) {
  const client = await CosmWasmClient.connect(rpcEndpoint());

  try {
    const res: any = await client.queryContractSmart(RUSD_CONTRACT, {
      Balance: { address },
    });

    return String(res?.balance ?? "0");
  } catch (upperErr: any) {
    try {
      const res: any = await client.queryContractSmart(RUSD_CONTRACT, {
        balance: { address },
      });

      return String(res?.balance ?? "0");
    } catch (lowerErr: any) {
      throw new Error(
        upperErr?.message ||
          lowerErr?.message ||
          "Failed to query RUSD balance"
      );
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address")?.trim();

    if (!address) {
      return NextResponse.json(
        { ok: false, error: "address is required" },
        { status: 400 }
      );
    }

    const rest = restEndpoint();

    const bankUrl =
      `${rest}/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${RIO_DENOM}`;

    const bankRes = await fetch(bankUrl, { cache: "no-store" });
    const bankJson = await bankRes.json().catch(() => null);

    if (!bankRes.ok) {
      throw new Error(
        bankJson?.message ||
          bankJson?.error ||
          `RIO bank query failed (${bankRes.status})`
      );
    }

    const rusdRaw = await queryRusdBalance(address);

    return NextResponse.json({
      ok: true,
      address,
      rio: toDisplay(bankJson?.balance?.amount || "0"),
      rusd: toDisplay(rusdRaw),
      rest_endpoint: rest,
      rpc_endpoint: rpcEndpoint(),
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load wallet balances",
      },
      { status: 500 }
    );
  }
}
