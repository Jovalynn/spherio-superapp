import type {
  ComponentType,
} from "react";

import type {
  WorkspaceId,
} from "./WorkspaceContext";

export type WorkspaceModuleProps = {
  meetingCode: string;
};

export type WorkspaceRegistryEntry = {
  id: WorkspaceId;
  label: string;
  icon: string;
  group: "primary" | "more";
  component?: ComponentType<
    WorkspaceModuleProps
  >;
};

export const WORKSPACE_REGISTRY:
  WorkspaceRegistryEntry[] = [
    {
      id: "voice",
      label: "Voice",
      icon: "🎙️",
      group: "primary",
    },
    {
      id: "chat",
      label: "Chat",
      icon: "💬",
      group: "primary",
    },
    {
      id: "participants",
      label: "Participants",
      icon: "👥",
      group: "primary",
    },
    {
      id: "files",
      label: "Files",
      icon: "📁",
      group: "primary",
    },
    {
      id: "notes",
      label: "Notes",
      icon: "📝",
      group: "more",
    },
    {
      id: "documents",
      label: "Documents",
      icon: "📄",
      group: "more",
    },
    {
      id: "whiteboard",
      label: "Whiteboard",
      icon: "🎨",
      group: "more",
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: "✅",
      group: "more",
    },
    {
      id: "polls",
      label: "Polls",
      icon: "📊",
      group: "more",
    },
    {
      id: "apps",
      label: "Apps",
      icon: "🔌",
      group: "more",
    },
    {
      id: "ai",
      label: "AI",
      icon: "✨",
      group: "more",
    },
  ];

export function workspaceEntry(
  id: WorkspaceId
) {
  return WORKSPACE_REGISTRY.find(
    (entry) => entry.id === id
  );
}
