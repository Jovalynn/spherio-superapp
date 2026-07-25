export type RoomLifecycleStatus =
  | "available"
  | "occupied"
  | "locked"
  | "closed";

export type CanonicalRoom = {
  id: string;
  teamId: string;
  workspaceId: string | null;

  name: string;
  description: string | null;
  roomType: string;

  status: RoomLifecycleStatus;
  capacity: number;
  activeParticipantCount: number;

  lobbyEnabled: boolean;
  recordingAllowed: boolean;
  transcriptionAllowed: boolean;
  translationAllowed: boolean;

  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};
