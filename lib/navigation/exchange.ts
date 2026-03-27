export type ExchangeSurfaceItem = {
  title: string;
  href: string;
  description: string;
};

export const EXCHANGE_SURFACES: ExchangeSurfaceItem[] = [
  {
    title: "RioDex",
    href: "/riodex",
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
