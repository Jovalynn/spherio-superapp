export type MeetingLifecycleState =
  | "scheduled"
  | "lobby"
  | "joining"
  | "live"
  | "paused"
  | "ending"
  | "archived";

export type ParticipantRole =
  | "owner"
  | "host"
  | "cohost"
  | "presenter"
  | "participant"
  | "viewer"
  | "guest";

export type ParticipantStatus =
  | "invited"
  | "joining"
  | "connected"
  | "disconnected"
  | "left";

export type MeetingEventType =
  | "meeting.created"
  | "meeting.lifecycle.changed"
  | "meeting.started"
  | "meeting.paused"
  | "meeting.resumed"
  | "meeting.ending"
  | "meeting.ended"
  | "participant.joined"
  | "participant.left"
  | "camera.enabled"
  | "camera.disabled"
  | "microphone.enabled"
  | "microphone.disabled"
  | "hand.raised"
  | "hand.lowered"
  | "screen.shared"
  | "screen.stopped"
  | "transcript.chunk"
  | "summary.updated"
  | "decision.created"
  | "action.created"
  | "risk.detected";

export interface MeetingParticipant {
  id: string;
  displayName: string;
  email?: string;

  role: ParticipantRole;
  status: ParticipantStatus;

  joinedAt?: string;
  leftAt?: string;

  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;

  preferredLanguage?: string;
  translationLanguage?: string;

  metadata?: Record<string, unknown>;
}

export interface MeetingRoom {
  id: string;
  meetingCode: string;

  title: string;

  lifecycle: MeetingLifecycleState;

  createdAt: string;
  updatedAt: string;

  participants: MeetingParticipant[];
}

export interface MeetingEvent<T = unknown> {
  id: string;

  meetingCode: string;

  type: MeetingEventType;

  createdAt: string;

  participantId?: string;

  payload: T;
}
