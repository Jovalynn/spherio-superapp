export type MeetingLifecycleStatus =
  | "scheduled"
  | "lobby"
  | "active"
  | "paused"
  | "ended"
  | "cancelled";

export type MeetingLayoutMode =
  | "grid"
  | "speaker"
  | "present"
  | "lobby";

export type CanonicalMeeting = {
  id: string;
  code: string;
  teamId: string | null;
  roomId: string | null;
  workspaceId: string | null;

  title: string;
  description: string | null;
  hostUserId: string | null;

  status: MeetingLifecycleStatus;
  layout: MeetingLayoutMode;

  defaultLanguage: string;
  translationEnabled: boolean;
  transcriptionEnabled: boolean;
  recordingEnabled: boolean;
  aiSummaryEnabled: boolean;

  participantCount: number;
  startedAt: string | null;
  endedAt: string | null;
  scheduledAt: string | null;

  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};

export function createEmptyMeeting(
  overrides: Partial<CanonicalMeeting> = {},
): CanonicalMeeting {
  return {
    id: "",
    code: "",
    teamId: null,
    roomId: null,
    workspaceId: null,

    title: "Nexus Meeting",
    description: null,
    hostUserId: null,

    status: "scheduled",
    layout: "grid",

    defaultLanguage: "en",
    translationEnabled: false,
    transcriptionEnabled: false,
    recordingEnabled: false,
    aiSummaryEnabled: true,

    participantCount: 0,
    startedAt: null,
    endedAt: null,
    scheduledAt: null,

    metadata: {},
    createdAt: null,
    updatedAt: null,

    ...overrides,
  };
}
