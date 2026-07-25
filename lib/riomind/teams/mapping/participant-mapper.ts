import {
  createEmptyParticipant,
  PARTICIPANT_ROLES,
  type CanonicalParticipant,
  type NetworkQuality,
  type ParticipantConnectionStatus,
  type ParticipantPresenceStatus,
  type ParticipantRole,
} from "../models/canonical-participant";
import {
  resolveParticipantPermissions,
} from "../permissions/participant-permissions";
import {
  asBoolean,
  asNullableText,
  asNumber,
  asRecord,
  asText,
} from "./mapper-utils";

function normalizeRole(
  value: unknown,
): ParticipantRole {
  const role = asText(value, "viewer");

  return PARTICIPANT_ROLES.includes(
    role as ParticipantRole,
  )
    ? role as ParticipantRole
    : "viewer";
}

function normalizePresence(
  value: unknown,
): ParticipantPresenceStatus {
  const status = asText(
    value,
    "offline",
  ) as ParticipantPresenceStatus;

  return [
    "joining",
    "in_meeting",
    "away",
    "offline",
    "left",
  ].includes(status)
    ? status
    : "offline";
}

function normalizeConnection(
  value: unknown,
): ParticipantConnectionStatus {
  const status = asText(
    value,
    "disconnected",
  ) as ParticipantConnectionStatus;

  return [
    "connecting",
    "connected",
    "reconnecting",
    "disconnected",
  ].includes(status)
    ? status
    : "disconnected";
}

function normalizeNetworkQuality(
  value: unknown,
): NetworkQuality {
  const quality = asText(
    value,
    "unknown",
  ) as NetworkQuality;

  return [
    "unknown",
    "excellent",
    "good",
    "fair",
    "poor",
  ].includes(quality)
    ? quality
    : "unknown";
}

export function mapParticipantRecord(
  value: unknown,
): CanonicalParticipant {
  const row = asRecord(value);
  const metadata = asRecord(row.metadata);
  const runtimeMetadata =
    asRecord(row.runtime_metadata);
  const role = normalizeRole(
    row.participant_role ?? row.role,
  );

  return createEmptyParticipant({
    id: asText(row.id),
    meetingId: asText(
      row.meeting_id ?? row.meetingId,
    ),
    runtimeId: asText(
      row.runtime_id ?? row.runtimeId,
    ),
    clientSessionId: asNullableText(
      row.client_session_id ??
        row.clientSessionId,
    ),
    invitationId: asNullableText(
      row.invitation_id ??
        row.invitationId,
    ),
    userId: asNullableText(
      row.user_id ?? row.userId,
    ),

    displayName: asText(
      row.display_name ?? row.displayName,
      "Participant",
    ),
    email: asNullableText(row.email),
    avatarUrl: asNullableText(
      row.avatar_url ??
        row.avatarUrl ??
        metadata.avatarUrl,
    ),

    role,
    accessType: asText(
      row.access_type ?? row.accessType,
      "general_link",
    ),

    presence: {
      status: normalizePresence(
        row.presence_status ??
          row.presenceStatus,
      ),
      connection: normalizeConnection(
        row.connection_status ??
          row.connectionStatus,
      ),
      joinedAt: asNullableText(
        row.joined_at ?? row.joinedAt,
      ),
      lastSeenAt: asNullableText(
        row.last_seen_at ?? row.lastSeenAt,
      ),
      leftAt: asNullableText(
        row.left_at ?? row.leftAt,
      ),
    },

    media: {
      cameraEnabled: asBoolean(
        row.camera_enabled ??
          row.cameraEnabled,
      ),
      microphoneEnabled: asBoolean(
        row.microphone_enabled ??
          row.microphoneEnabled,
      ),
      screenSharing: asBoolean(
        row.screen_sharing ??
          row.screenSharing ??
          runtimeMetadata.screenSharing,
      ),
      handRaised: asBoolean(
        row.hand_raised ??
          row.handRaised ??
          runtimeMetadata.handRaised,
      ),
      speaking: asBoolean(
        row.speaking ??
          runtimeMetadata.speaking,
      ),
    },

    language: {
      preferred: asText(
        row.preferred_language ??
          row.preferredLanguage,
        "en",
      ),
      spoken: asText(
        row.spoken_language ??
          runtimeMetadata.spokenLanguage,
        "en",
      ),
      caption: asText(
        row.caption_language ??
          runtimeMetadata.captionLanguage,
        "en",
      ),
      translated: asText(
        row.translation_language ??
          row.translationLanguage,
        "en",
      ),
      autoTranslate: asBoolean(
        row.auto_translate ??
          runtimeMetadata.autoTranslate,
      ),
    },

    permissions:
      resolveParticipantPermissions(role),

    network: {
      quality: normalizeNetworkQuality(
        row.connection_quality ??
          row.connectionQuality,
      ),
      latencyMs:
        row.latency_ms == null
          ? null
          : asNumber(row.latency_ms),
    },

    metadata,
    runtimeMetadata,

    createdAt: asNullableText(
      row.created_at ?? row.createdAt,
    ),
    updatedAt: asNullableText(
      row.updated_at ?? row.updatedAt,
    ),
  });
}

export function mapParticipantRecords(
  values: unknown[],
): CanonicalParticipant[] {
  return values.map(mapParticipantRecord);
}
