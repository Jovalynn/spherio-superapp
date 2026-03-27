"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

const API_BASE = "/api/rpc";

function shortHash(s: string, left = 10, right = 8) {
  const v = (s || "").trim();
  if (v.length <= left + right + 3) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

async function fetchJson(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export default function BlockDetailPage() {
  const params = useParams<{ height: string }>();
  const height = useMemo(() => String(params?.height || "").trim(), [params]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [block, setBlock] = useState<any>(null);
  const [results, setResults] = useState<any>(null);

  const card =
    "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]";

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [b, br] = await Promise.all([
        fetchJson(`${API_BASE}/block?height=${encodeURIComponent(height)}`),
        fetchJson(`${API_BASE}/block_results?height=${encodeURIComponent(height)}`),
      ]);
      setBlock(b);
      setResults(br);
    } catch (e: any) {
      setErr(e?.message || "Failed to load block");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!height) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  const header = block?.result?.block?.header;
  const txCount = Number(block?.result?.block?.data?.txs?.length ?? 0);
  const proposer = header?.proposer_address || "";

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
                RioExplorer
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                Block {height || "—"}
              </div>
              <div className="mt-2 text-sm text-slate-200">
                RPC-proxied view (C4). This will migrate to indexed chain-wide tables later.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/rioexplorer/blocks"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
              >
                Back
              </Link>
              <button
                onClick={load}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
              >
                Refresh
              </button>
            </div>
          </div>

          {err ? (
            <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-slate-100">
              <div className="font-bold text-amber-300">RPC Warning</div>
              <div className="mt-1 opacity-90">{err}</div>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
                Height
              </div>
              <div className="mt-2 text-2xl font-semibold">{height}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
                Transactions
              </div>
              <div className="mt-2 text-2xl font-semibold">{Number.isFinite(txCount) ? txCount : "—"}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
                Proposer
              </div>
              <div className="mt-2 text-sm text-slate-200 font-semibold">
                {proposer ? shortHash(proposer, 14, 10) : "—"}
              </div>

              {proposer ? (
                <button
                  onClick={() => navigator.clipboard.writeText(proposer)}
                  className="mt-3 inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold hover:bg-white/10 transition"
                >
                  Copy
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200 leading-relaxed">
            <span className="font-semibold text-white">Audit link:</span>{" "}
            <a
              className="underline decoration-white/20 hover:decoration-white"
              href={`${API_BASE}/block?height=${encodeURIComponent(height)}`}
              target="_blank"
              rel="noreferrer"
            >
              Open raw block (RPC)
            </a>{" "}
            <span className="text-white/15">•</span>{" "}
            <a
              className="underline decoration-white/20 hover:decoration-white"
              href={`${API_BASE}/block_results?height=${encodeURIComponent(height)}`}
              target="_blank"
              rel="noreferrer"
            >
              Open raw block_results (RPC)
            </a>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-sm font-bold">Header</div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm text-slate-200">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
                  Chain ID
                </div>
                <div className="mt-1 font-semibold">{header?.chain_id || "—"}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
                  Time
                </div>
                <div className="mt-1 font-semibold">{header?.time || "—"}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
                  Last Block ID
                </div>
                <div className="mt-1 font-semibold">{shortHash(header?.last_block_id?.hash || "—", 18, 10)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
                  Data Hash
                </div>
                <div className="mt-1 font-semibold">{shortHash(header?.data_hash || "—", 18, 10)}</div>
              </div>
            </div>

            {loading ? (
              <div className="mt-4 text-sm text-slate-300">Loading…</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
