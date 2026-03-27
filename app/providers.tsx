"use client";

import React from "react";
import { ChainProvider } from "@cosmos-kit/react";

// wallets
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as leapWallets } from "@cosmos-kit/leap";
import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation";

// your chain definition
import { SPHERIO_CHAIN } from "@/lib/spherioChain";

// ✅ restore TxProvider (this is what CreateToken/Hybrid require)
import { TxProvider } from "@/context/TxContext";

// optional: your custom modal (only if you already wired walletModal)
import WalletModal from "@/components/WalletModal";

const SPHERIO_ASSET_LIST = {
  chain_name: SPHERIO_CHAIN.chain_name ?? "spherio",
  assets: [
    {
      description: "Spherio native asset",
      denom_units: [
        { denom: "urio", exponent: 0 },
        { denom: "rio", exponent: 6 },
      ],
      base: "urio",
      name: "RIO",
      display: "rio",
      symbol: "RIO",
    },
  ],
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TxProvider>
      <ChainProvider
        throwErrors={false}
        chains={[SPHERIO_CHAIN as any]}
        assetLists={[SPHERIO_ASSET_LIST as any]}
        wallets={[...keplrWallets, ...leapWallets, ...cosmostationWallets]}
        walletModal={WalletModal as any}
      >
        {children}
      </ChainProvider>
    </TxProvider>
  );
}
