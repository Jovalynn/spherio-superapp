"use client";

import { getRioLightExecutionContext } from "./client";
import type { RioLightPumpTradeInput } from "./types";

export async function executeRioLightPumpTrade(input: RioLightPumpTradeInput) {
  const wallet = await getRioLightExecutionContext();

  const response = await fetch("/api/pump/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      side: input.side,
      amount: input.amount,
      tokenAddress: input.tokenAddress,
      symbol: input.symbol,
      totalSupply: input.totalSupply ?? 1_000_000_000,
      previewOnly: false,
      traderAddress: wallet.address,
      walletAdapter: wallet.adapter,
      executionMode: "riolight-wallet",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "RioLight Pump execution failed.");
  }

  return {
    ...data,
    rioLight: {
      address: wallet.address,
      adapter: wallet.adapter,
      chainId: wallet.chainId,
    },
  };
}
