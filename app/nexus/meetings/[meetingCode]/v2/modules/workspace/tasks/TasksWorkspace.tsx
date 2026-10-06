"use client";

import WorkspaceModuleShell from "../WorkspaceModuleShell";

export default function TasksWorkspace() {
  return (
    <WorkspaceModuleShell
      eyebrow="Meeting Execution"
      title="Tasks Workspace"
      description="Convert decisions into assigned, prioritized, dependency-aware work with due dates, progress, and AI suggestions."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          "Owner",
          "Due Date",
          "Priority",
          "Status",
          "Dependencies",
          "AI Suggested Tasks",
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
