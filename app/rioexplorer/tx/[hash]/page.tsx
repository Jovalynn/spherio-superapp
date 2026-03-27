"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type ActivityRow = {
  height?: string | number;
  tx_hash?: string;
  action?: string;
  sender?: string;
  recipient?: string;
  amount?: string;
  created_at?: string;
  token_address?: string;
};

type TxResponse =
  | { tx_hash: string; activity: ActivityRow[] }
  | { error: string };

function short(a?: string | null, left = 12, right = 8) {
  if (!a) return "—";
  if (a.length <= left + right + 3) return a;
  return `${a.slice(0, left)}…${a.slice(-right)}`;
}

export default function TxPage() {
  const params = useParams<{ hash: string }>();

  // ✅ Client-safe param read (fixes “blank hash”)
  const hash = useMemo(() => {
    const h = String(params?.hash ?? "").trim();
    return h ? h.toUpperCase() : "";
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TxResponse | null>(null);

  useEffect(() => {
    // ✅ If hash missing, STOP loading and show error
    if (!hash) {
      setLoading(false);
      setData({ error: "Missing tx hash in route. Check route folder name: /rioexplorer/tx/[hash]" });
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/tx/${encodeURIComponent(hash)}`, { cache: "no-store" });

        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          if (!cancelled) {
            setData({ error: `HTTP ${r.status} ${r.statusText}${txt ? ` — ${txt}` : ""}` });
          }
          return;
        }

        const j = (await r.json()) as TxResponse;
        if (!cancelled) setData(j);
      } catch {
        if (!cancelled) setData({ error: "Failed to load tx" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hash]);

  return (
    <div className="min-h-[calc(100vh-64px)] w-full text-white bg-[#060B16]">
      <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6">
          <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
            RioExplorer • Transaction
          </div>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="text-2xl font-semibold tracking-tight">Tx Details</div>
            <Link href="/rioexplorer" className="text-sm text-slate-300 hover:text-white">
              Back to Explorer
            </Link>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
              Hash
            </div>
            <div className="mt-2 font-mono text-sm break-all">{hash || "—"}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 mt-6">
          {loading ? (
            <div className="text-sm text-slate-300">Loading…</div>
          ) : !data ? (
            <div className="text-sm text-slate-300">No data.</div>
          ) : "error" in data ? (
            <div className="text-sm text-red-300">{data.error}</div>
          ) : (
            <>
              <div className="text-sm font-bold">Related Activity</div>

              {!data.activity?.length ? (
                <div className="mt-3 text-sm text-slate-300">No activity found.</div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-black/30">
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-300">
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Height</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Sender</th>
                        <th className="px-4 py-3">Recipient</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Token</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.activity.map((a, i) => (
                        <tr key={i} className="border-t border-white/10">
                          <td className="px-4 py-3 text-slate-200">
                            {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-200">{a.height ?? "—"}</td>
                          <td className="px-4 py-3 font-semibold text-white">{a.action ?? "—"}</td>
                          <td className="px-4 py-3 font-mono text-slate-200">{short(a.sender)}</td>
                          <td className="px-4 py-3 font-mono text-slate-200">{short(a.recipient)}</td>
                          <td className="px-4 py-3 font-mono text-slate-200">{a.amount ?? "—"}</td>
                          <td className="px-4 py-3 font-mono text-slate-200">
                            {a.token_address ? (
                              <Link href={`/rioexplorer/spo20/${a.token_address}`} className="hover:underline">
                                {short(a.token_address, 10, 6)}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
