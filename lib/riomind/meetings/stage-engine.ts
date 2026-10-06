export type StageParticipant = {
  id: string;
  name: string;
  role: string;

  speaking?: boolean;

  spotlighted?: boolean;

  pinned?: boolean;

  screenSharing?: boolean;

  inLobby?: boolean;
};

export type StageLayout =
  | "single"
  | "two"
  | "grid-2"
  | "grid-3"
  | "grid-4"
  | "grid-5"
  | "grid-7";

export type StageState = {
  layout: StageLayout;
  participants: StageParticipant[];
};

function priority(p: StageParticipant) {

  if (p.inLobby) return -1;

  if (p.screenSharing) return 1000;

  if (p.spotlighted) return 900;

  if (p.pinned) return 800;

  if (p.role === "presenter") return 700;

  if (p.role === "owner") return 650;

  if (p.role === "host") return 640;

  if (p.role === "cohost") return 630;

  if (p.speaking) return 500;

  return 100;
}

function layout(count: number): StageLayout {

  if (count <= 1) return "single";

  if (count == 2) return "two";

  if (count <= 4) return "grid-2";

  if (count <= 9) return "grid-3";

  if (count <= 16) return "grid-4";

  if (count <= 25) return "grid-5";

  return "grid-7";
}

export function buildStage(
  participants: StageParticipant[]
): StageState {

  const visible = participants
    .filter((p) => !p.inLobby)
    .sort((a, b) => priority(b) - priority(a));

  return {
    layout: layout(visible.length),
    participants: visible,
  };
}
