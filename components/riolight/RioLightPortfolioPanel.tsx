"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { connectRioLight } from "@/lib/riolight";
import { RioLightPortfolioValuePanel } from "@/components/riolight/RioLightPortfolioValuePanel";

type RioLightPortfolioTab = "overview" | "spo20" | "pump" | "prime";

type RioLightPumpPosition = {
  kind: "pump";
  tokenAddress: string;
  tokenName: string;
  symbol: string;
  status: string;
  netTokenAmount: number;
  netRioSpent: number;
  feesRio: number;
  tradeCount: number;
  lastTradeAt: string | null;
  curve: {
    marketCapRio: number;
    progressPercent: number;
  };
  routes: {
    pump: string;
    explorer: string;
  };
};

type RioLightSpo20Balance = {
  kind: "spo20";
  tokenAddress: string;
  symbol: string;
  name: string;
  balanceBase: string;
  balance: number;
  display: string;
  decimals: number;
  creator: string | null;
  updatedHeight: number;
  updatedAt: string | null;
  source: string;
  routes: {
    explorer: string;
    pump?: string;
  };
};

type RioLightPortfolioResponse = {
  ok: boolean;
  error?: string;
  address?: string;
  native?: {
    rio?: {
      display: string;
      source: string;
      error?: string;
    };
  };
  totals?: {
    positionCount: number;
    spo20BalanceCount?: number;
    tradeCount: number;
    netRioSpent: number;
  };
  positions?: RioLightPumpPosition[];
  sections?: {
    pump?: RioLightPumpPosition[];
    prime?: unknown[];
    spo20?: RioLightSpo20Balance[];
    ibc?: unknown[];
    bridged?: unknown[];
    offchain?: unknown[];
  };
};

function shortAddress(address?: string | null) {
  if (!address) return "Not connected";
  return `${address.slice(0, 10)}…${address.slice(-6)}`;
}

