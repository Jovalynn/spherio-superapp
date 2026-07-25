import type {
  CanonicalMeeting,
} from "../models/canonical-meeting";
import type {
  CanonicalParticipant,
} from "../models/canonical-participant";
import type {
  CanonicalRoom,
} from "../models/canonical-room";
import type {
  CanonicalWorkspace,
} from "../models/canonical-workspace";
import {
  nexusTeamsEventBus,
} from "../realtime/event-bus";
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

export type MeetingRuntimeHydration = {
  meeting?: CanonicalMeeting | null;
  participants?: CanonicalParticipant[];
  room?: CanonicalRoom | null;
  workspace?: CanonicalWorkspace | null;
};

export type MeetingRuntimeLifecycleStatus =
  | "idle"
  | "initializing"
  | "ready"
  | "stopping"
  | "stopped"
  | "failed";

export type MeetingRuntimeOrchestratorSnapshot = {
  meetingCode: string | null;
  status: MeetingRuntimeLifecycleStatus;
  initializedAt: string | null;
  stoppedAt: string | null;
  error: string | null;
};

type OrchestratorListener = (
  snapshot:
    MeetingRuntimeOrchestratorSnapshot,
) => void;

const initialSnapshot:
  MeetingRuntimeOrchestratorSnapshot = {
    meetingCode: null,
    status: "idle",
    initializedAt: null,
    stoppedAt: null,
    error: null,
  };

export class MeetingRuntimeOrchestrator {
  private snapshot = initialSnapshot;

  private readonly listeners =
    new Set<OrchestratorListener>();

  getSnapshot():
    MeetingRuntimeOrchestratorSnapshot {
    return this.snapshot;
  }

  subscribe(
    listener: OrchestratorListener,
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  initialize(
    meetingCode: string,
    hydration: MeetingRuntimeHydration = {},
  ): void {
    const normalizedMeetingCode =
      meetingCode.trim();

    if (!normalizedMeetingCode) {
      throw new Error(
        "A meeting code is required to initialize the runtime.",
      );
    }

    this.setSnapshot({
      meetingCode: normalizedMeetingCode,
      status: "initializing",
      initializedAt: null,
      stoppedAt: null,
      error: null,
    });

    try {
      if (
        hydration.meeting !== undefined
      ) {
        meetingRuntimeStore.setMeeting(
          hydration.meeting,
        );
      }

      if (hydration.participants) {
        participantRuntimeStore
          .replaceParticipants(
            hydration.participants,
          );
      }

      if (hydration.room !== undefined) {
        roomRuntimeStore.setRoom(
          hydration.room,
        );
      }

      if (
        hydration.workspace !== undefined
      ) {
        workspaceRuntimeStore.setWorkspace(
          hydration.workspace,
        );
      }

      const initializedAt =
        new Date().toISOString();

      this.setSnapshot({
        meetingCode: normalizedMeetingCode,
        status: "ready",
        initializedAt,
        stoppedAt: null,
        error: null,
      });

      nexusTeamsEventBus.publish({
        id: globalThis.crypto?.randomUUID?.() ??
          `meeting-runtime-${Date.now()}`,
        name: "meeting.updated",
        meetingId:
          hydration.meeting?.id ?? null,
        participantId: null,
        occurredAt: initializedAt,
        payload: {
          reason: "runtime_initialized",
          meetingCode:
            normalizedMeetingCode,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Meeting runtime initialization failed.";

      this.setSnapshot({
        meetingCode: normalizedMeetingCode,
        status: "failed",
        initializedAt: null,
        stoppedAt: null,
        error: message,
      });

      throw error;
    }
  }

  hydrate(
    hydration: MeetingRuntimeHydration,
  ): void {
    if (hydration.meeting !== undefined) {
      meetingRuntimeStore.setMeeting(
        hydration.meeting,
      );
    }

    if (hydration.participants) {
      participantRuntimeStore
        .replaceParticipants(
          hydration.participants,
        );
    }

    if (hydration.room !== undefined) {
      roomRuntimeStore.setRoom(
        hydration.room,
      );
    }

    if (
      hydration.workspace !== undefined
    ) {
      workspaceRuntimeStore.setWorkspace(
        hydration.workspace,
      );
    }
  }

  stop(): void {
    const current = this.snapshot;

    if (
      current.status === "idle" ||
      current.status === "stopped"
    ) {
      return;
    }

    this.setSnapshot({
      ...current,
      status: "stopping",
      error: null,
    });

    participantRuntimeStore
      .replaceParticipants([]);
    meetingRuntimeStore.setMeeting(null);
    roomRuntimeStore.setRoom(null);
    workspaceRuntimeStore
      .setWorkspace(null);

    this.setSnapshot({
      meetingCode: current.meetingCode,
      status: "stopped",
      initializedAt:
        current.initializedAt,
      stoppedAt:
        new Date().toISOString(),
      error: null,
    });
  }

  fail(error: unknown): void {
    const message =
      error instanceof Error
        ? error.message
        : String(
            error ||
              "Meeting runtime failed.",
          );

    this.setSnapshot({
      ...this.snapshot,
      status: "failed",
      error: message,
    });
  }

  private setSnapshot(
    snapshot:
      MeetingRuntimeOrchestratorSnapshot,
  ): void {
    this.snapshot = snapshot;

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const meetingRuntimeOrchestrator =
  new MeetingRuntimeOrchestrator();
