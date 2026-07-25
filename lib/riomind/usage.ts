import { getRioMindPgPool } from "@/lib/riomind/db";

type RioMindUsageEventInput = {
  ownerKey: string;
  conversationId?: string | null;
  requestType?: string;
  route?: string | null;
  agent?: string | null;
  capability?: string | null;
  inputText?: string;
  outputText?: string;
  latencyMs?: number;
  status?: string;
  metadata?: Record<string, unknown>;
};

function estimateTokens(text?: string) {
  const length = String(text || "").length;
  return Math.max(0, Math.ceil(length / 4));
}

function toSafeInt(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.round(number));
}

function cleanNullableText(value: unknown, max = 180) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, max) : null;
}

function cleanConversationId(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned || null;
}

export async function logRioMindUsageEvent(input: RioMindUsageEventInput) {
  try {
    const db = getRioMindPgPool();
    const inputText = String(input.inputText || "");
    const outputText = String(input.outputText || "");

    await db.query(
      `
        INSERT INTO riomind_usage_events (
          owner_key,
          conversation_id,
          request_type,
          route,
          agent,
          capability,
          input_chars,
          output_chars,
          estimated_input_tokens,
          estimated_output_tokens,
          latency_ms,
          status,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
      `,
      [
        cleanNullableText(input.ownerKey, 120) || "local_dev",
        cleanConversationId(input.conversationId),
        cleanNullableText(input.requestType, 80) || "chat",
        cleanNullableText(input.route),
        cleanNullableText(input.agent),
        cleanNullableText(input.capability),
        inputText.length,
        outputText.length,
        estimateTokens(inputText),
        estimateTokens(outputText),
        toSafeInt(input.latencyMs),
        cleanNullableText(input.status, 80) || "completed",
        JSON.stringify(input.metadata || {}),
      ]
    );
  } catch (error) {
    console.warn("[riomind_usage_event_failed]", error);
  }
}
