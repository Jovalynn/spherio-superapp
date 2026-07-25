export default function AiBuilderDashboardPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-cyan-300/20 bg-white/[0.04] p-7">
        <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
          AI Builder Dashboard
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Project, usage, deployment, and template overview
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
          This page will show AI builder projects, usage credits, model routes,
          deployment status, and RioMind Nexus recommendations.
        </p>
      </div>
    </main>
  );
}
