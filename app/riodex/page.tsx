"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RegistryMarketStrip, {
  RegistryStripMarket,
} from "@/components/exchange/RegistryMarketStrip";
import ExchangeSurfaceNav from "@/components/exchange/ExchangeSurfaceNav";

type BoardResponse = {
  ok: boolean;
  markets?: RegistryStripMarket[];
  error?: string;
};

function cardClass() {
  return "rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5 backdrop-blur-xl";
}

function buttonClass(active = false) {
  return active
    ? "rounded-2xl border border-fuchsia-400/28 bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(157,23,77,0.18))] px-4 py-2 text-sm font-semibold text-white"
    : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/90";
}

function formatMoney(value: number) {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)}`;
}

export default function RioDexHomePage() {
  const [markets, setMarkets] = useState<RegistryStripMarket[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const response = await fetch(
        "/api/rioex/markets?canonicalOnly=true&sort=liquidity",
        { cache: "no-store" }
      );
      const raw = await response.text();
      const json: BoardResponse | null = raw ? JSON.parse(raw) : null;

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to load RioDex execution hub.");
      }

      setMarkets(json?.markets || []);
    } catch (e: any) {
      setMarkets([]);
      setError(e?.message || "Failed to load RioDex execution hub.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const featured = useMemo(() => markets[0] || null, [markets]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(157,23,77,0.12),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <RegistryMarketStrip markets={markets} activeSurface="riodex" />

        <ExchangeSurfaceNav
          product="riodex"
          activeKey="riodex"
          featured={featured}
          title="RioDex Execution Surfaces"
          subtitle="One shared horizontal route layer now sits above RioDex execution. This is the first step toward removing fragmented local navs and making Swap, Pool, Liquidity, Markets, Assets, LaunchPad, and Account feel like one product family."
        />

        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(37,10,24,0.82),rgba(10,9,18,0.94))] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                RioDex • Execution Hub
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Registry-backed Swap, Pool, and Liquidity Handoff
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">
                RioDex now inherits canonical market identity, liquidity valuation,
                fee policy, and treasury routing truth from the authoritative pair registry.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => void load()} className={buttonClass(false)}>
                Refresh RioDex
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            {markets.map((market) => (
              <article
                key={market.pairAddress}
                className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5"
              >
                <div className="text-xl font-semibold text-white">{market.displaySymbol}</div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
                  {market.canonicalSymbol}
                </div>

                <div className="mt-5 grid gap-3">
                  <div className={cardClass()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                      Liquidity
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      {formatMoney(market.liquidityUsd)}
                    </div>
                  </div>

                  <div className={cardClass()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                      Execution Handoff
                    </div>
                    <div className="mt-2 text-sm text-white/70">
                      Registry-backed routing into swap, liquidity, and pool surfaces.
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={market.routes.swap} className={buttonClass(true)}>
                    Swap
                  </Link>
                  <Link href={market.routes.pool} className={buttonClass(false)}>
                    Pool
                  </Link>
                  <Link href={market.routes.liquidity} className={buttonClass(false)}>
                    Liquidity
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
