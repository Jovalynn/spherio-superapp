import { SPHERIO } from "@/lib/spherioConfig";

export type SpherioIbcRouteStatus =
  | "planned"
  | "configured"
  | "testing"
  | "live"
  | "disabled";

export type SpherioIbcRoute = {
  id: string;
  status: SpherioIbcRouteStatus;

  sourceChainId: string;
  sourceChainName: string;
  sourcePort: string;
  sourceChannel: string | null;

  counterpartyChainId: string;
  counterpartyChainName: string;
  counterpartyPort: string;
  counterpartyChannel: string | null;

  supportedAssets: Array<{
    symbol: string;
    baseDenom: string;
    displayDenom: string;
    decimals: number;
    role: "native" | "stable" | "liquidity" | "external";
  }>;

  purpose: string;
  notes: string[];
};

export const SPHERIO_IBC_ROUTES: SpherioIbcRoute[] = [
  {
    id: "spherio-osmosis",
    status: "planned",
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName || "SpherioChain",
    sourcePort: "transfer",
    sourceChannel: null,
    counterpartyChainId: "osmosis-1",
    counterpartyChainName: "Osmosis",
    counterpartyPort: "transfer",
    counterpartyChannel: null,
    supportedAssets: [
      {
        symbol: "RIO",
        baseDenom: "urio",
        displayDenom: "RIO",
        decimals: 6,
        role: "native",
      },
      {
        symbol: "RUSD",
        baseDenom: "rusd",
        displayDenom: "RUSD",
        decimals: 6,
        role: "stable",
      },
    ],
    purpose: "Primary Cosmos liquidity route for RIO/RUSD market access.",
    notes: [
      "Channel IDs are not configured yet.",
      "Route must remain planned until relayer/channel proof exists.",
      "RioEx and RioLight may display this route as planned, not executable.",
    ],
  },
  {
    id: "spherio-cosmoshub",
    status: "planned",
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName || "SpherioChain",
    sourcePort: "transfer",
    sourceChannel: null,
    counterpartyChainId: "cosmoshub-4",
    counterpartyChainName: "Cosmos Hub",
    counterpartyPort: "transfer",
    counterpartyChannel: null,
    supportedAssets: [
      {
        symbol: "RIO",
        baseDenom: "urio",
        displayDenom: "RIO",
        decimals: 6,
        role: "native",
      },
    ],
    purpose: "Strategic Cosmos ecosystem interoperability route.",
    notes: [
      "Channel IDs are not configured yet.",
      "ATOM liquidity integration should be evaluated after Spherio IBC relayer setup.",
    ],
  },
  {
    id: "spherio-noble",
    status: "planned",
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName || "SpherioChain",
    sourcePort: "transfer",
    sourceChannel: null,
    counterpartyChainId: "noble-1",
    counterpartyChainName: "Noble",
    counterpartyPort: "transfer",
    counterpartyChannel: null,
    supportedAssets: [
      {
        symbol: "USDC",
        baseDenom: "uusdc",
        displayDenom: "USDC",
        decimals: 6,
        role: "external",
      },
      {
        symbol: "RUSD",
        baseDenom: "rusd",
        displayDenom: "RUSD",
        decimals: 6,
        role: "stable",
      },
    ],
    purpose: "Stablecoin liquidity route for USDC/RUSD settlement and liquidity depth.",
    notes: [
      "Requires verified Noble route/channel before executable status.",
      "Useful for future RUSD stability and RioEx stablecoin markets.",
    ],
  },
];

export function getSpherioIbcRegistry() {
  return {
    status: "foundation_ready" as const,
    chainId: SPHERIO.chainId,
    chainName: SPHERIO.chainName,
    transferPort: "transfer",
    routes: SPHERIO_IBC_ROUTES,
    executionEnabled: false,
    notes: [
      "IBC route registry is informational until channels, relayers, and counterparty proofs are configured.",
      "RioLight must not broadcast IBC transfers until a route status is live.",
      "RioEx may show planned IBC routes as non-executable future liquidity paths.",
    ],
  };
}
