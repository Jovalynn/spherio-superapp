export type HeartbeatOptions = {
  intervalMs?: number;
  onHeartbeat: () =>
    void | Promise<void>;
  onError?: (error: unknown) => void;
};

export function startParticipantHeartbeat(
  options: HeartbeatOptions,
): () => void {
  const intervalMs =
    options.intervalMs ?? 20_000;

  let stopped = false;
  let running = false;

  const tick = async () => {
    if (stopped || running) {
      return;
    }

    running = true;

    try {
      await options.onHeartbeat();
    } catch (error) {
      options.onError?.(error);
    } finally {
      running = false;
    }
  };

  void tick();

  const timer = setInterval(
    () => void tick(),
    intervalMs,
  );

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
