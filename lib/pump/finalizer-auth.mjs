import { timingSafeEqual } from "node:crypto";

/** Finalizer routes are unavailable unless a server-only token is configured. */
export function isAuthorizedPumpFinalizer(request, expectedToken = process.env.PUMP_FINALIZER_ADMIN_TOKEN || "") {
  if (typeof expectedToken !== "string" || expectedToken.trim().length === 0) {
    return false;
  }

  const suppliedToken = request.headers.get("x-pump-finalizer-token") || "";
  if (!suppliedToken) return false;

  const expected = Buffer.from(expectedToken, "utf8");
  const supplied = Buffer.from(suppliedToken, "utf8");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
