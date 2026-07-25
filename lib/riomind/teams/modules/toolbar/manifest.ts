export const toolbarModuleManifest = {
  id: "riomind.teams.toolbar",
  name: "Meeting Toolbar",
  version: "1.0.0",
  description:
    "Canonical meeting control surface for communication, media, collaboration, presentation, and lifecycle actions.",
  capabilities: [
    "recording",
    "chat",
    "participants",
    "raise-hands",
    "reactions",
    "view-control",
    "meeting-controls",
    "camera",
    "microphone",
    "screen-share",
    "video",
    "meeting-lifecycle",
  ],
  dependencies: [
    "meeting-runtime",
    "participant-runtime",
    "permissions-runtime",
    "media-runtime",
  ],
} as const;
