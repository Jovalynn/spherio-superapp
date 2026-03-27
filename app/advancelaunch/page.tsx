// app/advancelaunch/page.tsx
import Link from "next/link";

function Card({
  title,
  subtitle,
  bullets,
  href,
  cta,
  badge,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  href: string;
  cta: string;
  badge?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_70px_-55px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/80">
          AdvancedLaunch
        </div>
        {badge ? (
          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-200">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-2 text-xl font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-slate-200/90">{subtitle}</div>

      <ul className="mt-5 space-y-2 text-sm text-slate-200/90">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-slate-300/70" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-300/80">
          Institutional mode • Policy gated
        </div>
        <Link
          href={href}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15 active:bg-white/10"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

export default function AdvancedLaunchHome() {
  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#060B16] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background:radial-gradient(1100px_circle_at_50%_0%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(900px_circle_at_20%_70%,rgba(16,185,129,0.10),transparent_60%),radial-gradient(900px_circle_at_80%_70%,rgba(245,158,11,0.10),transparent_60%)]" />

      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-300/80">
            Issuer Console
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            AdvancedLaunch
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200/90">
            Hybrid Launch is the default issuance workflow. Presale-only and Fair-only
            will be added soon as advanced toggles inside Hybrid.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-slate-200/90">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300/70">
              Safety Notice
            </div>
            <div className="mt-2 text-sm leading-relaxed">
              Launches can be used for impersonation or fraud. Spherio does not verify issuers by default.
              Always verify{" "}
              <span className="font-semibold text-white">
                contract address, issuer wallet, and terms
              </span>{" "}
              before participating.
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card
            title="Hybrid Launch"
            subtitle="A single, opinionated flow combining presale discipline and fair-launch clarity."
            bullets={[
              "Issuer configuration + participant policy gates",
              "Optional allowlist (default OFF) for controlled access",
              "Mandatory confirmation gate + anti-fraud disclosure layer",
            ]}
            href="/advancelaunch/hybrid"
            cta="Open Hybrid"
            badge=""
          />

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/80">
              Roadmap
            </div>
            <div className="mt-2 text-xl font-semibold text-white">
              soon toggles
            </div>
            <div className="mt-2 text-sm text-slate-200/90">
              Presale-only and Fair-only will appear as advanced toggles inside Hybrid.
              This keeps the navigation clean and optimizes for fastest RIO adoption.
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-300/80">
          CreateToken remains the meme/retail launcher. AdvancedLaunch is the institutional issuer console.
        </div>
      </div>
    </div>
  );
}
