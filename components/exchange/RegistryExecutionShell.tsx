"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import RegistryMarketStrip, {
  RegistryStripMarket,
} from "@/components/exchange/RegistryMarketStrip";

export type ExecutionPairContext = {
  pairAddress: string;
  displaySymbol: string;
  canonicalSymbol: string;
  baseAssetId: string;
  quoteAssetId: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseDisplayName: string;
  quoteDisplayName: string;
  baseLogoUrl: string | null;
  quoteLogoUrl: string | null;
  feeBps: number;
  isCanonical: boolean;
  isLive: boolean;
  liquidityUsd: number;
  liquidityHeight: string | number | null;
  liquidityTime: string | null;
  liquiditySource: string | null;
  liquidityUpdatedAt: string | null;
  lastSwapTime: string | null;
  lastSwapTxHash: string | null;
  feeRecipientAddress: string | null;
  feePolicy: string | null;
  quoteConvention: "asset_1_per_asset_0";
  routes: {
    assetTerminal: string;
    marketBoard: string;
    hero: string;
    pool: string;
    swap: string;
    liquidity: string;
  };
  source: string;
};

function shellCardClass() {
  return "rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5 backdrop-blur-xl";
}

function buttonClass(
  active = false,
  tone: "primary" | "secondary" | "neutral" = "neutral"
) {
  if (active || tone === "primary") {
    return "rounded-2xl border border-fuchsia-400/28 bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(157,23,77,0.18))] px-4 py-2 text-sm font-semibold text-white";
  }

  if (tone === "secondary") {
    return "rounded-2xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.14),rgba(8,145,178,0.10))] px-4 py-2 text-sm font-semibold text-white";
  }

  return "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/90";
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

function shortHash(value?: string | null, left = 14, right = 10) {
  if (!value) return "—";
  if (value.length <= left + right) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
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

export default function RegistryExecutionShell({
  surface,
  title,
  subtitle,
  pair,
  markets,
  loading = false,
  error = null,
  children,
}: {
  surface: "swap" | "pool" | "liquidity";
  title: string;
  subtitle: string;
  pair: ExecutionPairContext | null;
  markets: RegistryStripMarket[];
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  const activeLabel =
    surface === "swap" ? "Swap" : surface === "pool" ? "Pool" : "Liquidity";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(157,23,77,0.12),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <RegistryMarketStrip markets={markets} activeSurface="riodex" />

        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(37,10,24,0.82),rgba(10,9,18,0.94))] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                RioDex • Execution Shell
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">
                {subtitle}
              </p>
            </div>

            {pair ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={pair.routes.swap}
                  className={buttonClass(surface === "swap")}
                >
                  Swap
                </Link>
                <Link
                  href={pair.routes.pool}
                  className={buttonClass(surface === "pool")}
                >
                  Pool
                </Link>
                <Link
                  href={pair.routes.liquidity}
                  className={buttonClass(surface === "liquidity")}
                >
                  Liquidity
                </Link>
                <Link
                  href={pair.routes.assetTerminal}
                  className={buttonClass(false, "secondary")}
                >
                  Open Terminal
                </Link>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
              {error}
            </div>
          ) : null}

          {loading || !pair ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/70">
              Loading registry-backed {activeLabel.toLowerCase()} surface…
            </div>
          ) : (
            <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5">
                <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <PairMarks
                        leftLogo={pair.baseLogoUrl}
                        rightLogo={pair.quoteLogoUrl}
                        leftFallback={pair.baseSymbol}
                        rightFallback={pair.quoteSymbol}
                      />
                      <div>
                        <div className="text-3xl font-semibold tracking-tight text-white">
                          {pair.displaySymbol}
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                          {pair.canonicalSymbol}
                        </div>
                        <div className="mt-2 text-sm text-white/60">
                          Registry-backed {activeLabel.toLowerCase()} execution context
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-right">
                      {pair.isCanonical ? (
                        <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200">
                          Canonical
                        </span>
                      ) : null}
                      {pair.isLive ? (
                        <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                          Live
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-4">
                    <div className={shellCardClass()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                        Liquidity
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {formatMoney(pair.liquidityUsd)}
                      </div>
                      <div className="mt-2 text-[11px] text-white/50">
                        {pair.liquiditySource || "unresolved"}
                      </div>
                    </div>

                    <div className={shellCardClass()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                        Fee
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {pair.feeBps} bps
                      </div>
                      <div className="mt-2 text-[11px] text-white/50">
                        {pair.feePolicy || "—"}
                      </div>
                    </div>

                    <div className={shellCardClass()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                        Last Swap
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {formatDateTime(pair.lastSwapTime)}
                      </div>
                    </div>

                    <div className={shellCardClass()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                        Liquidity Refresh
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {formatDateTime(pair.liquidityUpdatedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
                  {children}
                </div>
              </div>

              <div className="space-y-5">
                <div className={shellCardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Pair Truth
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-white/65">
                    <div>Base Asset ID: {pair.baseAssetId}</div>
                    <div>Quote Asset ID: {pair.quoteAssetId}</div>
                    <div>Liquidity Source: {pair.liquiditySource || "unresolved"}</div>
                    <div>Liquidity Height: {String(pair.liquidityHeight ?? "—")}</div>
                    <div>Last Swap Tx: {shortHash(pair.lastSwapTxHash, 12, 8)}</div>
                    <div>Source: {pair.source}</div>
                  </div>
                </div>

                <div className={shellCardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Treasury Routing
                  </div>
                  <div className="mt-4 text-sm font-semibold text-white">
                    {pair.feePolicy || "—"}
                  </div>
                  <div className="mt-2 font-mono text-xs text-white/55">
                    {shortHash(pair.feeRecipientAddress, 16, 10)}
                  </div>
                </div>

                <div className={shellCardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Route Map
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-white/70">
                    <Link href={pair.routes.assetTerminal}>Terminal</Link>
                    <Link href={pair.routes.swap}>Swap</Link>
                    <Link href={pair.routes.pool}>Pool</Link>
                    <Link href={pair.routes.liquidity}>Liquidity</Link>
                    <Link href={pair.routes.marketBoard}>Markets Board</Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
