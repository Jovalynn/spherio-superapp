const agents = [
  "Education Agent",
  "Research Agent",
  "Trading Agent",
  "Marketing Agent",
  "Coding Agent",
  "Support Agent",
];

export default function AiAgentCatalogPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-violet-300/20 bg-white/[0.04] p-7">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-violet-200">
            Agent Catalog
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Browse installable AI agents
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
            This catalog will list agents available to buy, rent, install, execute,
            review, and monetize through Prime and RioMind Nexus.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-lg font-semibold">{agent}</div>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Scaffold listing for marketplace agent category.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
