export type ActivationStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "ready"
  | "complete";

export type ActivationItem = {
  id: string;
  label: string;
  status: ActivationStatus;
  required: boolean;
  proofRequired: boolean;
  notes: string;
};

export type ActivationStack = {
  id: "ibc" | "axelar" | "hyperlane" | "evm_representation";
  label: string;
  executionEnabled: boolean;
  currentStatus: "planned" | "configured" | "testing" | "live";
  completionEstimatePct: number;
  items: ActivationItem[];
};

const commonProofItems: ActivationItem[] = [
  {
    id: "rioexplorer_proof",
    label: "RioExplorer proof route",
    status: "in_progress",
    required: true,
    proofRequired: true,
    notes: "Every bridge or representation event must be searchable and provable in RioExplorer.",
  },
  {
    id: "riolight_handover",
    label: "RioLight review and approval handover",
    status: "complete",
    required: true,
    proofRequired: true,
    notes: "Bridge execution must use the same single-review RioLight handover model.",
  },
  {
    id: "treasury_fee_policy",
    label: "Treasury and fee routing policy",
    status: "in_progress",
    required: true,
    proofRequired: true,
    notes: "Spherio-side protocol fees must route to the canonical treasury policy before live execution.",
  },
];

export function getBridgeActivationChecklist() {
  const stacks: ActivationStack[] = [
    {
      id: "ibc",
      label: "IBC",
      executionEnabled: false,
      currentStatus: "planned",
      completionEstimatePct: 25,
      items: [
        {
          id: "ibc_module_enabled",
          label: "IBC module enabled on SpherioChain",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "Spherio node and chain config must expose IBC transfer capability.",
        },
        {
          id: "relayer_running",
          label: "Relayer running",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "A relayer must be configured for each live route.",
        },
        {
          id: "channel_ids_verified",
          label: "Channel IDs verified",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "sourceChannel and counterpartyChannel must be known and verified.",
        },
        {
          id: "test_transfer_success",
          label: "Successful IBC test transfer",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "A test transfer must settle on the destination chain and be visible through proof tooling.",
        },
        ...commonProofItems,
      ],
    },
    {
      id: "axelar",
      label: "Axelar",
      executionEnabled: false,
      currentStatus: "planned",
      completionEstimatePct: 20,
      items: [
        {
          id: "gateway_configured",
          label: "Gateway configured",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "Axelar gateway and gas service addresses must be configured per destination chain.",
        },
        {
          id: "representation_policy",
          label: "Representation policy finalized",
          status: "in_progress",
          required: true,
          proofRequired: true,
          notes: "SPO-20 canonical asset and EVM represented asset rules must be finalized and enforced.",
        },
        {
          id: "test_bridge_success",
          label: "Successful Axelar bridge test",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "Bridge out and return path must be tested before executable status.",
        },
        ...commonProofItems,
      ],
    },
    {
      id: "hyperlane",
      label: "Hyperlane",
      executionEnabled: false,
      currentStatus: "planned",
      completionEstimatePct: 20,
      items: [
        {
          id: "mailbox_configured",
          label: "Mailbox configured",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "Hyperlane mailbox must be configured for each route.",
        },
        {
          id: "gas_paymaster_configured",
          label: "Interchain gas paymaster configured",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "Interchain gas must be configured before cross-chain message execution.",
        },
        {
          id: "warp_route_configured",
          label: "Warp route configured",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "Warp route or equivalent message route must exist before live bridge/messaging.",
        },
        {
          id: "test_message_success",
          label: "Successful Hyperlane message test",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "A cross-chain message or token route must be proven end-to-end.",
        },
        ...commonProofItems,
      ],
    },
    {
      id: "evm_representation",
      label: "SPO-20 ↔ ERC-20 Representation",
      executionEnabled: false,
      currentStatus: "planned",
      completionEstimatePct: 35,
      items: [
        {
          id: "canonical_model_finalized",
          label: "Canonical model finalized",
          status: "complete",
          required: true,
          proofRequired: true,
          notes: "SPO-20 on SpherioChain is canonical; ERC-20 on EVM is represented.",
        },
        {
          id: "erc20_contracts_deployed",
          label: "Represented ERC-20 contracts deployed",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "Destination ERC-20 contracts must be deployed and mapped to canonical SPO-20 assets.",
        },
        {
          id: "supply_mechanism_selected",
          label: "Supply mechanism selected",
          status: "in_progress",
          required: true,
          proofRequired: true,
          notes: "Choose lock/mint, burn/mint, or lock/release for each route.",
        },
        {
          id: "represented_supply_indexed",
          label: "Represented supply indexed",
          status: "not_started",
          required: true,
          proofRequired: true,
          notes: "RioExplorer must show canonical, locked, and represented supply.",
        },
        ...commonProofItems,
      ],
    },
  ];

  return {
    status: "foundation_ready" as const,
    executionEnabled: false,
    activationRule:
      "A stack can only become executionEnabled=true after every required proof item is complete and at least one real end-to-end transaction is verified.",
    stacks,
  };
}
