"use client";

import Link from "next/link";
import CopyableValue from "@/components/rioexplorer/CopyableValue";
import { useCallback, useEffect, useMemo, useState } from "react";

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function shellClass() {
  return "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(37,10,24,0.82),rgba(10,9,18,0.94))] p-5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-6";
}

function cardClass() {
  return "rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 backdrop-blur-xl";
}

function buttonClass(active = false) {
  return active
    ? "rounded-2xl border border-fuchsia-400/28 bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(157,23,77,0.18))] px-4 py-2 text-sm font-semibold text-white"
    : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/90";
}

function pillClass(kind: "truth" | "live" | "warn" | "neutral" | "module" = "neutral") {
  if (kind === "truth") {
    return "rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300";
  }
  if (kind === "live") {
    return "rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200";
  }
  if (kind === "warn") {
    return "rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200";
  }
  if (kind === "module") {
    return "rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80";
  }
  return "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75";
}

function shortHash(s: string, left = 12, right = 10) {
  const v = (s || "").trim();
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

function formatAmount(value?: string | null) {
  if (!value) return "—";
  return value;
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
        time?: string;
        chain_id?: string;
      };
      data?: {
        txs?: string[];
      };
    };
  };
};

type BlockRow = {
  height: number;
  txs: number;
  proposer: string;
  time: string | null;
  chainId: string | null;
};

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

type ActivityRow = {
  time: string;
  height: number;
  txHash: string;
  activityType: string;
  sourceModule: string;
  subjectAsset: string | null;
  counterparty: string | null;
  amount: string | null;
  status: string;
  detailRoute: string;
};

const RPC_API_BASE = "/api/rpc";
const EXPLORER_ACTIVITY_API = "/api/rioexplorer/activity?limit=100";

