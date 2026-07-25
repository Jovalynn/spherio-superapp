export function asRecord(
  value: unknown,
): Record<string, unknown> {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function asText(
  value: unknown,
  fallback = "",
): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function asNullableText(
  value: unknown,
): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

export function asBoolean(
  value: unknown,
  fallback = false,
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

export function asNumber(
  value: unknown,
  fallback = 0,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}
