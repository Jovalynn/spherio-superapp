import type {
  ToolbarAction,
  ToolbarMediaState,
  ToolbarPanel,
  ToolbarRuntimeState,
} from "./types";

export type ToolbarStoreListener = (
  state: ToolbarRuntimeState,
) => void;

const DEFAULT_MEDIA_STATE: ToolbarMediaState = {
  cameraEnabled: false,
  microphoneEnabled: false,
  screenShareEnabled: false,
  videoEnabled: false,
  recordingEnabled: false,
};

export function createInitialToolbarState(
  overrides: Partial<ToolbarRuntimeState> = {},
): ToolbarRuntimeState {
  return {
    activePanel: overrides.activePanel ?? null,
    media: {
      ...DEFAULT_MEDIA_STATE,
      ...overrides.media,
    },
    disabledActions: overrides.disabledActions ?? [],
    mounted: overrides.mounted ?? false,
  };
}

export class ToolbarRuntimeStore {
  private state: ToolbarRuntimeState;

  private readonly listeners = new Set<ToolbarStoreListener>();

  constructor(initialState: Partial<ToolbarRuntimeState> = {}) {
    this.state = createInitialToolbarState(initialState);
  }

  getState(): ToolbarRuntimeState {
    return {
      ...this.state,
      media: { ...this.state.media },
      disabledActions: [...this.state.disabledActions],
    };
  }

  subscribe(listener: ToolbarStoreListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  mount(): void {
    this.update({ mounted: true });
  }

  suspend(): void {
    this.update({ activePanel: null });
  }

  resume(): void {
    this.update({ mounted: true });
  }

  destroy(): void {
    this.state = createInitialToolbarState();
    this.emit();
    this.listeners.clear();
  }

  setActivePanel(panel: ToolbarPanel): void {
    this.update({ activePanel: panel });
  }

  closeActivePanel(): void {
    this.setActivePanel(null);
  }

  setMediaState(media: Partial<ToolbarMediaState>): void {
    this.update({
      media: {
        ...this.state.media,
        ...media,
      },
    });
  }

  setActionDisabled(
    action: ToolbarAction,
    disabled: boolean,
  ): void {
    const disabledActions = new Set(
      this.state.disabledActions,
    );

    if (disabled) {
      disabledActions.add(action);
    } else {
      disabledActions.delete(action);
    }

    this.update({
      disabledActions: [...disabledActions],
    });
  }

  isActionDisabled(action: ToolbarAction): boolean {
    return this.state.disabledActions.includes(action);
  }

  private update(
    patch: Partial<ToolbarRuntimeState>,
  ): void {
    this.state = {
      ...this.state,
      ...patch,
    };

    this.emit();
  }

  private emit(): void {
    const snapshot = this.getState();

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
