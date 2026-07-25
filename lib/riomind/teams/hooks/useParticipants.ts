"use client";

import {
  participantRuntimeStore,
} from "../runtime/participant-runtime-store";
import {
  useRuntimeStore,
} from "./use-runtime-store";

export function useParticipants() {
  return useRuntimeStore(
    participantRuntimeStore,
  );
}
