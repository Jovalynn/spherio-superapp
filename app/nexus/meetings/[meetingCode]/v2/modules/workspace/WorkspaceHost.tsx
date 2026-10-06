"use client";

import {
  useState,
  type ReactNode,
} from "react";

import {
  WorkspaceProvider,
  type WorkspaceId,
} from "./WorkspaceContext";

import WorkspaceContainer
  from "./WorkspaceContainer";

import WorkspaceTabs
  from "./WorkspaceTabs";

export type WorkspaceHostProps = {
  meetingCode: string;

  /**
   * Used when the host manages its own state.
   */
  initialWorkspace?: WorkspaceId;

  /**
   * Supply both controlled props when the parent page
   * remains the canonical workspace-state authority.
   */
  activeWorkspace?: WorkspaceId;
  onWorkspaceChange?: (
    workspace: WorkspaceId
  ) => void;

  renderWorkspace: (
    workspace: WorkspaceId
  ) => ReactNode;
};

export default function WorkspaceHost({
  meetingCode,
  initialWorkspace = "voice",
  activeWorkspace: controlledWorkspace,
  onWorkspaceChange,
  renderWorkspace,
}: WorkspaceHostProps) {
  const [
    internalWorkspace,
    setInternalWorkspace,
  ] = useState<WorkspaceId>(
    initialWorkspace
  );

  const isControlled =
    controlledWorkspace !== undefined;

  const activeWorkspace =
    controlledWorkspace ??
    internalWorkspace;

  function selectWorkspace(
    workspace: WorkspaceId
  ) {
    if (!isControlled) {
      setInternalWorkspace(workspace);
    }

    onWorkspaceChange?.(workspace);
  }

  return (
    <WorkspaceProvider
      value={{
        meetingCode,
        activeWorkspace,
        setActiveWorkspace:
          selectWorkspace,
      }}
    >
      <WorkspaceContainer
        tabs={
          <WorkspaceTabs
            activeWorkspace={
              activeWorkspace
            }
            onSelect={
              selectWorkspace
            }
          />
        }
      >
        {renderWorkspace(
          activeWorkspace
        )}
      </WorkspaceContainer>
    </WorkspaceProvider>
  );
}
