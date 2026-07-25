const physicsLabs = [
  "Newton's laws simulation",
  "Projectile motion model",
  "Electric circuits lab",
  "Wave speed experiment",
  "Energy conservation model",
];

export default function PhysicsLabPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[34px] border border-cyan-300/20 bg-white/[0.045] p-7">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
            Physics Lab
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Simulate motion, energy, waves, and circuits
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
            Mock runtime for guided physics experiments, calculations, and lab reports.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {physicsLabs.map((lab) => (
            <div key={lab} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-lg font-semibold">{lab}</div>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Scaffold-ready virtual experiment.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
