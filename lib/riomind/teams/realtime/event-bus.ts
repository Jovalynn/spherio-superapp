import type {
  TeamsRuntimeEvent,
  TeamsRuntimeEventName,
} from "../models/canonical-events";

type EventListener = (
  event: TeamsRuntimeEvent,
) => void;

export class TeamsEventBus {
  private readonly listeners =
    new Map<
      TeamsRuntimeEventName,
      Set<EventListener>
    >();

  subscribe(
    name: TeamsRuntimeEventName,
    listener: EventListener,
  ): () => void {
    const existing =
      this.listeners.get(name) ??
      new Set<EventListener>();

    existing.add(listener);
    this.listeners.set(name, existing);

    return () => {
      existing.delete(listener);

      if (existing.size === 0) {
        this.listeners.delete(name);
      }
    };
  }

  publish(
    event: TeamsRuntimeEvent,
  ): void {
    const listeners =
      this.listeners.get(event.name);

    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(event);
    }
  }
}

export const nexusTeamsEventBus =
  new TeamsEventBus();
