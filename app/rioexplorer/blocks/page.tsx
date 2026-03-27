"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function shortHash(s: string, left = 10, right = 8) {
  const v = (s || "").trim();
  if (!v) return "—";
  if (v.length <= left + right + 3) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

type RpcStatus = {
  result?: {
    sync_info?: {
      latest_block_height?: string;
    };
  };
};

type RpcBlock = {
  result?: {
    block?: {
      header?: {
        height?: string;
        proposer_address?: string;
      };
      data?: {
        txs?: any[];
      };
    };
  };
};

type Row = {
  height: number;
  txs: number;
  proposer: string;
};

const API_BASE = "/api/rpc";

export default function RioExplorerBlocks() {
  const [rows, setRows] = useState<Row[]>([]);
  const [latest, setLatest] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [rpcOk, setRpcOk] = useState<boolean>(true);
  const [rpcErr, setRpcErr] = useState<string>("");

  const card =
    "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]";

  const fetchJson = useCallback(async (url: string) => {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`HTTP ${r.status} ${t}`.slice(0, 300));
    }
    return r.json();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setRpcOk(true);
    setRpcErr("");

    try {
      // 1) status -> latest height
      const st = (await fetchJson(`${API_BASE}/status`)) as RpcStatus;
      const h = Number(st?.result?.sync_info?.latest_block_height ?? 0);
      if (!Number.isFinite(h) || h <= 0) throw new Error("RPC status returned invalid height");

      setLatest(h);

      // 2) fetch last N blocks (small N so it stays snappy)
      const N = 10;
      const heights = Array.from({ length: N }, (_, i) => h - i).filter((x) => x > 0);

      const blocks = await Promise.all(
        heights.map(async (height) => {
          const b = (await fetchJson(`${API_BASE}/block?height=${height}`)) as RpcBlock;
          const header = b?.result?.block?.header;
          const txs = b?.result?.block?.data?.txs?.length ?? 0;

          return {
            height,
            txs,
            proposer: String(header?.proposer_address ?? "").trim() || "—",
          } as Row;
        })
      );

      setRows(blocks);
    } catch (e: any) {
      setRpcOk(false);
      setRows([]);
      setLatest(0);

      const msg = e?.message || String(e);
      setRpcErr(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    load();
  }, [load]);

  const badge = useMemo(
    () => (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-200">
        C4
      </span>
    ),
    []
  );

  return (
    <div className="min-h-[calc(100vh-64px)] w-full text-white relative overflow-hidden bg-[#060B16]">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-[560px] w-[560px] rounded-full bg-[#FF8A32]/18 blur-[170px]" />
        <div className="absolute top-16 right-[-160px] h-[560px] w-[560px] rounded-full bg-[#22C55E]/10 blur-[180px]" />
        <div className="absolute bottom-[-220px] left-[18%] h-[720px] w-[720px] rounded-full bg-[#1F2937]/40 blur-[210px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(0,0,0,0.65))]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-10">
        <div className={clsx(card, "p-6")}>
          <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
            RioExplorer
          </div>

          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-4xl font-semibold tracking-tight text-white">
                Blocks / Transactions
              </div>
              <div className="mt-2 text-sm text-slate-200">
                Pulled via indexed API proxy (no direct browser RPC calls).
              </div>
            </div>

            <div className="flex items-center gap-3">
              {badge}
              <button
                onClick={load}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
                disabled={loading}
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* RPC status banner */}
          {!rpcOk ? (
            <div className="mt-5 rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-4">
              <div className="text-sm font-extrabold uppercase tracking-wider text-[#F59E0B]">
                RPC Warning
              </div>
              <div className="mt-1 text-sm text-slate-200">
                Failed to fetch via proxy: <span className="text-slate-300">{API_BASE}</span>
              </div>
              <div className="mt-2 text-xs text-slate-300 whitespace-pre-wrap break-words">
                {rpcErr}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
              <span className="font-semibold text-white">Latest height:</span>{" "}
              <span className="text-slate-300">{latest || "—"}</span>
            </div>
          )}

          {/* Latest blocks */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 overflow-hidden">
            <div className="p-5">
              <div className="text-lg font-semibold">Latest blocks</div>
              <div className="mt-1 text-sm text-slate-200">
                This C4 view is RPC-proxied. Later we’ll switch to fully indexed chain-wide tables.
              </div>
            </div>

            <div className="border-t border-white/10">
              <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-300/90 bg-black/10">
                <div className="col-span-4">Height</div>
                <div className="col-span-2">Txs</div>
                <div className="col-span-6">Proposer</div>
              </div>

              {rows.length === 0 ? (
                <div className="px-5 py-6 text-sm text-slate-200">
                  {loading ? "Loading block data…" : "No block data returned."}
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {rows.map((r) => (
                    <div
                      key={r.height}
                      className="grid grid-cols-12 gap-3 px-5 py-3 text-sm text-slate-200 hover:bg-white/[0.04] transition"
                    >
                      {/* HEIGHT clickable */}
                      <div className="col-span-4 font-semibold text-white">
                        <Link
                          href={`/rioexplorer/blocks/${r.height}`}
                          className="hover:underline decoration-white/20"
                          title={`Open block ${r.height}`}
                        >
                          {r.height}
                        </Link>
                      </div>

                      {/* TXS clickable if > 0 */}
                      <div className="col-span-2">
                        {r.txs > 0 ? (
                          <Link
                            href={`/rioexplorer/blocks/${r.height}#txs`}
                            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-bold hover:bg-white/10 transition"
                            title="Open transactions"
                          >
                            {r.txs}
                          </Link>
                        ) : (
                          <span className="text-slate-300">{r.txs}</span>
                        )}
                      </div>

                      {/* proposer trimmed */}
                      <div className="col-span-6 truncate text-slate-300" title={r.proposer}>
                        {shortHash(r.proposer, 14, 10)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200 leading-relaxed">
            <span className="font-semibold text-white">Note:</span> Direct browser calls to the RPC can fail in Docker /
            reverse-proxy environments. This page uses <span className="text-slate-300">{API_BASE}</span> so it works
            reliably behind nginx.
          </div>
        </div>
      </div>
    </div>
  );
}
