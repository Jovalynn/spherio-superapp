import type {
  MeetingMemory,
} from "./meeting-memory";
import type {
  TranscriptSegment,
} from "./transcript";

export function appendTranscriptSegment(
  memory: MeetingMemory,
  segment: TranscriptSegment,
): MeetingMemory {
  return {
    ...memory,
    transcript: [
      ...memory.transcript,
      segment,
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyMeetingMemory(
  meetingId: string,
): MeetingMemory {
  return {
    meetingId,
    transcript: [],
    summary: null,
    decisions: [],
    actionItems: [],
    updatedAt: null,
  };
}
