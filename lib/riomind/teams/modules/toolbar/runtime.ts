import {
  createToolbarActionEvent,
  TOOLBAR_RUNTIME_EVENTS,
  type ToolbarRuntimeEventName,
} from "./events";
import { ToolbarRuntimeStore } from "./store";
import type {
  ToolbarAction,
  ToolbarActionEvent,
  ToolbarPanel,
  ToolbarRuntimeState,
} from "./types";

export interface ToolbarRuntimeEvent {
  name: ToolbarRuntimeEventName;
  payload?: unknown;
  timestamp: string;
}

export type ToolbarRuntimeEventListener = (
  event: ToolbarRuntimeEvent,
) => void;

export interface ToolbarRuntimeOptions {
  meetingCode?: string;
  participantRuntimeId?: string | null;
  initialState?: Partial<ToolbarRuntimeState>;
}

export class ToolbarRuntime {
  readonly store: ToolbarRuntimeStore;

  private readonly listeners =
    new Set<ToolbarRuntimeEventListener>();

  private initialized = false;

  constructor(
    private readonly options: ToolbarRuntimeOptions = {},
  ) {
    this.store = new ToolbarRuntimeStore(
      options.initialState,
    );
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.emit(TOOLBAR_RUNTIME_EVENTS.INITIALIZED);
  }

  mount(): void {
    this.initialize();
    this.store.mount();
    this.emit(TOOLBAR_RUNTIME_EVENTS.MOUNTED);
  }

  suspend(): void {
    this.store.suspend();
    this.emit(TOOLBAR_RUNTIME_EVENTS.SUSPENDED);
  }

  resume(): void {
    this.store.resume();
    this.emit(TOOLBAR_RUNTIME_EVENTS.RESUMED);
  }

  destroy(): void {
    this.store.destroy();
    this.initialized = false;
    this.emit(TOOLBAR_RUNTIME_EVENTS.DESTROYED);
    this.listeners.clear();
  }

  selectPanel(panel: ToolbarPanel): void {
    this.store.setActivePanel(panel);

    this.emit(
      TOOLBAR_RUNTIME_EVENTS.PANEL_CHANGED,
      { panel },
    );
  }

  dispatchAction(
    action: ToolbarAction,
    metadata?: Record<string, unknown>,
  ): ToolbarActionEvent {
    const event = createToolbarActionEvent(action, {
      meetingCode: this.options.meetingCode,
      participantRuntimeId:
        this.options.participantRuntimeId,
      metadata,
    });

    this.emit(
      TOOLBAR_RUNTIME_EVENTS.ACTION,
      event,
    );

    return event;
  }

  subscribe(
    listener: ToolbarRuntimeEventListener,
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(
    name: ToolbarRuntimeEventName,
    payload?: unknown,
  ): void {
    const event: ToolbarRuntimeEvent = {
      name,
      payload,
      timestamp: new Date().toISOString(),
    };

    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
