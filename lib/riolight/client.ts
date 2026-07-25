"use client";

import { SPHERIO } from "@/lib/spherioConfig";
import { connectKeplrSpherio, hasKeplrProvider } from "@/lib/wallet-adapters/keplr";
import { connectLeapSpherio, hasLeapProvider } from "@/lib/wallet-adapters/leap";
import {
  connectCosmostationSpherio,
  hasCosmostationProvider,
} from "@/lib/wallet-adapters/cosmostation";
import type { RioLightConnectedWallet, RioLightExecutionContext } from "./types";

type RioLightProvider = {
  request?: (args: { method: string; params?: any }) => Promise<any>;
  connect?: () => Promise<any>;
  getAccounts?: () => Promise<any>;
  getAccount?: () => Promise<any>;
  enable?: (chainId?: string) => Promise<any>;
};

declare global {
  interface Window {
    riolight?: RioLightProvider;
    rioLight?: RioLightProvider;
    spherio?: {
      riolight?: RioLightProvider;
      rioLight?: RioLightProvider;
    };
  }
}

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("RioLight can only connect in a browser session.");
  }
}

function assertRioAddress(address: string) {
  if (!/^rio1[a-z0-9]{20,}$/i.test(address)) {
    throw new Error("Connected wallet is not a valid Spherio rio1 address.");
  }
}

function detectRioLightProvider(): RioLightProvider | null {
  assertBrowser();

  return (
    window.riolight ||
    window.rioLight ||
    window.spherio?.riolight ||
    window.spherio?.rioLight ||
    null
  );
}

function getRioLightProvider(): RioLightProvider {
  const provider = detectRioLightProvider();

  if (!provider) {
    throw new Error(
      "RioLight extension was not detected. Install or reload the RioLight extension, unlock it, then refresh this page."
    );
  }

  return provider;
}

function normalizeAddress(result: any): string {
  if (!result) {
    throw new Error("RioLight did not return an account.");
  }

  if (typeof result === "string") {
    return result;
  }

  if (Array.isArray(result)) {
    const first = result[0];

    if (typeof first === "string") {
      return first;
    }

    if (first?.address) {
      return String(first.address);
    }

    if (first?.bech32Address) {
      return String(first.bech32Address);
    }
  }

  if (result.address) {
    return String(result.address);
  }

  if (result.bech32Address) {
    return String(result.bech32Address);
  }

  if (result.account?.address) {
    return String(result.account.address);
  }

  if (result.account?.bech32Address) {
    return String(result.account.bech32Address);
  }

  throw new Error("RioLight returned an account response without a rio1 address.");
}

async function requestRioLightAddress(provider: RioLightProvider): Promise<string> {
  if (provider.request) {
    const methods = [
      "spherio_requestAccounts",
      "spherio_accounts",
      "riolight_requestAccounts",
      "riolight_accounts",
      "wallet_requestAccounts",
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
        assertRioAddress(address);
        return address;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError;
    }
  }

  if (provider.connect) {
    const result = await provider.connect();
    const address = normalizeAddress(result);
    assertRioAddress(address);
    return address;
  }

  if (provider.getAccounts) {
    const result = await provider.getAccounts();
    const address = normalizeAddress(result);
    assertRioAddress(address);
    return address;
  }

  if (provider.getAccount) {
    const result = await provider.getAccount();
    const address = normalizeAddress(result);
    assertRioAddress(address);
    return address;
  }

  throw new Error(
    "RioLight provider was detected, but it does not expose an account connection method yet."
  );
}

export async function connectRioLight(): Promise<RioLightConnectedWallet> {
  assertBrowser();

  const provider = detectRioLightProvider();

  if (provider) {
    if (provider.enable) {
      await provider.enable(SPHERIO.chainId).catch(() => undefined);
    }

    const address = await requestRioLightAddress(provider);

    return {
      adapter: "riolight-native",
      address,
      chainId: SPHERIO.chainId,
    };
  }

  if (hasKeplrProvider()) {
    const wallet = await connectKeplrSpherio();

    return {
      adapter: "keplr",
      address: wallet.address,
      chainId: wallet.chainId,
    };
  }

  if (hasLeapProvider()) {
    const wallet = await connectLeapSpherio();

    return {
      adapter: "leap",
      address: wallet.address,
      chainId: wallet.chainId,
    };
  }

  if (hasCosmostationProvider()) {
    const wallet = await connectCosmostationSpherio();

    return {
      adapter: "cosmostation",
      address: wallet.address,
      chainId: wallet.chainId,
    };
  }

  throw new Error(
    "No supported Spherio wallet was detected. Install or unlock RioLight, Keplr, Leap, or Cosmostation, then refresh this page."
  );
}

export async function getRioLightExecutionContext(): Promise<RioLightExecutionContext> {
  const wallet = await connectRioLight();

  throw new Error(
    `RioLight connected ${wallet.address}, but native signing/broadcast is intentionally reserved until the security pass is complete.`
  );
}

export async function getRioLightAddress(): Promise<string> {
  const wallet = await connectRioLight();
  return wallet.address;
}
