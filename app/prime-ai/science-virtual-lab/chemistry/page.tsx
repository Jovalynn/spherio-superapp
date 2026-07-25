const chemistryLabs = [
  "Acid-base titration",
  "Organic reaction pathway",
  "Mole calculation lab",
  "Periodic trend explorer",
  "Chemical bonding model",
];

export default function ChemistryLabPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[34px] border border-amber-300/20 bg-white/[0.045] p-7">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-amber-200">
            Chemistry Lab
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Explore reactions, calculations, and molecular concepts
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
            Mock runtime for chemistry simulations, guided reaction explanations, and lab reporting.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chemistryLabs.map((lab) => (
            <div key={lab} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-lg font-semibold">{lab}</div>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Scaffold-ready chemistry experiment.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
