import {
  meetingRuntimeStore,
} from "./meeting-runtime-store";
import {
  participantRuntimeStore,
} from "./participant-runtime-store";
import {
  roomRuntimeStore,
} from "./room-runtime-store";
import {
  workspaceRuntimeStore,
} from "./workspace-runtime-store";

export const nexusTeamsRuntimeRegistry = {
  meeting: meetingRuntimeStore,
  participants: participantRuntimeStore,
  room: roomRuntimeStore,
  workspace: workspaceRuntimeStore,
} as const;
