export type TeamsRuntimeEventName =
  | "participant.joined"
  | "participant.updated"
  | "participant.left"
  | "participant.presence.changed"
  | "participant.media.changed"
  | "participant.language.changed"
  | "participant.permission.changed"
  | "meeting.updated"
  | "meeting.started"
  | "meeting.ended"
  | "room.updated"
  | "workspace.updated"
  | "transcript.updated"
  | "translation.updated"
  | "assistant.updated";

export type TeamsRuntimeEvent<T = unknown> = {
  id: string;
  name: TeamsRuntimeEventName;
  meetingId: string | null;
  participantId: string | null;
  occurredAt: string;
  payload: T;
};
