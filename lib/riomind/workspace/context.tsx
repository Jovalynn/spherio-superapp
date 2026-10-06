"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  WorkspaceId,
} from "./types";

export type WorkspaceContextValue = {
  currentWorkspace: WorkspaceId;
  changeWorkspace: (
    workspace: WorkspaceId
  ) => void;
};

const WorkspaceContext =
  createContext<WorkspaceContextValue | null>(
    null
  );

export type WorkspaceProviderProps = {
  children: ReactNode;
  initialWorkspace?: WorkspaceId;
  currentWorkspace?: WorkspaceId;
  onWorkspaceChange?: (
    workspace: WorkspaceId
  ) => void;
};

export function WorkspaceProvider({
  children,
  initialWorkspace = "voice",
  currentWorkspace:
    controlledWorkspace,
  onWorkspaceChange,
}: WorkspaceProviderProps) {
  const [
    internalWorkspace,
    setInternalWorkspace,
  ] = useState<WorkspaceId>(
    initialWorkspace
  );

  const isControlled =
    controlledWorkspace !== undefined;

  const currentWorkspace =
    controlledWorkspace ??
    internalWorkspace;

  function changeWorkspace(
    workspace: WorkspaceId
  ) {
    if (!isControlled) {
      setInternalWorkspace(workspace);
    }

    onWorkspaceChange?.(workspace);
  }

  const value = useMemo(
    () => ({
      currentWorkspace,
      changeWorkspace,
    }),
    [currentWorkspace]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context =
    useContext(WorkspaceContext);

  if (!context) {
    throw new Error(
      "useWorkspace must be used inside WorkspaceProvider."
    );
  }

  return context;
}
