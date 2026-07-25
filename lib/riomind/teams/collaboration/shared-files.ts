export type SharedFile = {
  id: string;
  meetingId: string;
  workspaceId: string | null;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string | null;
  uploadedBy: string | null;
  createdAt: string;
};
