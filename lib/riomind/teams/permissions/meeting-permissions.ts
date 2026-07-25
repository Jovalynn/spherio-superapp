import type {
  CanonicalParticipant,
} from "../models/canonical-participant";

export function canStartMeeting(
  participant: CanonicalParticipant,
): boolean {
  return [
    "owner",
    "admin",
    "manager",
  ].includes(participant.role);
}

export function canEndMeeting(
  participant: CanonicalParticipant,
): boolean {
  return [
    "owner",
    "admin",
  ].includes(participant.role);
}
