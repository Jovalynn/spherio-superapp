"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function shellClass() {
  return "rounded-[30px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(13,21,48,0.76),rgba(34,8,28,0.92))] p-5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-6";
}

function cardClass() {
  return "rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";
}

function buttonClass(primary = false) {
  return primary
    ? "rounded-2xl border border-fuchsia-400/30 bg-[linear-gradient(180deg,rgba(236,72,153,0.28),rgba(124,58,237,0.18))] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(217,70,239,0.18)]"
    : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/90";
}

function pillClass(kind: "live" | "truth" | "neutral" = "neutral") {
  if (kind === "live") {
    return "rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200";
  }
  if (kind === "truth") {
    return "rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300";
  }
  return "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75";
}

function shortHash(s?: string | null, left = 12, right = 10) {
  const v = String(s || "").trim();
  if (!v) return "—";
  if (v.length <= left + right + 3) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

type TokenRow = {
  token_address: string;
  symbol: string;
  creator: string | null;
  factory_address: string | null;
  tx_hash: string | null;
  height: string | number;
  created_at: string;
};

type TokensResponse = {
  ok?: boolean;
  items?: TokenRow[];
  rows?: TokenRow[];
  tokens?: TokenRow[];
  total?: number;
  error?: string;
};

export default function RioExplorerSpo20List() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const url = `/api/spo20/tokens?limit=100${q ? `&q=${encodeURIComponent(q)}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        const text = await res.text();
        const json: TokensResponse | null = text ? JSON.parse(text) : null;

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error || `HTTP ${res.status}`);
        }

        const rows = Array.isArray(json?.items)
          ? json!.items!
          : Array.isArray(json?.rows)
          ? json!.rows!
          : Array.isArray(json?.tokens)
          ? json!.tokens!
          : [];

        if (alive) setItems(rows);
      } catch (e: any) {
        if (alive) {
          setItems([]);
          setError(e?.message || "Failed to load SPO-20 tokens");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [q]);

  const total = useMemo(() => items.length, [items]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_18%),radial-gradient(circle_at_82%_15%,rgba(217,70,239,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className={shellClass()}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                RioExplorer • SPO-20
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
                SPO-20 Registry
              </h1>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">
                Canonical Spherio issuance surface for symbol discovery, contract traceability,
                creator lineage, registry truth, and future multichain representation continuity.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className={pillClass("truth")}>Registry Truth</span>
                <span className={pillClass("live")}>Explorer Active</span>
                <span className={pillClass("neutral")}>Canonical Spherio Issuance</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/createtoken" className={buttonClass(true)}>CreateToken.live</Link>
              <Link
                href="/createtoken/prime"
                className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
              >
                Prime
              </Link>
                <Link href="/pump.live" className={buttonClass(false)}>Pump.live</Link>
                <Link href="/riodex/swap" className={buttonClass(false)}>Swap</Link>
                <Link href="/riodex/pools" className={buttonClass(false)}>Pool</Link>
                <Link href="/riodex/pools" className={buttonClass(false)}>Liquidity</Link>
                <Link href="/rioex" className={buttonClass(false)}>Screener</Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/rioexplorer" className={buttonClass(false)}>Back to Explorer</Link>
            </div>
          </div>
        </section>

        <section className={shellClass()}>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_0.55fr_0.55fr]">
            <div className={cardClass()}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Standard Overview</div>
              <div className="text-sm text-slate-400">
                Issued assets on SpherioChain with verifiable on-chain traceability.
              </div>
            </div>

            <div className={cardClass()}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Registry Count</div>
              <div className="mt-2 text-3xl font-semibold text-white">{total}</div>
              <div className="mt-2 text-sm text-white/60">Explorer-visible issued SPO-20 tokens.</div>
            </div>

            <div className={cardClass()}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Current Scope</div>
              <div className="mt-2 text-sm leading-7 text-white/72">
                Canonical registry now. Multichain representation layer later.
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_0.55fr]">
            <div className={cardClass()}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Search Registry</div>
              <div className="mt-3 flex gap-3">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search symbol, contract, creator"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>
            </div>

            <div className={cardClass()}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Registry Use</div>
              <div className="mt-2 text-sm leading-7 text-white/72">
                Trace token origin, creator lineage, issuance tx, and future execution handoff into RioDex and RioEx surfaces.
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-[22px] border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-200">
              {error}
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-black/15">
            <div className="grid grid-cols-[0.9fr_1.1fr_1fr_0.7fr_1fr_0.8fr] gap-4 border-b border-white/8 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <div>Symbol</div>
              <div>Token Address</div>
              <div>Creator</div>
              <div>Height</div>
              <div>Created At</div>
              <div>Open</div>
            </div>

            {loading ? (
              <div className="px-6 py-8 text-sm text-white/65">Loading SPO-20 registry…</div>
            ) : items.length === 0 ? (
              <div className="px-6 py-8 text-sm text-white/65">
                No SPO-20 registry rows matched the current search.
              </div>
            ) : (
              <div className="divide-y divide-white/8">
                {items.map((row) => (
                  <div
                    key={row.token_address}
                    className="grid grid-cols-[0.9fr_1.1fr_1fr_0.7fr_1fr_0.8fr] gap-4 px-6 py-4 text-sm text-white/80"
                  >
                    <div className="font-semibold text-white">{row.symbol || "—"}</div>
                    <div title={row.token_address}>{shortHash(row.token_address)}</div>
                    <div title={row.creator || ""}>{shortHash(row.creator)}</div>
                    <div>{row.height}</div>
                    <div>{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</div>
                    <div>
                      <Link
                        href={row.tx_hash ? `/rioexplorer/tx/${row.tx_hash}` : "/rioexplorer/blocks"}
                        className={buttonClass(false)}
                      >
                        Trace
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
