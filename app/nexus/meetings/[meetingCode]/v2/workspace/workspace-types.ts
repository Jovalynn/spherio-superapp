import type { ReactNode } from "react";

export const NEXUS_WORKSPACE_TYPES = [
  "meeting",
  "project",
  "research",
  "classroom",
  "development",
  "sales",
] as const;

export type NexusWorkspaceType =
  (typeof NEXUS_WORKSPACE_TYPES)[number];

export const NEXUS_WORKSPACE_REGIONS = [
  "header",
  "navigation",
  "primary",
  "secondary",
  "right_rail",
  "bottom_dock",
  "overlay",
] as const;

export type NexusWorkspaceRegion =
  (typeof NEXUS_WORKSPACE_REGIONS)[number];

export type NexusWorkspaceModuleId =
  | "meeting"
  | "toolbar"
  | "participants"
  | "chat"
  | "voice"
  | "translation"
  | "transcript"
  | "assistant"
  | "files"
  | "notes"
  | "documents"
  | "whiteboard"
  | "analytics"
  | "calendar"
  | "calls"
  | "apps";

export type NexusWorkspaceRuntimeDependency =
  | "meeting"
  | "participants"
  | "room"
  | "workspace"
  | "presence"
  | "media"
  | "translation"
  | "assistant"
  | "realtime";

export type NexusWorkspacePermission =
  | "view"
  | "participate"
  | "share_screen"
  | "record"
  | "invite"
  | "moderate"
  | "manage_roles"
  | "manage_translation";

export type NexusWorkspaceModuleManifest = {
  id: NexusWorkspaceModuleId;
  name: string;
  description: string;
  version: string;

  region: NexusWorkspaceRegion;
  order: number;

  supportedWorkspaceTypes: readonly NexusWorkspaceType[];
  runtimeDependencies: readonly NexusWorkspaceRuntimeDependency[];
  requiredPermissions: readonly NexusWorkspacePermission[];

  enabledByDefault: boolean;
  singleton: boolean;
  experimental: boolean;

  metadata?: Readonly<Record<string, unknown>>;
};

export type NexusWorkspaceModuleContext = {
  meetingCode: string;
  workspaceType: NexusWorkspaceType;
  activeModuleId: NexusWorkspaceModuleId;
  setActiveModuleId: (
    moduleId: NexusWorkspaceModuleId,
  ) => void;
};

export type NexusWorkspaceModuleDefinition = {
  manifest: NexusWorkspaceModuleManifest;
  render?: (
    context: NexusWorkspaceModuleContext,
  ) => ReactNode;
};

export type NexusWorkspaceLayoutSlots = {
  header?: ReactNode;
  navigation?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  rightRail?: ReactNode;
  bottomDock?: ReactNode;
  overlay?: ReactNode;
};
