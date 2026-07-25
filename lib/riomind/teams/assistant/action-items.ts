export type MeetingActionItem = {
  id: string;
  meetingId: string;
  title: string;
  description: string | null;
  assigneeParticipantId: string | null;
  dueAt: string | null;
  status:
    | "open"
    | "in_progress"
    | "completed"
    | "cancelled";
  createdAt: string;
  updatedAt: string;
};
