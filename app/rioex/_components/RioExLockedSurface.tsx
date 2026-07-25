import Link from "next/link";

type RioExLockedSurfaceProps = {
  title: string;
  eyebrow: string;
  status: "locked" | "pending";
  description: string;
  requirements: string[];
  nextStep: string;
};

export default function RioExLockedSurface({
  title,
  eyebrow,
  status,
  description,
  requirements,
  nextStep,
}: RioExLockedSurfaceProps) {
  const badgeClass =
    status === "locked"
      ? "border-amber-300/30 bg-amber-400/10 text-amber-200"
      : "border-cyan-300/30 bg-cyan-400/10 text-cyan-100";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_90%_4%,rgba(245,158,11,0.10),transparent_22%),linear-gradient(180deg,#06090f_0%,#060914_42%,#03050b_100%)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/rioex"
          className="inline-flex items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 hover:bg-cyan-400/15"
        >
          ← Back to RioEx
        </Link>

        <section className="mt-6 rounded-[32px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(8,20,46,0.94),rgba(7,10,28,0.98))] p-6 shadow-[0_24px_90px_rgba(8,145,178,0.16)] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">
                {eyebrow}
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                {description}
              </p>
            </div>

            <span className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${badgeClass}`}>
              {status}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
                Requirements before activation
              </div>
              <div className="mt-4 grid gap-3">
                {requirements.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-300/15 bg-emerald-400/[0.045] p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200/75">
                Next production step
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-emerald-100">
                {nextStep}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
