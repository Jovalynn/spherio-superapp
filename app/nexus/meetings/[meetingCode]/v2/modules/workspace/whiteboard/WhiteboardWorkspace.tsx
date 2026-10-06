"use client";

import WorkspaceModuleShell from "../WorkspaceModuleShell";

export default function WhiteboardWorkspace() {
  const tools = [
    "Infinite Canvas",
    "Sticky Notes",
    "Shapes",
    "Mind Maps",
    "UML",
    "Architecture Diagrams",
    "AI Draw",
    "AI Explain",
    "AI Organize",
  ];

  return (
    <WorkspaceModuleShell
      eyebrow="AI Collaborative Canvas"
      title="Whiteboard Workspace"
      description="A shared intelligent canvas for visual planning, diagrams, system architecture, brainstorming, and AI-assisted organization."
    >
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <span
            key={tool}
            className="rounded-xl border border-purple-300/15 bg-purple-300/[0.06] px-4 py-2 text-xs font-black text-purple-100"
          >
            {tool}
          </span>
        ))}
      </div>
    </WorkspaceModuleShell>
  );
}
