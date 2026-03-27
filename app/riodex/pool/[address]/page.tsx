"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";

type PairApiItem = {
  pairKey: string;
  pairAddress: string;
  liquidityToken?: string | null;
  createdAtHeight?: number | null;
  createdAtTime?: number | null;
  label: string;
  assetLabels: [string, string];
  pool?: {
    assets?: Array<{
      info?: {
        native_token?: { denom: string };
        token?: { contract_addr: string };
      };
      amount?: string;
    }>;
    total_share?: string;
  } | null;
  isCanonical?: boolean;
};

type PairsResponse = {
  ok?: boolean;
  error?: string;
  factory?: string;
  canonical_pair?: string;
  count?: number;
  items?: PairApiItem[];
  rpc_endpoint?: string;
  updated_at?: string;
};

function fromBaseUnits(value?: string, decimals = 6) {
  const num = Number(value || "0");
  if (!Number.isFinite(num)) return 0;
  return num / 10 ** decimals;
}

function formatAmount(value: string | number, max = 6) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
    minimumFractionDigits: 0,
  }).format(num);
}

function formatInteger(value: string | number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(num);
}

function shortAddr(v?: string | null, left = 10, right = 8) {
  if (!v) return "—";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

function formatTimestamp(value?: string | null) {
  if (!value) return "Live index active";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function prettyAssetLabel(label?: string | null) {
  if (!label) return "—";
  if (label === "urio") return "RIO";
  if (label === "RIO") return "RIO";
  if (label === "RUSD") return "RUSD";
  if (label === RUSD_CONTRACT) return "RUSD";
  return shortAddr(label, 12, 8);
}

function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "primary";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : tone === "primary"
      ? "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200"
      : "border-white/10 bg-white/5 text-white/75";

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${cls}`}>
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(26,18,28,0.82),rgba(10,10,14,0.92))] p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
      {note ? <div className="mt-2 text-xs text-slate-400">{note}</div> : null}
    </div>
  );
}

export default function PoolTradingPage() {
  const params = useParams<{ address: string }>();
  const address = useMemo(() => String(params?.address ?? "").trim(), [params]);

  const [pairs, setPairs] = useState<PairsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("1h");

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/riodex/pairs", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        const text = await res.text();
        let json: PairsResponse | null = null;

        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(`Pool registry returned non-JSON (${res.status}). ${text.slice(0, 200)}`);
        }

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(json?.error || `Failed to load pair registry: ${res.status}`);
        }

        setPairs(json);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load pool");
        setPairs(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const poolItem = useMemo(() => {
    return (pairs?.items || []).find((item) => item.pairAddress === address) || null;
  }, [pairs, address]);

  const canonicalPairAddress = pairs?.canonical_pair || null;
  const isCanonical = !!poolItem && poolItem.pairAddress === canonicalPairAddress;

  const asset0Raw = poolItem?.pool?.assets?.[0]?.amount || "0";
  const asset1Raw = poolItem?.pool?.assets?.[1]?.amount || "0";
  const totalShareRaw = poolItem?.pool?.total_share || "0";

  const asset0 = fromBaseUnits(asset0Raw, 6);
  const asset1 = fromBaseUnits(asset1Raw, 6);
  const midPrice = asset0 > 0 ? asset1 / asset0 : 0;

  const leftLabel = prettyAssetLabel(poolItem?.assetLabels?.[0]);
  const rightLabel = prettyAssetLabel(poolItem?.assetLabels?.[1]);
  const symbol = poolItem?.label || `${leftLabel} / ${rightLabel}`;

  const swapHref = `/riodex/swap?pool=${encodeURIComponent(address)}&from=${encodeURIComponent(
    leftLabel
  )}&to=${encodeURIComponent(rightLabel)}`;

  const liquidityHref = `/riodex/liquidity?pool=${encodeURIComponent(address)}`;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#060B16] text-white">
        <div className="mx-auto max-w-7xl px-6 pb-14 pt-8">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
            Loading terminal...
          </div>
        </div>
      </div>
    );
  }

  if (!poolItem) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#060B16] text-white">
        <div className="mx-auto max-w-7xl px-6 pb-14 pt-8">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/riodex"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Back to RioDex
            </Link>
            <Link
              href="/riodex/pools"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Back to Pools
            </Link>
          </div>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
            <h1 className="text-xl font-semibold">Pool not found</h1>
            <p className="mt-2 break-all font-mono text-sm text-slate-300">{address}</p>
            {error ? <p className="mt-3 text-sm text-slate-400">{error}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060B16] text-white">
      <div className="mx-auto max-w-7xl px-6 pb-14 pt-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/riodex"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
          >
            Back to RioDex
          </Link>
          <Link
            href="/riodex/pools"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
          >
            Back to Pools
          </Link>
          <Link
            href={swapHref}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
          >
            Swap
          </Link>
          <Link
            href={liquidityHref}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
          >
            Liquidity
          </Link>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(92,14,38,0.22),rgba(18,10,14,0.84))] p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.20em] text-slate-400">
                RioDex Terminal
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {symbol}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {isCanonical ? <Badge label="Canonical" tone="primary" /> : null}
                <Badge label="Verified" tone="good" />
                <Badge label="Live" tone="good" />
                <Badge label="Indexed" tone="neutral" />
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">
                Canonical pool terminal surface for verified liquidity, pool identity, and execution
                routing into the live RioDex market.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right sm:grid-cols-4">
              <StatCard label="Type" value="xyk" />
              <StatCard label="Status" value="Live" />
              <StatCard label="Price" value={midPrice > 0 ? `${formatAmount(midPrice, 6)} RUSD` : "—"} />
              <StatCard label="LP Share" value={formatInteger(totalShareRaw)} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Liquidity</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {formatAmount(asset0)} RIO / {formatAmount(asset1)} RUSD
              </div>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Pool</div>
              <div className="mt-2 break-all font-mono text-xs text-white/80">
                {poolItem.pairAddress}
              </div>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Pair Key</div>
              <div className="mt-2 break-all font-mono text-xs text-white/70">
                {poolItem.pairKey}
              </div>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Factory</div>
              <div className="mt-2 break-all font-mono text-xs text-white/70">
                {pairs?.factory || "Unavailable"}
              </div>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Last Update</div>
              <div className="mt-2 text-sm font-medium text-white">
                {formatTimestamp(pairs?.updated_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Base Asset"
            value={leftLabel}
            note={`Displayed reserve: ${formatAmount(asset0)}`}
          />
          <StatCard
            label="Quote Asset"
            value={rightLabel}
            note={`Displayed reserve: ${formatAmount(asset1)}`}
          />
          <StatCard
            label="Canonical Route"
            value={isCanonical ? "Direct" : "Pool-linked"}
            note={isCanonical ? "Verified primary execution venue" : "Linked execution venue"}
          />
          <StatCard
            label="Execution Venue"
            value="RioDex"
            note="Canonical on-chain swap venue"
          />
        </div>

        <div className="mt-6 grid grid-cols-12 gap-4">
          <div className="col-span-12 rounded-[24px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur xl:col-span-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Market Terminal</div>
                <div className="mt-1 text-xs text-slate-400">
                  Chart and market telemetry surface for the canonical pool
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                {["1m", "5m", "1h", "24h"].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={[
                      "rounded-full border px-3 py-1",
                      timeframe === tf
                        ? "border-[#ff8aa3]/30 bg-[#7f173a]/30 text-white"
                        : "border-white/10 text-slate-300",
                    ].join(" ")}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid h-[360px] place-items-center rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,18,28,0.88),rgba(9,10,18,0.96))] text-center text-sm text-slate-300">
              <div>
                <div className="font-medium text-white">{symbol}</div>
                <div className="mt-2">
                  Candle feeds and trade telemetry come next once RioEx market data endpoints are live.
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Timeframe: {timeframe}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 rounded-[24px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur xl:col-span-4">
            <div className="text-sm font-medium text-white">Execution Surface</div>
            <div className="mt-1 text-xs text-slate-400">
              Route into swap and liquidity actions from the verified pool terminal
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Mid Price
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {midPrice > 0 ? `${formatAmount(midPrice, 6)} RUSD` : "—"}
                </div>
              </div>

              <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Pool Liquidity
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatAmount(asset0)} RIO / {formatAmount(asset1)} RUSD
                </div>
              </div>

              <div className="grid gap-3">
                <Link
                  href={swapHref}
                  className="rounded-2xl border border-[#ff7a95]/20 bg-[linear-gradient(180deg,rgba(171,29,72,0.90),rgba(104,16,41,0.96))] px-4 py-3 text-center text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Open Swap Terminal
                </Link>

                <Link
                  href={liquidityHref}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/15"
                >
                  Open Liquidity Console
                </Link>
              </div>

              <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-200">
                This pool terminal is now aligned with the canonical market model: identity first,
                liquidity second, execution routing third, and raw internals demoted to supporting
                metadata.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
