export const RIOLIGHT_SWAP_RESULT_EVENT = "riolight:swapResult" as const;

export type RioLightExecutionStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "cancelled"
  | "broadcasted"
  | "confirmed"
  | "success"
  | "failed"
  | "error";

export type RioLightSwapIntent = {
  action: "riodex_swap";
  requestId: string;
  surface: "riolight_swap_approval";
  uiMode: "compact_swap";
  resultEvent: typeof RIOLIGHT_SWAP_RESULT_EVENT;

  title: string;
  subtitle: string;

  spendAmount: string;
  spendSymbol: string;
  spendAssetId?: string | null;
  spendAssetType?: string | null;

  receiveAmount: string;
  receiveSymbol: string;
  receiveAssetId?: string | null;
  receiveAssetType?: string | null;

  minReceived?: string;
  slippagePct?: number;
  rate?: string;
  quoteSource?: string;

  feeAmount?: string;
  feeSymbol?: string;
  feeRecipient?: string | null;
  treasuryRecipient?: string | null;
  feePolicy?: string;
  feePolicySource?: string;

  pairAddress?: string | null;
  routeLabel?: string;
  auditIdentity?: string;
  contractLabel?: string;

  receiptMode?: "same_surface";
  receiptCopy?: string;
};

export type RioLightSwapResult = {
  requestId?: string | null;
  status: RioLightExecutionStatus;
  txHash?: string | null;
  height?: number | string | null;
  outputAmount?: number | string | null;
  receivedAmount?: number | string | null;
  error?: string | null;
};

export function createRioLightRequestId(prefix = "riolight-swap") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emitRioLightSwapResult(detail: RioLightSwapResult) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(RIOLIGHT_SWAP_RESULT_EVENT, {
      detail,
    }),
  );
}
