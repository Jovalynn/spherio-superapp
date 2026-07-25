export type MeetingSummary = {
  id: string;
  meetingId: string;
  summary: string;
  generatedAt: string;
  sourceSegmentCount: number;
  status:
    | "pending"
    | "generating"
    | "ready"
    | "failed";
};
