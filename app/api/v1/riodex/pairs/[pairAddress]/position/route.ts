import { NextRequest, NextResponse } from "next/server";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SPHERIO_CHAIN } from "@/lib/spherioChain";

export const dynamic = "force-dynamic";

function rpcEndpoint() {
  return (
    process.env.SPHERIO_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
    (SPHERIO_CHAIN as any)?.apis?.rpc?.[0]?.address ||
    (SPHERIO_CHAIN as any)?.rpc ||
    "http://host.docker.internal:26657"
  );
}

function toDisplay(amount: string | number, decimals = 6) {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return 0;
  return n / 10 ** decimals;
}

function ratio(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
}

async function queryPairInfo(client: CosmWasmClient, pairAddress: string) {
  return client.queryContractSmart(pairAddress, { pair: {} }) as Promise<{
    asset_infos?: any[];
    liquidity_token?: string | null;
    factory_addr?: string;
  }>;
}

async function queryPool(client: CosmWasmClient, pairAddress: string) {
  return client.queryContractSmart(pairAddress, { pool: {} }) as Promise<{
    assets?: Array<{
      info?: {
        native_token?: { denom: string };
        token?: { contract_addr: string };
      };
      amount?: string;
    }>;
    total_share?: string;
  }>;
}

async function queryCw20Balance(client: CosmWasmClient, contract: string, address: string) {
  try {
    const lower: any = await client.queryContractSmart(contract, {
      balance: { address },
    });
    return String(lower?.balance ?? "0");
  } catch {
    const upper: any = await client.queryContractSmart(contract, {
      Balance: { address },
    });
    return String(upper?.balance ?? "0");
  }
}

function assetIdFromInfo(info: any) {
  if (info?.native_token?.denom) return String(info.native_token.denom);
  if (info?.token?.contract_addr) return String(info.token.contract_addr);
  return null;
}

function assetLabel(id?: string | null) {
  if (!id) return "—";
  if (id === "urio" || id === "RIO") return "RIO";
  if (id.startsWith("rio1")) return "RUSD";
  return id;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ pairAddress: string }> }
) {
  try {
    const { pairAddress } = await ctx.params;
    const address = req.nextUrl.searchParams.get("address")?.trim();

    if (!pairAddress) {
      return NextResponse.json(
        { ok: false, error: "pairAddress is required" },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { ok: false, error: "address is required" },
        { status: 400 }
      );
    }

    const client = await CosmWasmClient.connect(rpcEndpoint());

    const [pairInfo, pool] = await Promise.all([
      queryPairInfo(client, pairAddress),
      queryPool(client, pairAddress),
    ]);

    const lpTokenAddress = pairInfo?.liquidity_token || null;
    if (!lpTokenAddress) {
      return NextResponse.json(
        { ok: false, error: "pair has no liquidity token address" },
        { status: 404 }
      );
    }

    const walletLpRaw = await queryCw20Balance(client, lpTokenAddress, address);

    const totalShareRaw = String(pool?.total_share || "0");
    const totalShare = toDisplay(totalShareRaw, 6);
    const walletLp = toDisplay(walletLpRaw, 6);

    const assets = Array.isArray(pool?.assets) ? pool.assets : [];
    const asset0 = assets[0] || null;
    const asset1 = assets[1] || null;

    const reserve0Raw = String(asset0?.amount || "0");
    const reserve1Raw = String(asset1?.amount || "0");

    const reserve0 = toDisplay(reserve0Raw, 6);
    const reserve1 = toDisplay(reserve1Raw, 6);

    const shareRatio = ratio(walletLp, totalShare);
    const ownershipPct = shareRatio * 100;

    const underlying0 = reserve0 * shareRatio;
    const underlying1 = reserve1 * shareRatio;

    const asset0Id = assetIdFromInfo(asset0?.info);
    const asset1Id = assetIdFromInfo(asset1?.info);

    return NextResponse.json({
      ok: true,
      address,
      pair_address: pairAddress,
      lp_token_address: lpTokenAddress,
      pair_label: `${assetLabel(asset0Id)} / ${assetLabel(asset1Id)}`,
      asset_0_id: asset0Id,
      asset_1_id: asset1Id,
      asset_0_label: assetLabel(asset0Id),
      asset_1_label: assetLabel(asset1Id),
      wallet_lp_balance: walletLp,
      wallet_lp_balance_raw: walletLpRaw,
      total_share: totalShare,
      total_share_raw: totalShareRaw,
      share_ratio: shareRatio,
      ownership_pct: ownershipPct,
      reserve_0: reserve0,
      reserve_0_raw: reserve0Raw,
      reserve_1: reserve1,
      reserve_1_raw: reserve1Raw,
      underlying_0: underlying0,
      underlying_1: underlying1,
      rpc_endpoint: rpcEndpoint(),
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load RioDex position",
      },
      { status: 500 }
    );
  }
}
