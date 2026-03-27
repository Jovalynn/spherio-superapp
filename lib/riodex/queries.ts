import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import type {
  Asset,
  AssetInfo,
  RioDexFactoryConfigResponse,
  RioDexFactoryPairsResponse,
  RioDexFactoryPairResponse,
  RioDexPairConfigResponse,
  RioDexPairInfoResponse,
  RioDexPoolResponse,
  RioDexRoutePairsResponse,
  RioDexRouterConfigResponse,
  RioDexRouterSimulationResponse,
  RioDexSimulationResponse,
  SwapOperation,
} from "@/lib/riodex/types";

const RIODEX_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
  "http://127.0.0.1:26657";

let queryClientPromise: Promise<CosmWasmClient> | null = null;

async function getRioDexQueryClient(): Promise<CosmWasmClient> {
  if (!queryClientPromise) {
    queryClientPromise = CosmWasmClient.connect(RIODEX_RPC_ENDPOINT);
  }

  return queryClientPromise;
}

async function queryContract<T>(
  contractAddress: string,
  queryMsg: Record<string, unknown>
): Promise<T> {
  const client = await getRioDexQueryClient();
  return client.queryContractSmart(contractAddress, queryMsg);
}

export async function queryRioDexFactoryConfig(
  factoryAddress: string,
): Promise<RioDexFactoryConfigResponse> {
  return queryContract<RioDexFactoryConfigResponse>(factoryAddress, {
    config: {},
  });
}

export async function queryRioDexFactoryPairs(
  factoryAddress: string,
  startAfter?: string[],
  limit?: number,
): Promise<RioDexFactoryPairsResponse> {
  return queryContract<RioDexFactoryPairsResponse>(factoryAddress, {
    pairs: {
      start_after: startAfter ?? null,
      limit: limit ?? null,
    },
  });
}

export async function queryRioDexFactoryPair(
  factoryAddress: string,
  assetInfos: [AssetInfo, AssetInfo],
): Promise<RioDexFactoryPairResponse> {
  return queryContract<RioDexFactoryPairResponse>(factoryAddress, {
    pair: {
      asset_infos: assetInfos,
    },
  });
}

export async function queryRioDexPairInfo(
  pairAddress: string,
): Promise<RioDexPairInfoResponse> {
  return queryContract<RioDexPairInfoResponse>(pairAddress, {
    pair: {},
  });
}

export async function queryRioDexPairPool(
  pairAddress: string,
): Promise<RioDexPoolResponse> {
  return queryContract<RioDexPoolResponse>(pairAddress, {
    pool: {},
  });
}

export async function queryRioDexPairConfig(
  pairAddress: string,
): Promise<RioDexPairConfigResponse> {
  return queryContract<RioDexPairConfigResponse>(pairAddress, {
    config: {},
  });
}

export async function queryRioDexPairSimulation(
  pairAddress: string,
  offerAsset: Asset,
  askAssetInfo: AssetInfo,
): Promise<RioDexSimulationResponse> {
  return queryContract<RioDexSimulationResponse>(pairAddress, {
    simulation: {
      offer_asset: offerAsset,
      ask_asset_info: askAssetInfo,
    },
  });
}

export async function queryRioDexRouterConfig(
  routerAddress: string,
): Promise<RioDexRouterConfigResponse> {
  return queryContract<RioDexRouterConfigResponse>(routerAddress, {
    config: {},
  });
}

export async function queryRioDexRouterSimulation(
  routerAddress: string,
  offerAmount: string,
  operations: SwapOperation[],
): Promise<RioDexRouterSimulationResponse> {
  return queryContract<RioDexRouterSimulationResponse>(routerAddress, {
    simulate_swap_operations: {
      offer_amount: offerAmount,
      operations,
    },
  });
}

export async function queryRioDexRoutePairs(
  routerAddress: string,
  operations: SwapOperation[],
): Promise<RioDexRoutePairsResponse> {
  return queryContract<RioDexRoutePairsResponse>(routerAddress, {
    route_pairs: {
      operations,
    },
  });
}
