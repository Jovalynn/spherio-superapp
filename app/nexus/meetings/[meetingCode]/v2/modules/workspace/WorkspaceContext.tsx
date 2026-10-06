"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

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

export type WorkspaceContextValue = {
  meetingCode: string;
  activeWorkspace: WorkspaceId;
  setActiveWorkspace: (
    workspace: WorkspaceId
  ) => void;
};

const WorkspaceContext =
  createContext<WorkspaceContextValue | null>(
    null
  );

export function WorkspaceProvider({
  value,
  children,
}: {
  value: WorkspaceContextValue;
  children: ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(
    WorkspaceContext
  );

  if (!context) {
    throw new Error(
      "useWorkspace must be used inside WorkspaceProvider."
    );
  }

  return context;
}
