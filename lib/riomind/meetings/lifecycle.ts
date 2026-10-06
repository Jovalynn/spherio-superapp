import type { MeetingLifecycleState } from "./types";

export class InvalidMeetingLifecycleTransitionError extends Error {
  readonly from: MeetingLifecycleState;
  readonly to: MeetingLifecycleState;

  constructor(from: MeetingLifecycleState, to: MeetingLifecycleState) {
    super(`Invalid meeting lifecycle transition: ${from} -> ${to}`);
    this.name = "InvalidMeetingLifecycleTransitionError";
    this.from = from;
    this.to = to;
  }
}

export const MEETING_LIFECYCLE_TRANSITIONS: Readonly<
  Record<MeetingLifecycleState, readonly MeetingLifecycleState[]>
> = {
  scheduled: ["lobby", "archived"],
  lobby: ["joining", "live", "ending", "archived"],
  joining: ["lobby", "live", "ending"],
  live: ["paused", "ending"],
  paused: ["live", "ending"],
  ending: ["archived"],
  archived: [],
};

export function getAllowedMeetingTransitions(
  currentState: MeetingLifecycleState
): readonly MeetingLifecycleState[] {
  return MEETING_LIFECYCLE_TRANSITIONS[currentState];
}

export function canTransitionMeetingLifecycle(
  currentState: MeetingLifecycleState,
  nextState: MeetingLifecycleState
): boolean {
  if (currentState === nextState) {
    return true;
  }

  return MEETING_LIFECYCLE_TRANSITIONS[currentState].includes(nextState);
}

export function assertMeetingLifecycleTransition(
  currentState: MeetingLifecycleState,
  nextState: MeetingLifecycleState
): void {
  if (!canTransitionMeetingLifecycle(currentState, nextState)) {
    throw new InvalidMeetingLifecycleTransitionError(
      currentState,
      nextState
    );
  }
}

export function transitionMeetingLifecycle(
  currentState: MeetingLifecycleState,
  nextState: MeetingLifecycleState
): MeetingLifecycleState {
  assertMeetingLifecycleTransition(currentState, nextState);
  return nextState;
}

export function isMeetingJoinable(
  state: MeetingLifecycleState
): boolean {
  return (
    state === "lobby" ||
    state === "joining" ||
    state === "live" ||
    state === "paused"
  );
}

export function isMeetingActive(
  state: MeetingLifecycleState
): boolean {
  return (
    state === "joining" ||
    state === "live" ||
    state === "paused" ||
    state === "ending"
  );
}

export function isMeetingTerminal(
  state: MeetingLifecycleState
): boolean {
  return state === "archived";
}
