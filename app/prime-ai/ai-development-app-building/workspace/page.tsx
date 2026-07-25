export default function AiBuilderWorkspacePage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-amber-300/20 bg-white/[0.04] p-7">
        <div className="text-xs font-black uppercase tracking-[0.28em] text-amber-200">
          Prompt Workspace
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Build AI apps from prompts, templates, and model routes
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
          This workspace will become the prompt-to-app surface for AI application
          generation, architecture planning, and deployment preparation.
        </p>
      </div>
    </main>
  );
}
