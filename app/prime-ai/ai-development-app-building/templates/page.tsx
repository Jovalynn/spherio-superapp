const templates = [
  "Chatbot",
  "Marketplace",
  "CRM",
  "School Portal",
  "Healthcare App",
  "E-commerce Site",
];

export default function AiBuilderTemplatesPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-fuchsia-300/20 bg-white/[0.04] p-7">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-fuchsia-200">
            App Template Gallery
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            One-click AI app templates
          </h1>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {templates.map((template) => (
            <div key={template} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-lg font-semibold">{template}</div>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Scaffold template for AI Development & App Building.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
