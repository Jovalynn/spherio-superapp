export type RioExMarketItem = {
  pairKey: string;
  pairAddress: string;
  label: string;
  assetLabels: [string, string];
  liquidityToken?: string | null;
  createdAtHeight?: number | null;
  createdAtTime?: number | null;
  asset0Amount: string;
  asset1Amount: string;
  totalShare: string;
  status: "live" | "pending";
};
