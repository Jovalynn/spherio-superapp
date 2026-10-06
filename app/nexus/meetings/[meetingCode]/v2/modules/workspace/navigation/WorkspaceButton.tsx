"use client";

import type {
  WorkspaceNavigationItem,
} from "./types";

export type WorkspaceButtonProps = {
  item: WorkspaceNavigationItem;
  active: boolean;
  onSelect: () => void;
};

export default function WorkspaceButton({
  item,
  active,
  onSelect,
}: WorkspaceButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
        active
          ? "border-cyan-300/50 bg-cyan-500/20 text-cyan-100"
          : "border-white/10 bg-black/20 text-slate-300 hover:border-cyan-300/30 hover:bg-white/[0.04]"
      }`}
    >
      <span className="mr-1.5">
        {item.icon}
      </span>

      {item.label}
    </button>
  );
}
