import RioExLockedSurface from "../_components/RioExLockedSurface";

export default function RioExP2PPage() {
  return (
    <RioExLockedSurface
      eyebrow="RioEx P2P"
      title="P2P Market"
      status="locked"
      description="RioEx P2P will support peer-to-peer exchange only after policy, compliance controls, dispute handling, escrow rules, and market-risk protections are ready."
      requirements={[
        "Escrow or protected settlement design",
        "Dispute and fraud response process",
        "Jurisdiction-aware policy controls",
        "RioExplorer proof and activity indexing",
        "RioLight confirmation and receipt flow",
      ]}
      nextStep="Keep P2P locked until Spherio has clear policy, compliance, escrow, and dispute infrastructure. This avoids exposing an unfinished high-risk market surface."
    />
  );
}
