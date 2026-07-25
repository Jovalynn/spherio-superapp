import type {
  CanonicalParticipant,
} from "../models/canonical-participant";
import {
  RuntimeStore,
} from "./store-core";

export type ParticipantRuntimeSnapshot = {
  participants: CanonicalParticipant[];
  activeParticipantId: string | null;
  loading: boolean;
  error: string | null;
  updatedAt: string | null;
};

const initialSnapshot:
  ParticipantRuntimeSnapshot = {
    participants: [],
    activeParticipantId: null,
    loading: false,
    error: null,
    updatedAt: null,
  };

export class ParticipantRuntimeStore extends RuntimeStore<ParticipantRuntimeSnapshot> {
  constructor() {
    super(initialSnapshot);
  }

  replaceParticipants(
    participants: CanonicalParticipant[],
  ): void {
    this.update((current) => ({
      ...current,
      participants,
      loading: false,
      error: null,
      updatedAt: new Date().toISOString(),
    }));
  }

  upsertParticipant(
    participant: CanonicalParticipant,
  ): void {
    this.update((current) => {
      const index = current.participants.findIndex(
        (item) => item.id === participant.id,
      );

      const participants =
        index >= 0
          ? current.participants.map(
              (item, itemIndex) =>
                itemIndex === index
                  ? participant
                  : item,
            )
          : [
              ...current.participants,
              participant,
            ];

      return {
        ...current,
        participants,
        updatedAt:
          new Date().toISOString(),
      };
    });
  }

  removeParticipant(
    participantId: string,
  ): void {
    this.update((current) => ({
      ...current,
      participants:
        current.participants.filter(
          (participant) =>
            participant.id !== participantId,
        ),
      updatedAt: new Date().toISOString(),
    }));
  }

  setActiveParticipant(
    participantId: string | null,
  ): void {
    this.update((current) => ({
      ...current,
      activeParticipantId: participantId,
    }));
  }

  setLoading(loading: boolean): void {
    this.update((current) => ({
      ...current,
      loading,
    }));
  }

  setError(error: string | null): void {
    this.update((current) => ({
      ...current,
      error,
      loading: false,
    }));
  }
}

export const participantRuntimeStore =
  new ParticipantRuntimeStore();
