const biologyLabs = [
  "Cell structure explorer",
  "Genetics probability lab",
  "Photosynthesis model",
  "Human body systems",
  "Ecology population simulation",
];

export default function BiologyLabPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[34px] border border-emerald-300/20 bg-white/[0.045] p-7">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-200">
            Biology Lab
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Model life systems, cells, genetics, and ecology
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
            Mock runtime for biology diagrams, simulations, and exam-ready lab explanations.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {biologyLabs.map((lab) => (
            <div key={lab} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-lg font-semibold">{lab}</div>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Scaffold-ready biology experiment.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
