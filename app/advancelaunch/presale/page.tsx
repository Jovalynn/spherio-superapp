// app/advancelaunch/presale/page.tsx
import Link from "next/link";

export default function PresaleLaunchPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#060B16] text-white">
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/80">
              AdvancedLaunch
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Presale Launch
            </h1>
            <p className="mt-2 text-sm text-slate-200/90">
              Institutional presale workflow. (Scaffold page — execution logic to be added next.)
            </p>
          </div>

          <Link
            href="/advancelaunch"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
          >
            Back
          </Link>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="text-sm font-bold text-white">Issuer Controls</div>
          <div className="mt-2 text-sm text-slate-200/90">
            Coming next: presale terms, caps, allowlist, allocation schedule, disclosures,
            and confirmation gates.
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300/70">
              Anti-fraud disclosure
            </div>
            <div className="mt-2 text-sm leading-relaxed text-slate-200/90">
              Presale terms are issuer-provided and may be misleading. Participants must verify{" "}
              <span className="font-semibold text-white">
                issuer wallet, contract addresses, and launch terms
              </span>{" "}
              independently.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
