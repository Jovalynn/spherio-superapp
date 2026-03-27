import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { SPHERIO } from "@/lib/spherioConfig";

declare global {
  interface Window {
    keplr?: any;
    getOfflineSigner?: any;
  }
}

function getKeplrChainInfo() {
  const chainId = SPHERIO.chainId;

  return {
    chainId,
    chainName: "Spherio",
    rpc: SPHERIO.rpc,
    rest: SPHERIO.rest,

    bech32Config: {
      bech32PrefixAccAddr: "rio",
      bech32PrefixAccPub: "riopub",
      bech32PrefixValAddr: "riovaloper",
      bech32PrefixValPub: "riovaloperpub",
      bech32PrefixConsAddr: "riovalcons",
      bech32PrefixConsPub: "riovalconspub",
    },

    bip44: {
      coinType: 118,
    },

    currencies: [
      {
        coinDenom: "RIO",
        coinMinimalDenom: "urio",
        coinDecimals: 6,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "RIO",
        coinMinimalDenom: "urio",
        coinDecimals: 6,
        gasPriceStep: { low: 0.01, average: 0.025, high: 0.04 },
      },
    ],
    stakeCurrency: {
      coinDenom: "RIO",
      coinMinimalDenom: "urio",
      coinDecimals: 6,
    },

    features: ["cosmwasm"],
  };
}

export async function getKeplrSigner(): Promise<{ signer: any; address: string }> {
  if (typeof window === "undefined") throw new Error("Browser wallet required");
  if (!window.keplr) throw new Error("Keplr not installed");

  const chainId = SPHERIO.chainId;
  if (!chainId) throw new Error("Missing NEXT_PUBLIC_CHAIN_ID");

  // Suggest chain (safe if already added)
  if (window.keplr.experimentalSuggestChain) {
    await window.keplr.experimentalSuggestChain(getKeplrChainInfo());
  }

  await window.keplr.enable(chainId);

  const signer = window.getOfflineSigner(chainId);
  const key = await window.keplr.getKey(chainId);

  return { signer, address: key.bech32Address };
}

export async function getSigningClient(signer: any) {
  // Optional, but gives more consistent fees than relying on defaults
  const gasPrice = GasPrice.fromString("0.025urio");
  return SigningCosmWasmClient.connectWithSigner(SPHERIO.rpc, signer, { gasPrice });
}
