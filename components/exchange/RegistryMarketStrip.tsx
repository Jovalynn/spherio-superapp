"use client";

import Link from "next/link";

export type RegistryStripMarket = {
  pairAddress: string;
  displaySymbol: string;
  canonicalSymbol: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseLogoUrl: string | null;
  quoteLogoUrl: string | null;
  liquidityUsd: number;
  isCanonical: boolean;
  isLive: boolean;
  routes: {
    assetTerminal: string;
    marketBoard: string;
    hero: string;
    pool: string;
    swap: string;
    liquidity: string;
  };
};

function formatMoney(value: number) {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)}`;
}

function PairMarks({
  leftLogo,
  rightLogo,
  leftFallback,
  rightFallback,
}: {
  leftLogo: string | null;
  rightLogo: string | null;
  leftFallback: string;
  rightFallback: string;
}) {
  return (
    <div className="flex -space-x-2">
      {leftLogo ? (
        <img
          src={leftLogo}
          alt={leftFallback}
          className="h-9 w-9 rounded-full border border-white/10 bg-black/20 object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white">
          {leftFallback.slice(0, 1)}
        </div>
      )}

      {rightLogo ? (
        <img
          src={rightLogo}
          alt={rightFallback}
          className="h-9 w-9 rounded-full border border-white/10 bg-black/20 object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white">
          {rightFallback.slice(0, 1)}
        </div>
      )}
    </div>
  );
}

export default function RegistryMarketStrip({
  markets,
  activeSurface = "rioex",
}: {
  markets: RegistryStripMarket[];
  activeSurface?: "rioex" | "riodex" | "rioexplorer";
}) {
  const cards = [
    {
      key: "riodex",
      title: "RioDex",
      subtitle: "Execution, swap, liquidity, pools",
      href: "/riodex",
    },
    {
      key: "rioex",
      title: "RioEx",
      subtitle: "Discovery, markets, exchange intelligence",
      href: "/rioex",
    },
    {
      key: "rioexplorer",
      title: "RioExplorer",
      subtitle: "On-chain visibility, contracts, telemetry",
      href: "/rioexplorer",
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-3 lg:grid-cols-3">
        {cards.map((card) => {
          const active = card.key === activeSurface;
          return (
            <Link
              key={card.key}
              href={card.href}
              className={`rounded-[18px] border px-4 py-4 transition ${
                active
                  ? "border-cyan-400/28 bg-[linear-gradient(180deg,rgba(217,70,239,0.12),rgba(34,211,238,0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="text-sm font-semibold text-white">{card.title}</div>
              <div className="mt-1 text-[11px] text-white/50">{card.subtitle}</div>
            </Link>
          );
        })}
      </div>

      {markets.length ? (
        <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4">
          <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
            Canonical Market Strip
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {markets.slice(0, 3).map((market) => (
              <Link
                key={market.pairAddress}
                href={market.routes.assetTerminal}
                className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PairMarks
                      leftLogo={market.baseLogoUrl}
                      rightLogo={market.quoteLogoUrl}
                      leftFallback={market.baseSymbol}
                      rightFallback={market.quoteSymbol}
                    />
                    <div>
                      <div className="text-base font-semibold text-white">
                        {market.displaySymbol}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
                        {market.canonicalSymbol}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-right">
                    {market.isCanonical ? (
                      <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fuchsia-200">
                        Canonical
                      </span>
                    ) : null}
                    {market.isLive ? (
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                        Live
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 text-sm font-semibold text-white">
                  {formatMoney(market.liquidityUsd)}
                </div>
                <div className="mt-1 text-[11px] text-white/50">
                  Registry-backed liquidity
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
