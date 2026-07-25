import type {
  CanonicalParticipant,
} from "../models/canonical-participant";

export function participantInitials(
  participant: Pick<
    CanonicalParticipant,
    "displayName"
  >,
): string {
  const parts = participant.displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return (
    parts
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P"
  );
}

export function activeParticipants(
  participants: CanonicalParticipant[],
): CanonicalParticipant[] {
  return participants.filter(
    (participant) =>
      participant.presence.status ===
        "in_meeting" &&
      participant.presence.connection ===
        "connected",
  );
}
