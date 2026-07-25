const reports = [
  ["Experiment summary", "Objective, method, variables, observations, and result."],
  ["Calculation proof", "Formula, substituted values, result, and unit explanation."],
  ["Graph interpretation", "Trend, conclusion, limitation, and follow-up question."],
  ["Safety notes", "Risk level, safe-use notice, and human supervision recommendation."],
];

export default function LabReportsPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[34px] border border-cyan-300/20 bg-white/[0.045] p-7">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
            Lab Reports
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Generate structured virtual lab reports
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
            RioMind Nexus can later help students create report drafts, calculations,
            graph interpretations, and revision notes.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {reports.map(([title, value]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
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
