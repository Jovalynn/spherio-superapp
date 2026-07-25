"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

type PoolRegistryEntry = {
  pool_id: string;
  pool_type: string;
  pool_address: string;
  display_name: string | null;
  asset_ids?: string[];
  pool_status: string;
  origin_surface: string;
  reward_status: string;
  reward_source: string;
  apy_source: string;
  lock_policy: string;
  risk_level: string;
  deposit_enabled: boolean;
  withdraw_enabled: boolean;
  claim_enabled: boolean;
  governance_enabled: boolean;
  source_table: string;
  source_contract: string | null;
  created_height: string | number | null;
  created_tx_hash: string | null;
  metadata_json?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

type PoolRegistryResponse = {
  ok?: boolean;
  pool?: PoolRegistryEntry | null;
  error?: string;
};

type RioExMarketResponse = {
  ok?: boolean;
  pair?: Record<string, any> | null;
  item?: Record<string, any> | null;
  error?: string;
};

type PairDetailResponse = {
  ok?: boolean;
  pair?: Record<string, any> | null;
  last_swap?: Record<string, any> | null;
  last_liquidity?: Record<string, any> | null;
  error?: string;
};

type ActivityRow = {
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
  ok?: boolean;
  count?: number;
  rows?: ActivityRow[];
  error?: string;
};

type AddressProofResponse = {
  ok?: boolean;
  address?: string;
  classification?: string;
  proof_status?: string;
  public_discovery?: boolean;
  registry_quality?: string;
  source?: {
    type?: string;
    upstream?: string;
    guarantees?: string[];
  };
  proof_sources?: {
    pool_registry?: boolean;
    riodex_pair?: boolean;
    liquidity_snapshots?: number;
    swaps?: number;
  };
  pool_registry?: PoolRegistryEntry | null;
  pair?: Record<string, any> | null;
  latest_liquidity?: Record<string, any> | null;
  latest_swap?: Record<string, any> | null;
  liquidity?: Record<string, any>[];
  swaps?: Record<string, any>[];
  error?: string;
};


function shellClass() {
  return "rounded-[32px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(15,22,48,0.72),rgba(28,9,24,0.90))] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8";
}

function cardClass() {
  return "rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";
}

function pillClass(kind: "truth" | "live" | "warn" | "neutral" = "neutral") {
  if (kind === "live") {
    return "rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200";
  }
  if (kind === "truth") {
    return "rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300";
  }
  if (kind === "warn") {
    return "rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200";
  }
  return "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75";
}

function buttonClass(primary = false, disabled = false) {
  if (disabled) {
    return "rounded-2xl border border-white/8 bg-black/20 px-4 py-2 text-sm font-medium text-white/38";
  }
  return primary
    ? "rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.12)] hover:bg-cyan-400/15"
    : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/[0.075]";
}

function shortAddr(value?: string | null, left = 14, right = 10) {
  const v = String(value || "").trim();
  if (!v) return "—";
  if (v.length <= left + right + 3) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

function prettify(value?: string | null, fallback = "—") {
  if (!value) return fallback;
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatUsd(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fromBaseUnits(value: unknown, decimals = 6) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n / 10 ** decimals;
}

function formatAmount(value: unknown, symbol = "", decimals = 6) {
  const n = fromBaseUnits(value, decimals);
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(n);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function Copyable({ value }: { value?: string | null }) {
  const v = String(value || "").trim();

  return (
    <button
      type="button"
      disabled={!v}
      onClick={() => {
        if (v) void navigator.clipboard?.writeText(v);
      }}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:text-white/35"
    >
      Copy
    </button>
  );
}

export default function RioExplorerAddressPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const resolvedAddress = useMemo(() => String(address || "").trim(), [address]);

  const [proof, setProof] = useState<AddressProofResponse | null>(null);
  const [pool, setPool] = useState<PoolRegistryEntry | null>(null);
  const [market, setMarket] = useState<Record<string, any> | null>(null);
  const [pair, setPair] = useState<Record<string, any> | null>(null);
  const [lastSwap, setLastSwap] = useState<Record<string, any> | null>(null);
  const [lastLiquidity, setLastLiquidity] = useState<Record<string, any> | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [liquidityRows, setLiquidityRows] = useState<Record<string, any>[]>([]);
  const [swapRows, setSwapRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedAddress) return;

    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const response = await fetch(
          `/api/rioexplorer/address/${encodeURIComponent(resolvedAddress)}`,
          { cache: "no-store", headers: { accept: "application/json" } }
        );

        const text = await response.text();
        const json = text ? (JSON.parse(text) as AddressProofResponse) : null;

        if (!response.ok || json?.ok === false) {
          throw new Error(json?.error || `Address proof HTTP ${response.status}`);
        }

        if (!alive) return;

        const nextPool = json?.pool_registry || null;
        const nextPair = json?.pair || null;
        const nextLastSwap = json?.latest_swap || null;
        const nextLastLiquidity = json?.latest_liquidity || null;
        const nextLiquidityRows = Array.isArray(json?.liquidity) ? json!.liquidity! : [];
        const nextSwapRows = Array.isArray(json?.swaps) ? json!.swaps! : [];

        setProof(json);
        setPool(nextPool);
        setPair(nextPair);
        setMarket(null);
        setLastSwap(nextLastSwap);
        setLastLiquidity(nextLastLiquidity);
        setLiquidityRows(nextLiquidityRows);
        setSwapRows(nextSwapRows);
        setActivity([]);

        if (json?.proof_status === "pending") {
          setErr("No indexed proof source was found for this address yet.");
        }
      } catch (e: any) {
        if (alive) {
          setErr(e?.message || "Failed to load address proof");
          setProof(null);
          setPool(null);
          setMarket(null);
          setPair(null);
          setLastSwap(null);
          setLastLiquidity(null);
          setLiquidityRows([]);
          setSwapRows([]);
          setActivity([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();

    return () => {
      alive = false;
    };
  }, [resolvedAddress]);

  const metadata = pool?.metadata_json || {};
  const displayName =
    pool?.display_name ||
    market?.displaySymbol ||
    market?.canonicalSymbol ||
    pair?.display_symbol ||
    proof?.address ||
    "Address Proof";

  const classification = proof?.classification === "pool_contract"
    ? "Pool / Liquidity Contract"
    : proof?.classification === "spherio_address_or_contract"
      ? "Spherio Address / Contract"
      : pool
        ? "Pool / Liquidity Contract"
        : String(resolvedAddress).startsWith("rio1")
          ? "Spherio Address / Contract"
          : "Unknown Identifier";

  const tvl = metadata.registry_liquidity_usd ?? metadata.liquidity_usd ?? market?.liquidityUsd ?? 0;
  const lpToken = String(metadata.lp_token_address || pair?.lp_token_address || "");
  const registryQuality = String(proof?.registry_quality || metadata.registry_quality || "standard");
  const registryQualityLabel =
    pool?.risk_level === "core" && pool?.pool_status === "live" && registryQuality === "standard"
      ? "Core Verified"
      : prettify(registryQuality);

  const proofStatusLabel = prettify(proof?.proof_status, pool ? "Resolved" : "Pending");

  const publicDiscovery = metadata.public_discovery === false ? "Hidden / Legacy" : "Public / Normal";

  const poolDirectoryHref = "/riodex/pools";
  const rioDexHref = "/riodex";
  const poolHref = `/riodex/pool/${encodeURIComponent(resolvedAddress)}`;
  const swapHref = `/riodex/swap?pair=${encodeURIComponent(resolvedAddress)}`;
  const depositHref = `/riodex/liquidity?pair=${encodeURIComponent(resolvedAddress)}&mode=add`;
  const rioExHref = `/rioex/markets/${encodeURIComponent(resolvedAddress)}`;

  const canTrade = !!pool && pool.pool_status === "live" && pool.deposit_enabled;
  const canDeposit = !!pool && pool.pool_status === "live" && pool.deposit_enabled;

  const latestReserve0 = lastLiquidity?.reserve_0 ?? liquidityRows[0]?.reserve_0 ?? null;
  const latestReserve1 = lastLiquidity?.reserve_1 ?? liquidityRows[0]?.reserve_1 ?? null;
  const latestTotalShare = lastLiquidity?.total_share ?? liquidityRows[0]?.total_share ?? null;
  const reserve0Symbol = String((pool?.metadata_json || {}).asset_0_symbol || "RIO");
  const reserve1Symbol = String((pool?.metadata_json || {}).asset_1_symbol || "RUSD");
  const readableReserve0 = latestReserve0 ? formatAmount(latestReserve0, reserve0Symbol) : "Pending";
  const readableReserve1 = latestReserve1 ? formatAmount(latestReserve1, reserve1Symbol) : "Pending";
  const readableTotalShare = latestTotalShare ? formatAmount(latestTotalShare, "LP") : "Pending";

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(99,102,241,0.14),transparent_30%),radial-gradient(circle_at_50%_105%,rgba(14,165,233,0.10),transparent_38%),linear-gradient(180deg,#020617_0%,#050914_48%,#020617_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className={shellClass()}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-300/80">
                RioExplorer • Address Proof
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
                {displayName}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={pillClass("truth")}>{classification}</span>
                {pool?.pool_status ? <span className={pillClass(pool.pool_status === "live" ? "live" : "warn")}>Status: {prettify(pool.pool_status)}</span> : null}
                {pool?.risk_level ? <span className={pillClass(pool.risk_level === "core" ? "truth" : pool.risk_level === "misclassified" ? "warn" : "neutral")}>Risk: {prettify(pool.risk_level)}</span> : null}
                <span className={pillClass(publicDiscovery.startsWith("Hidden") ? "warn" : "live")}>{publicDiscovery}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={pillClass(proof?.proof_sources?.pool_registry ? "live" : "neutral")}>Pool Registry {proof?.proof_sources?.pool_registry ? "Resolved" : "Pending"}</span>
                <span className={pillClass(proof?.proof_sources?.riodex_pair ? "live" : "neutral")}>RioDex Pair {proof?.proof_sources?.riodex_pair ? "Resolved" : "Pending"}</span>
                <span className={pillClass((proof?.proof_sources?.liquidity_snapshots || 0) > 0 ? "live" : "neutral")}>Liquidity Snapshots: {proof?.proof_sources?.liquidity_snapshots || 0}</span>
                <span className={pillClass("truth")}>Address Proof: {proofStatusLabel}</span>
              </div>

              <div className="mt-4 break-all font-mono text-sm text-white/68">
                {resolvedAddress}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={pillClass("truth")}>spheriochain.io/rioexplorer/address</span>
                <span className={pillClass(proof?.proof_status === "resolved" ? "live" : "warn")}>Proof: {proofStatusLabel}</span>
                <span className={pillClass("truth")}>Source-of-Truth Routed</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={poolDirectoryHref} className={buttonClass(false)}>Pool Directory</Link>
                <Link href={rioDexHref} className={buttonClass(false)}>RioDex</Link>
                <Copyable value={resolvedAddress} />
                {pool ? <Link href={poolHref} className={buttonClass(true)}>Open Pool Terminal</Link> : null}
                {pool ? <Link href={rioExHref} className={buttonClass(false)}>Open RioEx Market</Link> : null}
                {canTrade ? <Link href={swapHref} className={buttonClass(false)}>Swap</Link> : null}
                {canDeposit ? <Link href={depositHref} className={buttonClass(false)}>Deposit</Link> : null}
              </div>
            </div>

            <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[460px]">
              <div className={`${cardClass()} sm:col-span-2 border-cyan-300/18 bg-cyan-400/[0.06]`}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70">Public Proof Summary</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs text-white/45">TVL</div>
                    <div className="mt-1 text-2xl font-semibold text-white">{formatUsd(tvl)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/45">Reserve 0</div>
                    <div className="mt-1 text-sm font-semibold text-white">{readableReserve0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/45">Reserve 1</div>
                    <div className="mt-1 text-sm font-semibold text-white">{readableReserve1}</div>
                  </div>
                </div>
              </div>

              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">TVL / Registry Liquidity</div>
                <div className="mt-3 text-3xl font-semibold text-white">{formatUsd(tvl)}</div>
              </div>
              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Registry Quality</div>
                <div className="mt-3 text-xl font-semibold text-white">{registryQualityLabel}</div>
              </div>
              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">LP Token</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="break-all font-mono text-sm text-white">{lpToken ? shortAddr(lpToken) : "Pending"}</div>
                  {lpToken ? <Copyable value={lpToken} /> : null}
                </div>
              </div>
              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Source Table</div>
                <div className="mt-3 text-xl font-semibold text-white">{pool?.source_table || "Pending"}</div>
                <div className="mt-2 text-xs leading-5 text-white/50">
                  Liquidity snapshots: {proof?.proof_sources?.liquidity_snapshots || liquidityRows.length} · Swaps: {proof?.proof_sources?.swaps || swapRows.length}
                  <br />
                  Latest LP share: {readableTotalShare}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={shellClass()}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">Registry Proof</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">Pool / Contract Classification</div>
            </div>
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/65">
              Loading address proof...
            </div>
          ) : null}

          {err ? (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-100">
              {err}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className={cardClass()}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Pool Type</div>
              <div className="mt-3 text-xl font-semibold text-white">{prettify(pool?.pool_type, "Unknown")}</div>
              <div className="mt-2 text-sm text-white/55">Origin: {prettify(pool?.origin_surface, "Unknown")}</div>
            </div>

            <div className={cardClass()}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Rewards / APY</div>
              <div className="mt-3 text-xl font-semibold text-white">{prettify(pool?.reward_status, "Pending")}</div>
              <div className="mt-2 text-sm text-white/55">Source: {pool?.reward_source || "none"} · APY: {pool?.apy_source || "none"}</div>
            </div>

            <div className={cardClass()}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Governance / Locks</div>
              <div className="mt-3 text-xl font-semibold text-white">{prettify(pool?.lock_policy, "Not Configured")}</div>
              <div className="mt-2 text-sm text-white/55">Gov {pool?.governance_enabled ? "enabled" : "disabled"} · Claim {pool?.claim_enabled ? "enabled" : "disabled"}</div>
            </div>
          </div>
        </section>

        <section className={shellClass()}>
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">Liquidity Evidence</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">Indexed Reserve Snapshots</div>
            <p className="mt-2 text-sm leading-7 text-white/60">
              Reserve proof is resolved from the normalized RioExplorer address proof API and anchored to indexed RioDex liquidity snapshots.
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.18em] text-white/45">
                <tr>
                  <th className="px-4 py-3">Height</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Reserve 0</th>
                  <th className="px-4 py-3">Reserve 1</th>
                  <th className="px-4 py-3">Total Share</th>
                  <th className="px-4 py-3">LP Token</th>
                </tr>
              </thead>
              <tbody>
                {liquidityRows.slice(0, 8).map((row, idx) => (
                  <tr key={`${row.block_height || idx}-${row.block_time || idx}`} className="border-t border-white/8">
                    <td className="px-4 py-3 text-white/70">{row.block_height || row.height || "—"}</td>
                    <td className="px-4 py-3 text-white/70">{formatDateTime(row.block_time || row.time)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{formatAmount(row.reserve_0, reserve0Symbol)}</div>
                      <div className="mt-1 font-mono text-[11px] text-white/40">{String(row.reserve_0 || "—")}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{formatAmount(row.reserve_1, reserve1Symbol)}</div>
                      <div className="mt-1 font-mono text-[11px] text-white/40">{String(row.reserve_1 || "—")}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white/80">{formatAmount(row.total_share, "LP")}</div>
                      <div className="mt-1 font-mono text-[11px] text-white/35">{String(row.total_share || "—")}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-200">{row.lp_token_address ? shortAddr(row.lp_token_address, 10, 8) : "—"}</td>
                  </tr>
                ))}

                {!liquidityRows.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-white/45">
                      No liquidity snapshots resolved for this address yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className={shellClass()}>
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">Activity Evidence</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">Indexed Activity</div>
            <p className="mt-2 text-sm leading-7 text-white/60">
              Activity rows are resolved from RioExplorer’s indexed activity feed where this address appears as a subject, counterparty, route, or proof reference. If no rows appear yet, the registry and liquidity snapshot proof above remains authoritative.
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.18em] text-white/45">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Height</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Tx</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr key={`${row.tx_hash}-${row.height}-${row.activity_type}`} className="border-t border-white/8">
                    <td className="px-4 py-3 text-white/70">{formatDateTime(row.time)}</td>
                    <td className="px-4 py-3 text-white/70">{row.height}</td>
                    <td className="px-4 py-3 text-white">{prettify(row.activity_type)}</td>
                    <td className="px-4 py-3 text-white/70">{row.source_module}</td>
                    <td className="px-4 py-3">
                      <Link href={`/rioexplorer/tx/${encodeURIComponent(row.tx_hash)}`} className="font-mono text-cyan-200 hover:text-cyan-100">
                        {shortAddr(row.tx_hash, 10, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white/70">{row.status}</td>
                  </tr>
                ))}

                {!activity.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-white/45">
                      No indexed activity rows reference this address yet. The address is still classified from registry and market truth; activity proof will appear here when the indexer emits address-linked rows.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className={cardClass()}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Last Swap</div>
              <div className="mt-3 text-sm leading-6 text-white/70">
                {lastSwap ? JSON.stringify(lastSwap).slice(0, 220) : "No latest swap row indexed for this address yet. This pool is live from registry and liquidity proof, but swap activity remains pending until indexed swaps exist."}
              </div>
            </div>
            <div className={cardClass()}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Last Liquidity</div>
              <div className="mt-3 text-sm leading-6 text-white/70">
                {lastLiquidity ? JSON.stringify(lastLiquidity).slice(0, 220) : "No latest liquidity row indexed for this address yet. Liquidity proof remains anchored by pool registry and normalized reserve snapshots."}
              </div>
            </div>
            <div className={cardClass()}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Market Truth</div>
              <div className="mt-3 text-sm leading-6 text-white/70">
                {market ? "RioEx market registry resolved for this address and linked to this proof surface." : "No RioEx market registry row resolved yet."}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
