export type ToolbarPanel =
  | "chat"
  | "participants"
  | "raiseHands"
  | "reactions"
  | "view"
  | "controls"
  | "more"
  | "camera"
  | "microphone"
  | "share"
  | "video"
  | "notes"
  | "files"
  | "ai"
  | null;

export type ToolbarAction =
  | "record"
  | "open-chat"
  | "open-participants"
  | "open-raise-hands"
  | "open-reactions"
  | "open-view"
  | "open-controls"
  | "open-more"
  | "toggle-camera"
  | "toggle-microphone"
  | "start-share"
  | "open-video"
  | "leave-meeting";

export interface ToolbarMediaState {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenShareEnabled: boolean;
  videoEnabled: boolean;
  recordingEnabled: boolean;
}

export interface ToolbarRuntimeState {
  activePanel: ToolbarPanel;
  media: ToolbarMediaState;
  disabledActions: ToolbarAction[];
  mounted: boolean;
}

export interface ToolbarActionEvent {
  type: ToolbarAction;
  meetingCode?: string;
  participantRuntimeId?: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
