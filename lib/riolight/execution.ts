import {
  executeRioLightContract,
  waitForRioLightStoredExecutionResult,
} from "@/lib/riolight/signer";
import type { RioLightGlobalHandoverIntent } from "@/lib/riolight/handover";
import { getRioLightSurface, type RioLightSurfaceKey } from "@/lib/riolight/surfaces";

export type SpherioRioLightProduct =
  | "Prime"
  | "Pump"
  | "CreateToken"
  | "RioDex"
  | "RioEx"
  | "Pool"
  | "Liquidity"
  | "Swap"
  | "SPO-20"
  | "Spherio";

export type ExecuteSpherioRioLightActionInput = {
  surfaceKey?: RioLightSurfaceKey;
  product: SpherioRioLightProduct;
  action: string;
  contractAddress: string;
  msg: Record<string, any>;
  funds?: Array<{ denom: string; amount: string }>;
  memo?: string;
  label?: string;
  sender?: string;
  reviewTitle: string;
  reviewSubtitle: string;
  spendAmount?: string;
  spendSymbol?: string;
  receiveAmount?: string;
  receiveSymbol?: string;
  routeLabel?: string;
  feeAmount?: string;
  feeSymbol?: string;
  contractLabel?: string;
  surface?: string;
  metadata?: Record<string, unknown>;
  handoverIntent?: RioLightGlobalHandoverIntent;
};

function getRioLightProvider() {
  if (typeof window === "undefined") return null;

  return (
    (window as any).riolight ||
    (window as any).rioLight ||
    (window as any).spherio?.riolight ||
    (window as any).spherio?.rioLight ||
    null
  );
}

export async function executeSpherioRioLightAction(input: ExecuteSpherioRioLightActionInput) {
  const surface = input.surfaceKey ? getRioLightSurface(input.surfaceKey) : null;

  const product = input.product || surface?.product || "Spherio";
  const action = input.action || surface?.action || "spherio_execution";
  const reviewTitle = input.reviewTitle || surface?.reviewTitle || "SpherioChain Action";
  const reviewSubtitle =
    input.reviewSubtitle ||
    surface?.reviewSubtitle ||
    "Review this SpherioChain action before RioLight signs and broadcasts.";
  const routeLabel = input.routeLabel || surface?.defaultRouteLabel;
  const actionLabel =
    input.metadata?.actionLabel ||
    surface?.actionLabel ||
    (
      product === "Prime"
        ? "Confirm Prime Project"
        : product === "Pump"
          ? "Confirm Pump Launch"
          : product === "Liquidity" || product === "Pool"
            ? "Confirm Liquidity"
            : product === "Swap" || product === "RioDex"
              ? "Confirm Swap"
              : "Confirm & Broadcast"
    );

  const execResult = await executeRioLightContract({
    contractAddress: input.contractAddress,
    msg: input.msg,
    funds: input.funds || [],
    memo: input.memo || reviewTitle,
    label: input.label || reviewTitle,
    action,
    sender: input.sender,
    metadata: {
      product,
      surface: input.surface || input.surfaceKey || action,
      executionKind: action,
      reviewTitle,
      reviewSubtitle,
      spendAmount: input.spendAmount,
      spendSymbol: input.spendSymbol,
      receiveAmount: input.receiveAmount,
      receiveSymbol: input.receiveSymbol,
      routeLabel,
      feeAmount: input.feeAmount,
      feeSymbol: input.feeSymbol,
      contractLabel: input.contractLabel,
      actionLabel,
      handoverIntent: input.handoverIntent || null,
      handoverVersion: input.handoverIntent?.version || "legacy-riolight-execution",
      globalHandover: Boolean(input.handoverIntent),
      ...(input.metadata || {}),
    },
  });

  return execResult;
}

export async function waitForSpherioRioLightResult(requestId: string, timeoutMs = 180000) {
  const provider = getRioLightProvider();

  if (!provider) {
    throw new Error("RioLight provider is not available. Reload the page after enabling RioLight.");
  }

  return waitForRioLightStoredExecutionResult(provider, requestId, timeoutMs, 1500);
}
