export type PrimeHybridRule = {
  id: string;
  left: string;
  right: string;
  label: string;
  feeMultiplier: number;
  requiredTrustControls: string[];
  notes: string;
};

export const PRIME_APPROVED_HYBRIDS: PrimeHybridRule[] = [
  {
    id: "ai-utility",
    left: "ai",
    right: "utility",
    label: "AI + Utility",
    feeMultiplier: 1.15,
    requiredTrustControls: [
      "Utility clarity",
      "Supply discipline",
      "Monitoring enabled",
    ],
    notes: "Good for agent, model, or infra products with direct token utility.",
  },
  {
    id: "dao-treasury",
    left: "dao",
    right: "treasury",
    label: "DAO + Treasury",
    feeMultiplier: 1.15,
    requiredTrustControls: [
      "Treasury disclosure",
      "Vesting required",
      "Governance transparency",
    ],
    notes: "Good for collective treasury coordination and governance-led reserves.",
  },
  {
    id: "nft-creator",
    left: "nft",
    right: "creator",
    label: "NFT + Creator",
    feeMultiplier: 1.10,
    requiredTrustControls: [
      "Creator disclosures",
      "Wallet caps",
      "Monitoring enabled",
    ],
    notes: "Good for creator ecosystems with collection and access layers.",
  },
  {
    id: "defi-governance",
    left: "defi",
    right: "governance",
    label: "DeFi + Governance",
    feeMultiplier: 1.20,
    requiredTrustControls: [
      "Liquidity lock strongly advised",
      "Governance transparency",
      "Whale controls",
    ],
    notes: "Good for exchange, staking, or on-chain finance protocols with governance.",
  },
  {
    id: "asset-backed-governance",
    left: "asset-backed",
    right: "governance",
    label: "Asset-backed + Governance",
    feeMultiplier: 1.25,
    requiredTrustControls: [
      "Transparency heavy",
      "Collateral stance",
      "Governance transparency",
    ],
    notes: "Good for structured, collateral-aware projects requiring governance oversight.",
  },
  {
    id: "revenue-linked-treasury",
    left: "revenue-linked",
    right: "treasury",
    label: "Revenue-linked + Treasury",
    feeMultiplier: 1.20,
    requiredTrustControls: [
      "Disclosure-heavy",
      "Treasury transparency",
      "Monitoring enabled",
    ],
    notes: "Good for revenue-aware products with explicit treasury and reserve coordination.",
  },
];

export function getApprovedHybridByLabel(label: string) {
  return PRIME_APPROVED_HYBRIDS.find((item) => item.label === label);
}
