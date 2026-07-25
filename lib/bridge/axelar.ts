import { SPHERIO } from "@/lib/spherioConfig";

export type SpherioAxelarRouteStatus =
  | "planned"
  | "configured"
  | "testing"
  | "live"
  | "disabled";

export type SpherioAxelarRoute = {
  id: string;
  status: SpherioAxelarRouteStatus;

  sourceChainId: string;
  sourceChainName: string;

  destinationChainId: string;
  destinationChainName: string;
  destinationVm: "cosmos" | "evm" | "other";

  gatewayAddress: string | null;
  gasServiceAddress: string | null;

  supportedAssets: Array<{
    symbol: string;
    canonicalAssetId: string;
    sourceDenomOrAddress: string;
    destinationDenomOrAddress: string | null;
    decimals: number;
    role: "native" | "stable" | "bridged" | "external";
  }>;

  purpose: string;
  notes: string[];
};

export const SPHERIO_AXELAR_ROUTES: SpherioAxelarRoute[] = [
  {
    id: "spherio-axelar-ethereum",
    status: "planned",
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName || "SpherioChain",
    destinationChainId: "ethereum-1",
    destinationChainName: "Ethereum",
    destinationVm: "evm",
    gatewayAddress: null,
    gasServiceAddress: null,
    supportedAssets: [
      {
        symbol: "RIO",
        canonicalAssetId: "urio",
        sourceDenomOrAddress: "urio",
        destinationDenomOrAddress: null,
        decimals: 6,
        role: "bridged",
      },
      {
        symbol: "RUSD",
        canonicalAssetId: "rusd",
        sourceDenomOrAddress: "rusd",
        destinationDenomOrAddress: null,
        decimals: 6,
        role: "stable",
      },
    ],
    purpose:
      "Future Axelar bridge route for EVM-facing RIO/RUSD representation and liquidity access.",
    notes: [
      "Gateway and gas service addresses are not configured yet.",
      "Route must remain planned until Axelar contracts, gateway, and representation rules are finalized.",
      "Do not expose executable bridge transactions until this route is live.",
    ],
  },
  {
    id: "spherio-axelar-arbitrum",
    status: "planned",
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName || "SpherioChain",
    destinationChainId: "arbitrum-one",
    destinationChainName: "Arbitrum One",
    destinationVm: "evm",
    gatewayAddress: null,
    gasServiceAddress: null,
    supportedAssets: [
      {
        symbol: "RIO",
        canonicalAssetId: "urio",
        sourceDenomOrAddress: "urio",
        destinationDenomOrAddress: null,
        decimals: 6,
        role: "bridged",
      },
      {
        symbol: "RUSD",
        canonicalAssetId: "rusd",
        sourceDenomOrAddress: "rusd",
        destinationDenomOrAddress: null,
        decimals: 6,
        role: "stable",
      },
    ],
    purpose:
      "Future low-cost EVM liquidity/access route for Spherio assets through Axelar.",
    notes: [
      "Route is informational only.",
      "Destination token representation contracts are not configured yet.",
    ],
  },
  {
    id: "spherio-axelar-base",
    status: "planned",
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName || "SpherioChain",
    destinationChainId: "base",
    destinationChainName: "Base",
    destinationVm: "evm",
    gatewayAddress: null,
    gasServiceAddress: null,
    supportedAssets: [
      {
        symbol: "RIO",
        canonicalAssetId: "urio",
        sourceDenomOrAddress: "urio",
        destinationDenomOrAddress: null,
        decimals: 6,
        role: "bridged",
      },
      {
        symbol: "RUSD",
        canonicalAssetId: "rusd",
        sourceDenomOrAddress: "rusd",
        destinationDenomOrAddress: null,
        decimals: 6,
        role: "stable",
      },
    ],
    purpose:
      "Future consumer/EVM route for Spherio asset representation and app distribution.",
    notes: [
      "Route is planned only.",
      "Bridge execution must remain disabled until Axelar route proof exists.",
    ],
  },
];

export function getSpherioAxelarRegistry() {
  return {
    status: "foundation_ready" as const,
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName,
    executionEnabled: false,
    routeType: "axelar_bridge",
    routes: SPHERIO_AXELAR_ROUTES,
    notes: [
      "Axelar registry is informational until gateway, gas service, and representation contracts are configured.",
      "RioLight must not broadcast Axelar bridge transactions until a route status is live.",
      "RioEx Bridge may show planned Axelar routes as future liquidity paths, not executable routes.",
    ],
  };
}
