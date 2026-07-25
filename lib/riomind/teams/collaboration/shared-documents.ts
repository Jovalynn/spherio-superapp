export type SharedDocument = {
  id: string;
  meetingId: string;
  title: string;
  contentType: string;
  revision: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};
