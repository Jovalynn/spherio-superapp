// app/spo-20/page.tsx
export default function Spo20Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10 shadow-2xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="flex flex-col gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            SDK + Token Standard
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-white">
            SPO-20 Standard
          </h1>

          <p className="max-w-3xl text-slate-300">
            SpherioChain token standard (ERC-20 analogue) designed for sovereign-grade issuance.
            SPO-20 is both a specification and an SDK for teams to scaffold production tokens,
            registries, and fee-aware issuance flows.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#quickstart"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow"
            >
              Developer Quickstart
            </a>
            <a
              href="#economics"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
            >
              Economics & Fees
            </a>
            <a
              href="#scaffold"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
            >
              Scaffold a Project
            </a>
          </div>
        </div>
      </div>

      {/* FEATURE GRID */}
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">Standard</div>
          <div className="mt-2 text-sm text-slate-300">
            Predictable interfaces: metadata, supply, mint/burn policy, admin, allowances.
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Goal: auditability + compatibility.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">SDK</div>
          <div className="mt-2 text-sm text-slate-300">
            Client helpers, schema types, scaffolding templates, and integration patterns
            for indexers and dashboards.
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Goal: teams ship fast without compromising structure.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">Scaffold</div>
          <div className="mt-2 text-sm text-slate-300">
            CreateToken-ready projects: token factory, registry hooks, fee routing, and UI presets.
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Goal: “build like Spherio” with guardrails.
          </div>
        </div>
      </div>

      {/* ECONOMICS */}
      <div id="economics" className="mt-10 rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-8">
        <h2 className="text-2xl font-semibold text-white">Economics & Fee Discipline</h2>
        <p className="mt-2 text-sm text-slate-300 max-w-3xl">
          SPO-20 issuance is fee-aware. CreateToken flows pay issuance fees in RIO, designed to route
          to protocol treasury. This creates an accountable economic loop: issuance → treasury revenue → ecosystem funding.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-400">Issuance Fee</div>
            <div className="mt-1 text-lg font-semibold text-white">1 RIO (example)</div>
            <div className="mt-2 text-xs text-slate-400">
              Final amount comes from chain params / factory policy.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-400">Routing</div>
            <div className="mt-1 text-lg font-semibold text-white">Treasury</div>
            <div className="mt-2 text-xs text-slate-400">
              Routed by module/contract implementation (not UI).
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-400">Transparency</div>
            <div className="mt-1 text-lg font-semibold text-white">On-chain</div>
            <div className="mt-2 text-xs text-slate-400">
              Every issuance event is indexable + auditable.
            </div>
          </div>
        </div>
      </div>

      {/* QUICKSTART */}
      <div id="quickstart" className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold text-white">Developer Quickstart</h2>
          <p className="mt-2 text-sm text-slate-300">
            Scaffold a SPO-20 token project and wire it into Spherio dashboards.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-xs text-slate-200">
            <div>$ npx spo20 init my-token</div>
            <div>$ cd my-token</div>
            <div>$ pnpm dev</div>
          </div>

          <div className="mt-5 text-xs text-slate-400">
            (Placeholder commands — we’ll formalize once the SDK package name is locked.)
          </div>
        </div>

        <div id="scaffold" className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold text-white">Scaffold like Spherio</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Token factory interface + fee policy</li>
            <li>• Registry + symbol uniqueness patterns</li>
            <li>• Indexer endpoints (supply, holders, transfers)</li>
            <li>• Dashboard templates (institutional UI defaults)</li>
            <li>• Governance/admin controls (audit posture)</li>
          </ul>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            SPO-20 is not “just a token”. It is a <span className="font-semibold text-white">system</span>:
            issuance, registry, fees, indexing, and governance — shipped as a standard SDK.
          </div>
        </div>
      </div>
    </div>
  );
}
