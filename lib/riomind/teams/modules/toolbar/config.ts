import type { ToolbarPanel } from "./types";

export interface ToolbarButtonDefinition {
  id: string;
  icon: string;
  label: string;
  panel: ToolbarPanel;
}

export const PRIMARY_TOOLBAR_BUTTONS: ToolbarButtonDefinition[] = [
  {
    id: "record",
    icon: "⏺",
    label: "Record",
    panel: null,
  },
  {
    id: "chat",
    icon: "💬",
    label: "Chat",
    panel: "chat",
  },
  {
    id: "participants",
    icon: "👥",
    label: "People",
    panel: "participants",
  },
  {
    id: "raiseHands",
    icon: "✋",
    label: "Raise Hands",
    panel: "raiseHands",
  },
];
