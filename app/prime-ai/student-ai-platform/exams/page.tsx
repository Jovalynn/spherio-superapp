const examFlow = [
  "Choose subject and level",
  "Select exam type",
  "Generate timed mock test",
  "Submit answers",
  "Review weak areas",
  "Receive revision plan",
];

const sampleQuestions = [
  "Explain the difference between mitosis and meiosis.",
  "Solve: 2x + 5 = 17.",
  "List three causes of inflation.",
  "Describe Newton's second law of motion.",
];

export default function StudentExamPrepPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[34px] border border-fuchsia-300/20 bg-white/[0.045] p-7">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-fuchsia-200">
            Exam Prep Engine
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Mock tests, weak-area review, and revision planning
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
            Mock flow for WAEC, NECO, JAMB, university courses, vocational exams,
            and professional preparation.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-sm font-semibold">Exam workflow</div>
            <div className="mt-4 space-y-3">
              {examFlow.map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/65">
                  {index + 1}. {step}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-fuchsia-300/15 bg-fuchsia-500/[0.055] p-5">
            <div className="text-sm font-semibold text-fuchsia-100">Sample generated questions</div>
            <div className="mt-4 grid gap-3">
              {sampleQuestions.map((question) => (
                <div key={question} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                  {question}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
