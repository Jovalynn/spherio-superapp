"use client";

import {
  WorkspaceRegistry,
} from "@/lib/riomind/workspace";

import type {
  WorkspaceId,
  WorkspaceNavigationItem,
} from "./types";

const MORE_ITEMS:
  WorkspaceNavigationItem[] =
  WorkspaceRegistry
    .filter(
      (workspace) =>
        !workspace.primary
    )
    .map((workspace) => ({
      id: workspace.id,
      label: workspace.title,
      icon: workspace.icon,
    }));

export type MoreMenuProps = {
  open: boolean;
  activeWorkspace: WorkspaceId;
  onSelect: (
    workspace: WorkspaceId
  ) => void;
};

export default function MoreMenu({
  open,
  activeWorkspace,
  onSelect,
}: MoreMenuProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="menu"
      aria-label="More collaboration workspaces"
      className="absolute right-0 top-[calc(100%+0.6rem)] z-[500] w-64 rounded-2xl border border-white/10 bg-[#101a25] p-2 shadow-2xl"
    >
      <div className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
        Collaboration workspaces
      </div>

      {MORE_ITEMS.map((item) => {
        const active =
          activeWorkspace === item.id;

        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            onClick={() =>
              onSelect(item.id)
            }
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
              active
                ? "bg-purple-300/10 text-purple-100"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span className="text-base">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
