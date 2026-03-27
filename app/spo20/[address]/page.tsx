"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type TokenMeta = {
  token_address: string;
  symbol: string;
  creator: string | null;
  factory_address: string | null;
  tx_hash: string | null;
  height: string;
  created_at: string;
  onchain: null | {
    name: string;
    symbol: string;
    decimals: number;
    total_supply: string;
  };
};

type HolderRow = {
  token_address: string;
  address: string;
  balance: string;
  updated_height: string;
  updated_at: string;
};

type ActivityRow = {
  id: string;
  token_address: string;
  height: string;
  tx_hash: string;
  action: string;
  sender: string | null;
  recipient: string | null;
  amount: string | null;
  created_at: string;
};

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function shortAddr(a?: string | null) {
  if (!a) return "—";
  return `${a.slice(0, 10)}…${a.slice(-6)}`;
}

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

function fmtBig(s?: string | null) {
  if (!s) return "—";
  // keep simple (no bigint formatting libs)
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function Spo20TokenPage() {
  const params = useParams<{ address: string }>();
  const address = params?.address;

  const [tab, setTab] = useState<"overview" | "holders" | "activity">("overview");

  const [token, setToken] = useState<TokenMeta | null>(null);
  const [holders, setHolders] = useState<HolderRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  const [loadingToken, setLoadingToken] = useState(true);
  const [loadingHolders, setLoadingHolders] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [holdersOffset, setHoldersOffset] = useState(0);
  const [activityOffset, setActivityOffset] = useState(0);

  const limit = 25;

  const card =
    "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]";
  const label = "text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-300/90";

  useEffect(() => {
    if (!address) return;

    (async () => {
      try {
        setLoadingToken(true);
        const r = await fetch(`/api/spo20/token/${address}`, { cache: "no-store" });
        const j = await r.json();
        setToken(j);
      } catch {
        setToken(null);
      } finally {
        setLoadingToken(false);
      }
    })();
  }, [address]);

  async function loadHolders(nextOffset = 0) {
    if (!address) return;
    setLoadingHolders(true);
    try {
      const r = await fetch(
        `/api/spo20/token/${address}/holders?limit=${limit}&offset=${nextOffset}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      setHolders(j.items || []);
      setHoldersOffset(nextOffset);
    } finally {
      setLoadingHolders(false);
    }
  }

  async function loadActivity(nextOffset = 0) {
    if (!address) return;
    setLoadingActivity(true);
    try {
      const r = await fetch(
        `/api/spo20/token/${address}/txs?limit=${limit}&offset=${nextOffset}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      setActivity(j.items || []);
      setActivityOffset(nextOffset);
    } finally {
      setLoadingActivity(false);
    }
  }

  useEffect(() => {
    if (tab === "holders") loadHolders(0);
    if (tab === "activity") loadActivity(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, address]);

  const title = useMemo(() => {
    if (!token?.onchain?.name && !token?.symbol) return "SPO-20 Token";
    return token?.onchain?.name || token?.symbol || "SPO-20 Token";
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-64px)] w-full text-white relative overflow-hidden bg-[#060B16]">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-[560px] w-[560px] rounded-full bg-[#FF8A32]/18 blur-[170px]" />
        <div className="absolute top-16 right-[-160px] h-[560px] w-[560px] rounded-full bg-[#22C55E]/10 blur-[180px]" />
        <div className="absolute bottom-[-220px] left-[18%] h-[720px] w-[720px] rounded-full bg-[#1F2937]/40 blur-[210px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(0,0,0,0.65))]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-10">
        {/* header card */}
        <div className={clsx(card, "p-6")}>
          <div className={label}>RioExplorer • SPO-20</div>

          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-3xl font-semibold tracking-tight">{title}</div>
              <div className="mt-2 text-sm text-slate-200">
                Contract:{" "}
                <button
                  className="font-semibold text-white hover:underline"
                  onClick={() => address && copy(address)}
                  title="Click to copy"
                >
                  {address}
                </button>
                <span className="ml-2 text-xs text-slate-300">(click to copy)</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className={clsx(
                  "rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold",
                  tab === "overview" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                )}
                onClick={() => setTab("overview")}
              >
                Overview
              </button>
              <button
                className={clsx(
                  "rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold",
                  tab === "holders" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                )}
                onClick={() => setTab("holders")}
              >
                Holders
              </button>
              <button
                className={clsx(
                  "rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold",
                  tab === "activity" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                )}
                onClick={() => setTab("activity")}
              >
                Activity
              </button>
            </div>
          </div>

          {/* quick stats */}
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs text-slate-400">Symbol</div>
              <div className="mt-1 text-sm font-semibold">{token?.onchain?.symbol || token?.symbol || "—"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs text-slate-400">Decimals</div>
              <div className="mt-1 text-sm font-semibold">{token?.onchain?.decimals ?? "—"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs text-slate-400">Total Supply</div>
              <div className="mt-1 text-sm font-semibold">{fmtBig(token?.onchain?.total_supply)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs text-slate-400">Creator</div>
              <div className="mt-1 text-sm font-semibold">{shortAddr(token?.creator)}</div>
            </div>
          </div>
        </div>

        {/* content */}
        <div className="mt-8">
          {tab === "overview" ? (
            <div className={clsx(card, "p-6")}>
              <div className="text-sm font-bold tracking-wide">On-chain Metadata</div>

              {loadingToken ? (
                <div className="mt-4 text-sm text-slate-300">Loading…</div>
              ) : token?.onchain ? (
                <dl className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <dt className="text-slate-400">Name</dt>
                    <dd className="mt-1 font-semibold text-white">{token.onchain.name}</dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <dt className="text-slate-400">Symbol</dt>
                    <dd className="mt-1 font-semibold text-white">{token.onchain.symbol}</dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <dt className="text-slate-400">Decimals</dt>
                    <dd className="mt-1 font-semibold text-white">{token.onchain.decimals}</dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <dt className="text-slate-400">Total Supply</dt>
                    <dd className="mt-1 font-semibold text-white">{fmtBig(token.onchain.total_supply)}</dd>
                  </div>
                </dl>
              ) : (
                <div className="mt-4 text-sm text-slate-300">
                  No on-chain metadata returned yet.
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200 leading-relaxed">
                <span className="font-semibold text-white">Verification:</span> Always verify the contract address
                before adding liquidity or trading. Names/symbols can be duplicated by third parties.
              </div>
            </div>
          ) : null}

          {tab === "holders" ? (
            <div className={clsx(card, "p-6")}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold tracking-wide">Holders</div>
                <div className="flex gap-2">
                  <button
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/5 disabled:opacity-50"
                    disabled={holdersOffset === 0 || loadingHolders}
                    onClick={() => loadHolders(Math.max(0, holdersOffset - limit))}
                  >
                    Prev
                  </button>
                  <button
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/5 disabled:opacity-50"
                    disabled={loadingHolders || holders.length < limit}
                    onClick={() => loadHolders(holdersOffset + limit)}
                  >
                    Next
                  </button>
                </div>
              </div>

              {loadingHolders ? (
                <div className="mt-4 text-sm text-slate-300">Loading holders…</div>
              ) : holders.length ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-black/30">
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-300">
                        <th className="px-4 py-3">Address</th>
                        <th className="px-4 py-3">Balance</th>
                        <th className="px-4 py-3">Updated Height</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holders.map((h) => (
                        <tr key={h.address} className="border-t border-white/10">
                          <td className="px-4 py-3">
                            <button
                              className="font-semibold text-white hover:underline"
                              onClick={() => copy(h.address)}
                              title="Click to copy"
                            >
                              {h.address}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-semibold text-white">{fmtBig(h.balance)}</td>
                          <td className="px-4 py-3 text-slate-200">{h.updated_height}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-300">No holders indexed yet.</div>
              )}
            </div>
          ) : null}

          {tab === "activity" ? (
            <div className={clsx(card, "p-6")}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold tracking-wide">Activity</div>
                <div className="flex gap-2">
                  <button
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/5 disabled:opacity-50"
                    disabled={activityOffset === 0 || loadingActivity}
                    onClick={() => loadActivity(Math.max(0, activityOffset - limit))}
                  >
                    Prev
                  </button>
                  <button
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/5 disabled:opacity-50"
                    disabled={loadingActivity || activity.length < limit}
                    onClick={() => loadActivity(activityOffset + limit)}
                  >
                    Next
                  </button>
                </div>
              </div>

              {loadingActivity ? (
                <div className="mt-4 text-sm text-slate-300">Loading activity…</div>
              ) : activity.length ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-black/30">
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-300">
                        <th className="px-4 py-3">Height</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Sender</th>
                        <th className="px-4 py-3">Recipient</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((a) => (
                        <tr key={a.id} className="border-t border-white/10">
                          <td className="px-4 py-3 text-slate-200">{a.height}</td>
                          <td className="px-4 py-3 font-semibold text-white">{a.action}</td>
                          <td className="px-4 py-3 text-slate-200">{shortAddr(a.sender)}</td>
                          <td className="px-4 py-3 text-slate-200">{shortAddr(a.recipient)}</td>
                          <td className="px-4 py-3 text-slate-200">{a.amount ? fmtBig(a.amount) : "—"}</td>
                          <td className="px-4 py-3">
                            <button
                              className="font-semibold text-white hover:underline"
                              onClick={() => copy(a.tx_hash)}
                              title="Click to copy"
                            >
                              {a.tx_hash.slice(0, 10)}…{a.tx_hash.slice(-8)}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-300">No activity indexed yet.</div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
