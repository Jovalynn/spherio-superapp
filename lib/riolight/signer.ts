"use client";

import { SPHERIO } from "@/lib/spherioConfig";

type RioLightProvider = {
  request?: (args: { method: string; params?: any }) => Promise<any>;
  requestSimulation?: (params: any) => Promise<any>;
  broadcastExecution?: (params: any) => Promise<any>;
  connect?: () => Promise<any>;
  getAccounts?: () => Promise<any>;
  getAccount?: () => Promise<any>;
  enable?: (chainId?: string) => Promise<any>;
};

type ExecuteRioLightContractInput = {
  sender?: string;
  contractAddress: string;
  msg: Record<string, any>;
  funds?: Array<{ denom: string; amount: string }>;
  memo?: string;
  label?: string;
  action?: string;
  riskLevel?: "low" | "medium" | "high";
  metadata?: Record<string, any>;
};

function createRioLightExecutionRequestId(prefix = "riolight-exec") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("RioLight signing is only available in a browser session.");
  }
}

function getProvider(): RioLightProvider {
  assertBrowser();

  const w = window as any;
  const provider =
    w.riolight ||
    w.rioLight ||
    w.spherio?.riolight ||
    w.spherio?.rioLight;

  if (!provider) {
    throw new Error("RioLight is required for this action. Connect or unlock RioLight, then try again.");
  }

  return provider;
}

function normalizeAddress(result: any): string {
  if (!result) throw new Error("RioLight did not return an account.");

  if (typeof result === "string") return result;

  if (Array.isArray(result)) {
    const first = result[0];
    if (typeof first === "string") return first;
    if (first?.address) return String(first.address);
    if (first?.bech32Address) return String(first.bech32Address);
  }

  if (result.address) return String(result.address);
  if (result.bech32Address) return String(result.bech32Address);
  if (result.account?.address) return String(result.account.address);
  if (result.account?.bech32Address) return String(result.account.bech32Address);

  throw new Error("RioLight returned an account response without a rio1 address.");
}

async function getRioLightAddress(provider: RioLightProvider): Promise<string> {
  if (provider.enable) {
    await provider.enable(SPHERIO.chainId).catch(() => undefined);
  }

  if (provider.request) {
    const methods = [
      "spherio_requestAccounts",
      "riolight_requestAccounts",
      "wallet_requestAccounts",
      "spherio_accounts",
      "riolight_accounts",
      "wallet_accounts",
    ];

    let lastError: unknown = null;

    for (const method of methods) {
      try {
        const result = await provider.request({
          method,
          params: { chainId: SPHERIO.chainId },
        });

        const address = normalizeAddress(result);

        if (!address.startsWith("rio1")) {
          throw new Error("RioLight returned a non-Spherio address.");
        }

        return address;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
  }

  if (provider.connect) return normalizeAddress(await provider.connect());
  if (provider.getAccounts) return normalizeAddress(await provider.getAccounts());
  if (provider.getAccount) return normalizeAddress(await provider.getAccount());

  throw new Error("RioLight provider does not expose an account method.");
}

function extractRequestId(result: any, fallback: string) {
  return (
    result?.requestId ||
    result?.id ||
    result?.request?.id ||
    result?.data?.requestId ||
    result?.data?.id ||
    result?.data?.request?.id ||
    result?.approval?.requestId ||
    result?.approval?.id ||
    result?.approval?.request?.id ||
    result?.state?.requestId ||
    result?.state?.id ||
    result?.draft?.requestId ||
    result?.draft?.id ||
    fallback
  );
}

function toRioLightJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => {
      if (typeof item === "bigint") return item.toString();
      if (typeof item === "undefined") return null;
      if (typeof item === "function") return undefined;
      return item;
    }),
  );
}

function normalizeExecutionResult(result: any, sender: string) {
  const txHash =
    result?.txHash ||
    result?.transactionHash ||
    result?.result?.txHash ||
    result?.result?.transactionHash ||
    result?.proof?.txHash ||
    null;

  const height =
    result?.height ||
    result?.result?.height ||
    result?.proof?.height ||
    null;

  const events =
    result?.events ||
    result?.result?.events ||
    result?.rawLog?.events ||
    [];

  return {
    ...result,
    sender,
    signer: sender,
    transactionHash: txHash,
    txHash,
    height,
    events,
  };
}

async function requestRioLightExecutionReview(provider: RioLightProvider, payload: any) {
  if (provider.request) {
    return provider.request({
      method: "riolight_requestSimulation",
      params: payload,
    });
  }

  if (provider.requestSimulation) {
    return provider.requestSimulation(payload);
  }

  throw new Error(
    "RioLight is connected, but execution review is not available. Update or unlock RioLight, then try again.",
  );
}

