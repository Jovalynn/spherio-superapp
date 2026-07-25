export const PARTICIPANT_ROLES = [
  "owner",
  "admin",
  "manager",
  "analyst",
  "contributor",
  "viewer",
] as const;

export type ParticipantRole =
  (typeof PARTICIPANT_ROLES)[number];

export const PARTICIPANT_PRESENCE_STATUSES = [
  "joining",
  "in_meeting",
  "away",
  "offline",
  "left",
] as const;

export type ParticipantPresenceStatus =
  (typeof PARTICIPANT_PRESENCE_STATUSES)[number];

export const PARTICIPANT_CONNECTION_STATUSES = [
  "connecting",
  "connected",
  "reconnecting",
  "disconnected",
] as const;

export type ParticipantConnectionStatus =
  (typeof PARTICIPANT_CONNECTION_STATUSES)[number];

export const NETWORK_QUALITIES = [
  "unknown",
  "excellent",
  "good",
  "fair",
  "poor",
] as const;

export type NetworkQuality =
  (typeof NETWORK_QUALITIES)[number];

export type ParticipantPresence = {
  status: ParticipantPresenceStatus;
  connection: ParticipantConnectionStatus;
  joinedAt: string | null;
  lastSeenAt: string | null;
  leftAt: string | null;
};

export type ParticipantMedia = {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  speaking: boolean;
};

export type ParticipantLanguage = {
  preferred: string;
  spoken: string;
  caption: string;
  translated: string;
  autoTranslate: boolean;
};

export type ParticipantPermissions = {
  canShareScreen: boolean;
  canRecord: boolean;
  canInvite: boolean;
  canModerate: boolean;
  canRemoveParticipants: boolean;
  canManageRoles: boolean;
  canManageTranslation: boolean;
};

export type ParticipantNetwork = {
  quality: NetworkQuality;
  latencyMs: number | null;
};

export type CanonicalParticipant = {
  id: string;
  meetingId: string;

  runtimeId: string;
  clientSessionId: string | null;
  invitationId: string | null;
  userId: string | null;

  displayName: string;
  email: string | null;
  avatarUrl: string | null;

  role: ParticipantRole;
  accessType: string;

  presence: ParticipantPresence;
  media: ParticipantMedia;
  language: ParticipantLanguage;
  permissions: ParticipantPermissions;
  network: ParticipantNetwork;

  metadata: Record<string, unknown>;
  runtimeMetadata: Record<string, unknown>;

  createdAt: string | null;
  updatedAt: string | null;
};

export function createEmptyParticipant(
  overrides: Partial<CanonicalParticipant> = {},
): CanonicalParticipant {
  return {
    id: "",
    meetingId: "",
    runtimeId: "",
    clientSessionId: null,
    invitationId: null,
    userId: null,

    displayName: "Participant",
    email: null,
    avatarUrl: null,

    role: "viewer",
    accessType: "general_link",

    presence: {
      status: "joining",
      connection: "connecting",
      joinedAt: null,
      lastSeenAt: null,
      leftAt: null,
    },

    media: {
      cameraEnabled: false,
      microphoneEnabled: false,
      screenSharing: false,
      handRaised: false,
      speaking: false,
    },

    language: {
      preferred: "en",
      spoken: "en",
      caption: "en",
      translated: "en",
      autoTranslate: false,
    },

    permissions: {
      canShareScreen: false,
      canRecord: false,
      canInvite: false,
      canModerate: false,
      canRemoveParticipants: false,
      canManageRoles: false,
      canManageTranslation: false,
    },

    network: {
      quality: "unknown",
      latencyMs: null,
    },

    metadata: {},
    runtimeMetadata: {},

    createdAt: null,
    updatedAt: null,

    ...overrides,
  };
}
