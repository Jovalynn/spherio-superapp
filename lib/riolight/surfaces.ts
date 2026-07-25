export type RioLightSurfaceKey =
  | "prime_create"
  | "pump_create"
  | "createtoken_spo20_create"
  | "swap_execute"
  | "liquidity_add"
  | "liquidity_remove"
  | "pool_create"
  | "pool_manage"
  | "riodex_swap"
  | "riodex_pool"
  | "rioex_trade"
  | "spo20_transfer";

export type RioLightSurfaceConfig = {
  key: RioLightSurfaceKey;
  product:
    | "Prime"
    | "Pump"
    | "CreateToken"
    | "Swap"
    | "Liquidity"
    | "Pool"
    | "RioDex"
    | "RioEx"
    | "SPO-20";
  action: string;
  reviewTitle: string;
  reviewSubtitle: string;
  actionLabel: string;
  defaultRouteLabel: string;
};

export const RIOLIGHT_SURFACES: Record<RioLightSurfaceKey, RioLightSurfaceConfig> = {
  prime_create: {
    key: "prime_create",
    product: "Prime",
    action: "prime_create",
    reviewTitle: "Prime Project Creation",
    reviewSubtitle:
      "Review this Prime Project creation before RioLight signs and broadcasts. Your project includes a canonical SPO-20 asset and a market-ready path into liquidity, discovery, and trading.",
    actionLabel: "Confirm Prime Project",
    defaultRouteLabel: "Prime SPO-20 factory",
  },

  pump_create: {
    key: "pump_create",
    product: "Pump",
    action: "pump_create",
    reviewTitle: "Pump Launch Creation",
    reviewSubtitle:
      "Review this Pump launch before RioLight signs and broadcasts. After creation, the bonding-curve launch path opens automatically.",
    actionLabel: "Confirm Pump Launch",
    defaultRouteLabel: "Pump launch factory",
  },

  createtoken_spo20_create: {
    key: "createtoken_spo20_create",
    product: "CreateToken",
    action: "createtoken_deploy",
    reviewTitle: "SPO-20 Token Creation",
    reviewSubtitle:
      "Review this SPO-20 token creation before RioLight signs and broadcasts.",
    actionLabel: "Confirm Token Creation",
    defaultRouteLabel: "SPO-20 factory",
  },

  swap_execute: {
    key: "swap_execute",
    product: "Swap",
    action: "riodex_swap",
    reviewTitle: "Swap Confirmation",
    reviewSubtitle:
      "Review this swap route, amount, fee, and minimum received before RioLight signs and broadcasts.",
    actionLabel: "Confirm Swap",
    defaultRouteLabel: "RioDex swap",
  },

  liquidity_add: {
    key: "liquidity_add",
    product: "Liquidity",
    action: "lp_add",
    reviewTitle: "Add Liquidity",
    reviewSubtitle:
      "Review this liquidity contribution before RioLight signs and broadcasts.",
    actionLabel: "Confirm Liquidity",
    defaultRouteLabel: "RioDex liquidity",
  },

  liquidity_remove: {
    key: "liquidity_remove",
    product: "Liquidity",
    action: "lp_remove",
    reviewTitle: "Remove Liquidity",
    reviewSubtitle:
      "Review this liquidity removal before RioLight signs and broadcasts.",
    actionLabel: "Confirm Liquidity Removal",
    defaultRouteLabel: "RioDex liquidity",
  },

  pool_create: {
    key: "pool_create",
    product: "Pool",
    action: "pool_create",
    reviewTitle: "Create Pool",
    reviewSubtitle:
      "Review this pool creation before RioLight signs and broadcasts.",
    actionLabel: "Confirm Pool Creation",
    defaultRouteLabel: "RioDex pool factory",
  },

  pool_manage: {
    key: "pool_manage",
    product: "Pool",
    action: "pool_manage",
    reviewTitle: "Pool Action",
    reviewSubtitle:
      "Review this pool action before RioLight signs and broadcasts.",
    actionLabel: "Confirm Pool Action",
    defaultRouteLabel: "RioDex pool",
  },

  riodex_swap: {
    key: "riodex_swap",
    product: "RioDex",
    action: "riodex_swap",
    reviewTitle: "RioDex Swap",
    reviewSubtitle:
      "Review this RioDex swap before RioLight signs and broadcasts.",
    actionLabel: "Confirm RioDex Swap",
    defaultRouteLabel: "RioDex AMM",
  },

  riodex_pool: {
    key: "riodex_pool",
    product: "RioDex",
    action: "riodex_pool",
    reviewTitle: "RioDex Pool Action",
    reviewSubtitle:
      "Review this RioDex pool action before RioLight signs and broadcasts.",
    actionLabel: "Confirm Pool Action",
    defaultRouteLabel: "RioDex pool",
  },

  rioex_trade: {
    key: "rioex_trade",
    product: "RioEx",
    action: "rioex_trade",
    reviewTitle: "RioEx Trade",
    reviewSubtitle:
      "Review this RioEx trade before RioLight signs and broadcasts.",
    actionLabel: "Confirm RioEx Trade",
    defaultRouteLabel: "RioEx market",
  },

  spo20_transfer: {
    key: "spo20_transfer",
    product: "SPO-20",
    action: "spo20_transfer",
    reviewTitle: "SPO-20 Transfer",
    reviewSubtitle:
      "Review this SPO-20 transfer before RioLight signs and broadcasts.",
    actionLabel: "Confirm Transfer",
    defaultRouteLabel: "SPO-20 transfer",
  },
};

export function getRioLightSurface(key: RioLightSurfaceKey) {
  return RIOLIGHT_SURFACES[key];
}
