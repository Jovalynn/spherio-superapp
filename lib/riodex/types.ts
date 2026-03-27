export type AssetInfo =
  | {
      native_token: {
        denom: string;
      };
    }
  | {
      token: {
        contract_addr: string;
      };
    };

export type Asset = {
  info: AssetInfo;
  amount: string;
};

export type RioDexFactoryConfigResponse = {
  owner: string;
  pair_code_id: number;
  fee_collector: string;
  protocol_fee_bps: number;
};

export type RioDexFactoryPairResponse = {
  asset_infos: [AssetInfo, AssetInfo];
  contract_addr: string;
  liquidity_token?: string | null;
  created_at_height?: number | null;
  created_at_time?: number | null;
};

export type RioDexFactoryPairsResponse = {
  pairs: RioDexFactoryPairResponse[];
};

export type RioDexPairInfoResponse = {
  factory_addr: string;
  asset_infos: [AssetInfo, AssetInfo];
  liquidity_token?: string | null;
};

export type RioDexPoolResponse = {
  assets: [Asset, Asset];
  total_share: string;
};

export type RioDexPairConfigResponse = {
  fee_collector: string;
  protocol_fee_bps: number;
};

export type RioDexSimulationResponse = {
  return_amount: string;
  spread_amount: string;
  commission_amount: string;
};

export type RioDexRouterConfigResponse = {
  factory_addr: string;
};

export type RioDexRoutePair = {
  pair_key: string;
  offer_asset_info: AssetInfo;
  ask_asset_info: AssetInfo;
};

export type RioDexRoutePairsResponse = {
  pairs: RioDexRoutePair[];
};

export type RioDexRouterSimulationResponse = {
  amount: string;
};

export type SwapOperation = {
  riodex_swap: {
    offer_asset_info: AssetInfo;
    ask_asset_info: AssetInfo;
  };
};

export function assetInfoKey(info: AssetInfo): string {
  if ("native_token" in info) {
    return `native:${info.native_token.denom}`;
  }

  return `token:${info.token.contract_addr}`;
}

export function formatAssetInfo(info: AssetInfo): string {
  if ("native_token" in info) {
    return info.native_token.denom;
  }

  return info.token.contract_addr;
}
