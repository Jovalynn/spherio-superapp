"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ApiPayload = {
  ok?: boolean;
  item?: Record<string, any> | null;
  pair?: Record<string, any> | null;
  error?: string;
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function shortValue(value?: string | null, left = 14, right = 10) {
  if (!value) return "—";
  if (value.length <= left + right) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
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

export default function RioExMarketTerminalPage() {
  const params = useParams();
  const pairAddress = typeof params?.pairAddress === "string" ? params.pairAddress : "";

  const [market, setMarket] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!pairAddress) {
        setError("Missing pair address.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/rioex/markets/${encodeURIComponent(pairAddress)}`, {
          cache: "no-store",
        });

        const text = await response.text();
        let json: ApiPayload | null = null;

        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          throw new Error(`Market API returned non-JSON (${response.status})`);
        }

        const raw = json?.item || json?.pair || null;

        if (!response.ok || !json?.ok || !raw) {
          throw new Error(json?.error || `Market API failed (${response.status})`);
        }

        if (!cancelled) {
          setMarket(raw);
        }
      } catch (e: any) {
        if (!cancelled) {
          setMarket(null);
          setError(e?.message || "Failed to load market terminal.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [pairAddress]);

  const assetTerminal = asString(market?.routes?.assetTerminal, `/rioex/markets/${encodeURIComponent(pairAddress)}`);
  const tradeRoute = asString(
    market?.routes?.trade,
    assetTerminal.endsWith("/trades") ? assetTerminal : `${assetTerminal}/trades`
  );
  const swapRoute = asString(market?.routes?.swap, `/riodex/swap?pair=${encodeURIComponent(pairAddress)}`);
  const poolRoute = asString(market?.routes?.pool, `/riodex/pool/${encodeURIComponent(pairAddress)}`);
  const liquidityRoute = asString(
    market?.routes?.liquidity,
    `/riodex/liquidity?pool=${encodeURIComponent(pairAddress)}`
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[28px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(5,14,38,0.92),rgba(4,10,28,0.96))] p-6">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-300/72">
            RioEx • Market Terminal
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Market
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-white/70">
            Minimal safe market terminal on the authoritative RioEx pair route.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/rioex/markets"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/95"
            >
              Back to Market Board
            </Link>
            <Link
              href={tradeRoute}
              className="rounded-2xl border border-fuchsia-400/28 bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(157,23,77,0.18))] px-4 py-2 text-sm font-semibold text-white"
            >
              Trade Terminal
            </Link>
            <Link
              href={swapRoute}
              className="rounded-2xl border border-cyan-400/24 bg-[linear-gradient(180deg,rgba(34,211,238,0.16),rgba(15,118,110,0.10))] px-4 py-2 text-sm font-medium text-white"
            >
              Swap
            </Link>
            <Link
              href={poolRoute}
              className="rounded-2xl border border-cyan-400/24 bg-[linear-gradient(180deg,rgba(34,211,238,0.16),rgba(15,118,110,0.10))] px-4 py-2 text-sm font-medium text-white"
            >
              Pool
            </Link>
            <Link
              href={liquidityRoute}
              className="rounded-2xl border border-cyan-400/24 bg-[linear-gradient(180deg,rgba(34,211,238,0.16),rgba(15,118,110,0.10))] px-4 py-2 text-sm font-medium text-white"
            >
              Liquidity
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
            Loading market terminal…
          </div>
        ) : error ? (
          <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-6 text-sm text-amber-200">
            {error}
          </div>
        ) : market ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Pair Identity
              </div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {asString(market.displaySymbol || market.label, "—")}
              </div>
              <div className="mt-2 font-mono text-sm text-white/55">
                {shortValue(asString(market.pairAddress, pairAddress), 18, 12)}
              </div>
              <div className="mt-4 text-sm text-white/70">
                {asString(market.baseDisplayName || market.baseSymbol || market.baseAssetId, "—")} / {asString(market.quoteDisplayName || market.quoteSymbol || market.quoteAssetId, "—")}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Market Truth
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-white/50">Liquidity</div>
                  <div className="mt-1 text-xl font-semibold text-white">
                    {formatMoney(asNumber(market.liquidityUsd))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Fee Tier</div>
                  <div className="mt-1 text-xl font-semibold text-white">
                    {asNumber(market.feeBps)} bps
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Fee Policy</div>
                  <div className="mt-1 text-sm text-white">
                    {asString(market.feePolicy, "—")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Liquidity Source</div>
                  <div className="mt-1 text-sm text-white">
                    {asString(market.liquiditySource, "—")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Last Swap</div>
                  <div className="mt-1 text-sm text-white">
                    {formatDateTime(asString(market.lastSwapTime))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Treasury Recipient</div>
                  <div className="mt-1 font-mono text-sm text-white">
                    {shortValue(asString(market.feeRecipientAddress), 14, 10)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
            No market payload was available.
          </div>
        )}
      </div>
    </main>
  );
}
