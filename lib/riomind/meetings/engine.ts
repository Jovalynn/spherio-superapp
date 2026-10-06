import type {
  MeetingRoom,
  MeetingParticipant,
  MeetingLifecycleState,
  MeetingEventType,
} from "./types";

import {
  transitionMeetingLifecycle,
} from "./lifecycle";

import {
  meetingEventBus,
} from "./events";

import {
  loadMeetingRoom,
} from "./repository";

export class MeetingEngine {
  private readonly meetings = new Map<string, MeetingRoom>();

  private meetingKey(meetingCode: string) {
    return String(meetingCode || "")
      .trim()
      .toUpperCase();
  }

  hasMeeting(meetingCode: string) {
    return this.meetings.has(
      this.meetingKey(meetingCode)
    );
  }

  getMeeting(meetingCode: string) {
    return this.meetings.get(
      this.meetingKey(meetingCode)
    );
  }

  listMeetings() {
    return [...this.meetings.values()];
  }

  registerMeeting(meeting: MeetingRoom) {
    const key = this.meetingKey(meeting.meetingCode);

    if (!key) {
      throw new Error(
        "Meeting code is required for runtime registration"
      );
    }

    meeting.meetingCode = key;
    this.meetings.set(key, meeting);

    return meeting;
  }

  async loadMeeting(meetingCode: string) {
    const loadedMeeting = await loadMeetingRoom(
      meetingCode
    );

    if (!loadedMeeting) {
      return null;
    }

    return this.registerMeeting(loadedMeeting);
  }

  async ensureMeetingLoaded(meetingCode: string) {
    const existing = this.getMeeting(meetingCode);

    if (existing) {
      return existing;
    }

    const loaded = await this.loadMeeting(meetingCode);

    if (!loaded) {
      throw new Error(
        `Meeting not found: ${meetingCode}`
      );
    }

    return loaded;
  }

  removeMeetingFromRuntime(meetingCode: string) {
    return this.meetings.delete(
      this.meetingKey(meetingCode)
    );
  }

  async transition(
    meetingCode: string,
    nextState: MeetingLifecycleState
  ) {
    const meeting = await this.ensureMeetingLoaded(
      meetingCode
    );

    const previous = meeting.lifecycle;

    meeting.lifecycle = transitionMeetingLifecycle(
      previous,
      nextState
    );

    meeting.updatedAt = new Date().toISOString();

    const lifecyclePayload = {
      previousState: previous,
      currentState: meeting.lifecycle,
    };

    await this.publish(
      meetingCode,
      "meeting.lifecycle.changed",
      lifecyclePayload
    );

    if (meeting.lifecycle === "live") {
      await this.publish(
        meetingCode,
        previous === "paused"
          ? "meeting.resumed"
          : "meeting.started",
        lifecyclePayload
      );
    } else if (meeting.lifecycle === "paused") {
      await this.publish(
        meetingCode,
        "meeting.paused",
        lifecyclePayload
      );
    } else if (meeting.lifecycle === "ending") {
      await this.publish(
        meetingCode,
        "meeting.ending",
        lifecyclePayload
      );
    } else if (meeting.lifecycle === "archived") {
      await this.publish(
        meetingCode,
        "meeting.ended",
        lifecyclePayload
      );
    }

    return meeting;
  }

  async addParticipant(
    meetingCode: string,
    participant: MeetingParticipant
  ) {
    const meeting = await this.ensureMeetingLoaded(
      meetingCode
    );

    const exists = meeting.participants.find(
      (p) => p.id === participant.id
    );

    if (exists) {
      Object.assign(exists, participant);
      meeting.updatedAt = new Date().toISOString();
      return meeting;
    }

    meeting.participants.push(participant);
    meeting.updatedAt = new Date().toISOString();

    await this.publish(
      meetingCode,
      "participant.joined",
      participant
    );

    return meeting;
  }

  async removeParticipant(
    meetingCode: string,
    participantId: string
  ) {
    const meeting = await this.ensureMeetingLoaded(
      meetingCode
    );

    meeting.participants =
      meeting.participants.filter(
        (p) => p.id !== participantId
      );

    meeting.updatedAt = new Date().toISOString();

    await this.publish(
      meetingCode,
      "participant.left",
      { participantId }
    );

    return meeting;
  }

  async publish(
    meetingCode: string,
    type: MeetingEventType,
    payload: unknown
  ) {
    await meetingEventBus.publish({
      id: crypto.randomUUID(),
      meetingCode,
      type,
      createdAt: new Date().toISOString(),
      payload,
    });
  }
}

export const meetingEngine = new MeetingEngine();
