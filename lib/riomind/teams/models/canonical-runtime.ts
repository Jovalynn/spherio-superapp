import type {
  CanonicalParticipant,
} from "./canonical-participant";
import type {
  CanonicalMeeting,
} from "./canonical-meeting";
import type {
  CanonicalRoom,
} from "./canonical-room";
import type {
  CanonicalWorkspace,
} from "./canonical-workspace";

export type NexusTeamsRuntimeSnapshot = {
  meeting: CanonicalMeeting | null;
  room: CanonicalRoom | null;
  workspace: CanonicalWorkspace | null;
  participants: CanonicalParticipant[];
  initialized: boolean;
  loading: boolean;
  error: string | null;
  updatedAt: string | null;
};
