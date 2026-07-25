import {
  createEmptyMeeting,
  type CanonicalMeeting,
  type MeetingLayoutMode,
  type MeetingLifecycleStatus,
} from "../models/canonical-meeting";
import {
  asBoolean,
  asNullableText,
  asNumber,
  asRecord,
  asText,
} from "./mapper-utils";

export function mapMeetingRecord(
  value: unknown,
): CanonicalMeeting {
  const row = asRecord(value);

  return createEmptyMeeting({
    id: asText(row.id),
    code: asText(
      row.meeting_code ?? row.code,
    ),
    teamId: asNullableText(
      row.team_id ?? row.teamId,
    ),
    roomId: asNullableText(
      row.room_id ?? row.roomId,
    ),
    workspaceId: asNullableText(
      row.workspace_id ?? row.workspaceId,
    ),

    title: asText(
      row.title,
      "Nexus Meeting",
    ),
    description:
      asNullableText(row.description),
    hostUserId: asNullableText(
      row.host_user_id ?? row.hostUserId,
    ),

    status: asText(
      row.status,
      "scheduled",
    ) as MeetingLifecycleStatus,
    layout: asText(
      row.layout,
      "grid",
    ) as MeetingLayoutMode,

    defaultLanguage: asText(
      row.default_language ??
        row.defaultLanguage,
      "en",
    ),
    translationEnabled: asBoolean(
      row.translation_enabled ??
        row.translationEnabled,
    ),
    transcriptionEnabled: asBoolean(
      row.transcription_enabled ??
        row.transcriptionEnabled,
    ),
    recordingEnabled: asBoolean(
      row.recording_enabled ??
        row.recordingEnabled,
    ),
    aiSummaryEnabled: asBoolean(
      row.ai_summary_enabled ??
        row.aiSummaryEnabled,
      true,
    ),

    participantCount: asNumber(
      row.participant_count ??
        row.participantCount,
    ),
    startedAt: asNullableText(
      row.started_at ?? row.startedAt,
    ),
    endedAt: asNullableText(
      row.ended_at ?? row.endedAt,
    ),
    scheduledAt: asNullableText(
      row.scheduled_at ?? row.scheduledAt,
    ),

    metadata: asRecord(row.metadata),
    createdAt: asNullableText(
      row.created_at ?? row.createdAt,
    ),
    updatedAt: asNullableText(
      row.updated_at ?? row.updatedAt,
    ),
  });
}
