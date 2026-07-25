"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  nexusWorkspaceModuleRegistry,
} from "./module-registry";
import type {
  NexusWorkspaceModuleDefinition,
  NexusWorkspaceModuleId,
  NexusWorkspaceType,
} from "./workspace-types";

type WorkspaceContextValue = {
  meetingCode: string;
  workspaceType: NexusWorkspaceType;

  activeModuleId: NexusWorkspaceModuleId;
  setActiveModuleId: (
    moduleId: NexusWorkspaceModuleId,
  ) => void;

  enabledModuleIds:
    readonly NexusWorkspaceModuleId[];
  modules:
    readonly NexusWorkspaceModuleDefinition[];

  isModuleEnabled: (
    moduleId: NexusWorkspaceModuleId,
  ) => boolean;
  enableModule: (
    moduleId: NexusWorkspaceModuleId,
  ) => void;
  disableModule: (
    moduleId: NexusWorkspaceModuleId,
  ) => void;
};

const WorkspaceContext =
  createContext<WorkspaceContextValue | null>(
    null,
  );

type WorkspaceProviderProps = {
  meetingCode: string;
  workspaceType?: NexusWorkspaceType;
  initialActiveModuleId?: NexusWorkspaceModuleId;
  children: ReactNode;
};

export function WorkspaceProvider({
  meetingCode,
  workspaceType = "meeting",
  initialActiveModuleId = "meeting",
  children,
}: WorkspaceProviderProps) {
  const modules = useMemo(
    () =>
      nexusWorkspaceModuleRegistry
        .listForWorkspace(workspaceType),
    [workspaceType],
  );

  const defaultModuleIds = useMemo(
    () =>
      nexusWorkspaceModuleRegistry
        .enabledByDefault(workspaceType)
        .map(({ manifest }) => manifest.id),
    [workspaceType],
  );

  const [
    activeModuleId,
    setActiveModuleIdState,
  ] = useState<NexusWorkspaceModuleId>(
    initialActiveModuleId,
  );

  const [
    enabledModuleIds,
    setEnabledModuleIds,
  ] = useState<
    readonly NexusWorkspaceModuleId[]
  >(defaultModuleIds);

  const isModuleEnabled = useCallback(
    (moduleId: NexusWorkspaceModuleId) =>
      enabledModuleIds.includes(moduleId),
    [enabledModuleIds],
  );

  const enableModule = useCallback(
    (moduleId: NexusWorkspaceModuleId) => {
      setEnabledModuleIds((current) =>
        current.includes(moduleId)
          ? current
          : [...current, moduleId],
      );
    },
    [],
  );

  const disableModule = useCallback(
    (moduleId: NexusWorkspaceModuleId) => {
      setEnabledModuleIds((current) =>
        current.filter(
          (currentModuleId) =>
            currentModuleId !== moduleId,
        ),
      );

      setActiveModuleIdState((current) =>
        current === moduleId
          ? "meeting"
          : current,
      );
    },
    [],
  );

  const setActiveModuleId = useCallback(
    (moduleId: NexusWorkspaceModuleId) => {
      if (
        !nexusWorkspaceModuleRegistry.has(
          moduleId,
        )
      ) {
        return;
      }

      enableModule(moduleId);
      setActiveModuleIdState(moduleId);
    },
    [enableModule],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      meetingCode,
      workspaceType,
      activeModuleId,
      setActiveModuleId,
      enabledModuleIds,
      modules,
      isModuleEnabled,
      enableModule,
      disableModule,
    }),
    [
      activeModuleId,
      disableModule,
      enableModule,
      enabledModuleIds,
      isModuleEnabled,
      meetingCode,
      modules,
      setActiveModuleId,
      workspaceType,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useNexusWorkspace():
  WorkspaceContextValue {
  const context =
    useContext(WorkspaceContext);

  if (!context) {
    throw new Error(
      "useNexusWorkspace must be used inside WorkspaceProvider.",
    );
  }

  return context;
}
