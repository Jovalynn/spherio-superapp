export type RioLightGlobalActionKind =
  | "swap"
  | "add_liquidity"
  | "remove_liquidity"
  | "pool_deposit"
  | "pool_withdraw"
  | "create_token"
  | "prime_create"
  | "prime_liquidity"
  | "pump_create"
  | "pump_trade"
  | "pump_graduation"
  | "spo20_execute"
  | "bridge"
  | "ibc_transfer"
  | "evm_representation"
  | "generic";

export type RioLightGlobalSurface =
  | "riodex_swap"
  | "riodex_liquidity"
  | "riodex_pool"
  | "rioex_trade"
  | "rioex_assets"
  | "riolight_portfolio"
  | "createtoken"
  | "prime"
  | "pump"
  | "spo20"
  | "bridge"
  | "ibc"
  | "evm"
  | "spherio";

export type RioLightGlobalHandoverStatus =
  | "draft"
  | "review"
  | "approval_opened"
  | "approved"
  | "rejected"
  | "broadcasted"
  | "confirmed"
  | "failed"
  | "cancelled";

export type RioLightGlobalAssetLine = {
  label: string;
  symbol?: string | null;
  assetId?: string | null;
  assetType?: string | null;
  amount?: string | number | null;
  logoUrl?: string | null;
  role?: "spend" | "receive" | "fee" | "lp" | "collateral" | "reward" | "other";
};

export type RioLightGlobalHandoverIntent = {
  version: "riolight-handover-v1";
  requestId: string;

  surface: RioLightGlobalSurface;
  product: string;
  actionKind: RioLightGlobalActionKind;
  actionLabel: string;

  chainId: string;
  networkLabel: string;

  walletAddress?: string | null;
  contractAddress?: string | null;
  contractLabel?: string | null;

  title: string;
  subtitle?: string;

  assets: RioLightGlobalAssetLine[];

  routeLabel?: string | null;
  quoteSource?: string | null;
  slippagePct?: number | null;
  minimumReceive?: string | number | null;
  feeAmount?: string | number | null;
  feeSymbol?: string | null;
  feeRecipient?: string | null;
  treasuryRecipient?: string | null;

  pairAddress?: string | null;
  poolAddress?: string | null;
  tokenAddress?: string | null;

  msg?: Record<string, unknown> | null;
  funds?: Array<{ denom: string; amount: string }>;

  riskNotes?: string[];
  truthNotes?: string[];

  proofHref?: string | null;
  explorerHref?: string | null;

  metadata?: Record<string, unknown>;
};

export type RioLightGlobalHandoverResult = {
  version: "riolight-handover-v1";
  requestId: string;
  status: RioLightGlobalHandoverStatus;

  txHash?: string | null;
  height?: number | string | null;

  receiptTitle?: string | null;
  receiptSubtitle?: string | null;
  outputAssets?: RioLightGlobalAssetLine[];

  proofHref?: string | null;
  explorerHref?: string | null;

  error?: string | null;
  metadata?: Record<string, unknown>;
};

export function createRioLightGlobalHandoverIntent(
  input: Omit<RioLightGlobalHandoverIntent, "version" | "chainId" | "networkLabel"> &
    Partial<Pick<RioLightGlobalHandoverIntent, "chainId" | "networkLabel">>,
): RioLightGlobalHandoverIntent {
  return {
    version: "riolight-handover-v1",
    chainId: input.chainId || "spherio-1",
    networkLabel: input.networkLabel || "SpherioChain",
    ...input,
  };
}

export function rioLightExplorerProofHref(input: {
  txHash?: string | null;
  pairAddress?: string | null;
  address?: string | null;
}) {
  if (input.txHash) return `/rioexplorer/tx/${encodeURIComponent(input.txHash)}`;
  if (input.pairAddress) return `/rioexplorer/address/${encodeURIComponent(input.pairAddress)}`;
  if (input.address) return `/rioexplorer/address/${encodeURIComponent(input.address)}`;
  return "/rioexplorer";
}
