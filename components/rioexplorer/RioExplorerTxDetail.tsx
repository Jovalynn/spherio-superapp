"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ExplorerTxResponse = {
  ok?: boolean;
  source?: string;
  proxiedBy?: string;
  txHash?: string;
  classification?: string;
  swaps?: Array<any>;
  tokenActivity?: Array<any>;
  rawTx?: any;
  error?: string;
};

function short(value?: string | null, left = 12, right = 10) {
  if (!value) return "—";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

function formatAmount(value: unknown) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 9,
  }).format(n);
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusBadge(classification?: string) {
  if (classification === "riodex_swap") return "RioDex Swap";
  if (classification === "token_activity") return "Token Activity";
  return classification || "Transaction";
}

export default function RioExplorerTxDetail({ txHash }: { txHash: string }) {
  const normalizedHash = useMemo(() => String(txHash || "").trim().toUpperCase(), [txHash]);
  const [data, setData] = useState<ExplorerTxResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rioexplorer/tx/${normalizedHash}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err: any) {
        if (!cancelled) {
          setData({
            ok: false,
            error: err?.message || "Failed to load transaction evidence",
            txHash: normalizedHash,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (normalizedHash) load();

    return () => {
      cancelled = true;
    };
  }, [normalizedHash]);

  const firstSwap = data?.swaps?.[0] || null;
  const offer = firstSwap?.offerAsset;
  const ask = firstSwap?.askAsset;

  return (
    <main className="min-h-screen bg-[#070B12] text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.28em] text-slate-500">
              RioExplorer / Transaction Evidence
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Transaction Detail
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Investigator-grade transaction view powered by the Spherio indexer, RioDex swap
              ledger, SPO-20 activity, and canonical market registry.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/rioexplorer/activity"
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-300 hover:border-slate-600"
            >
              Back to Ledger
            </Link>
            <Link
              href="/rioexplorer"
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 hover:border-amber-400/60"
            >
              RioExplorer Home
            </Link>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/30">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Tx Hash</div>
              <div className="mt-2 break-all font-mono text-sm text-slate-200">
                {normalizedHash}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Status</div>
              <div className="mt-2 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                {loading ? "Loading…" : data?.ok ? "Resolved" : "Not resolved"}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Classification</div>
              <div className="mt-2 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
                {loading ? "Loading…" : statusBadge(data?.classification)}
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
            Loading transaction evidence…
          </div>
        )}

        {!loading && !data?.ok && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {data?.error || "Transaction not found."}
          </div>
        )}

        {!loading && data?.ok && firstSwap && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Primary Evidence
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    {firstSwap.label || "RioDex Swap"}
                  </h2>
                </div>
                <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                  {firstSwap.blockHeight ? `Block ${firstSwap.blockHeight}` : "Indexed"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0B111D] p-5">
                <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Offer</div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {formatAmount(offer?.amountDisplay)}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {offer?.symbol || "Unknown"}
                    </div>
                    <div className="mt-3 break-all font-mono text-xs text-slate-500">
                      {offer?.assetId || "—"}
                    </div>
                  </div>

                  <div className="text-center text-2xl text-slate-500">→</div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Receive</div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {formatAmount(ask?.amountDisplay)}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {ask?.symbol || "Unknown"}
                    </div>
                    <div className="mt-3 break-all font-mono text-xs text-slate-500">
                      {ask?.assetId || "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Info label="Pair" value={firstSwap.pairLabel || firstSwap.pairAddress} mono />
                <Info label="Pair Address" value={firstSwap.pairAddress} mono />
                <Info label="Sender" value={firstSwap.sender} mono />
                <Info label="Recipient" value={firstSwap.recipient || firstSwap.sender} mono />
                <Info label="Effective Price" value={firstSwap.effectivePrice} />
                <Info label="Block Time" value={formatTime(firstSwap.blockTime)} />
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Routes</div>
                <div className="mt-4 space-y-2">
                  <RouteLink href={firstSwap.routes?.rioexMarket} label="Open RioEx Market" />
                  <RouteLink href={firstSwap.routes?.pair} label="Open RioDex Pool" />
                  <RouteLink href={firstSwap.routes?.swap} label="Open Swap Route" />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Evidence Source</div>
                <div className="mt-4 space-y-3 text-sm text-slate-400">
                  <Info label="Source" value={data.source} />
                  <Info label="Proxy" value={data.proxiedBy} />
                  <Info label="Swap Rows" value={String(data.swaps?.length || 0)} />
                  <Info label="Token Activity Rows" value={String(data.tokenActivity?.length || 0)} />
                </div>
              </section>
            </aside>
          </div>
        )}

        {!loading && data?.ok && !firstSwap && (
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">Token Activity</h2>
            <pre className="mt-4 max-h-[520px] overflow-auto rounded-xl bg-black/40 p-4 text-xs text-slate-300">
              {JSON.stringify(data.tokenActivity || data, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}

function Info({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-1 break-all text-sm text-slate-200 ${mono ? "font-mono" : ""}`}>
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </div>
    </div>
  );
}

function RouteLink({ href, label }: { href?: string; label: string }) {
  if (!href) {
    return (
      <div className="rounded-xl border border-slate-800 px-4 py-3 text-sm text-slate-600">
        {label}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-800 bg-[#0B111D] px-4 py-3 text-sm text-slate-300 hover:border-amber-500/40 hover:text-amber-200"
    >
      {label}
    </Link>
  );
}
