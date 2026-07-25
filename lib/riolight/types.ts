export type RioLightAdapterKind =
  | "keplr"
  | "leap"
  | "cosmostation"
  | "riolight-native"
  | "walletconnect"
  | "evm"
  | "ibc"
  | "bridge";

export type RioLightAssetKind =
  | "native"
  | "spo20"
  | "pump"
  | "prime"
  | "rusd"
  | "ibc"
  | "bridged"
  | "offchain";

export type RioLightConnectedWallet = {
  adapter: RioLightAdapterKind;
  address: string;
  chainId: string;
};

export type RioLightExecutionContext = RioLightConnectedWallet & {
  signer: any;
  client: any;
};

export type RioLightAssetRef = {
  assetId: string;
  symbol: string;
  denomOrAddress: string;
  kind: RioLightAssetKind;
  decimals?: number;
};

export type RioLightPumpTradeInput = {
  side: "buy" | "sell";
  amount: string;
  tokenAddress: string;
  symbol: string;
  totalSupply?: number;
};

export type RioLightPortfolioBalance = {
  asset: RioLightAssetRef;
  amountBase: string;
  amountDisplay: string;
};
