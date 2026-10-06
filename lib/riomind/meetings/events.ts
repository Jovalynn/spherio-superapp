import type { MeetingEvent, MeetingEventType } from "./types";

export type MeetingEventHandler<T = unknown> = (
  event: MeetingEvent<T>
) => void | Promise<void>;

export class MeetingEventBus {
  private readonly listeners = new Map<
    MeetingEventType,
    Set<MeetingEventHandler>
  >();

  subscribe(
    type: MeetingEventType,
    handler: MeetingEventHandler
  ): () => void {
    let handlers = this.listeners.get(type);

    if (!handlers) {
      handlers = new Set();
      this.listeners.set(type, handlers);
    }

    handlers.add(handler);

    return () => {
      handlers?.delete(handler);

      if (handlers && handlers.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  async publish<T>(event: MeetingEvent<T>): Promise<void> {
    const handlers = this.listeners.get(event.type);

    if (!handlers || handlers.size === 0) {
      return;
    }

    for (const handler of handlers) {
      await handler(event);
    }
  }

  listenerCount(type?: MeetingEventType): number {
    if (!type) {
      let total = 0;

      for (const handlers of this.listeners.values()) {
        total += handlers.size;
      }

      return total;
    }

    return this.listeners.get(type)?.size ?? 0;
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const meetingEventBus = new MeetingEventBus();
