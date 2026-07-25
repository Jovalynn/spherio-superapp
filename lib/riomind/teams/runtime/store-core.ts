export type StoreListener<T> = (
  snapshot: T,
) => void;

export class RuntimeStore<T> {
  private snapshot: T;
  private readonly listeners =
    new Set<StoreListener<T>>();

  constructor(initialSnapshot: T) {
    this.snapshot = initialSnapshot;
  }

  getSnapshot(): T {
    return this.snapshot;
  }

  setSnapshot(next: T): void {
    this.snapshot = next;
    this.emit();
  }

  update(
    updater: (current: T) => T,
  ): void {
    this.snapshot = updater(this.snapshot);
    this.emit();
  }

  subscribe(
    listener: StoreListener<T>,
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }
}
