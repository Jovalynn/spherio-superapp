import { SPHERIO } from "@/lib/spherioConfig";

export type SpherioHyperlaneRouteStatus =
  | "planned"
  | "configured"
  | "testing"
  | "live"
  | "disabled";

export type SpherioHyperlaneRoute = {
  id: string;
  status: SpherioHyperlaneRouteStatus;

  sourceChainId: string;
  sourceChainName: string;

  destinationChainId: string;
  destinationChainName: string;
  destinationVm: "cosmos" | "evm" | "other";

  mailboxAddress: string | null;
  interchainGasPaymasterAddress: string | null;
  warpRouteAddress: string | null;

  supportedAssets: Array<{
    symbol: string;
    canonicalAssetId: string;
    sourceDenomOrAddress: string;
    destinationDenomOrAddress: string | null;
    decimals: number;
    role: "native" | "stable" | "bridged" | "external";
  }>;

  supportedMessages: Array<
    | "token_bridge"
    | "asset_representation"
    | "governance_message"
    | "liquidity_message"
    | "proof_message"
  >;

  purpose: string;
  notes: string[];
};

export const SPHERIO_HYPERLANE_ROUTES: SpherioHyperlaneRoute[] = [
  {
    id: "spherio-hyperlane-ethereum",
    status: "planned",
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName || "SpherioChain",
    destinationChainId: "ethereum-1",
    destinationChainName: "Ethereum",
    destinationVm: "evm",
    mailboxAddress: null,
    interchainGasPaymasterAddress: null,
    warpRouteAddress: null,
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
    supportedMessages: [
      "token_bridge",
      "asset_representation",
      "proof_message",
    ],
    purpose:
      "Future Hyperlane route for EVM-facing Spherio asset representation and proof messaging.",
    notes: [
      "Mailbox, gas paymaster, and warp route addresses are not configured yet.",
      "Route must remain planned until Hyperlane deployment proof exists.",
      "Do not expose executable bridge or messaging transactions until this route is live.",
    ],
  },
  {
    id: "spherio-hyperlane-arbitrum",
    status: "planned",
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName || "SpherioChain",
    destinationChainId: "arbitrum-one",
    destinationChainName: "Arbitrum One",
    destinationVm: "evm",
    mailboxAddress: null,
    interchainGasPaymasterAddress: null,
    warpRouteAddress: null,
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
    supportedMessages: [
      "token_bridge",
      "asset_representation",
      "liquidity_message",
    ],
    purpose:
      "Future low-cost Hyperlane route for Spherio liquidity and represented assets.",
    notes: [
      "Route is informational only.",
      "Execution remains disabled until route contracts are configured and verified.",
    ],
  },
  {
    id: "spherio-hyperlane-base",
    status: "planned",
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName || "SpherioChain",
    destinationChainId: "base",
    destinationChainName: "Base",
    destinationVm: "evm",
    mailboxAddress: null,
    interchainGasPaymasterAddress: null,
    warpRouteAddress: null,
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
    supportedMessages: [
      "token_bridge",
      "asset_representation",
      "proof_message",
    ],
    purpose:
      "Future consumer/EVM Hyperlane route for Spherio asset representation and messaging.",
    notes: [
      "Route is planned only.",
      "Bridge and messaging execution must remain disabled until Hyperlane route proof exists.",
    ],
  },
];

export function getSpherioHyperlaneRegistry() {
  return {
    status: "foundation_ready" as const,
    sourceChainId: SPHERIO.chainId,
    sourceChainName: SPHERIO.chainName,
    executionEnabled: false,
    routeType: "hyperlane_bridge_and_messaging",
    routes: SPHERIO_HYPERLANE_ROUTES,
    notes: [
      "Hyperlane registry is informational until mailbox, gas paymaster, and warp route contracts are configured.",
      "RioLight must not broadcast Hyperlane bridge or messaging transactions until a route status is live.",
      "RioEx Bridge may show planned Hyperlane routes as future messaging and bridge paths, not executable routes.",
    ],
  };
}
