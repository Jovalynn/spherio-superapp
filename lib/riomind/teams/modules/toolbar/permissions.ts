import type { ToolbarAction } from "./types";

export type ToolbarRole =
  | "owner"
  | "admin"
  | "manager"
  | "analyst"
  | "contributor"
  | "viewer";

const HOST_ACTIONS: ToolbarAction[] = [
  "record",
  "open-chat",
  "open-participants",
  "open-raise-hands",
  "open-reactions",
  "open-view",
  "open-controls",
  "open-more",
  "toggle-camera",
  "toggle-microphone",
  "start-share",
  "open-video",
  "leave-meeting",
];

const PARTICIPANT_ACTIONS: ToolbarAction[] = [
  "open-chat",
  "open-participants",
  "open-raise-hands",
  "open-reactions",
  "open-view",
  "open-more",
  "toggle-camera",
  "toggle-microphone",
  "start-share",
  "open-video",
  "leave-meeting",
];

const VIEWER_ACTIONS: ToolbarAction[] = [
  "open-chat",
  "open-participants",
  "open-reactions",
  "open-view",
  "open-more",
  "toggle-camera",
  "toggle-microphone",
  "leave-meeting",
];

export function getToolbarActionsForRole(
  role: ToolbarRole,
): ToolbarAction[] {
  if (role === "owner" || role === "admin") {
    return HOST_ACTIONS;
  }

  if (
    role === "manager" ||
    role === "analyst" ||
    role === "contributor"
  ) {
    return PARTICIPANT_ACTIONS;
  }

  return VIEWER_ACTIONS;
}

export function canUseToolbarAction(
  role: ToolbarRole,
  action: ToolbarAction,
): boolean {
  return getToolbarActionsForRole(role).includes(action);
}
