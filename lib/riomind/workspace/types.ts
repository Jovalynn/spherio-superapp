export type WorkspaceId =
  | "voice"
  | "chat"
  | "participants"
  | "files"
  | "notes"
  | "documents"
  | "whiteboard"
  | "tasks"
  | "polls"
  | "apps"
  | "ai";

export interface WorkspaceDefinition {
  id: WorkspaceId;
  title: string;
  icon: string;
  primary: boolean;
}
