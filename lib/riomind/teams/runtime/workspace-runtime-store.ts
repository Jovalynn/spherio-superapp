import type {
  CanonicalWorkspace,
} from "../models/canonical-workspace";
import {
  RuntimeStore,
} from "./store-core";

export class WorkspaceRuntimeStore extends RuntimeStore<CanonicalWorkspace | null> {
  constructor() {
    super(null);
  }

  setWorkspace(
    workspace: CanonicalWorkspace | null,
  ): void {
    this.setSnapshot(workspace);
  }
}

export const workspaceRuntimeStore =
  new WorkspaceRuntimeStore();
