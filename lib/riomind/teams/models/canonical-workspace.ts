export type CanonicalWorkspace = {
  id: string;
  teamId: string;

  name: string;
  description: string | null;

  sharedFilesEnabled: boolean;
  sharedReportsEnabled: boolean;
  sharedAnalyticsEnabled: boolean;
  sharedArtifactsEnabled: boolean;
  sharedNotesEnabled: boolean;
  sharedDocumentsEnabled: boolean;
  whiteboardEnabled: boolean;

  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};
