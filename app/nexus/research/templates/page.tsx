"use client";

import Link from "next/link";

const templates = [
  {
    icon: "🏢",
    title: "Competitor Research",
    goal: "Research competitors, positioning, pricing, strengths, weaknesses, and market gaps.",
    depth: "standard",
    sources: "combined",
    output: "report",
  },
  {
    icon: "📈",
    title: "Market Trend Analysis",
    goal: "Analyze current market trends, demand signals, risks, opportunities, and forecast direction.",
    depth: "deep",
    sources: "combined",
    output: "market_analysis",
  },
  {
    icon: "🤖",
    title: "AI Provider Research",
    goal: "Research AI providers, aggregators, pricing, credits, APIs, strengths, risks, and integration roadmap.",
    depth: "standard",
    sources: "combined",
    output: "report",
  },
  {
    icon: "🚀",
    title: "Launch Strategy Research",
    goal: "Research launch strategy, audience, positioning, channels, risks, milestones, and go-to-market plan.",
    depth: "standard",
    sources: "combined",
    output: "executive_brief",
  },
  {
    icon: "🪙",
    title: "Token / Crypto Research",
    goal: "Research token fundamentals, market narrative, liquidity, risks, holders, competitors, and growth signals.",
    depth: "deep",
    sources: "combined",
    output: "market_analysis",
  },
  {
    icon: "🎨",
    title: "Creator Studio Research",
    goal: "Research creator tools, content ideas, providers, audience trends, formats, workflows, and monetization.",
    depth: "standard",
    sources: "combined",
    output: "report",
  },
];

export default function ResearchTemplatesPage() {
  function startTemplate(template: (typeof templates)[number]) {
    const prompt = [
      "Start a Nexus Research Workspace task from template.",
      "",
      `Template: ${template.title}`,
      `Research goal: ${template.goal}`,
      `Research depth: ${template.depth}`,
      `Source preference: ${template.sources}`,
      `Output format: ${template.output}`,
      "",
      "Please produce a structured research plan first, then continue with findings, recommendations, risks, and next actions.",
    ].join("\n");

    window.location.href = `/riomind/chat?prompt=${encodeURIComponent(prompt)}`;
  }

  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-cyan-300/15 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/50">
              RioMind Nexus
            </div>
            <h1 className="mt-1 text-3xl font-black text-cyan-50">Research Templates</h1>
            <p className="mt-1 text-sm font-semibold text-white/45">
              Start structured research faster with professional Nexus templates.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/nexus/research" className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2 text-sm font-black text-cyan-100">
              New Research
            </Link>
            <Link href="/nexus/research/sessions" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/60">
              Sessions
            </Link>
            <Link href="/nexus/research/reports" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/60">
              Reports
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <article key={template.title} className="rounded-[28px] border border-white/10 bg-white/[0.025] p-5 shadow-xl shadow-black/25">
              <div className="text-3xl">{template.icon}</div>
              <h2 className="mt-3 text-lg font-black text-cyan-50">{template.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/42">{template.goal}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                  <div className="text-[10px] font-bold uppercase text-white/30">Depth</div>
                  <div className="mt-1 text-xs font-black text-cyan-50">{template.depth}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                  <div className="text-[10px] font-bold uppercase text-white/30">Sources</div>
                  <div className="mt-1 text-xs font-black text-cyan-50">{template.sources}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                  <div className="text-[10px] font-bold uppercase text-white/30">Output</div>
                  <div className="mt-1 text-xs font-black text-cyan-50">{template.output}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => startTemplate(template)}
                className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-500/18"
              >
                Use Template
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
