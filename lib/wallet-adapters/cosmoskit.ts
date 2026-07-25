import { SPHERIO } from "@/lib/spherioConfig";

export type CosmosKitWalletId =
  | "keplr"
  | "leap"
  | "cosmostation"
  | "walletconnect";

export type CosmosKitAdapterStatus =
  | "planned"
  | "ready_for_install"
  | "installed"
  | "disabled";

export type SpherioCosmosKitWallet = {
  id: CosmosKitWalletId;
  label: string;
  status: CosmosKitAdapterStatus;
  priority: number;
  role: string;
  notes: string;
};

export function spherioCosmosKitWallets(): SpherioCosmosKitWallet[] {
  return [
    {
      id: "keplr",
      label: "Keplr",
      status: "ready_for_install",
      priority: 1,
      role: "primary_cosmos_wallet",
      notes:
        "Keplr is already supported through the direct Spherio adapter and can later be routed through CosmosKit.",
    },
    {
      id: "leap",
      label: "Leap",
      status: "ready_for_install",
      priority: 2,
      role: "cosmos_wallet",
      notes:
        "Leap is already supported through the direct Spherio adapter and can later be routed through CosmosKit.",
    },
    {
      id: "cosmostation",
      label: "Cosmostation",
      status: "ready_for_install",
      priority: 3,
      role: "cosmos_wallet",
      notes:
        "Cosmostation is already supported through the direct Spherio adapter and can later be routed through CosmosKit.",
    },
    {
      id: "walletconnect",
      label: "WalletConnect",
      status: "planned",
      priority: 4,
      role: "mobile_session_walletconnect",
      notes:
        "WalletConnect should be added after the CosmosKit wrapper is installed and tested.",
    },
  ];
}

export function spherioCosmosKitChainRecord() {
  return {
    chain_name: "spherio",
    chain_id: SPHERIO.chainId,
    pretty_name: SPHERIO.chainName || "SpherioChain",
    status: "live",
    network_type: "devnet",
    bech32_prefix: "rio",
    daemon_name: "spheriod",
    node_home: "$HOME/.spheriochain",
    slip44: SPHERIO.coinType || 118,
    fees: {
      fee_tokens: [
        {
          denom: "urio",
          fixed_min_gas_price: 0.025,
          low_gas_price: 0.01,
          average_gas_price: 0.025,
          high_gas_price: 0.04,
        },
      ],
    },
    staking: {
      staking_tokens: [
        {
          denom: "urio",
        },
      ],
    },
    apis: {
      rpc: [
        {
          address: SPHERIO.rpc,
          provider: "Spherio",
        },
      ],
      rest: [
        {
          address: SPHERIO.rest,
          provider: "Spherio",
        },
      ],
    },
  };
}

export function spherioCosmosKitAssetRecord() {
  return {
    chain_name: "spherio",
    assets: [
      {
        description:
          "RIO is the native asset of SpherioChain, used for fees, execution, liquidity, treasury routing, and ecosystem settlement.",
        denom_units: [
          {
            denom: "urio",
            exponent: 0,
          },
          {
            denom: "rio",
            exponent: 6,
          },
        ],
        base: "urio",
        name: "Real-World Interconnected On-chain",
        display: "rio",
        symbol: "RIO",
        type_asset: "sdk.coin",
      },
    ],
  };
}
