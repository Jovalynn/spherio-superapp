"use client";

import {
  useSyncExternalStore,
} from "react";
import {
  meetingRuntimeOrchestrator,
} from "../runtime/meeting-runtime-orchestrator";

export function useMeetingRuntimeOrchestrator() {
  return useSyncExternalStore(
    (listener) =>
      meetingRuntimeOrchestrator.subscribe(
        () => listener(),
      ),
    () =>
      meetingRuntimeOrchestrator.getSnapshot(),
    () =>
      meetingRuntimeOrchestrator.getSnapshot(),
  );
}
