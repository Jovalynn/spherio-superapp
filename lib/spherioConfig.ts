// lib/spherioConfig.ts
export const SPHERIO = {
  // Chain identity
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID || "spherio-1",
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || "Spherio",

  // Endpoints (browser uses localhost; in production use your domain)
  rpc: process.env.NEXT_PUBLIC_SPHERIO_RPC || "http://localhost:26657",
  rest: process.env.NEXT_PUBLIC_SPHERIO_REST || "http://localhost:1317",

  // Wallet derivation (Cosmos standard)
  coinType: Number(process.env.NEXT_PUBLIC_COIN_TYPE || "118"),

  // SPO-20 Factory contract (CosmWasm)
  factoryAddress: process.env.NEXT_PUBLIC_SPO20_FACTORY_ADDRESS || "",

  // Optional fee config
  feeDenom: process.env.NEXT_PUBLIC_FEE_DENOM || "urio",
  issuanceFeeAmount: process.env.NEXT_PUBLIC_ISSUANCE_FEE_AMOUNT || "1000000",

  // Explorer base (optional; later point to RioExplorer)
  explorerTxBase: process.env.NEXT_PUBLIC_EXPLORER_TX_BASE || "",
} as const;
