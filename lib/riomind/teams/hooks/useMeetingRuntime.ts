"use client";

import {
  meetingRuntimeStore,
} from "../runtime/meeting-runtime-store";
import {
  participantRuntimeStore,
} from "../runtime/participant-runtime-store";
import {
  roomRuntimeStore,
} from "../runtime/room-runtime-store";
import {
  workspaceRuntimeStore,
} from "../runtime/workspace-runtime-store";
import {
  useRuntimeStore,
} from "./use-runtime-store";

export function useMeetingRuntime() {
  const meeting =
    useRuntimeStore(meetingRuntimeStore);
  const participants =
    useRuntimeStore(
      participantRuntimeStore,
    );
  const room =
    useRuntimeStore(roomRuntimeStore);
  const workspace =
    useRuntimeStore(
      workspaceRuntimeStore,
    );

  return {
    meeting,
    participants,
    room,
    workspace,
  };
}
