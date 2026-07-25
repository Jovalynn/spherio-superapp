export type MeetingDecision = {
  id: string;
  meetingId: string;
  description: string;
  decidedAt: string;
  participantIds: string[];
  sourceTranscriptIds: string[];
};
