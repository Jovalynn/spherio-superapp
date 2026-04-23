export type RioExExternalIds = {
  coingeckoId?: string | null;
  coinmarketcapId?: string | null;
  dexscreenerChainId?: string | null;
  dexscreenerTokenAddress?: string | null;
};

export type RioExAssetRecord = {
  assetId: string;
  symbol: string;
  displayName: string;
  decimals: number;
  logoUrl: string | null;
  assetType: "native" | "spo20" | "bridged" | "external" | "unknown";
  denom: string | null;
  contractAddress: string | null;
  explorerRoute: string;
  externalIds: RioExExternalIds;
  source:
    | "rioex_assets_table"
    | "env_asset_metadata"
    | "derived_from_pairs"
    | "heuristic_fallback";
};

export type RioExPairRecord = {
  pairAddress: string;
  baseAssetId: string;
  quoteAssetId: string;
  displaySymbol: string;
  canonicalSymbol: string;
  feeBps: number;
  isCanonical: boolean;
  isLive: boolean;
  liquidityUsd: number;
  liquidityHeight: string | number | null;
  liquidityTime: string | null;
  liquiditySource: string | null;
  liquidityUpdatedAt: string | null;
  lastSwapTime: string | null;
  lastSwapTxHash: string | null;
  quoteConvention: "asset_1_per_asset_0";
  feeRecipientAddress: string | null;
  feePolicy: string | null;
  baseAsset: RioExAssetRecord;
  quoteAsset: RioExAssetRecord;
  routes: {
    assetTerminal: string;
    marketBoard: string;
    hero: string;
    pool: string;
    swap: string;
    liquidity: string;
  };
  source:
    | "rioex_pairs_registry_table"
    | "derived_from_pairs_and_snapshots";
};
