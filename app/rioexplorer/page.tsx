"use client";

import Link from "next/link";

function shellClass() {
  return "rounded-[32px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(15,22,48,0.72),rgba(28,9,24,0.90))] p-6 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-8";
}

function cardClass() {
  return "rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";
}

function actionClass(primary = false, disabled = false) {
  if (disabled) {
    return "rounded-2xl border border-white/8 bg-black/20 px-4 py-2 text-sm font-medium text-white/38";
  }
  return primary
    ? "rounded-2xl border border-fuchsia-400/30 bg-[linear-gradient(180deg,rgba(236,72,153,0.28),rgba(124,58,237,0.18))] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(217,70,239,0.18)]"
    : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/90";
}

function pillClass(kind: "truth" | "live" | "plan" = "truth") {
  if (kind === "live") {
    return "rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200";
  }
  if (kind === "plan") {
    return "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75";
  }
  return "rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300";
}

type ExplorerTile = {
  title: string;
  description: string;
  href?: string;
  status: "live" | "next";
  tag: string;
};

function ExplorerTileCard({ tile }: { tile: ExplorerTile }) {
  const body = (
    <div className={`${cardClass()} h-full transition hover:border-cyan-400/18 hover:shadow-[0_0_30px_rgba(34,211,238,0.08)]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{tile.tag}</div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-white">{tile.title}</div>
        </div>
        <span className={pillClass(tile.status === "live" ? "live" : "plan")}>
          {tile.status === "live" ? "Active" : "Next"}
        </span>
      </div>

      <div className="mt-3 text-sm leading-7 text-white/68">{tile.description}</div>

      <div className="mt-5">
        <span className={actionClass(!!tile.href, !tile.href)}>
          {tile.href ? "Open Surface" : "Planned Surface"}
        </span>
      </div>
    </div>
  );

  return tile.href ? <Link href={tile.href}>{body}</Link> : body;
}

export default function RioExplorerHome() {
  const activeTiles: ExplorerTile[] = [
    {
      title: "Blocks / Transactions",
      description:
        "Live chain visibility evolving into accountable explorer truth with authoritative activity routing and transaction-level investigation.",
      href: "/rioexplorer/blocks",
      status: "live",
      tag: "Core Accountability",
    },
    {
      title: "SPO-20 Registry",
      description:
        "Issued-token registry surface for token discovery, creation lineage, holder investigation, and activity traceability.",
      href: "/rioexplorer/spo20",
      status: "live",
      tag: "Asset Registry",
    },
  ];

  const coreTiles: ExplorerTile[] = [
    { title: "Accounts", description: "Address-level investigation for balances, counterparties, touched contracts, asset flows, and timelines.", status: "next", tag: "Investigation" },
    { title: "Contracts", description: "Contract verification, execution traceability, code lineage, instantiated modules, and route evidence.", status: "next", tag: "Execution" },
    { title: "Assets", description: "Explorer-grade RIO, RUSD, and future asset pages with transfers, holders, mint and burn records, and route linkage.", status: "next", tag: "Asset Truth" },
    { title: "Attestations", description: "Reserve-proof and collateral-evidence layer for RUSD. Narrative stays in RUSD terminal; proof lives here.", href: "/rioexplorer/attestations", status: "live", tag: "Reserve Proof" },
    { title: "Search", description: "Unified search across tx hash, block height, address, contract, token, and launch identifiers.", status: "next", tag: "Discovery" },
    { title: "Launch Traceability", description: "CreateToken, Pump.live, launch graduation, and future issuance events should resolve into explorer evidence.", status: "next", tag: "Launch Accountability" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_18%),radial-gradient(circle_at_82%_15%,rgba(217,70,239,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className={shellClass()}>
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-300/80">
                RioExplorer • Accountable Layer
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
                SpherioChain Explorer
              </h1>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">
                RioExplorer is the accountable layer of the chain. It should resolve blocks, transactions,
                accounts, assets, contracts, launches, treasury routing, and reserve evidence into one institutional investigation surface.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className={pillClass("truth")}>Truth Model First</span>
                <span className={pillClass("live")}>Blocks Active</span>
                <span className={pillClass("live")}>SPO-20 Active</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/rioexplorer/blocks" className={actionClass(true)}>Open Blocks / Transactions</Link>
                <Link href="/rioexplorer/spo20" className={actionClass(false)}>Open SPO-20</Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Chain Context</div>
                <div className="mt-4 space-y-4 text-sm leading-7 text-white/72">
                  <div>
                    <span className="font-semibold text-white">RIO</span> — native asset of SpherioChain; fixed total supply of <span className="font-semibold text-white">300,000,000</span>, fully minted, validator-bootstrapped network asset.
                  </div>
                  <div>
                    <span className="font-semibold text-white">RUSD</span> — stable unit with explorer-auditable reserve, treasury, mint, burn, and attestation evidence.
                  </div>
                </div>
              </div>

              <div className={cardClass()}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Connected Utility Stack</div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-white/72">
                  <div>RioTelecom</div>
                  <div>RioEdge</div>
                  <div>RioPay</div>
                  <div>RioStream</div>
                  <div>RioMind</div>
                  <div>RioEnterprise</div>
                  <div>RioCommerce</div>
                  <div>RioDNS</div>
                  <div className="sm:col-span-2 text-white/52">
                    RioBet only neutrally where on-chain settlement proof is relevant.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={shellClass()}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">Active Surfaces</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">Current Explorer Truth</div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {activeTiles.map((tile) => (
              <ExplorerTileCard key={tile.title} tile={tile} />
            ))}
          </div>
        </section>

        <section className={shellClass()}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">Core RioExplorer</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">Accountable Expansion Map</div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {coreTiles.map((tile) => (
              <ExplorerTileCard key={tile.title} tile={tile} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
