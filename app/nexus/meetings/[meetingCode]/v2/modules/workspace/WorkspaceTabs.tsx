"use client";

import {
  useState,
} from "react";

import {
  WORKSPACE_REGISTRY,
  workspaceEntry,
} from "./WorkspaceRegistry";

import WorkspaceMoreMenu
  from "./WorkspaceMoreMenu";

import type {
  WorkspaceId,
} from "./WorkspaceContext";

export default function WorkspaceTabs({
  activeWorkspace,
  onSelect,
}: {
  activeWorkspace: WorkspaceId;
  onSelect: (
    workspace: WorkspaceId
  ) => void;
}) {
  const [
    moreOpen,
    setMoreOpen,
  ] = useState(false);

  const primary =
    WORKSPACE_REGISTRY.filter(
      (entry) =>
        entry.group === "primary"
    );

  const activeEntry =
    workspaceEntry(activeWorkspace);

  const activeIsMore =
    activeEntry?.group === "more";

  return (
    <div className="relative flex flex-wrap gap-2">
      {primary.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => {
            onSelect(entry.id);
            setMoreOpen(false);
          }}
          className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
            activeWorkspace === entry.id
              ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
              : "border-white/10 bg-black/20 text-slate-300 hover:border-cyan-300/25"
          }`}
        >
          {entry.icon} {entry.label}
        </button>
      ))}

      <button
        type="button"
        onClick={() =>
          setMoreOpen((open) => !open)
        }
        className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
          activeIsMore
            ? "border-purple-300/40 bg-purple-300/10 text-purple-100"
            : "border-white/10 bg-black/20 text-slate-300 hover:border-purple-300/25"
        }`}
      >
        More ▾
      </button>

      <WorkspaceMoreMenu
        isOpen={moreOpen}
        onSelect={(workspace) => {
          onSelect(workspace);
          setMoreOpen(false);
        }}
      />
    </div>
  );
}
