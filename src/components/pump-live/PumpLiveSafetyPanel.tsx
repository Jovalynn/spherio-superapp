import type { PumpLiveMarket } from '../../lib/pump-live/types';

export function PumpLiveSafetyPanel({ market }: { market: PumpLiveMarket }) {
  const controls = [
    { label: 'Anti-sniper launch window', enabled: market.safety.antiSniper, detail: `${market.safety.launchProtectionBlocks} blocks` },
    { label: 'Bulk-buy rolling guard', enabled: market.safety.bulkBuyProtection, detail: `Launch wallet max ${market.safety.maxWalletLaunchTokens}` },
    { label: 'MEV / same-block protection', enabled: market.safety.mevProtection, detail: 'Slippage + same-block controls' },
    { label: 'Anti-rug liquidity lock', enabled: market.safety.antiRug && market.safety.lpLockRequired, detail: 'LP lock required' },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">Market Integrity</p>
      <h3 className="mt-1 text-xl font-semibold text-white">Safety Controls</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-300">
        Pump.live runs fail-closed protections: liquidity first, LP lock before graduation completion, no hidden minting, no owner withdrawal of required liquidity, and launch controls against snipers and bulk buyers.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {controls.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <span className={item.enabled ? 'text-xs text-emerald-300' : 'text-xs text-red-300'}>{item.enabled ? 'ON' : 'OFF'}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-orange-400/20 bg-orange-400/10 p-4 text-sm text-orange-100">
        Required liquidity cannot be withdrawn by the owner. Creator rewards are calculated only after RioDex liquidity is seeded and LP is locked.
      </div>
    </section>
  );
}
