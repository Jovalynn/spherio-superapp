// lib/spherioConfig.ts
export const SPHERIO = {
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID || "spherio-1",
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || "Spherio",

  // Prefer the standard public env names first, then fall back
  rpc:
    process.env.NEXT_PUBLIC_RPC_URL ||
    process.env.NEXT_PUBLIC_SPHERIO_RPC ||
    process.env.NEXT_PUBLIC_RPC ||
    "http://localhost:26657",

  rest:
    process.env.NEXT_PUBLIC_REST_URL ||
    process.env.NEXT_PUBLIC_SPHERIO_REST ||
    "http://localhost:1317",

  coinType: Number(process.env.NEXT_PUBLIC_COIN_TYPE || "118"),

  factoryAddress:
    process.env.NEXT_PUBLIC_PUMP_FACTORY_ADDRESS ||
    process.env.NEXT_PUBLIC_SPO20_FACTORY_ADDRESS ||
    "",

  feeDenom: process.env.NEXT_PUBLIC_FEE_DENOM || "urio",
  issuanceFeeAmount: process.env.NEXT_PUBLIC_ISSUANCE_FEE_AMOUNT || "1000000",

  explorerTxBase: process.env.NEXT_PUBLIC_EXPLORER_TX_BASE || "",
} as const;