function compactNumber(value: unknown, decimals = 4) {
  const num = typeof value === "number" ? value : Number(value || 0);
  if (!Number.isFinite(num)) return "0";
  if (Math.abs(num) >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function shellClass() {
  return "rounded-[28px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,rgba(8,17,31,0.96),rgba(5,7,13,0.96))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)]";
}

function statCardClass() {
  return "rounded-2xl border border-white/10 bg-white/[0.035] p-3";
}

function tabClass(active: boolean) {
  return active
    ? "rounded-2xl border border-cyan-300/30 bg-cyan-400/14 px-4 py-2 text-xs font-semibold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
    : "rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white/85";
}

function pillClass(tone: "cyan" | "gold" | "violet" | "green" | "neutral" = "neutral") {
  const tones = {
    cyan: "border-cyan-300/25 bg-cyan-400/10 text-cyan-200",
    gold: "border-amber-300/25 bg-amber-400/10 text-amber-200",
    violet: "border-violet-300/25 bg-violet-400/10 text-violet-200",
    green: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
    neutral: "border-white/10 bg-white/[0.04] text-white/60",
  };

  return `rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tones[tone]}`;
}

export function RioLightPortfolioPanel() {
  const [activeTab, setActiveTab] = useState<RioLightPortfolioTab>("overview");
  const [address, setAddress] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<RioLightPortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pumpPositions = useMemo(
    () => portfolio?.sections?.pump || portfolio?.positions || [],
    [portfolio],
  );

  const spo20Balances = useMemo(
    () => portfolio?.sections?.spo20 || [],
    [portfolio],
  );

  const previewSpo20Balances = useMemo(
    () => spo20Balances.slice(0, activeTab === "overview" ? 4 : 12),
    [spo20Balances, activeTab],
  );

  async function loadPortfolio(walletAddress: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/riolight/portfolio?address=${encodeURIComponent(walletAddress)}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as RioLightPortfolioResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load RioLight portfolio.");
      }

      setPortfolio(data);
    } catch (err) {
      setPortfolio(null);
      setError(err instanceof Error ? err.message : "Failed to load RioLight portfolio.");
    } finally {
      setIsLoading(false);
    }
  }

  async function connectAndLoad() {
    setIsLoading(true);
    setError(null);

    try {
      const wallet = await connectRioLight();
      setAddress(wallet.address);
      await loadPortfolio(wallet.address);
    } catch (err) {
      setPortfolio(null);
      setError(err instanceof Error ? err.message : "Failed to connect RioLight.");
    } finally {
      setIsLoading(false);
    }
  }

  const tabs: Array<{ id: RioLightPortfolioTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "spo20", label: `SPO-20 (${spo20Balances.length || portfolio?.totals?.spo20BalanceCount || 0})` },
    { id: "pump", label: `Pump (${pumpPositions.length})` },
    { id: "prime", label: "Prime" },
  ];

  return (
    <section className={shellClass()}>
      <RioLightPortfolioValuePanel address={address} />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className={pillClass("cyan")}>RioLight</span>
            <span className={pillClass("gold")}>Native Wallet Layer</span>
            <span className={pillClass("violet")}>Keplr Adapter v1</span>
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            RioLight Portfolio
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
            Native Spherio wallet surface for RIO, Pump, Prime, SPO-20, RUSD, IBC, bridged assets, and future eVRI identity.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 xl:items-end">
          <button
            type="button"
            onClick={connectAndLoad}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/12 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/18 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Loading..." : address ? "Refresh RioLight" : "Connect RioLight"}
          </button>

          <div className="text-xs text-white/50">
            {address ? `Connected: ${shortAddress(address)}` : "No RioLight wallet connected"}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className={statCardClass()}>
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Native RIO</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {portfolio?.native?.rio?.display || "—"}
          </div>
          <div className="mt-1 text-xs text-white/45">
            {portfolio?.native?.rio?.error || portfolio?.native?.rio?.source || "Connect to load bank balance"}
          </div>
        </div>

        <div className={statCardClass()}>
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Pump Positions</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {portfolio?.totals?.positionCount ?? "—"}
          </div>
          <div className="mt-1 text-xs text-white/45">Wallet-attributed bonding exposure</div>
        </div>

        <div className={statCardClass()}>
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">SPO-20 Assets</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {portfolio?.totals?.spo20BalanceCount ?? "—"}
          </div>
          <div className="mt-1 text-xs text-white/45">Real indexed token balances</div>
        </div>

        <div className={statCardClass()}>
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Net RIO Spent</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {portfolio?.totals ? `${compactNumber(portfolio.totals.netRioSpent, 6)} RIO` : "—"}
          </div>
          <div className="mt-1 text-xs text-white/45">Indexed Pump.live attribution</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={tabClass(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">SPO-20 Preview</div>
                <div className="mt-1 text-base font-semibold text-white">Top wallet token balances</div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("spo20")}
                className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/15"
              >
                View all
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {previewSpo20Balances.length ? (
                previewSpo20Balances.map((token) => (
                  <div
                    key={token.tokenAddress}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3"
                  >
                    <div>
                      <div className="font-semibold text-white">{token.symbol}</div>
                      <div className="mt-1 max-w-[320px] truncate text-xs text-white/42">{token.tokenAddress}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">{compactNumber(token.balance, 4)}</div>
                      <div className="text-xs text-white/45">SPO-20</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3 text-sm text-white/55">
                  Connect RioLight to load real SPO-20 balances.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">Pump Preview</div>
                <div className="mt-1 text-base font-semibold text-white">Wallet-attributed bonding exposure</div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("pump")}
                className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/15"
              >
                View Pump
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {pumpPositions.length ? (
                pumpPositions.slice(0, 3).map((position) => (
                  <div
                    key={position.tokenAddress}
                    className="rounded-xl border border-white/8 bg-white/[0.025] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{position.tokenName}</div>
                        <div className="mt-1 text-xs text-white/45">{position.symbol} · {position.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-cyan-100">{compactNumber(position.curve.progressPercent, 4)}%</div>
                        <div className="text-xs text-white/45">{compactNumber(position.netRioSpent, 6)} RIO spent</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3 text-sm text-white/55">
                  No Pump positions yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "spo20" ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">SPO-20 Wallet Tokens</div>
              <div className="mt-1 text-base font-semibold text-white">Real indexed token balances</div>
            </div>
            <span className={pillClass("cyan")}>{spo20Balances.length} assets</span>
          </div>

          <div className="mt-3 max-h-[520px] overflow-auto rounded-2xl border border-white/10">
            {previewSpo20Balances.length ? (
              previewSpo20Balances.map((token) => (
                <div
                  key={token.tokenAddress}
                  className="grid gap-3 border-b border-white/8 bg-white/[0.02] p-4 last:border-b-0 lg:grid-cols-[1fr_0.9fr_0.8fr_0.9fr]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold text-white">{token.symbol}</div>
                      <span className={pillClass("neutral")}>SPO-20</span>
                    </div>
                    <div className="mt-1 break-all text-xs text-white/42">{token.tokenAddress}</div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/42">Balance</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {compactNumber(token.balance, 4)} {token.symbol}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/42">Updated</div>
                    <div className="mt-1 text-sm font-semibold text-white">h{token.updatedHeight || "—"}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {token.routes.pump ? (
                      <Link
                        href={token.routes.pump}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/15"
                      >
                        Pump
                      </Link>
                    ) : null}
                    <Link
                      href={token.routes.explorer}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white/70 hover:bg-white/[0.06]"
                    >
                      Explorer
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-sm text-white/55">
                Connect RioLight to load real SPO-20 balances. RUSD, Prime tokens, Pump tokens, and all Spherio-created assets will appear here as indexed balances.
              </div>
            )}
          </div>

          {spo20Balances.length > previewSpo20Balances.length ? (
            <div className="mt-2 text-xs text-white/45">
              Showing first {previewSpo20Balances.length} of {spo20Balances.length} SPO-20 balances.
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "pump" ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">Pump Positions</div>
              <div className="mt-1 text-base font-semibold text-white">Wallet-attributed bonding exposure</div>
            </div>
            <span className={pillClass("gold")}>{pumpPositions.length} positions</span>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
            {pumpPositions.length ? (
              pumpPositions.map((position) => (
                <div
                  key={position.tokenAddress}
                  className="grid gap-3 border-b border-white/8 bg-white/[0.02] p-4 last:border-b-0 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.9fr]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold text-white">{position.tokenName}</div>
                      <span className={pillClass("cyan")}>{position.symbol}</span>
                      <span className={pillClass("gold")}>{position.status}</span>
                    </div>
                    <div className="mt-1 break-all text-xs text-white/42">{position.tokenAddress}</div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/42">Amount</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {compactNumber(position.netTokenAmount, 6)} {position.symbol}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/42">Spent</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {compactNumber(position.netRioSpent, 6)} RIO
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/42">Curve</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {compactNumber(position.curve.progressPercent, 4)}%
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link
                      href={position.routes.pump}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/15"
                    >
                      Open Pump
                    </Link>
                    <Link
                      href={position.routes.explorer}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white/70 hover:bg-white/[0.06]"
                    >
                      Explorer
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-sm text-white/55">
                Connect RioLight to load Pump positions.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "prime" ? (
        <div className="mt-5 rounded-2xl border border-violet-300/15 bg-violet-400/[0.045] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={pillClass("violet")}>Prime Allocation</span>
            <span className={pillClass("neutral")}>Indexer pending</span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-white">Prime portfolio section activates with indexed allocations</h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
            Prime has no indexed launch, allocation, presale, fair-launch, or contribution tables available yet. Once Prime schema exists, RioLight will show issuer roles, allocations, raised RIO, vesting state, launch status, and token routes here.
          </p>
        </div>
      ) : null}
    </section>
  );
}
