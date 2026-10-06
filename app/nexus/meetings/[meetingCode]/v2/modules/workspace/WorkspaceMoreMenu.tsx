"use client";

import {
  WORKSPACE_REGISTRY,
} from "./WorkspaceRegistry";

import type {
  WorkspaceId,
} from "./WorkspaceContext";

export default function WorkspaceMoreMenu({
  isOpen,
  onSelect,
}: {
  isOpen: boolean;
  onSelect: (
    workspace: WorkspaceId
  ) => void;
}) {
  if (!isOpen) {
    return null;
  }

  const entries =
    WORKSPACE_REGISTRY.filter(
      (entry) =>
        entry.group === "more"
    );

  return (
    <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#101a25] p-2 shadow-2xl">
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() =>
            onSelect(entry.id)
          }
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-200 transition hover:bg-white/[0.06]"
        >
          <span>{entry.icon}</span>
          <span>{entry.label}</span>
        </button>
      ))}
    </div>
  );
}
