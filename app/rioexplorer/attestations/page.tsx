"use client";

import Link from "next/link";

function shellClass() {
  return "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(37,10,24,0.82),rgba(10,9,18,0.94))] p-5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-6";
}

function cardClass() {
  return "rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 backdrop-blur-xl";
}

function buttonClass(primary = false) {
  return primary
    ? "rounded-2xl border border-fuchsia-400/28 bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(157,23,77,0.18))] px-4 py-2 text-sm font-semibold text-white"
    : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/90";
}

function pillClass(kind: "bootstrap" | "transitional" | "full") {
  if (kind === "bootstrap") {
    return "rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200";
  }
  if (kind === "transitional") {
    return "rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300";
  }
  return "rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200";
}

const phases = [
  {
    phase: "Phase 1",
    regime: "Bootstrap",
    coverageTarget: "Below over-collateralization",
    reserveModel: "Controlled bootstrap backing",
    explorerEvidence: "Treasury flows, mint/burn traces, reserve notes",
    status: "Bootstrap",
    badge: "bootstrap" as const,
    details: [
      "Effective range: bootstrap phase until collateral framework expansion",
      "Mint policy: controlled bootstrap issuance",
      "Burn policy: policy-governed contraction / redemption handling",
      "Treasury / reserve route: protocol treasury and reserve-linked evidence",
      "Evidence links: treasury flows, mint / burn records, reserve notes",
      "Attestation reference: bootstrap operational attestations",
      "Operator note: not yet presented as full over-collateralized institutional reserve state",
    ],
  },
  {
    phase: "Phase 2",
    regime: "Transitional Collateralization",
    coverageTarget: "Rising / policy-defined",
    reserveModel: "Partial collateralization",
    explorerEvidence: "Reserve snapshots, treasury routing, mint/burn, attestation updates",
    status: "Transitional",
    badge: "transitional" as const,
    details: [
      "Effective range: transition from bootstrap to institutional reserve maturity",
      "Mint policy: constrained expansion under collateral policy thresholds",
      "Burn policy: active supply contraction visibility",
      "Treasury / reserve route: reserve snapshots with routing continuity",
      "Evidence links: reserve updates, mint / burn ledger, treasury movements",
      "Attestation reference: transitional reserve attestations",
      "Operator note: collateralization improving but not yet the full institutional target state",
    ],
  },
  {
    phase: "Phase 3",
    regime: "Full Institutional",
    coverageTarget: "120%",
    reserveModel: "Over-collateralized T-bill / RWA-backed model",
    explorerEvidence: "Reserve proof, treasury evidence, attestation records, mint/burn continuity",
    status: "Full",
    badge: "full" as const,
    details: [
      "Effective range: full institutional reserve maturity",
      "Mint policy: issuance bounded by fully monitored reserve policy",
      "Burn policy: transparent contraction and redemption auditability",
      "Treasury / reserve route: over-collateralized reserve and treasury evidence",
      "Evidence links: reserve proof, treasury evidence, mint / burn continuity",
      "Attestation reference: formal institutional attestation record",
      "Operator note: target state for full RUSD maturity with 120% reserve framing",
    ],
  },
];

export default function RioExplorerAttestationsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(157,23,77,0.12),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className={shellClass()}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                RioExplorer • Attestations
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                RUSD Attestation & Reserve Evolution
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">
                Narrative and policy framing belong in the RUSD terminal. This explorer surface is for reserve-proof,
                treasury evidence, mint/burn continuity, and auditable phase progression.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/rioexplorer" className={buttonClass(false)}>
                Back to Explorer
              </Link>
            </div>
          </div>
        </section>

        <section className={shellClass()}>
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Attestation Table
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/15">
            <div className="grid grid-cols-[0.75fr_1fr_1fr_1.1fr_1.5fr_0.8fr] gap-4 border-b border-white/8 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <div>Phase</div>
              <div>Regime</div>
              <div>Coverage Target</div>
              <div>Reserve Model</div>
              <div>Explorer Evidence</div>
              <div>Status</div>
            </div>

            <div className="divide-y divide-white/8">
              {phases.map((row) => (
                <div key={row.phase}>
                  <div className="grid grid-cols-[0.75fr_1fr_1fr_1.1fr_1.5fr_0.8fr] gap-4 px-6 py-4 text-sm text-white/80">
                    <div className="font-semibold text-white">{row.phase}</div>
                    <div>{row.regime}</div>
                    <div>{row.coverageTarget}</div>
                    <div>{row.reserveModel}</div>
                    <div>{row.explorerEvidence}</div>
                    <div>
                      <span className={pillClass(row.badge)}>{row.status}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/6 px-6 py-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {row.details.map((detail) => (
                        <div key={detail} className={cardClass()}>
                          <div className="text-sm leading-7 text-white/70">{detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
