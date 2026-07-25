const generatedNotes = [
  "Definition and core concept",
  "Key formulas or principles",
  "Simple real-world explanation",
  "Important examples",
  "Common mistakes",
  "Revision checklist",
];

export default function StudentNotesPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[34px] border border-cyan-300/20 bg-white/[0.045] p-7">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
            Study Notes Generator
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Turn any topic into structured notes
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
            Mock flow: a student enters a topic, level, and subject. RioMind Nexus
            later generates structured notes, examples, revision bullets, and practice prompts.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-sm font-semibold">Input panel</div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/55">
                Topic: Photosynthesis
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/55">
                Level: Secondary school
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/55">
                Output: Notes + summary + quiz prompts
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-500/[0.055] p-5">
            <div className="text-sm font-semibold text-cyan-100">Generated note structure</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {generatedNotes.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
