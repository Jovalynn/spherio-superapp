import Link from "next/link";

const learningModules = [
  {
    title: "AI Tutor",
    value: "24/7 guided explanations",
    helper: "Subject-aware tutoring for learners at primary, secondary, university, vocational, research, and professional levels.",
  },
  {
    title: "Study Notes",
    value: "Structured summaries",
    helper: "Turn any topic into clean notes, key points, explanations, examples, and revision outlines.",
  },
  {
    title: "Flashcards",
    value: "Memory practice",
    helper: "Generate question-and-answer cards from lessons, notes, textbooks, or exam topics.",
  },
  {
    title: "Exam Prep",
    value: "Mock tests and revision",
    helper: "Prepare with timed questions, weak-area review, revision paths, and practice prompts.",
  },
  {
    title: "Progress Reports",
    value: "Learning intelligence",
    helper: "Track strengths, weak areas, completed modules, next actions, and certification readiness.",
  },
  {
    title: "Certification",
    value: "Proof-ready learning",
    helper: "Prepare credential and certificate proof for future Spherio/RioExplorer records.",
  },
];

const flows = [
  {
    title: "Deep Learning Runtime",
    href: "/prime-ai/student-ai-platform/deep-learning",
    tone: "violet",
    helper: "Open learning diagnosis, mastery map, exam simulation, and deep tutor reasoning.",
  },
  {
    title: "Generate Notes",
    href: "/prime-ai/student-ai-platform/notes",
    tone: "cyan",
    helper: "Create structured notes from any topic.",
  },
  {
    title: "Create Flashcards",
    href: "/prime-ai/student-ai-platform/flashcards",
    tone: "amber",
    helper: "Convert lessons into memory cards.",
  },
  {
    title: "Exam Prep",
    href: "/prime-ai/student-ai-platform/exams",
    tone: "fuchsia",
    helper: "Practice with mock questions and revision plans.",
  },
  {
    title: "Progress Report",
    href: "/prime-ai/student-ai-platform/reports",
    tone: "emerald",
    helper: "Review strengths, weak areas, and next actions.",
  },
];

function flowClass(tone: string) {
  if (tone === "violet") {
    return "border-violet-300/25 bg-violet-500/12 text-violet-100 hover:bg-violet-500/18";
  }
  if (tone === "amber") {
    return "border-amber-300/25 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18";
  }
  if (tone === "fuchsia") {
    return "border-fuchsia-300/25 bg-fuchsia-500/12 text-fuchsia-100 hover:bg-fuchsia-500/18";
  }
  if (tone === "emerald") {
    return "border-emerald-300/25 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18";
  }
  return "border-cyan-300/25 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18";
}

export function StudentAiMiniApp({
  projectName = "Student AI Project",
  tokenAddress,
}: {
  projectName?: string;
  tokenAddress?: string;
}) {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[34px] border border-cyan-300/20 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.16),transparent_34%),linear-gradient(135deg,rgba(8,20,38,0.72),rgba(13,17,34,0.92))] p-7 shadow-[0_30px_110px_-80px_rgba(34,211,238,0.9)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
              Creator Project App · Student AI Platform
            </div>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
              {projectName}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
              This is the creator-facing Student AI mini-app generated from the Prime
              AI niche selection. Students and viewers use this project app, while
              RioMind Nexus can later power tutoring, notes, flashcards, exam prep,
              reports, and certification intelligence.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {flows.map((flow) => (
                <Link
                  key={flow.title}
                  href={flow.href}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold ${flowClass(flow.tone)}`}
                >
                  {flow.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 lg:w-[380px]">
            <div className="text-sm font-semibold text-white">How viewers use this</div>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Viewers do not need the internal runtime URL. They access this project
              app from the creator project page. The internal runtime remains a reusable
              module behind the project frontend.
            </p>
            <div className="mt-4 rounded-2xl border border-cyan-300/14 bg-cyan-500/[0.055] px-4 py-3 text-xs leading-5 text-cyan-100/80">
              {tokenAddress ? (
                <>
                  Project token: <span className="font-mono">{tokenAddress.slice(0, 12)}…{tokenAddress.slice(-8)}</span>
                </>
              ) : (
                "Prime project token proof will appear here after indexing."
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {learningModules.map((module) => (
          <div key={module.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
              {module.title}
            </div>
            <div className="mt-2 text-xl font-semibold text-white">{module.value}</div>
            <p className="mt-2 text-sm leading-6 text-white/55">{module.helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
