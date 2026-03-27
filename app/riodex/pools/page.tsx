"use client";

import Link from "next/link";
import { useRioDexPairs } from "@/hooks/riodex/useRioDexPairs";

const RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";

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

function prettyAssetLabel(label?: string) {
  if (!label) return "—";
  if (label === "urio") return "RIO";
  if (label === RUSD_CONTRACT) return "RUSD";
  if (label === "RIO" || label === "RUSD") return label;
  return shortAddr(label, 10, 8);
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

export default function RioDexPoolsPage() {
  const { items, loading, error, refresh } = useRioDexPairs();

  const normalizedItems = items.map((item) => {
    const raw0 = item.pool?.assets?.[0]?.amount || "0";
    const raw1 = item.pool?.assets?.[1]?.amount || "0";
    const lpShare = item.pool?.total_share || "0";

    const asset0 = fromBaseUnits(raw0, 6);
    const asset1 = fromBaseUnits(raw1, 6);
    const price = asset0 > 0 ? asset1 / asset0 : 0;

    const left = prettyAssetLabel(item.assetLabels?.[0]);
    const right = prettyAssetLabel(item.assetLabels?.[1]);
    const displayLabel = `${left} / ${right}`;
    const isCanonical = displayLabel === "RIO / RUSD";

    return {
      ...item,
      displayLabel,
      asset0,
      asset1,
      price,
      lpShare,
      isCanonical,
    };
  });

  const canonicalPool =
    normalizedItems.find((item) => item.isCanonical) || normalizedItems[0] || null;

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">RioDex</p>
              <h1 className="text-3xl font-semibold tracking-tight">Pools</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/60">
                Factory-registered liquidity pools resolved from the current RioDex contract layer.
                Canonical markets are presented in display-grade units rather than raw contract
                internals.
              </p>
            </div>

            <button
              onClick={() => void refresh()}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              Loading RioDex pools...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              {error}
            </div>
          ) : null}

          {canonicalPool ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Canonical Pool</div>
                <div className="mt-2 text-xl font-semibold text-white">{canonicalPool.displayLabel}</div>
                <div className="mt-2">{canonicalPool.isCanonical ? <Badge label="Canonical" tone="primary" /> : null}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Liquidity</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  {formatAmount(canonicalPool.asset0)} RIO / {formatAmount(canonicalPool.asset1)} RUSD
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Price</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  {canonicalPool.price > 0 ? `${formatAmount(canonicalPool.price, 6)} RUSD` : "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">LP Share</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  {formatInteger(canonicalPool.lpShare)}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
          <div className="grid grid-cols-12 gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-white/45">
            <div className="col-span-4">Pool</div>
            <div className="col-span-3">Liquidity</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">LP Share</div>
            <div className="col-span-1">Open</div>
          </div>

          {normalizedItems.length === 0 ? (
            <div className="px-6 py-10 text-sm text-white/55">
              No pools available yet.
            </div>
          ) : (
            normalizedItems.map((item) => (
              <div
                key={item.pairKey}
                className="grid grid-cols-12 gap-4 border-b border-white/5 px-6 py-5 last:border-b-0"
              >
                <div className="col-span-4">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-white">{item.displayLabel}</div>
                    {item.isCanonical ? <Badge label="Canonical" tone="primary" /> : null}
                    {item.pairAddress ? <Badge label="Live" tone="good" /> : null}
                  </div>

                  <div className="mt-1 text-xs text-white/45">
                    {item.pairAddress || "Pending pair address"}
                  </div>

                  <div className="mt-2 text-[11px] text-white/35">
                    {item.isCanonical
                      ? "Verified canonical pool"
                      : item.createdAtHeight
                      ? `Created at height ${item.createdAtHeight}`
                      : "Creation metadata unavailable"}
                  </div>
                </div>

                <div className="col-span-3 text-sm text-white/75">
                  {formatAmount(item.asset0)} RIO / {formatAmount(item.asset1)} RUSD
                </div>

                <div className="col-span-2 text-sm text-white/75">
                  {item.price > 0 ? `${formatAmount(item.price, 6)} RUSD` : "—"}
                </div>

                <div className="col-span-2 text-sm text-white/75">
                  {formatInteger(item.lpShare)}
                </div>

                <div className="col-span-1">
                  {item.pairAddress ? (
                    <Link
                      href={`/riodex/pool/${item.pairAddress}`}
                      className="inline-flex rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                    >
                      View
                    </Link>
                  ) : (
                    <span className="text-xs text-white/35">—</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
