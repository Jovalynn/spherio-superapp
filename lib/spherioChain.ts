// lib/spherioChain.ts

const RPC = process.env.NEXT_PUBLIC_SPHERIO_RPC || "http://127.0.0.1:26657";
const REST = process.env.NEXT_PUBLIC_SPHERIO_REST || "http://127.0.0.1:1317";

export const SPHERIO_CHAIN = {
  chain_name: "spherio",
  chain_id: "spherio-1",
  pretty_name: "Spherio",
  status: "live",
  network_type: "devnet",

  bech32_prefix: "rio",

  daemon_name: "spheriod",
  node_home: "$HOME/.spheriochain",

  slip44: 118,
  bip44: {
    coin_type: 118,
  },

  apis: {
    rpc: [{ address: RPC }],
    rest: [{ address: REST }],
  },

  staking: {
    staking_tokens: [{ denom: "urio" }],
  },

  currencies: [
    {
      coinDenom: "RIO",
      coinMinimalDenom: "urio",
      coinDecimals: 6,
      coinGeckoId: "",
    },
  ],

  fee_currencies: [
    {
      coinDenom: "RIO",
      coinMinimalDenom: "urio",
      coinDecimals: 6,
      coinGeckoId: "",
      gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.04,
      },
    },
  ],

  stake_currency: {
    coinDenom: "RIO",
    coinMinimalDenom: "urio",
    coinDecimals: 6,
    coinGeckoId: "",
  },

  fees: {
    fee_tokens: [
      {
        denom: "urio",
        fixed_min_gas_price: 0.01,
        average_gas_price: 0.025,
        high_gas_price: 0.04,
      },
    ],
  },

  images: {
    png: "https://avatars.githubusercontent.com/u/175851528?s=400&u=b0c1a871d1e739566c4c2bf96a97720fedfc03ab&v=4",
  },

  explorers: [
    {
      kind: "explorer",
      url: "http://127.0.0.1:3000/rioexplorer",
      tx_page: "http://127.0.0.1:3000/rioexplorer/tx/${txHash}",
      account_page: "http://127.0.0.1:3000/rioexplorer/address/${accountAddress}",
    },
  ],

  keywords: ["spherio", "rio", "cosmwasm"],

  features: ["cosmwasm"],

  bech32_config: {
    bech32PrefixAccAddr: "rio",
    bech32PrefixAccPub: "riopub",
    bech32PrefixValAddr: "riovaloper",
    bech32PrefixValPub: "riovaloperpub",
    bech32PrefixConsAddr: "riovalcons",
    bech32PrefixConsPub: "riovalconspub",
  },
} as const;
