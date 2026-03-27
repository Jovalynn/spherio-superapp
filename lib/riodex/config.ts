import { SPHERIO_TREASURY_MULTISIG } from "@/lib/spherio/treasury";

export const RIODEX_FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_RIODEX_FACTORY_ADDRESS || "";

export const RIODEX_ROUTER_ADDRESS =
  process.env.NEXT_PUBLIC_RIODEX_ROUTER_ADDRESS || "";

export const RIODEX_FEE_COLLECTOR = SPHERIO_TREASURY_MULTISIG;

export function hasRioDexAddresses() {
  return Boolean(RIODEX_FACTORY_ADDRESS && RIODEX_ROUTER_ADDRESS);
}
