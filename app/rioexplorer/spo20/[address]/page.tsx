"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type TokenMeta = {
  token_address: string;
  symbol: string | null;
  creator: string | null;
  factory_address: string | null;
  tx_hash: string | null;
  height: string | number;
  created_at: string;
  contract_address?: string;
  factory?: string;
  tx?: string;
  created_height?: string | number;
  created?: string;
  onchain?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    total_supply?: string;
  } | null;
};

type HolderRow = {
  token_address: string;
  address: string;
  balance: string;
  updated_height: string | number;
  updated_at: string;
};

type ActivityRow = {
  height: string | number;
  tx_hash: string;
  action: string;
  sender: string | null;
  recipient: string | null;
  amount: string | null;
  created_at: string;
};

type TokenPairRow = {
  pair_id: string;
  dex_contract: string | null;
  token0: string;
  token1: string;
  created_height: string | number | null;
  created_at: string | null;
  token0_symbol: string | null;
  token1_symbol: string | null;
  token0_decimals: number | null;
  token1_decimals: number | null;
  counterpart_token: string | null;
  counterpart_symbol: string | null;
};

type TokenPairsResponse = {
  token_address: string;
  count: number;
  items: TokenPairRow[];
};

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function shortAddr(a?: string | null, left = 10, right = 6) {
  if (!a) return "—";
  if (a.length <= left + right + 3) return a;
  return `${a.slice(0, left)}…${a.slice(-right)}`;
}

