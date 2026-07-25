"use client";

import Link from "next/link";
import CopyableValue from "@/components/rioexplorer/CopyableValue";
import { use, useEffect, useMemo, useState } from "react";

function shellClass() {
  return "rounded-[30px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(20,25,52,0.78),rgba(20,8,22,0.92))] p-5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-6";
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

function shortHash(s?: string | null, left = 14, right = 12) {
  const v = String(s || "").trim();
  if (!v) return "—";
  if (v.length <= left + right + 3) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

type ActivityApiRow = {
  time: string;
  height: number | string;
  tx_hash: string;
  activity_type: string;
  source_module: string;
  subject_asset?: string | null;
  counterparty?: string | null;
  amount?: string | null;
  status: string;
  detail_route: string;
};

type ActivityResponse = {
  ok: boolean;
  count: number;
  rows: ActivityApiRow[];
  error?: string;
};

type TxActivityRow = {
  height?: number | string | null;
  tx_hash?: string | null;
  action?: string | null;
  sender?: string | null;
  recipient?: string | null;
  amount?: string | null;
  created_at?: string | null;
  token_address?: string | null;
};

type TxResponse =
  | {
      item?: Record<string, any>;
      tx_hash?: string;
      activity?: TxActivityRow[];
      error?: string;
    }
  | null;

export default function RioExplorerTxDetailPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = use(params);

  const [txData, setTxData] = useState<TxResponse>(null);
  const [activityRows, setActivityRows] = useState<ActivityApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [txRes, activityRes] = await Promise.allSettled([
          fetch(`/api/tx/${encodeURIComponent(hash)}`, { cache: "no-store" }),
          fetch(`/api/rioexplorer/activity?limit=200`, { cache: "no-store" }),
        ]);

        let nextTxData: TxResponse = null;
        let nextActivityRows: ActivityApiRow[] = [];

        if (txRes.status === "fulfilled") {
          const text = await txRes.value.text();
          try {
            nextTxData = text ? JSON.parse(text) : null;
          } catch {}
        }

        if (activityRes.status === "fulfilled") {
          const text = await activityRes.value.text();
          try {
            const parsed: ActivityResponse | null = text ? JSON.parse(text) : null;
            const allRows = Array.isArray(parsed?.rows) ? parsed!.rows : [];
            nextActivityRows = allRows.filter(
              (row) => String(row.tx_hash || "").toUpperCase() === hash.toUpperCase()
            );
          } catch {}
        }

        if (!nextTxData && nextActivityRows.length === 0) {
          throw new Error("No tx detail or authoritative activity rows were resolved for this hash.");
        }

        if (alive) {
          setTxData(nextTxData);
          setActivityRows(nextActivityRows);
        }
      } catch (e: any) {
        if (alive) {
          setTxData(null);
          setActivityRows([]);
          setError(e?.message || "Failed to load tx detail");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [hash]);

  const txItem = useMemo(() => {
    return txData && "item" in txData ? txData.item || null : null;
  }, [txData]);

  const fallbackHeight = Number(activityRows[0]?.height ?? 0) || null;
  const fallbackTime = activityRows[0]?.time || null;

  const primaryHeight = Number(txItem?.height ?? fallbackHeight ?? 0) || null;
  const primaryTime = txItem?.created_at || txItem?.time || fallbackTime || null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_18%),radial-gradient(circle_at_80%_18%,rgba(217,70,239,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className={shellClass()}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                RioExplorer • Transaction
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Transaction Detail
              </h1>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">
                Investigator-grade transaction surface for hash, height, time, module, subject asset,
                amount, counterparty, and trace continuity.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className={pillClass("truth")}>Explorer Truth</span>
                <span className={pillClass(loading ? "neutral" : error ? "neutral" : "live")}>
                  {loading ? "Loading" : error ? "Needs Attention" : "Resolved"}
                </span>
                <span className={pillClass("neutral")}>TX</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/rioexplorer/blocks" className={buttonClass(false)}>
                Back to Blocks
              </Link>
              {primaryHeight ? (
                <Link href={`/rioexplorer/blocks/${primaryHeight}`} className={buttonClass(false)}>
                  Open Block
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {error ? (
          <section className={shellClass()}>
            <div className="rounded-[22px] border border-amber-400/20 bg-amber-500/10 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                Transaction Warning
              </div>
              <div className="mt-2 text-sm text-white/80">{error}</div>
            </div>
          </section>
        ) : null}

        <section className={shellClass()}>
          <div className="grid gap-4 xl:grid-cols-4">
            <div className={cardClass()}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Tx Hash</div>
              <div className="mt-2 break-all font-mono text-sm text-white">{hash}</div>
            </div>

            <div className={cardClass()}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Height</div>
              <div className="mt-2 text-2xl font-semibold text-white">{primaryHeight || "—"}</div>
            </div>

            <div className={cardClass()}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Time</div>
              <div className="mt-2 text-lg font-semibold text-white">{formatDateTime(primaryTime)}</div>
            </div>

            <div className={cardClass()}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Activity Rows</div>
              <div className="mt-2 text-2xl font-semibold text-white">{activityRows.length}</div>
            </div>
          </div>
        </section>

        {txItem ? (
          <section className={shellClass()}>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
              Direct Tx Record
            </div>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/15">
              <div className="divide-y divide-white/8">
                {Object.entries(txItem).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[0.85fr_1.8fr] gap-4 px-6 py-4 text-sm">
                    <div className="font-semibold uppercase tracking-[0.12em] text-white/50">{key}</div>
                    <div className="break-all text-white/82">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className={shellClass()}>
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Activity Trace
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/15">
            <div className="grid grid-cols-[0.7fr_0.95fr_0.95fr_1fr_1fr_0.9fr_0.75fr] gap-4 border-b border-white/8 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <div>Height</div>
              <div>Time</div>
              <div>Module</div>
              <div>Action</div>
              <div>Subject</div>
              <div>Counterparty</div>
              <div>Amount</div>
            </div>

            {loading ? (
              <div className="px-6 py-8 text-sm text-white/65">Loading transaction trace…</div>
            ) : activityRows.length === 0 ? (
              <div className="px-6 py-8 text-sm text-white/65">
                No authoritative activity rows were returned for this tx hash.
              </div>
            ) : (
              <div className="divide-y divide-white/8">
                {activityRows.map((row, idx) => (
                  <div
                    key={`${row.tx_hash}-${idx}`}
                    className="grid grid-cols-[0.7fr_0.95fr_0.95fr_1fr_1fr_0.9fr_0.75fr] gap-4 px-6 py-4 text-sm text-white/80"
                  >
                    <div className="font-semibold text-white"><CopyableValue value={String(row.height)} left={10} right={0} mono={false} label="Copy block height" /></div>
                    <div>{formatDateTime(row.time)}</div>
                    <div>{row.source_module}</div>
                    <div><CopyableValue value={row.activity_type} left={12} right={0} mono={false} label="Copy action" /></div>
                    <div title={row.subject_asset || ""}><CopyableValue value={row.subject_asset} left={10} right={8} label="Copy subject" /></div>
                    <div title={row.counterparty || ""}><CopyableValue value={row.counterparty} left={10} right={8} label="Copy counterparty" /></div>
                    <div><CopyableValue value={row.amount ? String(row.amount) : ""} left={12} right={8} label="Copy amount" /></div>
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
