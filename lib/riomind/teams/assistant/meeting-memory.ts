import type {
  MeetingActionItem,
} from "./action-items";
import type {
  MeetingDecision,
} from "./decisions";
import type {
  MeetingSummary,
} from "./meeting-summary";
import type {
  TranscriptSegment,
} from "./transcript";

export type MeetingMemory = {
  meetingId: string;
  transcript: TranscriptSegment[];
  summary: MeetingSummary | null;
  decisions: MeetingDecision[];
  actionItems: MeetingActionItem[];
  updatedAt: string | null;
};
