const cards = [
  ["What is osmosis?", "Movement of water through a semi-permeable membrane."],
  ["What is a catalyst?", "A substance that speeds up a reaction without being consumed."],
  ["What is GDP?", "The total value of goods and services produced in an economy."],
  ["What is a variable?", "A symbol or value that can change in a problem."],
];

export default function StudentFlashcardsPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[34px] border border-amber-300/20 bg-white/[0.045] p-7">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-amber-200">
            Flashcard Generator
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Convert lessons into memory cards
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
            Mock flow: students generate flashcards from notes, textbook topics,
            past questions, or RioMind Nexus explanations.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {cards.map(([question, answer]) => (
            <div key={question} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-200/70">
                Question
              </div>
              <div className="mt-2 text-lg font-semibold">{question}</div>
              <div className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
                Answer
              </div>
              <p className="mt-2 text-sm leading-6 text-white/60">{answer}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
