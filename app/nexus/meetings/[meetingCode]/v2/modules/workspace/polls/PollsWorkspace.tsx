"use client";

import WorkspaceModuleShell from "../WorkspaceModuleShell";

export default function PollsWorkspace() {
  return (
    <WorkspaceModuleShell
      eyebrow="Live Audience Intelligence"
      title="Polls Workspace"
      description="Live voting, Q&A, surveys, quizzes, anonymous participation, results, and AI-generated polls."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          "Live Vote",
          "Q&A",
          "Survey",
          "Quiz",
          "Anonymous",
          "AI Poll Generation",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs font-black text-white"
          >
            {item}
          </div>
        ))}
      </div>
    </WorkspaceModuleShell>
  );
}
