import React from "react";

const RIO_LOGO =
  "https://avatars.githubusercontent.com/u/175851528?s=400&u=b0c1a871d1e739566c4c2bf96a97720fedfc03ab&v=4";

const RUSD_LOGO =
  "https://raw.githubusercontent.com/Lerivee/RUSD/refs/heads/main/Untitled%20design.png";

const SPHERIO_APP_URL = "https://app.spheriochain.io";
const SPHERIO_APP_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(
  SPHERIO_APP_URL,
)}`;

const productLinks = [
  {
    name: "Spherio App",
    href: "https://app.spheriochain.io",
    description: "Unified command surface for SpherioChain infrastructure.",
  },
  {
    name: "Pump.live",
    href: "https://pump.spheriochain.io",
    description: "Retail launch rail with bonding, graduation, and RioDex routing.",
  },
  {
    name: "Prime",
    href: "https://prime.spheriochain.io",
    description: "Institutional launch rail for structured issuer-grade token creation.",
  },
  {
    name: "RioDex",
    href: "https://dex.spheriochain.io",
    description: "On-chain liquidity, swap, pool, and market execution layer.",
  },
  {
    name: "RioEx",
    href: "https://exchange.spheriochain.io",
    description: "Asset intelligence, markets, and exchange-style discovery surface.",
  },
  {
    name: "RioExplorer",
    href: "https://explorer.spheriochain.io",
    description: "Explorer and proof layer for blocks, tokens, pairs, and transactions.",
  },
];

const infrastructure = [
  {
    title: "Sovereign Layer 1",
    body: "Cosmos-native blockchain infrastructure designed around RIO, RUSD, SPO-20 assets, on-chain execution, and validator-secured state.",
  },
  {
    title: "Truth-First Indexer",
    body: "A PostgreSQL-backed indexing layer powering RioDex, RioEx, RioExplorer, Pump, Prime, and terminal-grade dashboards.",
  },
  {
    title: "Launch Infrastructure",
    body: "Pump.live and Prime provide two separate launch rails: retail bonding-curve launches and institutional issuer-grade launches.",
  },
  {
    title: "Market Execution",
    body: "RioDex provides swap, liquidity, pool, screener, and route-ready execution surfaces for RIO, RUSD, SPO-20, and future assets.",
  },
  {
    title: "Public Domain Layer",
    body: "Cloudflare-backed public surfaces now route app, pump, prime, dex, explorer, and future Spherio services through secure HTTPS.",
  },
  {
    title: "Mainnet Preparation",
    body: "Validator, RPC, REST, explorer, indexer, and monitoring systems are being aligned for production-grade deployment.",
  },
];

const networkReadiness = [
  {
    title: "Validator-ready architecture",
    body: "SpherioChain is designed around validator-secured consensus, staking state, registry visibility, and mainnet validator onboarding.",
  },
  {
    title: "RPC and REST access",
    body: "Public endpoint routing is prepared for application access, wallet integration, explorers, and chain data services.",
  },
  {
    title: "Indexer proof layer",
    body: "The indexer provides the data foundation for token records, liquidity state, swaps, launches, and explorer visibility.",
  },
  {
    title: "Launch-to-market flow",
    body: "Pump and Prime launches are designed to graduate into RioDex, RioEx, and RioExplorer surfaces through source-of-truth state.",
  },
  {
    title: "Monetary dashboards",
    body: "RIO and RUSD terminals are positioned to expose supply, liquidity, reserve, staking, and protocol-level monetary signals.",
  },
  {
    title: "Production posture",
    body: "Cloudflare HTTPS, Dockerized services, NGINX routing, Postgres indexing, and monitoring form the current deployment base.",
  },
];

function ShellCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_90px_-50px_rgba(0,0,0,0.9)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/75">
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
      {children}
    </span>
  );
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-white/35">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs leading-5 text-white/45">{helper}</div>
    </div>
  );
}

export default function SpherioChainWebsite() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_30%),linear-gradient(180deg,#050711_0%,#07101d_48%,#050711_100%)] text-white">
      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/25 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img
              src={RIO_LOGO}
              alt="RIO logo"
              className="h-11 w-11 rounded-2xl border border-amber-300/25 bg-black/30"
            />
            <div>
              <div className="text-sm font-semibold tracking-[0.22em]">
                SPHERIOCHAIN
              </div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                Sovereign Infrastructure
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Pill>Public HTTPS Live</Pill>
            <Pill>Cloudflare Tunnel</Pill>
            <Pill>Devnet</Pill>
          </div>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1.15fr_0.85fr]">
          <ShellCard className="overflow-hidden p-7 md:p-9">
            <Eyebrow>Overview</Eyebrow>

            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
              SpherioChain is a sovereign Layer 1 infrastructure network for
              launches, markets, assets, and proof.
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-white/62">
              SpherioChain connects chain-native assets, token issuance,
              exchange-grade liquidity, explorer records, and institutional
              dashboards through one truth-first indexer and one public
              ecosystem surface.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://app.spheriochain.io"
                className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
              >
                Open Superapp
              </a>
              <a
                href="https://pump.spheriochain.io"
                className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15 px-5 py-3 text-sm font-semibold text-fuchsia-100 hover:bg-fuchsia-500/20"
              >
                Launch on Pump.live
              </a>
              <a
                href="https://prime.spheriochain.io"
                className="rounded-full border border-amber-300/30 bg-amber-500/15 px-5 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-500/20"
              >
                Launch on Prime
              </a>
            </div>
          </ShellCard>

          <ShellCard className="p-6">
            <Eyebrow>Monetary layer</Eyebrow>

            <div className="mb-5 rounded-3xl border border-cyan-300/15 bg-cyan-500/10 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="rounded-2xl border border-white/10 bg-white p-2 shadow-[0_18px_60px_-35px_rgba(34,211,238,0.85)]">
                  <img
                    src={SPHERIO_APP_QR_URL}
                    alt="QR code for app.spheriochain.io"
                    className="h-28 w-28 rounded-xl"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                    RioLight Access QR
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Connect with RioLight
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    Scan from another device to open the public app route, then connect using the RioLight extension.
                  </p>
                  <a
                    href={SPHERIO_APP_URL}
                    className="mt-3 inline-flex text-xs font-semibold text-cyan-100 underline decoration-cyan-300/40 underline-offset-4"
                  >
                    {SPHERIO_APP_URL}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-3xl border border-amber-300/15 bg-amber-500/10 p-5">
                <div className="flex items-center gap-3">
                  <img
                    src={RIO_LOGO}
                    alt="RIO"
                    className="h-12 w-12 rounded-2xl"
                  />
                  <div>
                    <div className="text-xl font-semibold">RIO</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Real-World Interconnected On-chain
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/58">
                  Native gas, staking, liquidity, fee, and ecosystem utility
                  asset for SpherioChain.
                </p>
              </div>

              <div className="rounded-3xl border border-cyan-300/15 bg-cyan-500/10 p-5">
                <div className="flex items-center gap-3">
                  <img
                    src={RUSD_LOGO}
                    alt="RUSD"
                    className="h-12 w-12 rounded-2xl"
                  />
                  <div>
                    <div className="text-xl font-semibold">RUSD</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Spherio stable settlement asset
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/58">
                  Stable settlement and reference asset used across dashboards,
                  liquidity, markets, and future collateral phases.
                </p>
              </div>
            </div>
          </ShellCard>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric
            label="Public domains"
            value="Live"
            helper="App, Pump, Prime, Dex, and Explorer are reachable through Cloudflare HTTPS."
          />
          <Metric
            label="Launch rails"
            value="2"
            helper="Pump.live for retail launches and Prime for institutional issuance."
          />
          <Metric
            label="Market layer"
            value="RioDex"
            helper="Swap, liquidity, pools, screener, and execution routing."
          />
          <Metric
            label="Proof layer"
            value="RioExplorer"
            helper="Explorer records for chain, token, liquidity, and transaction truth."
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <ShellCard className="p-7">
            <Eyebrow>Infrastructure</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold">
              Built around one authoritative truth layer.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/58">
              Spherio is designed so launches, pairs, assets, liquidity,
              swaps, and explorer records resolve through indexed source-of-truth
              state instead of disconnected UI assumptions.
            </p>

            <div className="mt-6 grid gap-3">
              {infrastructure.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-white/54">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </ShellCard>

          <ShellCard className="p-7">
            <Eyebrow>Ecosystem surfaces</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold">
              Public product domains for every major Spherio surface.
            </h2>

            <div className="mt-6 grid gap-3">
              {productLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-500/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-cyan-200/70 group-hover:text-cyan-100">
                      Open →
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/54">
                    {item.description}
                  </p>
                  <div className="mt-2 break-all font-mono text-xs text-white/35">
                    {item.href}
                  </div>
                </a>
              ))}
            </div>
          </ShellCard>
        </section>

        <section className="mt-8">
          <ShellCard className="p-7">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
              <div>
                <Eyebrow>Network readiness</Eyebrow>
                <h2 className="mt-3 text-3xl font-semibold">
                  Validator, endpoint, indexer, and market infrastructure for a
                  public Layer 1 ecosystem.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/58">
                  SpherioChain is being prepared as a sovereign blockchain
                  network with validator-secured state, public endpoints,
                  market execution, launch rails, explorer proof, and
                  institutional monitoring surfaces.
                </p>

                <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100/85">
                  Validator counts and mainnet participation should be displayed
                  from live registry/indexer data once production validator
                  onboarding is complete.
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {networkReadiness.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="text-sm font-semibold text-white">
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/56">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ShellCard>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-white/40">
          <div>
            © {new Date().getFullYear()} SpherioChain. Sovereign infrastructure
            for on-chain markets.
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:info@spheriochain.io" className="hover:text-white">
              info@spheriochain.io
            </a>
            <a href="https://spheriochain.io" className="hover:text-white">
              spheriochain.io
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
}
