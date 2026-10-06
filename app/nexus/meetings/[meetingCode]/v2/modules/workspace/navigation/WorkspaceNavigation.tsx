"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  WorkspaceRegistry,
} from "@/lib/riomind/workspace";

import WorkspaceButton
  from "./WorkspaceButton";

import MoreMenu
  from "./MoreMenu";

import type {
  WorkspaceId,
  WorkspaceNavigationItem,
} from "./types";

const PRIMARY_ITEMS:
  WorkspaceNavigationItem[] =
  WorkspaceRegistry
    .filter(
      (workspace) =>
        workspace.primary
    )
    .map((workspace) => ({
      id: workspace.id,
      label: workspace.title,
      icon: workspace.icon,
    }));

const MORE_WORKSPACES =
  new Set<WorkspaceId>(
    WorkspaceRegistry
      .filter(
        (workspace) =>
          !workspace.primary
      )
      .map(
        (workspace) =>
          workspace.id
      )
  );

export type WorkspaceNavigationProps = {
  activeWorkspace: WorkspaceId;
  onWorkspaceChange: (
    workspace: WorkspaceId
  ) => void;
};

export default function WorkspaceNavigation({
  activeWorkspace,
  onWorkspaceChange,
}: WorkspaceNavigationProps) {
  const [
    moreOpen,
    setMoreOpen,
  ] = useState(false);

  const navigationRef =
    useRef<HTMLDivElement>(null);

  const moreActive =
    MORE_WORKSPACES.has(
      activeWorkspace
    );

  useEffect(() => {
    function handlePointerDown(
      event: MouseEvent
    ) {
      if (
        navigationRef.current &&
        !navigationRef.current.contains(
          event.target as Node
        )
      ) {
        setMoreOpen(false);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setMoreOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  return (
    <div
      ref={navigationRef}
      className="relative flex flex-wrap gap-2"
    >
      {PRIMARY_ITEMS.map((item) => (
        <WorkspaceButton
          key={item.id}
          item={item}
          active={
            activeWorkspace ===
            item.id
          }
          onSelect={() => {
            onWorkspaceChange(
              item.id
            );
            setMoreOpen(false);
          }}
        />
      ))}

      <button
        type="button"
        onClick={() =>
          setMoreOpen(
            (current) => !current
          )
        }
        aria-expanded={moreOpen}
        aria-haspopup="menu"
        className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
          moreActive
            ? "border-purple-300/50 bg-purple-300/10 text-purple-100"
            : "border-white/10 bg-black/20 text-slate-300 hover:border-purple-300/30 hover:bg-white/[0.04]"
        }`}
      >
        ⋯ More
      </button>

      <MoreMenu
        open={moreOpen}
        activeWorkspace={
          activeWorkspace
        }
        onSelect={(workspace) => {
          onWorkspaceChange(
            workspace
          );
          setMoreOpen(false);
        }}
      />
    </div>
  );
}
