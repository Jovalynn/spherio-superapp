"use client";

import WorkspaceModuleShell from "../WorkspaceModuleShell";

export default function NotesWorkspace() {
  return (
    <WorkspaceModuleShell
      eyebrow="Collaborative Meeting Record"
      title="Notes Workspace"
      description="Shared notes, AI-generated minutes, decisions, action items, follow-ups, and exports."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          "Shared Notes",
          "AI Minutes",
          "Decisions",
          "Action Items",
          "Follow-ups",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-black text-white"
          >
            {item}
          </div>
        ))}
      </div>
    </WorkspaceModuleShell>
  );
}
