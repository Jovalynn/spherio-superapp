import type {
  CanonicalMeeting,
} from "../models/canonical-meeting";

export function isMeetingLive(
  meeting: CanonicalMeeting | null,
): boolean {
  return meeting?.status === "active";
}

export function meetingDisplayCode(
  meeting: CanonicalMeeting | null,
): string {
  return meeting?.code || "Unassigned";
}
