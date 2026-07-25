import { RioLightPortfolioPanel } from "@/components/riolight/RioLightPortfolioPanel";

const RIO_LOGO =
  "/icons/riolight-official-rio.png";

export default function RioLightPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_32%),linear-gradient(180deg,#040711_0%,#07111f_48%,#040711_100%)] px-5 py-8 text-white md:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/25 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img
              src={RIO_LOGO}
              alt="RioLight"
              className="h-12 w-12 rounded-2xl border border-amber-300/25 bg-black/40"
            />
            <div>
              <div className="text-lg font-semibold tracking-[0.18em]">
                RIOLIGHT PORTFOLIO
              </div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                Connected Account View
              </div>
            </div>
          </div>

          <div className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
            Extension-Controlled
          </div>
        </header>

        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_90px_-50px_rgba(0,0,0,0.9)] backdrop-blur-xl md:p-8">
          <div className="max-w-4xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200/75">
              Portfolio Layer
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              RioLight Portfolio shows your connected Spherio account.
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-white/62">
              This page displays connected account state, balances, activity, and approval surfaces.
              Wallet secrets, unlock, recovery phrases, and signing approvals remain inside the
              RioLight browser extension.
            </p>
          </div>

          <div className="mt-8">
            <RioLightPortfolioPanel />
          </div>
        </section>
      </section>
    </main>
  );
}
