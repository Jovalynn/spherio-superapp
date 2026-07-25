export type SharedNote = {
  id: string;
  meetingId: string;
  authorParticipantId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export function updateSharedNote(
  note: SharedNote,
  content: string,
): SharedNote {
  return {
    ...note,
    content,
    updatedAt: new Date().toISOString(),
  };
}
