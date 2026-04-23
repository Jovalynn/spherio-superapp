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

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
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
    <div className="flex -space-x-3">
      {leftLogo ? (
        <img
          src={leftLogo}
          alt={leftFallback}
          className="h-14 w-14 rounded-full border border-white/10 bg-black/20 object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white">
          {leftFallback.slice(0, 1)}
        </div>
      )}

      {rightLogo ? (
        <img
          src={rightLogo}
          alt={rightFallback}
          className="h-14 w-14 rounded-full border border-white/10 bg-black/20 object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white">
          {rightFallback.slice(0, 1)}
        </div>
      )}
    </div>
  );
}

export default function RioExHomePage() {
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
        throw new Error(json?.error || "Failed to load RioEx surfaces.");
      }

      setMarkets(json?.markets || []);
    } catch (e: any) {
      setMarkets([]);
      setError(e?.message || "Failed to load RioEx surfaces.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const featured = useMemo(() => markets[0] || null, [markets]);
  const integrityUpdatedAt =
    featured && "liquidityUpdatedAt" in featured
      ? ((featured as any).liquidityUpdatedAt || (featured as any).lastSwapTime || null)
      : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(157,23,77,0.12),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <RegistryMarketStrip markets={markets} activeSurface="rioex" />

        <ExchangeSurfaceNav
          product="rioex"
          activeKey="rioex"
          featured={featured}
          title="RioEx Discovery Surfaces"
          subtitle="One shared horizontal route layer now sits above RioEx discovery. This is now part of the same family rhythm as RioDex core surfaces while RioEx keeps its own market-intelligence identity."
        />

        {featured ? (
          <div className="rounded-[22px] border border-cyan-400/16 bg-cyan-500/6 px-5 py-4 text-sm text-white/85">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Integrity Truth
              </span>
              {featured.isCanonical ? (
                <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200">
                  Canonical
                </span>
              ) : null}
              {featured.isLive ? (
                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Live
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid gap-2 text-sm text-white/75 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                Registry TVL:{" "}
                <span className="font-semibold text-white">
                  {formatMoney(featured.liquidityUsd)}
                </span>
              </div>
              <div>
                Liquidity Source:{" "}
                <span className="font-semibold text-white">
                  {"liquiditySource" in featured ? ((featured as any).liquiditySource || "unresolved") : "unresolved"}
                </span>
              </div>
              <div>
                Fee Policy:{" "}
                <span className="font-semibold text-white">
                  {"feePolicy" in featured ? ((featured as any).feePolicy || "—") : "—"}
                </span>
              </div>
              <div>
                Treasury Recipient:{" "}
                <span className="font-semibold text-white">
                  {"feeRecipientAddress" in featured && (featured as any).feeRecipientAddress
                    ? String((featured as any).feeRecipientAddress)
                        .slice(0, 12) + "…" + String((featured as any).feeRecipientAddress).slice(-10)
                    : "—"}
                </span>
              </div>
            </div>

            <div className="mt-2 text-xs text-white/50">
              Last registry update: {formatDateTime(integrityUpdatedAt)}
            </div>
          </div>
        ) : null}

        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(37,10,24,0.82),rgba(10,9,18,0.94))] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                RioEx • Discovery Layer
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Registry-backed Exchange Intelligence
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">
                RioEx now resolves market discovery, featured market identity,
                routing, liquidity valuation, fee policy, and treasury routing
                from the same authoritative registry layer that powers the
                broader exchange surfaces.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/rioex/markets" className={buttonClass(true)}>
                Open Markets Board
              </Link>
              <button type="button" onClick={() => void load()} className={buttonClass(false)}>
                Refresh RioEx
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
              {error}
            </div>
          ) : null}

          {featured ? (
            <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <PairMarks
                      leftLogo={featured.baseLogoUrl}
                      rightLogo={featured.quoteLogoUrl}
                      leftFallback={featured.baseSymbol}
                      rightFallback={featured.quoteSymbol}
                    />
                    <div>
                      <div className="text-3xl font-semibold tracking-tight text-white">
                        {featured.displaySymbol}
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                        {featured.canonicalSymbol}
                      </div>
                      <div className="mt-2 text-sm text-white/60">
                        Featured registry market
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-right">
                    {featured.isCanonical ? (
                      <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200">
                        Canonical
                      </span>
                    ) : null}
                    {featured.isLive ? (
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                        Live
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className={cardClass()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                      Liquidity
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      {formatMoney(featured.liquidityUsd)}
                    </div>
                  </div>

                  <div className={cardClass()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                      Fee
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      {"feeBps" in featured && typeof (featured as any).feeBps === "number" ? `${(featured as any).feeBps} bps` : "—"}
                    </div>
                  </div>

                  <div className={cardClass()}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                      Last Activity
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {formatDateTime((featured as any).lastSwapTime)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={featured.routes.assetTerminal} className={buttonClass(true)}>
                    Open Trade Terminal
                  </Link>
                  <Link href={featured.routes.swap} className={buttonClass(false)}>
                    Open Swap
                  </Link>
                  <Link href={featured.routes.pool} className={buttonClass(false)}>
                    Open Pool
                  </Link>
                </div>
              </div>

              <div className="space-y-5">
                <div className={cardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    What RioEx now resolves
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-white/70">
                    <div>Market identity from canonical pair registry</div>
                    <div>Liquidity valuation from authoritative backend truth</div>
                    <div>Fee routing metadata from treasury-multisig policy</div>
                    <div>Execution routing into terminal, swap, and pool surfaces</div>
                  </div>
                </div>

                <div className={cardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Next RioEx expansion
                  </div>
                  <div className="mt-4 text-sm leading-7 text-white/70">
                    Finish the remaining RioEx discovery and market-intelligence
                    surfaces on top of the same registry layer, complete the
                    Trade restoration, then apply the later Binance / Bitget
                    mirroring cues after the app-page redesign.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/70">
              No featured RioEx market is available yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
