import {
  NEXUS_WORKSPACE_MODULE_MANIFESTS,
} from "./module-manifests";
import type {
  NexusWorkspaceModuleDefinition,
  NexusWorkspaceModuleId,
  NexusWorkspaceModuleManifest,
  NexusWorkspaceRegion,
  NexusWorkspaceType,
} from "./workspace-types";

export class NexusWorkspaceModuleRegistry {
  private readonly modules =
    new Map<
      NexusWorkspaceModuleId,
      NexusWorkspaceModuleDefinition
    >();

  constructor(
    manifests:
      readonly NexusWorkspaceModuleManifest[] = [],
  ) {
    for (const manifest of manifests) {
      this.register({ manifest });
    }
  }

  register(
    definition: NexusWorkspaceModuleDefinition,
  ): void {
    const moduleId = definition.manifest.id;

    if (this.modules.has(moduleId)) {
      throw new Error(
        `Nexus workspace module "${moduleId}" is already registered.`,
      );
    }

    this.modules.set(moduleId, definition);
  }

  replace(
    definition: NexusWorkspaceModuleDefinition,
  ): void {
    this.modules.set(
      definition.manifest.id,
      definition,
    );
  }

  unregister(
    moduleId: NexusWorkspaceModuleId,
  ): boolean {
    return this.modules.delete(moduleId);
  }

  get(
    moduleId: NexusWorkspaceModuleId,
  ): NexusWorkspaceModuleDefinition | null {
    return this.modules.get(moduleId) ?? null;
  }

  has(
    moduleId: NexusWorkspaceModuleId,
  ): boolean {
    return this.modules.has(moduleId);
  }

  list(): NexusWorkspaceModuleDefinition[] {
    return Array.from(
      this.modules.values(),
    ).sort(
      (left, right) =>
        left.manifest.order -
        right.manifest.order,
    );
  }

  listForWorkspace(
    workspaceType: NexusWorkspaceType,
  ): NexusWorkspaceModuleDefinition[] {
    return this.list().filter(
      ({ manifest }) =>
        manifest.supportedWorkspaceTypes.includes(
          workspaceType,
        ),
    );
  }

  listByRegion(
    region: NexusWorkspaceRegion,
    workspaceType?: NexusWorkspaceType,
  ): NexusWorkspaceModuleDefinition[] {
    const modules = workspaceType
      ? this.listForWorkspace(workspaceType)
      : this.list();

    return modules.filter(
      ({ manifest }) =>
        manifest.region === region,
    );
  }

  enabledByDefault(
    workspaceType: NexusWorkspaceType,
  ): NexusWorkspaceModuleDefinition[] {
    return this.listForWorkspace(
      workspaceType,
    ).filter(
      ({ manifest }) =>
        manifest.enabledByDefault,
    );
  }
}

export const nexusWorkspaceModuleRegistry =
  new NexusWorkspaceModuleRegistry(
    NEXUS_WORKSPACE_MODULE_MANIFESTS,
  );
