"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TokenRow = {
  token_address: string;
  symbol: string;
  creator: string | null;
  factory_address: string | null;
  tx_hash: string | null;
  height: string | number; // <-- FIX (API returns number)
  created_at: string;
};

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function shortAddr(a?: string | null) {
  if (!a) return "—";
  return `${a.slice(0, 10)}…${a.slice(-6)}`;
}

export default function RioExplorerSpo20List() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const card =
    "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]";
  const input =
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#FF8A32]/40 focus:ring-2 focus:ring-[#22C55E]/10";

  const query = useMemo(() => q.trim(), [q]);

useEffect(() => {
  (async () => {
    setLoading(true);
    setError(null);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

      const url =
        query.length > 0
          ? `${API_BASE}/api/spo20/tokens?limit=100&offset=0&q=${encodeURIComponent(query)}`
          : `${API_BASE}/api/spo20/tokens?limit=100&offset=0`;

      const r = await fetch(url, { cache: "no-store" });

      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} ${r.statusText}${text ? ` — ${text}` : ""}`);
      }

      const j = await r.json();
      setItems(j.items || []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch tokens");
      setItems([]);
    } finally {
      setLoading(false);
    }
  })();
}, [query]); 

  return (
    <div className="min-h-[calc(100vh-64px)] w-full text-white relative overflow-hidden bg-[#060B16]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-[560px] w-[560px] rounded-full bg-[#FF8A32]/18 blur-[170px]" />
        <div className="absolute top-16 right-[-160px] h-[560px] w-[560px] rounded-full bg-[#22C55E]/10 blur-[180px]" />
        <div className="absolute bottom-[-220px] left-[18%] h-[720px] w-[720px] rounded-full bg-[#1F2937]/40 blur-[210px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(0,0,0,0.65))]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-10">
        <div className={clsx(card, "p-6")}>
          <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
            RioExplorer • SPO-20
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-white">Tokens</div>
          <div className="mt-2 text-sm text-slate-200">
            Search by symbol or token address. Open a token to view holders and activity.
          </div>

          <div className="mt-4">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
              Search
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. HHH or rio1…"
              className={input}
            />
          </div>
        </div>

        <div className={clsx(card, "p-6 mt-6")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold tracking-wide text-white">Recent tokens</div>
            <Link href="/rioexplorer" className="text-sm text-slate-300 hover:text-white">
              Back to RioExplorer
            </Link>
          </div>

          {loading ? (
       <div className="mt-4 text-sm text-slate-300">Loading…</div>
        ) : error ? (
         <div className="mt-4 text-sm text-red-300">{error}</div>
          ) : items.length ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-black/30">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-300">
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3">Creator</th>
                    <th className="px-4 py-3">Height</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.token_address} className="border-t border-white/10">
                      <td className="px-4 py-3 font-semibold text-white">{t.symbol || "—"}</td>
                      <td className="px-4 py-3">
                        <Link
                         href={`/rioexplorer/spo20/${t.token_address}`}
                          className="font-semibold text-white hover:underline"
                        >
                          {t.token_address}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-200">{shortAddr(t.creator)}</td>
                      <td className="px-4 py-3 text-slate-200">{t.height}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-300">No tokens found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
