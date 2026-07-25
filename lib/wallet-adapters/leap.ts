"use client";

import { SPHERIO } from "@/lib/spherioConfig";
import { spherioKeplrChainInfo } from "@/lib/wallet-adapters/keplr";

type LeapProvider = {
  experimentalSuggestChain?: (chainInfo: any) => Promise<void>;
  enable?: (chainId: string) => Promise<void>;
  getKey?: (chainId: string) => Promise<{
    name: string;
    bech32Address: string;
    isNanoLedger?: boolean;
  }>;
};

export function getLeapProvider(): LeapProvider | null {
  if (typeof window === "undefined") return null;

  const w = window as any;
  return (w.leap as LeapProvider | undefined) || null;
}

export function hasLeapProvider() {
  return Boolean(getLeapProvider());
}

export async function suggestSpherioToLeap() {
  const leap = getLeapProvider();

  if (!leap) {
    throw new Error("Leap wallet was not detected. Install or unlock Leap, then refresh.");
  }

  if (leap.experimentalSuggestChain) {
    await leap.experimentalSuggestChain(spherioKeplrChainInfo());
  }

  await leap.enable?.(SPHERIO.chainId);

  return true;
}

export async function connectLeapSpherio() {
  const leap = getLeapProvider();

  if (!leap) {
    throw new Error("Leap wallet was not detected. Install or unlock Leap, then refresh.");
  }

  await suggestSpherioToLeap();

  const key = await leap.getKey?.(SPHERIO.chainId);

  if (!key?.bech32Address) {
    throw new Error("Leap did not return a Spherio address.");
  }

  if (!key.bech32Address.startsWith("rio1")) {
    throw new Error(`Leap returned a non-Spherio address: ${key.bech32Address}`);
  }

  return {
    adapter: "leap" as const,
    address: key.bech32Address,
    chainId: SPHERIO.chainId,
    name: key.name,
    isNanoLedger: Boolean(key.isNanoLedger),
  };
}
