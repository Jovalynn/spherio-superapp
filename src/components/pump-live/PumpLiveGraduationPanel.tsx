import type { PumpLiveMarket } from '../../lib/pump-live/types';

export function PumpLiveGraduationPanel({ market }: { market: PumpLiveMarket }) {
  const progress = Math.max(0, Math.min(100, market.graduationProgressPct));

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-orange-300/80">Graduation Engine</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Bonding → RioDex Liquidity</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">
            The first {market.requiredGraduationRUSD.toLocaleString()} RUSD-equivalent worth of RIO is reserved for RioDex liquidity. Creator rewards are paid only from surplus after liquidity is seeded and LP is locked.
          </p>
        </div>
        <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs font-medium text-orange-200">
          {market.status.toUpperCase()}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs text-zinc-400">
          <span>Graduation reserve</span>
          <span>{progress.toFixed(2)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-300 to-fuchsia-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="Reserve value" value={`${market.reserveValueRUSD.toLocaleString()} RUSD`} />
        <Metric label="Required seed" value={`${market.requiredGraduationRUSD.toLocaleString()} RUSD`} />
        <Metric label="Post-graduation route" value={market.riodexPairAddress ? 'RioDex active' : 'RioDex pending'} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
