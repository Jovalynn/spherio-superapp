import type {
  CanonicalMeeting,
} from "../models/canonical-meeting";
import {
  RuntimeStore,
} from "./store-core";

export type MeetingRuntimeSnapshot = {
  meeting: CanonicalMeeting | null;
  loading: boolean;
  error: string | null;
};

export class MeetingRuntimeStore extends RuntimeStore<MeetingRuntimeSnapshot> {
  constructor() {
    super({
      meeting: null,
      loading: false,
      error: null,
    });
  }

  setMeeting(
    meeting: CanonicalMeeting | null,
  ): void {
    this.update((current) => ({
      ...current,
      meeting,
      loading: false,
      error: null,
    }));
  }

  patchMeeting(
    patch: Partial<CanonicalMeeting>,
  ): void {
    this.update((current) => ({
      ...current,
      meeting: current.meeting
        ? {
            ...current.meeting,
            ...patch,
          }
        : null,
    }));
  }
}

export const meetingRuntimeStore =
  new MeetingRuntimeStore();