function readRioLightPageEvent() {
  if (typeof document === "undefined") return null;

  const raw = document.documentElement.getAttribute("data-riolight-page-event");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function waitForRioLightExecutionEvent(requestId: string, timeoutMs = 120000): Promise<any | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: any | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      document.documentElement.removeEventListener("riolight:page-event", onEvent);
      resolve(value);
    };

    const onEvent = () => {
      const event = readRioLightPageEvent();
      if (!event?.eventName) return;

      const detail = event.detail || {};
      if (detail.requestId !== requestId) return;

      if (
        event.eventName === "riolight:executionConfirmed" ||
        event.eventName === "riolight:executionFailed" ||
        event.eventName === "riolight:executionRejected"
      ) {
        finish({
          eventName: event.eventName,
          ...detail,
        });
      }
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);

    document.documentElement.addEventListener("riolight:page-event", onEvent);
    onEvent();
  });
}

async function getRioLightExecutionResult(provider: RioLightProvider, requestId: string) {
  if (!provider.request) return null;

  return provider.request({
    method: "riolight_getExecutionResult",
    params: { requestId },
  });
}

async function clearRioLightExecutionResult(provider: RioLightProvider, requestId: string) {
  if (!provider.request) return;

  await provider.request({
    method: "riolight_clearExecutionResult",
    params: { requestId },
  }).catch(() => undefined);
}

export async function waitForRioLightStoredExecutionResult(
  provider: RioLightProvider,
  requestId: string,
  timeoutMs = 120000,
  intervalMs = 1500,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await getRioLightExecutionResult(provider, requestId).catch(() => null);

    if (result?.status === "confirmed" || result?.ok === true) {
      await clearRioLightExecutionResult(provider, requestId);
      return result;
    }

    if (result?.status === "failed" || result?.ok === false) {
      await clearRioLightExecutionResult(provider, requestId);
      throw new Error(result?.error || "RioLight execution failed.");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}

async function broadcastRioLightExecution(provider: RioLightProvider, payload: any, requestId: string) {
  const broadcastPayload = {
    ...payload,
    requestId,
  };

  if (provider.request) {
    return provider.request({
      method: "riolight_broadcastExecution",
      params: broadcastPayload,
    });
  }

  if (provider.broadcastExecution) {
    return provider.broadcastExecution(broadcastPayload);
  }

  throw new Error(
    "RioLight is connected, but contract broadcast is not available. Update RioLight or enable its broadcast execution pipeline.",
  );
}

export async function executeRioLightContract(input: ExecuteRioLightContractInput) {
  const provider = getProvider();
  const sender = input.sender || (await getRioLightAddress(provider));
  const requestId = createRioLightExecutionRequestId(input.action || "riolight-exec");

  const payload = {
    requestId,
    chainId: SPHERIO.chainId,
    sender,
    signer: sender,
    action: input.action || input.metadata?.executionKind || "execute_contract",
    executionKind: input.metadata?.executionKind || input.action || "execute_contract",
    product: input.metadata?.product || (String(input.action || "").startsWith("prime") ? "Prime" : "Spherio"),
    type: input.metadata?.executionKind || input.action || "execute_contract",
    surface: input.metadata?.surface || "spherio_superapp",
    contractAddress: input.contractAddress,
    contract: input.contractAddress,
    msg: input.msg,
    funds: input.funds || [],
    memo: input.memo || input.label || input.metadata?.reviewTitle || "RioLight contract execution",
    label: input.label || input.memo || input.metadata?.reviewTitle || "RioLight contract execution",
    title: input.metadata?.reviewTitle || input.label || input.memo || "RioLight contract execution",
    subtitle: input.metadata?.reviewSubtitle || "Review this Spherio execution before RioLight signs and broadcasts.",
    riskLevel: input.riskLevel || "medium",
    spendAmount: input.metadata?.spendAmount,
    spendSymbol: input.metadata?.spendSymbol,
    receiveAmount: input.metadata?.receiveAmount,
    receiveSymbol: input.metadata?.receiveSymbol,
    minReceived: input.metadata?.receiveAmount,
    routeLabel: input.metadata?.routeLabel || input.label || input.memo,
    feeAmount: input.metadata?.feeAmount,
    feeSymbol: input.metadata?.feeSymbol,
    contractLabel: input.metadata?.contractLabel || input.label || input.memo,
    reviewTitle: input.metadata?.reviewTitle,
    reviewSubtitle: input.metadata?.reviewSubtitle,
    metadata: input.metadata || {},
  };

  const safePayload = toRioLightJsonSafe(payload);

  const review = await requestRioLightExecutionReview(provider, safePayload);
  const resolvedRequestId = extractRequestId(review, requestId);

  return normalizeExecutionResult(
    {
      status: "approval_opened",
      requestId: resolvedRequestId,
      review,
      note: "RioLight approval request opened. Confirm the request inside RioLight to continue.",
    },
    sender,
  );
}
