import type {
  CanonicalParticipant,
} from "../models/canonical-participant";

export type PresenceEvaluation = {
  stale: boolean;
  offline: boolean;
  ageMs: number | null;
};

export function evaluateParticipantPresence(
  participant: CanonicalParticipant,
  now = Date.now(),
): PresenceEvaluation {
  if (!participant.presence.lastSeenAt) {
    return {
      stale: true,
      offline: true,
      ageMs: null,
    };
  }

  const lastSeen =
    Date.parse(
      participant.presence.lastSeenAt,
    );

  if (!Number.isFinite(lastSeen)) {
    return {
      stale: true,
      offline: true,
      ageMs: null,
    };
  }

  const ageMs = Math.max(
    0,
    now - lastSeen,
  );

  return {
    ageMs,
    stale: ageMs > 45_000,
    offline: ageMs > 90_000,
  };
}
