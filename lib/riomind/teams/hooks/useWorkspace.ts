"use client";

import {
  workspaceRuntimeStore,
} from "../runtime/workspace-runtime-store";
import {
  useRuntimeStore,
} from "./use-runtime-store";

export function useWorkspace() {
  return useRuntimeStore(
    workspaceRuntimeStore,
  );
}
