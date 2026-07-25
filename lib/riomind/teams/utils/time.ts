export function isoNow(): string {
  return new Date().toISOString();
}

export function elapsedMilliseconds(
  timestamp: string | null,
  now = Date.now(),
): number | null {
  if (!timestamp) {
    return null;
  }

  const parsed = Date.parse(timestamp);

  return Number.isFinite(parsed)
    ? Math.max(0, now - parsed)
    : null;
}
