import { RIODEX_HOME_ROUTE } from "@/lib/riodex/routes";

export type ExchangeSurfaceItem = {
  title: string;
  href: string;
  description: string;
};

export const EXCHANGE_SURFACES: ExchangeSurfaceItem[] = [
  {
    title: "RioDex",
    href: RIODEX_HOME_ROUTE,
    description: "Execution, swap, liquidity, pools",
  },
  {
    title: "RioEx",
    href: "/rioex",
    description: "Discovery, markets, exchange intelligence",
  },
  {
    title: "RioExplorer",
    href: "/rioexplorer",
    description: "On-chain visibility, contracts, telemetry",
  },
];
