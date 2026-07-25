import type {
  ToolbarAction,
  ToolbarActionEvent,
} from "./types";

export const TOOLBAR_RUNTIME_EVENTS = {
  INITIALIZED: "toolbar.initialized",
  MOUNTED: "toolbar.mounted",
  SUSPENDED: "toolbar.suspended",
  RESUMED: "toolbar.resumed",
  DESTROYED: "toolbar.destroyed",
  ACTION: "toolbar.action",
  PANEL_CHANGED: "toolbar.panel.changed",
  MEDIA_CHANGED: "toolbar.media.changed",
} as const;

export type ToolbarRuntimeEventName =
  (typeof TOOLBAR_RUNTIME_EVENTS)[keyof typeof TOOLBAR_RUNTIME_EVENTS];

export function createToolbarActionEvent(
  action: ToolbarAction,
  options: Omit<ToolbarActionEvent, "type" | "timestamp"> = {},
): ToolbarActionEvent {
  return {
    type: action,
    timestamp: new Date().toISOString(),
    ...options,
  };
}
