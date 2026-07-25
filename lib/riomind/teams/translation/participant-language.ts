import type {
  CanonicalParticipant,
  ParticipantLanguage,
} from "../models/canonical-participant";

export function updateParticipantLanguage(
  participant: CanonicalParticipant,
  patch: Partial<ParticipantLanguage>,
): CanonicalParticipant {
  return {
    ...participant,
    language: {
      ...participant.language,
      ...patch,
    },
    updatedAt: new Date().toISOString(),
  };
}
