const engineeringLabs = [
  "Circuit design lab",
  "Robotics motion planner",
  "Structural load model",
  "Thermodynamics calculator",
  "Signal processing explorer",
];

export default function EngineeringLabPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[34px] border border-violet-300/20 bg-white/[0.045] p-7">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-violet-200">
            Engineering Lab
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Build, model, calculate, and test engineering systems
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
            Mock runtime for engineering calculations, robotics, electronics, and technical simulations.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {engineeringLabs.map((lab) => (
            <div key={lab} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-lg font-semibold">{lab}</div>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Scaffold-ready engineering simulation.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
