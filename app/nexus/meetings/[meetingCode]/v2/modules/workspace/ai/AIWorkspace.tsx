"use client";

import WorkspaceModuleShell from "../WorkspaceModuleShell";

export default function AIWorkspace() {
  const agents = [
    "AI Meeting Agent",
    "Executive Agent",
    "Planner Agent",
    "Memory Agent",
    "Workflow Agent",
    "AI Presenter Coach",
    "AI Meeting Replay",
    "Knowledge Graph",
  ];

  return (
    <WorkspaceModuleShell
      eyebrow="Meeting Intelligence"
      title="AI Workspace"
      description="The orchestration center for meeting understanding, executive intelligence, planning, memory, workflow execution, replay, and organizational knowledge."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => (
          <button
            key={agent}
            type="button"
            className="rounded-2xl border border-purple-300/15 bg-purple-300/[0.06] p-5 text-left transition hover:-translate-y-0.5 hover:border-purple-300/35"
          >
            <div className="text-lg">✨</div>
            <div className="mt-3 font-black text-white">
              {agent}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Intelligence module foundation
            </div>
          </button>
        ))}
      </div>
    </WorkspaceModuleShell>
  );
}
