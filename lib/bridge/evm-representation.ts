import { SPHERIO } from "@/lib/spherioConfig";

export type SpherioEvmRepresentationStatus =
  | "planned"
  | "configured"
  | "testing"
  | "live"
  | "disabled";

export type SpherioEvmRepresentationRoute = {
  id: string;
  status: SpherioEvmRepresentationStatus;

  canonicalChainId: string;
  canonicalStandard: "SPO-20";
  canonicalAssetId: string;
  canonicalSymbol: string;
  canonicalDecimals: number;

  destinationChainId: string;
  destinationChainName: string;
  destinationVm: "evm";
  destinationStandard: "ERC-20";
  representedContractAddress: string | null;

  bridgeProvider: "axelar" | "hyperlane" | "ibc" | "custom" | "unassigned";
  bridgeRouteId: string | null;

  supplyPolicy: {
    canonicalSupplyIsAuthoritative: true;
    evmSupplyIsRepresented: true;
    allowedMechanism: "lock_mint" | "burn_mint" | "lock_release" | "unassigned";
    requiresProof: true;
    requiresRioExplorerAttestation: true;
  };

  supportedBuilderMode: Array<"spherio_first" | "evm_facing_sdk">;

  notes: string[];
};

export const SPHERIO_EVM_REPRESENTATION_ROUTES: SpherioEvmRepresentationRoute[] = [
  {
    id: "spo20-rio-ethereum-erc20",
    status: "planned",
    canonicalChainId: SPHERIO.chainId,
    canonicalStandard: "SPO-20",
    canonicalAssetId: "urio",
    canonicalSymbol: "RIO",
    canonicalDecimals: 6,
    destinationChainId: "ethereum-1",
    destinationChainName: "Ethereum",
    destinationVm: "evm",
    destinationStandard: "ERC-20",
    representedContractAddress: null,
    bridgeProvider: "unassigned",
    bridgeRouteId: null,
    supplyPolicy: {
      canonicalSupplyIsAuthoritative: true,
      evmSupplyIsRepresented: true,
      allowedMechanism: "unassigned",
      requiresProof: true,
      requiresRioExplorerAttestation: true,
    },
    supportedBuilderMode: ["spherio_first", "evm_facing_sdk"],
    notes: [
      "RIO remains canonical on SpherioChain.",
      "Ethereum ERC-20 representation is planned only.",
      "No represented ERC-20 contract is deployed/configured yet.",
    ],
  },
  {
    id: "spo20-rio-base-erc20",
    status: "planned",
    canonicalChainId: SPHERIO.chainId,
    canonicalStandard: "SPO-20",
    canonicalAssetId: "urio",
    canonicalSymbol: "RIO",
    canonicalDecimals: 6,
    destinationChainId: "base",
    destinationChainName: "Base",
    destinationVm: "evm",
    destinationStandard: "ERC-20",
    representedContractAddress: null,
    bridgeProvider: "unassigned",
    bridgeRouteId: null,
    supplyPolicy: {
      canonicalSupplyIsAuthoritative: true,
      evmSupplyIsRepresented: true,
      allowedMechanism: "unassigned",
      requiresProof: true,
      requiresRioExplorerAttestation: true,
    },
    supportedBuilderMode: ["spherio_first", "evm_facing_sdk"],
    notes: [
      "Base representation is planned for consumer/EVM app distribution.",
      "Representation execution remains disabled until bridge route and contract are configured.",
    ],
  },
  {
    id: "spo20-rusd-ethereum-erc20",
    status: "planned",
    canonicalChainId: SPHERIO.chainId,
    canonicalStandard: "SPO-20",
    canonicalAssetId: "rusd",
    canonicalSymbol: "RUSD",
    canonicalDecimals: 6,
    destinationChainId: "ethereum-1",
    destinationChainName: "Ethereum",
    destinationVm: "evm",
    destinationStandard: "ERC-20",
    representedContractAddress: null,
    bridgeProvider: "unassigned",
    bridgeRouteId: null,
    supplyPolicy: {
      canonicalSupplyIsAuthoritative: true,
      evmSupplyIsRepresented: true,
      allowedMechanism: "unassigned",
      requiresProof: true,
      requiresRioExplorerAttestation: true,
    },
    supportedBuilderMode: ["spherio_first", "evm_facing_sdk"],
    notes: [
      "RUSD representation requires finalized collateral/reserve and bridge policy.",
      "Do not enable until RUSD reserve attestation and representation rules are finalized.",
    ],
  },
];

export function getSpherioEvmRepresentationRegistry() {
  return {
    status: "foundation_ready" as const,
    executionEnabled: false,
    routeType: "spo20_evm_representation",
    canonicalChainId: SPHERIO.chainId,
    canonicalStandard: "SPO-20",
    representedStandard: "ERC-20",
    routes: SPHERIO_EVM_REPRESENTATION_ROUTES,
    notes: [
      "SPO-20 remains the canonical asset standard on SpherioChain.",
      "ERC-20 assets on EVM chains are represented assets, not independent canonical supply.",
      "Execution must remain disabled until bridge provider, destination contract, and proof policy are finalized.",
    ],
  };
}