export default function RioExplorerBlocks() {
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [latest, setLatest] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [rpcOk, setRpcOk] = useState(true);
  const [rpcErr, setRpcErr] = useState("");

  const [activityOk, setActivityOk] = useState(true);
  const [activityErr, setActivityErr] = useState("");

  const [view, setView] = useState<"transactions" | "blocks">("transactions");
  const [moduleFilter, setModuleFilter] = useState<"all" | "riodex" | "liquidity" | "spo20">("all");

  const fetchJson = useCallback(async (url: string) => {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`HTTP ${r.status} ${t}`.slice(0, 300));
    }
    return r.json();
  }, []);

  const loadActivity = useCallback(async () => {
    const raw = (await fetchJson(EXPLORER_ACTIVITY_API)) as ActivityResponse;
    if (!raw?.ok) {
      throw new Error(raw?.error || "Explorer activity route failed");
    }

    const rows: ActivityRow[] = Array.isArray(raw.rows)
      ? raw.rows.map((r) => ({
          time: r.time,
          height: Number(r.height ?? 0),
          txHash: String(r.tx_hash || ""),
          activityType: String(r.activity_type || ""),
          sourceModule: String(r.source_module || ""),
          subjectAsset: r.subject_asset ?? null,
          counterparty: r.counterparty ?? null,
          amount: r.amount ?? null,
          status: String(r.status || "unknown"),
          detailRoute: String(r.detail_route || ""),
        }))
      : [];

    setActivity(rows.sort((a, b) => b.height - a.height));
  }, [fetchJson]);

  const loadBlocks = useCallback(async () => {
    const st = (await fetchJson(`${RPC_API_BASE}/status`)) as RpcStatus;
    const h = Number(st?.result?.sync_info?.latest_block_height ?? 0);
    if (!Number.isFinite(h) || h <= 0) {
      throw new Error("RPC status returned invalid height");
    }

    setLatest(h);

    const blockWindow = 12;
    const heights = Array.from({ length: blockWindow }, (_, i) => h - i).filter((x) => x > 0);

    const rawBlocks = await Promise.all(
      heights.map(async (height) => {
        const b = (await fetchJson(`${RPC_API_BASE}/block?height=${height}`)) as RpcBlock;
        const header = b?.result?.block?.header;
        const txs = b?.result?.block?.data?.txs ?? [];

        return {
          height,
          proposer: String(header?.proposer_address ?? "").trim() || "—",
          time: String(header?.time ?? "").trim() || null,
          chainId: String(header?.chain_id ?? "").trim() || null,
          txs,
        };
      })
    );

    setBlocks(
      rawBlocks.map((b) => ({
        height: b.height,
        proposer: b.proposer,
        time: b.time,
        chainId: b.chainId,
        txs: b.txs.length,
      }))
    );
  }, [fetchJson]);

  const load = useCallback(async () => {
    setLoading(true);

    setRpcOk(true);
    setRpcErr("");

    setActivityOk(true);
    setActivityErr("");

    const [activityResult, blockResult] = await Promise.allSettled([loadActivity(), loadBlocks()]);

    if (activityResult.status === "rejected") {
      setActivityOk(false);
      setActivity([]);
      setActivityErr(activityResult.reason?.message || String(activityResult.reason));
    }

    if (blockResult.status === "rejected") {
      setRpcOk(false);
      setBlocks([]);
      setLatest(0);
      setRpcErr(blockResult.reason?.message || String(blockResult.reason));
    }

    setLoading(false);
  }, [loadActivity, loadBlocks]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalTxs = useMemo(() => activity.length, [activity]);
  const blockCount = useMemo(() => blocks.length, [blocks]);
  const activeChainId = useMemo(() => blocks.find((b) => b.chainId)?.chainId || "spherio-1", [blocks]);
  const modulesSeen = useMemo(() => Array.from(new Set(activity.map((r) => r.sourceModule))), [activity]);

  const filteredActivity = useMemo(() => {
    if (moduleFilter === "all") return activity;
    return activity.filter((row) => row.sourceModule === moduleFilter);
  }, [activity, moduleFilter]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(157,23,77,0.12),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className={shellClass()}>
          <div className="grid gap-5 xl:grid-cols-[0.96fr_0.66fr]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                RioExplorer • Blocks / Transactions
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Chain Activity Ledger
              </h1>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">
                RioExplorer now reads authoritative recent activity from the indexer first, while RPC remains the
                supporting block-window source. This is the beginning of the real investigator ledger.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className={pillClass("truth")}>Authoritative Activity</span>
                <span className={pillClass(activityOk ? "live" : "warn")}>
                  {activityOk ? "Activity Route Active" : "Activity Warning"}
                </span>
                <span className={pillClass(rpcOk ? "live" : "warn")}>{rpcOk ? "RPC Active" : "RPC Warning"}</span>
                <span className={pillClass("neutral")}>{activeChainId}</span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className={cardClass()}>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Latest Height</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{latest || "—"}</div>
                </div>
                <div className={cardClass()}>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Blocks Loaded</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{blockCount}</div>
                </div>
                <div className={cardClass()}>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Activity Rows</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{totalTxs}</div>
                </div>
                <div className={cardClass()}>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Observed Modules</div>
                  <div className="mt-2 text-lg font-semibold text-white">{modulesSeen.length || "—"}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={load} className={buttonClass(false)} disabled={loading}>
                  {loading ? "Refreshing…" : "Refresh Ledger"}
                </button>
                <Link href="/rioexplorer" className={buttonClass(false)}>
                  Back to Explorer
                </Link>
              </div>
            </div>

            <div className={cardClass()}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Investigator Notes
              </div>

              <div className="mt-4 grid gap-3 text-sm leading-7 text-white/68">
                <div className={cardClass()}>
                  Activity rows are now sourced from the indexer route that merges SPO-20 activity, RioDex swaps, and
                  RioDex liquidity events into one normalized ledger.
                </div>

                <div className={cardClass()}>
                  RPC is still used here for block-head visibility and recent block-window support, but transaction rows
                  are no longer limited to the current RPC slice.
                </div>

                <div className={cardClass()}>
                  Next explorer hardening step after this page: tx detail evidence, message/event decoding, then account
                  and contract investigation surfaces.
                </div>
              </div>
            </div>
          </div>
        </section>

        {!activityOk ? (
          <section className={shellClass()}>
            <div className="rounded-[22px] border border-amber-400/20 bg-amber-500/10 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                Activity Route Warning
              </div>
              <div className="mt-2 text-sm text-white/80">
                Failed to fetch authoritative activity from <span className="font-semibold text-white">/api/rioexplorer/activity</span>.
              </div>
              <div className="mt-3 whitespace-pre-wrap break-words text-xs text-white/60">{activityErr}</div>
            </div>
          </section>
        ) : null}

        {!rpcOk ? (
          <section className={shellClass()}>
            <div className="rounded-[22px] border border-amber-400/20 bg-amber-500/10 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                RPC Warning
              </div>
              <div className="mt-2 text-sm text-white/80">
                Failed to fetch proxied block data from <span className="font-semibold text-white">{RPC_API_BASE}</span>.
              </div>
              <div className="mt-3 whitespace-pre-wrap break-words text-xs text-white/60">{rpcErr}</div>
            </div>
          </section>
        ) : null}

        <section className={shellClass()}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                Ledger Centerpiece
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Time • Tx Hash • Block • Module • Trace
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setView("transactions")} className={buttonClass(view === "transactions")}>
                Transactions
              </button>
              <button type="button" onClick={() => setView("blocks")} className={buttonClass(view === "blocks")}>
                Blocks
              </button>
            </div>
          </div>

          {view === "transactions" ? (
            <>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => setModuleFilter("all")} className={buttonClass(moduleFilter === "all")}>
                  All
                </button>
                <button type="button" onClick={() => setModuleFilter("riodex")} className={buttonClass(moduleFilter === "riodex")}>
                  RioDex
                </button>
                <button type="button" onClick={() => setModuleFilter("liquidity")} className={buttonClass(moduleFilter === "liquidity")}>
                  Liquidity
                </button>
                <button type="button" onClick={() => setModuleFilter("spo20")} className={buttonClass(moduleFilter === "spo20")}>
                  SPO-20
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-black/15">
                <div className="grid grid-cols-[1.1fr_0.65fr_1.2fr_0.8fr_0.9fr_1fr_0.9fr_0.7fr] gap-4 border-b border-white/8 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  <div>Time</div>
                  <div>Block</div>
                  <div>Tx Hash</div>
                  <div>Type</div>
                  <div>Module</div>
                  <div>Subject</div>
                  <div>Amount</div>
                  <div>Trace</div>
                </div>

                {filteredActivity.length === 0 ? (
                  <div className="px-6 py-8 text-sm text-white/65">
                    {loading ? "Loading authoritative activity…" : "No authoritative activity rows matched the current filter."}
                  </div>
                ) : (
                  <div className="divide-y divide-white/8">
                    {filteredActivity.map((row) => (
                      <div
                        key={`${row.height}-${row.txHash}-${row.activityType}`}
                        className="grid grid-cols-[1.1fr_0.65fr_1.2fr_0.8fr_0.9fr_1fr_0.9fr_0.7fr] gap-4 px-6 py-4 text-sm text-white/80"
                      >
                        <div>
                          <CopyableValue value={formatDateTime(row.time)} left={14} right={8} mono={false} label="Copy time" />
                        </div>

                        <div className="font-semibold text-white">
                          <Link href={`/rioexplorer/blocks/${row.height}`} className="hover:underline decoration-white/20">
                            <CopyableValue value={String(row.height)} left={10} right={0} mono={false} label="Copy block height" />
                          </Link>
                        </div>

                        <div className="font-mono text-[12px] text-white/86" title={row.txHash}>
                          <CopyableValue value={row.txHash} left={12} right={10} label="Copy tx hash" />
                        </div>

                        <div className="text-white/75">{row.activityType}</div>

                        <div>
                          <span className={pillClass("module")}>{row.sourceModule}</span>
                        </div>

                        <div className="truncate text-white/60" title={row.subjectAsset || ""}>
                          <CopyableValue value={row.subjectAsset} left={10} right={8} label="Copy subject" />
                        </div>

                        <div className="truncate text-white/70" title={row.amount || ""}>
                          <CopyableValue value={row.amount ? String(row.amount) : ""} left={12} right={8} mono={true} label="Copy amount" />
                        </div>

                        <div>
                          <Link
                            href={`/rioexplorer/tx/${row.txHash}`}
                            className="inline-flex rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/86 hover:bg-white/[0.08]"
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-black/15">
              <div className="grid grid-cols-[0.75fr_1.1fr_0.75fr_1.2fr_0.9fr] gap-4 border-b border-white/8 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
                <div>Height</div>
                <div>Time</div>
                <div>Txs</div>
                <div>Proposer</div>
                <div>Open</div>
              </div>

              {blocks.length === 0 ? (
                <div className="px-6 py-8 text-sm text-white/65">
                  {loading ? "Loading recent blocks…" : "No recent block rows were returned."}
                </div>
              ) : (
                <div className="divide-y divide-white/8">
                  {blocks.map((row) => (
                    <div
                      key={row.height}
                      className="grid grid-cols-[0.75fr_1.1fr_0.75fr_1.2fr_0.9fr] gap-4 px-6 py-4 text-sm text-white/80"
                    >
                      <div className="font-semibold text-white">
                        <Link href={`/rioexplorer/blocks/${row.height}`} className="hover:underline decoration-white/20">
                          {row.height}
                        </Link>
                      </div>
                      <div>{formatDateTime(row.time)}</div>
                      <div>{row.txs}</div>
                      <div className="truncate text-white/60" title={row.proposer}>
                        {shortHash(row.proposer, 14, 10)}
                      </div>
                      <div>
                        <Link
                          href={`/rioexplorer/blocks/${row.height}`}
                          className="inline-flex rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/86 hover:bg-white/[0.08]"
                        >
                          Open Block
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className={shellClass()}>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className={cardClass()}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Why This Matters</div>
              <div className="mt-3 text-sm leading-7 text-white/68">
                RioExplorer now shows authoritative recent activity from the indexer instead of depending only on the
                latest RPC block slice.
              </div>
            </div>

            <div className={cardClass()}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Investigator Standard</div>
              <div className="mt-3 text-sm leading-7 text-white/68">
                Real swaps and liquidity events are now visible in the explorer ledger, which is the correct
                progression toward institutional traceability.
              </div>
            </div>

            <div className={cardClass()}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Next Step</div>
              <div className="mt-3 text-sm leading-7 text-white/68">
                Harden tx detail evidence, then move into the SPO-20 explorer pass and later account, contract, and
                attestation surfaces.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
