const report = [
  ["Strong areas", "Biology definitions, basic algebra, reading comprehension"],
  ["Weak areas", "Physics formulas, essay structure, time management"],
  ["Recommended action", "Practice 20 formula questions and revise essay outlines"],
  ["Certification readiness", "Pending 3 completed mock tests"],
];

export default function StudentReportsPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[34px] border border-emerald-300/20 bg-white/[0.045] p-7">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-200">
            Progress Report
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Learning intelligence and next-action report
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
            Student AI can summarize learning activity, weak areas, exam readiness,
            certification progress, and next revision steps.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {report.map(([title, value]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200/70">
                {title}
              </div>
              <p className="mt-2 text-sm leading-7 text-white/65">{value}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
