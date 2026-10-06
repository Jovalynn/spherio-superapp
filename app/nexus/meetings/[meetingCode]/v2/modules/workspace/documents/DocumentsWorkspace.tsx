"use client";

import WorkspaceModuleShell from "../WorkspaceModuleShell";

export default function DocumentsWorkspace() {
  return (
    <WorkspaceModuleShell
      eyebrow="Live Document Collaboration"
      title="Documents Workspace"
      description="A collaborative document environment with multiple editors, comments, references, templates, version history, and AI writing."
    >
      <div className="grid gap-3 md:grid-cols-3">
        {[
          "Live Editing",
          "Version History",
          "AI Writing and References",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 font-black text-white"
          >
            {item}
          </div>
        ))}
      </div>
    </WorkspaceModuleShell>
  );
}
