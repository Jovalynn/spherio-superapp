
"use client";

import type { ReactNode } from "react";
import { buildStage } from "@/lib/riomind/meetings/stage-engine";

export type MeetingStageProps = {
  participants: any[];
  participantControlState: Record<string, any>;
  children: ReactNode;
};

export default function MeetingStage({
  participants,
  participantControlState,
  children,
}: MeetingStageProps) {

  const stage = buildStage(
    participants.map((participant, index) => {
      const name =
        participant.name ??
        participant.displayName ??
        participant.display_name ??
        `Participant ${index + 1}`;

      const controls =
        participantControlState[name] || {};

      return {
        id: String(
          participant.runtime_id ??
          participant.runtimeId ??
          participant.id ??
          participant.user_id ??
          name
        ),

        name,

        role: String(
          controls.role ??
          participant.participant_role ??
          participant.role ??
          participant.meeting_role ??
          "participant"
        ).toLowerCase(),

        speaking:
          controls.speaking ??
          participant.speaking ??
          false,

        spotlighted:
          controls.spotlighted ??
          false,

        pinned:
          controls.pinned ??
          false,

        screenSharing:
          controls.screenSharing ??
          participant.screen_sharing ??
          participant.screenSharing ??
          false,

        inLobby:
          controls.inLobby ??
          participant.inLobby ??
          false,
      };
    })
  );

  return (
    <div
      data-stage-layout={stage.layout}
      className="w-full"
    >
      {children}
    </div>
  );
}
