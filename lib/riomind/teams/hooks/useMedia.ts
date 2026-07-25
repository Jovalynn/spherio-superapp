"use client";

import {
  participantRuntimeStore,
} from "../runtime/participant-runtime-store";
import {
  useRuntimeStore,
} from "./use-runtime-store";

export function useMedia() {
  const snapshot = useRuntimeStore(
    participantRuntimeStore,
  );

  return snapshot.participants.map(
    (participant) => ({
      participantId: participant.id,
      media: participant.media,
    }),
  );
}
