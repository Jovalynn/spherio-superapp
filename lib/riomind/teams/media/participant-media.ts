import type {
  CanonicalParticipant,
  ParticipantMedia,
} from "../models/canonical-participant";

export function updateParticipantMedia(
  participant: CanonicalParticipant,
  patch: Partial<ParticipantMedia>,
): CanonicalParticipant {
  return {
    ...participant,
    media: {
      ...participant.media,
      ...patch,
    },
    updatedAt: new Date().toISOString(),
  };
}
