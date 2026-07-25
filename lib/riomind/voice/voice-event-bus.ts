import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool } from "../ai-foundation/db";

export type RioMindVoiceEventType =
  | "session_created"
  | "openai_realtime_session_created"
  | "stt_requested"
  | "stt_transcript_created"
  | "translation_created"
  | "tts_requested"
  | "tts_completed"
  | "provider_error"
  | "session_closed";

export async function recordRioMindVoiceEvent(input: {
  sessionId?: string | null;
  eventType: RioMindVoiceEventType | string;
  direction?: "inbound" | "outbound" | "internal";
  payload?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();

  const result = await getRioMindAiFoundationPool().query(
    `INSERT INTO riomind_voice_events
     (session_id, event_type, direction, payload)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [
      input.sessionId || null,
      input.eventType,
      input.direction || "internal",
      JSON.stringify(input.payload || {}),
    ]
  );

  return result.rows[0];
}
