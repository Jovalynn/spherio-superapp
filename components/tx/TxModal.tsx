"use client";

import { useTx } from "@/context/TxContext";
import { SPHERIO } from "@/lib/spherioConfig";

export default function TxModal() {
  const { tx, closeTx } = useTx();
  if (tx.status === "idle") return null;

  const explorer =
    tx.hash && SPHERIO.explorerTxBase
      ? `${SPHERIO.explorerTxBase}${tx.hash}`
      : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#070A12] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">
              {tx.title || "Transaction"}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {tx.status === "pending" && "Broadcasting… awaiting confirmation."}
              {tx.status === "success" && "Confirmed on-chain."}
              {tx.status === "error" && "Transaction failed."}
            </div>
          </div>

          {tx.status !== "pending" && (
            <button
              onClick={closeTx}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
            >
              Close
            </button>
          )}
        </div>

        {tx.status === "pending" && (
          <div className="mt-6 flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            <div className="text-sm text-slate-200">Pending…</div>
          </div>
        )}

        {tx.hash && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-slate-400">Tx Hash</div>
            <div className="mt-1 break-all font-mono text-xs text-slate-200">
              {tx.hash}
            </div>
            {explorer && (
              <a
                className="mt-3 inline-block text-xs font-semibold text-sky-300 hover:text-sky-200"
                href={explorer}
                target="_blank"
                rel="noreferrer"
              >
                View on Explorer →
              </a>
            )}
          </div>
        )}

        {tx.error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="text-xs font-semibold text-red-200">Error</div>
            <div className="mt-1 text-xs text-red-100/90">{tx.error}</div>
          </div>
        )}
      </div>
    </div>
  );
}

