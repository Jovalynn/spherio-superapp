import type {
  CanonicalParticipant,
  ParticipantConnectionStatus,
  ParticipantPresenceStatus,
} from "../models/canonical-participant";

export function updateParticipantPresence(
  participant: CanonicalParticipant,
  status: ParticipantPresenceStatus,
  connection:
    ParticipantConnectionStatus =
      participant.presence.connection,
): CanonicalParticipant {
  const now = new Date().toISOString();

  return {
    ...participant,
    presence: {
      ...participant.presence,
      status,
      connection,
      lastSeenAt: now,
      leftAt:
        status === "left"
          ? now
          : participant.presence.leftAt,
    },
    updatedAt: now,
  };
}