function fmtTs(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function fmtAmount(raw?: string | null, decimals = 6) {
  if (!raw) return "—";
  const s = String(raw);
  if (!/^\d+$/.test(s)) return s;

  if (decimals <= 0) return s;

  const pad = s.padStart(decimals + 1, "0");
  const whole = pad.slice(0, -decimals);
  const frac = pad.slice(-decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export default function RioExplorerSpo20TokenPage() {
  const params = useParams<{ address: string }>();
  const address = useMemo(() => String(params?.address ?? "").trim(), [params]);

  const [meta, setMeta] = useState<TokenMeta | null>(null);
  const [holders, setHolders] = useState<HolderRow[]>([]);
  const [txs, setTxs] = useState<ActivityRow[]>([]);
  const [pairs, setPairs] = useState<TokenPairRow[]>([]);
  const [tab, setTab] = useState<"holders" | "activity" | "pairs">("pairs");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const card =
    "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]";
  const chip =
    "rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold";
  const chipActive =
    "border-[#FF8A32]/40 bg-[#FF8A32]/10 text-white shadow-[0_0_0_1px_rgba(255,138,50,0.15)_inset]";
  const tableWrap = "mt-4 overflow-hidden rounded-2xl border border-white/10";
  const th =
    "px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-300 bg-black/30";
  const td = "px-4 py-3 text-slate-200";

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const [mRes, hRes, tRes, pRes] = await Promise.all([
          fetch(`/api/spo20/token/${address}`, { cache: "no-store" }),
          fetch(`/api/spo20/token/${address}/holders?limit=50&offset=0`, {
            cache: "no-store",
          }),
          fetch(`/api/spo20/token/${address}/txs?limit=50&offset=0`, {
            cache: "no-store",
          }),
          fetch(`/api/dex/token-pairs/${address}`, { cache: "no-store" }),
        ]);

        if (!mRes.ok) {
          const text = await mRes.text().catch(() => "");
          throw new Error(
            `Token meta HTTP ${mRes.status}: ${text || mRes.statusText}`
          );
        }

        const mJson = (await mRes.json()) as TokenMeta;

        const hJson = hRes.ok
          ? await hRes.json().catch(() => ({ items: [] }))
          : { items: [] };

        const tJson = tRes.ok
          ? await tRes.json().catch(() => ({ items: [] }))
          : { items: [] };

        const pJson = pRes.ok
          ? ((await pRes.json().catch(() => ({ items: [] }))) as TokenPairsResponse)
          : { token_address: address, count: 0, items: [] };

        if (cancelled) return;

        setMeta(mJson);
        setHolders(Array.isArray(hJson.items) ? (hJson.items as HolderRow[]) : []);
        setTxs(Array.isArray(tJson.items) ? (tJson.items as ActivityRow[]) : []);
        setPairs(Array.isArray(pJson.items) ? pJson.items : []);
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message ?? "Failed to load token");
        setMeta(null);
        setHolders([]);
        setTxs([]);
        setPairs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const decimals = meta?.onchain?.decimals ?? 6;

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden bg-[#060B16] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-[560px] w-[560px] rounded-full bg-[#FF8A32]/14 blur-[170px]" />
        <div className="absolute top-16 right-[-160px] h-[560px] w-[560px] rounded-full bg-[#8b1039]/12 blur-[180px]" />
        <div className="absolute bottom-[-220px] left-[18%] h-[720px] w-[720px] rounded-full bg-[#1F2937]/34 blur-[210px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),rgba(0,0,0,0.70))]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-8">
        <div className={clsx(card, "p-6")}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.20em] text-slate-300/90">
                RioExplorer • SPO-20
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {meta?.symbol || "Token"}
              </div>
              <div className="mt-2 break-all font-mono text-sm text-slate-200">
                {address}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/rioexplorer/spo20"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Back to Tokens
              </Link>
              <Link
                href="/riodex/markets"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Markets
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              className={clsx(chip, tab === "pairs" && chipActive)}
              onClick={() => setTab("pairs")}
              type="button"
            >
              Pairs ({pairs.length})
            </button>
            <button
              className={clsx(chip, tab === "holders" && chipActive)}
              onClick={() => setTab("holders")}
              type="button"
            >
              Holders ({holders.length})
            </button>
            <button
              className={clsx(chip, tab === "activity" && chipActive)}
              onClick={() => setTab("activity")}
              type="button"
            >
              Activity ({txs.length})
            </button>
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-slate-300">Loading…</div>
          ) : err ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="text-sm font-bold text-red-200">
                Failed to load token
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-red-200/80">
                {err}
              </pre>
            </div>
          ) : meta ? (
            <div className={tableWrap}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Field</th>
                    <th className={th}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/10">
                    <td className={td}>Symbol</td>
                    <td className={clsx(td, "font-semibold text-white")}>
                      {meta.symbol ?? "—"}
                    </td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Name</td>
                    <td className={td}>{meta.onchain?.name ?? "—"}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Decimals</td>
                    <td className={td}>{String(meta.onchain?.decimals ?? 6)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Total Supply</td>
                    <td className={td}>
                      {meta.onchain?.total_supply
                        ? fmtAmount(meta.onchain.total_supply, decimals)
                        : "—"}
                    </td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Creator</td>
                    <td className={td}>{shortAddr(meta.creator)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Factory</td>
                    <td className={td}>{shortAddr(meta.factory_address)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Created Height</td>
                    <td className={td}>{String(meta.height)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Created At</td>
                    <td className={td}>{fmtTs(meta.created_at)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className={td}>Tx Hash</td>
                    <td className={clsx(td, "break-all font-mono")}>
                      {meta.tx_hash ? (
                        <Link
                          href={`/rioexplorer/tx/${meta.tx_hash}`}
                          className="hover:underline"
                        >
                          {meta.tx_hash}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-300">Token not found.</div>
          )}
        </div>

        <div className={clsx(card, "mt-6 p-6")}>
          {loading ? (
            <div className="text-sm text-slate-300">Loading…</div>
          ) : err ? (
            <div className="text-sm text-slate-300">—</div>
          ) : tab === "pairs" ? (
            pairs.length ? (
              <div className={tableWrap}>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={th}>Counterpart</th>
                      <th className={th}>Pair</th>
                      <th className={th}>Pool</th>
                      <th className={th}>Created</th>
                      <th className={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pairs.map((p) => {
                      const pairLabel = `${p.token0_symbol || p.token0}/${p.token1_symbol || p.token1}`;
                      return (
                        <tr key={p.pair_id} className="border-t border-white/10">
                          <td className={clsx(td, "font-semibold text-white")}>
                            {p.counterpart_symbol || shortAddr(p.counterpart_token)}
                          </td>
                          <td className={td}>{pairLabel}</td>
                          <td className={clsx(td, "font-mono")}>
                            {shortAddr(p.pair_id, 14, 8)}
                          </td>
                          <td className={td}>{fmtTs(p.created_at)}</td>
                          <td className={td}>
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/riodex/pool/${p.pair_id}`}
                                className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                              >
                                Open Terminal
                              </Link>
                              <Link
                                href="/riodex/markets"
                                className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                              >
                                Markets
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-300">No market pairs indexed yet.</div>
            )
          ) : tab === "holders" ? (
            holders.length ? (
              <div className={tableWrap}>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={th}>Holder</th>
                      <th className={th}>Balance</th>
                      <th className={th}>Updated Height</th>
                      <th className={th}>Updated At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.map((h) => (
                      <tr key={h.address} className="border-t border-white/10">
                        <td className={clsx(td, "font-mono")}>
                          {shortAddr(h.address, 14, 8)}
                        </td>
                        <td className={clsx(td, "font-mono")}>
                          {fmtAmount(h.balance, decimals)}
                        </td>
                        <td className={td}>{String(h.updated_height)}</td>
                        <td className={td}>{fmtTs(h.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-300">No holders indexed yet.</div>
            )
          ) : txs.length ? (
            <div className={tableWrap}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Time</th>
                    <th className={th}>Action</th>
                    <th className={th}>From</th>
                    <th className={th}>To</th>
                    <th className={th}>Amount</th>
                    <th className={th}>Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t, i) => (
                    <tr key={`${t.tx_hash}-${i}`} className="border-t border-white/10">
                      <td className={td}>{fmtTs(t.created_at)}</td>
                      <td className={clsx(td, "font-semibold text-white")}>{t.action}</td>
                      <td className={clsx(td, "font-mono")}>{shortAddr(t.sender, 12, 8)}</td>
                      <td className={clsx(td, "font-mono")}>{shortAddr(t.recipient, 12, 8)}</td>
                      <td className={clsx(td, "font-mono")}>{fmtAmount(t.amount, decimals)}</td>
                      <td className={clsx(td, "font-mono")}>
                        {t.tx_hash ? (
                          <Link
                            href={`/rioexplorer/tx/${t.tx_hash}`}
                            className="hover:underline"
                            title={t.tx_hash}
                          >
                            {t.tx_hash.slice(0, 12)}…{t.tx_hash.slice(-8)}
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
          ) : (
            <div className="text-sm text-slate-300">No activity indexed yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
