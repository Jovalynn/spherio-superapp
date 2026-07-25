"use client";

import { SPHERIO } from "@/lib/spherioConfig";

type CosmostationProvider = {
  providers?: {
    keplr?: {
      experimentalSuggestChain?: (chainInfo: any) => Promise<void>;
      enable?: (chainId: string) => Promise<void>;
      getKey?: (chainId: string) => Promise<{
        name: string;
        bech32Address: string;
        isNanoLedger?: boolean;
      }>;
    };
  };
  cosmos?: {
    request?: (args: { method: string; params?: any }) => Promise<any>;
  };
};

async function buildChainInfo() {
  const { spherioKeplrChainInfo } = await import("@/lib/wallet-adapters/keplr");
  return spherioKeplrChainInfo();
}

export function getCosmostationProvider(): CosmostationProvider | null {
  if (typeof window === "undefined") return null;

  const w = window as any;
  return (w.cosmostation as CosmostationProvider | undefined) || null;
}

export function hasCosmostationProvider() {
  return Boolean(getCosmostationProvider());
}

function normalizeAddress(result: any): string | null {
  if (!result) return null;
  if (typeof result === "string") return result;

  if (result.address) return String(result.address);
  if (result.bech32Address) return String(result.bech32Address);

  if (Array.isArray(result)) {
    const first = result[0];
    if (typeof first === "string") return first;
    if (first?.address) return String(first.address);
    if (first?.bech32Address) return String(first.bech32Address);
  }

  return null;
}

export async function suggestSpherioToCosmostation() {
  const cosmostation = getCosmostationProvider();

  if (!cosmostation) {
    throw new Error("Cosmostation wallet was not detected. Install or unlock Cosmostation, then refresh.");
  }

  const keplrLike = cosmostation.providers?.keplr;

  if (keplrLike?.experimentalSuggestChain) {
    await keplrLike.experimentalSuggestChain(await buildChainInfo());
  }

  await keplrLike?.enable?.(SPHERIO.chainId);

  return true;
}

export async function connectCosmostationSpherio() {
  const cosmostation = getCosmostationProvider();

  if (!cosmostation) {
    throw new Error("Cosmostation wallet was not detected. Install or unlock Cosmostation, then refresh.");
  }

  const keplrLike = cosmostation.providers?.keplr;

  if (keplrLike) {
    await suggestSpherioToCosmostation();

    const key = await keplrLike.getKey?.(SPHERIO.chainId);

    if (!key?.bech32Address) {
      throw new Error("Cosmostation did not return a Spherio address.");
    }

    if (!key.bech32Address.startsWith("rio1")) {
      throw new Error(`Cosmostation returned a non-Spherio address: ${key.bech32Address}`);
    }

    return {
      adapter: "cosmostation" as const,
      address: key.bech32Address,
      chainId: SPHERIO.chainId,
      name: key.name,
      isNanoLedger: Boolean(key.isNanoLedger),
    };
  }

  const result = await cosmostation.cosmos?.request?.({
    method: "cos_requestAccount",
    params: {
      chainName: SPHERIO.chainId,
    },
  });

  const address = normalizeAddress(result);

  if (!address) {
    throw new Error("Cosmostation did not return a Spherio address.");
  }

  if (!address.startsWith("rio1")) {
    throw new Error(`Cosmostation returned a non-Spherio address: ${address}`);
  }

  return {
    adapter: "cosmostation" as const,
    address,
    chainId: SPHERIO.chainId,
  };
}
