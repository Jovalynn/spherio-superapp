"use client";

import { SPHERIO } from "@/lib/spherioConfig";

type KeplrCurrency = {
  coinDenom: string;
  coinMinimalDenom: string;
  coinDecimals: number;
  coinGeckoId?: string;
  coinImageUrl?: string;
};

type KeplrChainInfo = {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  bip44: {
    coinType: number;
  };
  bech32Config: {
    bech32PrefixAccAddr: string;
    bech32PrefixAccPub: string;
    bech32PrefixValAddr: string;
    bech32PrefixValPub: string;
    bech32PrefixConsAddr: string;
    bech32PrefixConsPub: string;
  };
  currencies: KeplrCurrency[];
  feeCurrencies: Array<
    KeplrCurrency & {
      gasPriceStep?: {
        low: number;
        average: number;
        high: number;
      };
    }
  >;
  stakeCurrency: KeplrCurrency;
  features?: string[];
};

type KeplrProvider = {
  experimentalSuggestChain?: (chainInfo: KeplrChainInfo) => Promise<void>;
  enable?: (chainId: string) => Promise<void>;
  getKey?: (chainId: string) => Promise<{
    name: string;
    algo: string;
    pubKey: Uint8Array;
    address: Uint8Array;
    bech32Address: string;
    isNanoLedger?: boolean;
  }>;
};

const RIO_LOGO_URI =
  process.env.NEXT_PUBLIC_RIO_LOGO_URI ||
  process.env.NEXT_PUBLIC_RIO_LOGO_URL ||
  "https://raw.githubusercontent.com/Lerivee/RUSD/refs/heads/main/Untitled%20design.png";

export function getKeplrProvider(): KeplrProvider | null {
  if (typeof window === "undefined") return null;
  return ((window as any).keplr as KeplrProvider | undefined) || null;
}

export function hasKeplrProvider() {
  return Boolean(getKeplrProvider());
}

export function spherioKeplrChainInfo(): KeplrChainInfo {
  const rioCurrency: KeplrCurrency = {
    coinDenom: "RIO",
    coinMinimalDenom: "urio",
    coinDecimals: 6,
    coinImageUrl: RIO_LOGO_URI,
  };

  return {
    chainId: SPHERIO.chainId,
    chainName: SPHERIO.chainName || "SpherioChain",
    rpc: SPHERIO.rpc,
    rest: SPHERIO.rest,
    bip44: {
      coinType: SPHERIO.coinType || 118,
    },
    bech32Config: {
      bech32PrefixAccAddr: "rio",
      bech32PrefixAccPub: "riopub",
      bech32PrefixValAddr: "riovaloper",
      bech32PrefixValPub: "riovaloperpub",
      bech32PrefixConsAddr: "riovalcons",
      bech32PrefixConsPub: "riovalconspub",
    },
    currencies: [rioCurrency],
    feeCurrencies: [
      {
        ...rioCurrency,
        gasPriceStep: {
          low: 0.01,
          average: 0.025,
          high: 0.04,
        },
      },
    ],
    stakeCurrency: rioCurrency,
    features: ["cosmwasm", "ibc-transfer"],
  };
}

export async function suggestSpherioToKeplr() {
  const keplr = getKeplrProvider();

  if (!keplr) {
    throw new Error("Keplr wallet was not detected. Install or unlock Keplr, then refresh.");
  }

  if (keplr.experimentalSuggestChain) {
    await keplr.experimentalSuggestChain(spherioKeplrChainInfo());
  }

  await keplr.enable?.(SPHERIO.chainId);

  return true;
}

export async function connectKeplrSpherio() {
  const keplr = getKeplrProvider();

  if (!keplr) {
    throw new Error("Keplr wallet was not detected. Install or unlock Keplr, then refresh.");
  }

  await suggestSpherioToKeplr();

  const key = await keplr.getKey?.(SPHERIO.chainId);

  if (!key?.bech32Address) {
    throw new Error("Keplr did not return a Spherio address.");
  }

  if (!key.bech32Address.startsWith("rio1")) {
    throw new Error(`Keplr returned a non-Spherio address: ${key.bech32Address}`);
  }

  return {
    adapter: "keplr" as const,
    address: key.bech32Address,
    chainId: SPHERIO.chainId,
    name: key.name,
    isNanoLedger: Boolean(key.isNanoLedger),
  };
}
