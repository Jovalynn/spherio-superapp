export type TranscriptSegment = {
  id: string;
  meetingId: string;
  participantId: string | null;
  speakerName: string;
  text: string;
  language: string;
  startedAt: string;
  endedAt: string | null;
  confidence: number | null;
};
