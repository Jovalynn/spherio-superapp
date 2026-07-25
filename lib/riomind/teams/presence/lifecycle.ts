import type {
  CanonicalParticipant,
} from "../models/canonical-participant";
import {
  updateParticipantPresence,
} from "./participant-presence";

export function markParticipantConnected(
  participant: CanonicalParticipant,
): CanonicalParticipant {
  return updateParticipantPresence(
    participant,
    "in_meeting",
    "connected",
  );
}

export function markParticipantReconnecting(
  participant: CanonicalParticipant,
): CanonicalParticipant {
  return updateParticipantPresence(
    participant,
    "away",
    "reconnecting",
  );
}

export function markParticipantDisconnected(
  participant: CanonicalParticipant,
): CanonicalParticipant {
  return updateParticipantPresence(
    participant,
    "offline",
    "disconnected",
  );
}

export function markParticipantLeft(
  participant: CanonicalParticipant,
): CanonicalParticipant {
  return updateParticipantPresence(
    participant,
    "left",
    "disconnected",
  );
}
