import type { ToolbarRuntime } from "./runtime";

export interface ToolbarModuleLifecycle {
  initialize(): void | Promise<void>;
  mount(): void | Promise<void>;
  suspend(): void | Promise<void>;
  resume(): void | Promise<void>;
  destroy(): void | Promise<void>;
}

export function createToolbarLifecycle(
  runtime: ToolbarRuntime,
): ToolbarModuleLifecycle {
  return {
    initialize() {
      runtime.initialize();
    },

    mount() {
      runtime.mount();
    },

    suspend() {
      runtime.suspend();
    },

    resume() {
      runtime.resume();
    },

    destroy() {
      runtime.destroy();
    },
  };
}
