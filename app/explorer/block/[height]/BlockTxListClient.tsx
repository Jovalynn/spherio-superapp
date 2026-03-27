"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type ApiResp = {
  height: string;
  tx_count: number;
  txs: Array<{
    tx_hash: string;
    code: number;
    gas_used: string;
    action: { label: string };
  }>;
};

function shortHash(h: string) {
  return `${h.slice(0, 10)}…${h.slice(-8)}`;
}

export default function BlockTxListClient() {
  const params = useParams();
  const height = useMemo(() => {
    const h = params?.height;
    return typeof h === "string" ? h : Array.isArray(h) ? h[0] : "";
  }, [params]);

  const [data, setData] = useState<ApiResp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setErr(null);
    setData(null);

    if (!/^\d+$/.test(height)) {
      setLoading(false);
      setErr(`Invalid block height: ${height || "(empty)"}`);
      return;
    }

    let alive = true;
    setLoading(true);

    fetch(`/api/rpc/block_results?height=${encodeURIComponent(height)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json: ApiResp) => {
        if (!alive) return;
        setData(json);
      })
      .catch((e: any) => {
        if (!alive) return;
        setErr(e?.message ?? String(e));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [height]);

  if (loading) {
    return (
      <div className="p-6 space-y-2">
        <div className="text-sm text-white/70">Loading block {height || "…"}</div>
        <div className="text-xs text-white/40">Fetching tx results…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6 space-y-2">
        <div className="text-sm text-red-200">Failed to load block</div>
        <pre className="text-xs text-white/60 whitespace-pre-wrap break-words">
          {err.slice(0, 1400)}
        </pre>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-sm text-white/70">No data</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-white">
        Block {data.height}{" "}
        <span className="text-white/50 text-base">({data.tx_count} txs)</span>
      </h1>

      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-white/50">
            <tr className="border-b border-white/10">
              <th className="p-3 text-left">TX HASH</th>
              <th className="p-3 text-left">CODE</th>
              <th className="p-3 text-left">GAS USED</th>
              <th className="p-3 text-left">ACTION</th>
            </tr>
          </thead>

          <tbody>
            {data.txs.length === 0 ? (
              <tr>
                <td className="p-4 text-white/60" colSpan={4}>
                  No transactions in this block.
                </td>
              </tr>
            ) : (
              data.txs.map((tx) => (
                <tr key={tx.tx_hash} className="border-b border-white/5">
                  <td className="p-3 font-mono text-white/90" title={tx.tx_hash}>
                    {shortHash(tx.tx_hash)}
                  </td>
                  <td className="p-3">{tx.code}</td>
                  <td className="p-3 font-mono">{tx.gas_used}</td>
                  <td className="p-3">{tx.action.label}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
