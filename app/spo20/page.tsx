"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TokenItem = {
  token_address: string;
  symbol?: string;
  creator?: string;
  factory_address?: string;
  tx_hash?: string;
  height?: string | number;
  created_at?: string;
};

type TokensResponse = {
  items: TokenItem[];
  limit: number;
  offset: number;
};

function shortAddr(addr?: string, left = 10, right = 6) {
  if (!addr) return "";
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

export default function Spo20Page() {
  const [items, setItems] = useState<TokenItem[]>([]);
  const [limit, setLimit] = useState<number>(25);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    sp.set("offset", String(offset));
    return sp.toString();
  }, [limit, offset]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        // IMPORTANT: single /api prefix (nginx maps /api -> indexer:4000)
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
        const res = await fetch(`${API_BASE}/api/spo20/tokens?${query}`, {
        cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
        }

        const data = (await res.json()) as TokensResponse;
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load tokens");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SPO-20 Tokens</h1>
          <p className="text-sm text-muted-foreground">
            Indexed token list via <span className="font-mono">/api/spo20/tokens</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">
            Limit{" "}
            <input
              className="ml-2 w-20 rounded-md border px-2 py-1 text-sm"
              type="number"
              min={1}
              max={200}
              value={limit}
              onChange={(e) => {
                const v = Number(e.target.value || 25);
                setOffset(0);
                setLimit(Number.isFinite(v) ? Math.max(1, Math.min(200, v)) : 25);
              }}
            />
          </label>

          <button
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            disabled={offset <= 0 || loading}
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
          >
            Prev
          </button>

          <button
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            disabled={loading || items.length < limit}
            onClick={() => setOffset((o) => o + limit)}
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-background">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading tokens…</div>
        ) : error ? (
          <div className="p-6">
            <div className="text-sm font-medium text-red-600">Failed to load tokens</div>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{error}</pre>
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No tokens found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Token Address</th>
                  <th className="px-4 py-3">Factory</th>
                  <th className="px-4 py-3">Height</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((t) => (
  <tr
    key={t.token_address}
    className="hover:bg-muted/20 transition-colors"
  >
    <td className="px-4 py-3 font-medium">{t.symbol || "—"}</td>

    <td className="px-4 py-3 font-mono">
      <Link
        href={`/spo20/${t.token_address}`}
        className="inline-flex items-center gap-2 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm cursor-pointer"
        title={t.token_address}
      >
        {shortAddr(t.token_address)}
        <span className="text-xs text-muted-foreground">View</span>
                    </Link>
                    </td>
                    <td className="px-4 py-3 font-mono">{shortAddr(t.factory_address)}</td>
                    <td className="px-4 py-3">{t.height ?? "—"}</td>
                    <td className="px-4 py-3">
                    {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono">
                    {t.tx_hash ? shortAddr(t.tx_hash, 12, 8) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        Offset: <span className="font-mono">{offset}</span> • Limit: <span className="font-mono">{limit}</span>
      </div>
    </div>
  );
}
