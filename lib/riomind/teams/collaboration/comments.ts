export type CollaborationComment = {
  id: string;
  resourceType:
    | "note"
    | "document"
    | "file"
    | "whiteboard";
  resourceId: string;
  participantId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};
