import RioExLockedSurface from "../_components/RioExLockedSurface";

export default function RioExEarnPage() {
  return (
    <RioExLockedSurface
      eyebrow="RioEx Earn"
      title="Earn, Farming, and Staking"
      status="locked"
      description="RioEx Earn will expose farming, staking, and liquidity reward surfaces only after contracts, reward accounting, LP position tracking, and RioExplorer proof are production-ready."
      requirements={[
        "Reward contracts or approved distribution policy",
        "LP position indexing",
        "User reward accounting",
        "Lock, vest, burn, and claim proof",
        "RioLight review and RioExplorer receipt integration",
      ]}
      nextStep="Keep Earn locked while Pool, Liquidity, LP position indexing, and reward accounting mature. The page is reserved for production-grade farming and staking surfaces."
    />
  );
}
