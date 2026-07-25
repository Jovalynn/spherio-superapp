import {
  PARTICIPANT_ROLES,
  type ParticipantRole,
} from "../models/canonical-participant";

export function normalizeParticipantRole(
  value: unknown,
): ParticipantRole {
  const role = String(
    value ?? "",
  ).trim() as ParticipantRole;

  return PARTICIPANT_ROLES.includes(role)
    ? role
    : "viewer";
}
