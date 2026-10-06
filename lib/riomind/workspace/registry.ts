import type {
  WorkspaceDefinition,
} from "./types";

export const WorkspaceRegistry: WorkspaceDefinition[] = [
  {
    id: "voice",
    title: "Voice",
    icon: "🎙️",
    primary: true,
  },
  {
    id: "chat",
    title: "Chat",
    icon: "💬",
    primary: true,
  },
  {
    id: "participants",
    title: "Participants",
    icon: "👥",
    primary: true,
  },
  {
    id: "files",
    title: "Files",
    icon: "📁",
    primary: true,
  },
  {
    id: "notes",
    title: "Notes",
    icon: "📝",
    primary: false,
  },
  {
    id: "documents",
    title: "Documents",
    icon: "📄",
    primary: false,
  },
  {
    id: "whiteboard",
    title: "Whiteboard",
    icon: "🎨",
    primary: false,
  },
  {
    id: "tasks",
    title: "Tasks",
    icon: "✅",
    primary: false,
  },
  {
    id: "polls",
    title: "Polls",
    icon: "📊",
    primary: false,
  },
  {
    id: "apps",
    title: "Apps",
    icon: "🔌",
    primary: false,
  },
  {
    id: "ai",
    title: "AI",
    icon: "✨",
    primary: false,
  },
];
