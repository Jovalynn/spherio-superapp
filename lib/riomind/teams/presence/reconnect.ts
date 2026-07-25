export type ReconnectPolicy = {
  maximumAttempts: number;
  baseDelayMs: number;
  maximumDelayMs: number;
};

export const defaultReconnectPolicy:
  ReconnectPolicy = {
    maximumAttempts: 8,
    baseDelayMs: 1_000,
    maximumDelayMs: 30_000,
  };

export function reconnectDelay(
  attempt: number,
  policy = defaultReconnectPolicy,
): number {
  return Math.min(
    policy.baseDelayMs *
      2 ** Math.max(0, attempt - 1),
    policy.maximumDelayMs,
  );
}
