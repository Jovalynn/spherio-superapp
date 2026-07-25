import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";

export async function recordRioMindGuardrailEvent(input: {
  aiLayer?: unknown;
  surface?: string;
  eventType: string;
  severity?: string;
  allowed?: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();

  const result = await getRioMindAiFoundationPool().query(
    `INSERT INTO riomind_guardrail_events
     (ai_layer, surface, event_type, severity, allowed, reason, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      normalizeAiLayer(input.aiLayer),
      input.surface || "nexus",
      input.eventType,
      input.severity || "info",
      input.allowed ?? true,
      input.reason || "",
      input.metadata || {},
    ]
  );

  return result.rows[0];
}
