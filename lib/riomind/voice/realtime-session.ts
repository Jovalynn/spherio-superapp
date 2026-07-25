import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { selectRioMindVoiceProvider } from "./voice-provider-registry";
import { upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";
import { recordRioMindVoiceEvent } from "./voice-event-bus";

export async function createRioMindVoiceSession(input: {
  aiLayer?: unknown;
  surface?: string;
  sessionType?: string;
  provider?: string;
  meetingCode?: string;
  ownerUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();

  const aiLayer = normalizeAiLayer(input.aiLayer || "nexus_ai");
  const selectedProvider = selectRioMindVoiceProvider("realtime", input.provider);
  const db = getRioMindAiFoundationPool();

  const result = await db.query(
    `INSERT INTO riomind_voice_sessions
     (ai_layer, surface, session_type, provider, status, meeting_code, owner_user_id, metadata)
     VALUES ($1,$2,$3,$4,'created',$5,$6,$7)
     RETURNING *`,
    [
      aiLayer,
      input.surface || "nexus",
      input.sessionType || "realtime",
      selectedProvider.id,
      input.meetingCode || null,
      input.ownerUserId || "local-user",
      JSON.stringify({
        providerName: selectedProvider.name,
        capabilities: selectedProvider.capabilities,
        providerStatus: selectedProvider.status,
        ...(input.metadata || {}),
      }),
    ]
  );

  await recordRioMindVoiceEvent({
    sessionId: result.rows[0].id,
    eventType: "session_created",
    direction: "internal",
    payload: { provider: selectedProvider.id, meetingCode: input.meetingCode || null },
  });

  const sessionNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "voice_session",
    nodeKey: result.rows[0].id,
    title: `Voice Session: ${input.meetingCode || result.rows[0].id}`,
    description: `RioMind voice/realtime session using ${selectedProvider.name}.`,
    metadata: result.rows[0],
  }).catch(() => null);

  if (sessionNode && input.meetingCode) {
    const meetingNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "meeting",
      nodeKey: input.meetingCode,
      title: `Meeting ${input.meetingCode}`,
      description: "Nexus Teams meeting linked to voice session.",
    }).catch(() => null);

    if (meetingNode) {
      await upsertRioMindKgEdge({
        aiLayer,
        fromNodeId: meetingNode.id,
        toNodeId: sessionNode.id,
        relation: "has_voice_session",
        confidence: 1,
      }).catch(() => null);
    }
  }

  return result.rows[0];
}

export async function listRioMindVoiceSessions(input: {
  aiLayer?: unknown;
  meetingCode?: string;
  limit?: number;
}) {
  await ensureRioMindAiFoundationSchema();

  const aiLayer = normalizeAiLayer(input.aiLayer || "nexus_ai");
  const limit = Math.min(Math.max(Number(input.limit || 25), 1), 100);

  const result = await getRioMindAiFoundationPool().query(
    `SELECT * FROM riomind_voice_sessions
     WHERE ai_layer = $1
       AND ($2::text IS NULL OR meeting_code = $2)
     ORDER BY created_at DESC
     LIMIT $3`,
    [aiLayer, input.meetingCode || null, limit]
  );

  return result.rows;
}
