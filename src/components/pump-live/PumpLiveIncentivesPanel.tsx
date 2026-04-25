import type { PumpLiveMarket } from '../../lib/pump-live/types';

export function PumpLiveIncentivesPanel({ market }: { market: PumpLiveMarket }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-300/80">Aligned Incentives</p>
      <h3 className="mt-1 text-xl font-semibold text-white">Creator Upside + Voluntary User Locks</h3>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h4 className="text-sm font-semibold text-white">Creator reward policy</h4>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li>Base: {market.creatorReward.baseRewardPct}% of graduation surplus after successful graduation.</li>
            <li>Milestone: +{market.creatorReward.milestone250kPct}% at 250K RUSD market cap.</li>
            <li>Milestone: +{market.creatorReward.milestone500kPct}% at 500K RUSD market cap.</li>
            <li>Cap: {market.creatorReward.maxRewardPct}% of surplus. Never taken from required liquidity.</li>
            <li>Vesting: {market.creatorReward.vestingLabel}.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h4 className="text-sm font-semibold text-white">User lock rewards</h4>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Locking is optional. Non-locking users can still trade normally. Locks earn points, badges, future eligibility, or fee rebates without turning the product into forced staking.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {market.userLocks.map((lock) => (
              <div key={lock.seconds} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-semibold text-white">{lock.label}</p>
                <p className="text-xs text-zinc-400">{lock.multiplier} points</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
