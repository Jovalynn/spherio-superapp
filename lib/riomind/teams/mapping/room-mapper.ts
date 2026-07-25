import type {
  CanonicalRoom,
} from "../models/canonical-room";
import {
  asBoolean,
  asNullableText,
  asNumber,
  asRecord,
  asText,
} from "./mapper-utils";

export function mapRoomRecord(
  value: unknown,
): CanonicalRoom {
  const row = asRecord(value);

  return {
    id: asText(row.id),
    teamId: asText(
      row.team_id ?? row.teamId,
    ),
    workspaceId: asNullableText(
      row.workspace_id ?? row.workspaceId,
    ),

    name: asText(row.name, "General"),
    description:
      asNullableText(row.description),
    roomType: asText(
      row.room_type ?? row.roomType,
      "meeting",
    ),

    status: asText(
      row.status,
      "available",
    ) as CanonicalRoom["status"],
    capacity: asNumber(row.capacity, 100),
    activeParticipantCount: asNumber(
      row.active_participant_count ??
        row.activeParticipantCount,
    ),

    lobbyEnabled: asBoolean(
      row.lobby_enabled ??
        row.lobbyEnabled,
      true,
    ),
    recordingAllowed: asBoolean(
      row.recording_allowed ??
        row.recordingAllowed,
    ),
    transcriptionAllowed: asBoolean(
      row.transcription_allowed ??
        row.transcriptionAllowed,
      true,
    ),
    translationAllowed: asBoolean(
      row.translation_allowed ??
        row.translationAllowed,
      true,
    ),

    metadata: asRecord(row.metadata),
    createdAt: asNullableText(
      row.created_at ?? row.createdAt,
    ),
    updatedAt: asNullableText(
      row.updated_at ?? row.updatedAt,
    ),
  };
}
