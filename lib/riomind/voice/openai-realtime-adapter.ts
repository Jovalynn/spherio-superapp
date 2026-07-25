import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";
import { recordRioMindVoiceEvent } from "./voice-event-bus";

export type OpenAiRealtimeSessionInput = {
  aiLayer?: unknown;
  surface?: string;
  meetingCode?: string;
  ownerUserId?: string;
  model?: string;
  voice?: string;
  instructions?: string;
  modalities?: string[];
  metadata?: Record<string, unknown>;
};

export async function createOpenAiRealtimeSession(input: OpenAiRealtimeSessionInput) {
  await ensureRioMindAiFoundationSchema();

  const aiLayer = normalizeAiLayer(input.aiLayer || "nexus_ai");
  const db = getRioMindAiFoundationPool();

  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  const model =
    input.model ||
    process.env.RIOMIND_OPENAI_REALTIME_MODEL ||
    "gpt-4o-realtime-preview";
  const voice =
    input.voice ||
    process.env.RIOMIND_OPENAI_REALTIME_VOICE ||
    "alloy";

  const instructions =
    input.instructions ||
    [
      "You are RioMind Nexus realtime meeting intelligence.",
      "Help with live conversation, meeting summaries, action items, and translation support.",
      "Do not expose provider names, API keys, model names, internal routing, or hidden infrastructure to end users.",
      "Use tool and workflow outputs only when provided by RioMind runtime.",
    ].join(" ");

  const session = await db.query(
    `INSERT INTO riomind_voice_sessions
     (ai_layer, surface, session_type, provider, status, meeting_code, owner_user_id, metadata)
     VALUES ($1,$2,'openai_realtime','openai_realtime',$3,$4,$5,$6)
     RETURNING *`,
    [
      aiLayer,
      input.surface || "nexus_teams",
      hasKey ? "adapter_ready" : "not_configured",
      input.meetingCode || null,
      input.ownerUserId || "local-user",
      JSON.stringify({
        model,
        voice,
        modalities: input.modalities || ["audio", "text"],
        instructions,
        providerStatus: hasKey ? "available" : "missing_openai_api_key",
        clientSecretMode: "server_managed_pending",
        ...(input.metadata || {}),
      }),
    ]
  );

  await recordRioMindVoiceEvent({
    sessionId: session.rows[0].id,
    eventType: "openai_realtime_session_created",
    direction: "internal",
    payload: {
      model,
      voice,
      meetingCode: input.meetingCode || null,
      hasKey,
      note: hasKey
        ? "OpenAI Realtime adapter session created. Ephemeral client-token minting comes next."
        : "OpenAI API key missing. Session stored as not_configured.",
    },
  });

  const sessionNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "voice_session",
    nodeKey: session.rows[0].id,
    title: `OpenAI Realtime Session: ${input.meetingCode || session.rows[0].id}`,
    description: "RioMind OpenAI Realtime adapter session.",
    metadata: session.rows[0],
  }).catch(() => null);

  if (sessionNode && input.meetingCode) {
    const meetingNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "meeting",
      nodeKey: input.meetingCode,
      title: `Meeting ${input.meetingCode}`,
      description: "Nexus Teams meeting linked to OpenAI realtime session.",
    }).catch(() => null);

    if (meetingNode) {
      await upsertRioMindKgEdge({
        aiLayer,
        fromNodeId: meetingNode.id,
        toNodeId: sessionNode.id,
        relation: "has_realtime_ai_session",
        confidence: 1,
      }).catch(() => null);
    }
  }

  return {
    ok: hasKey,
    session: session.rows[0],
    realtime: {
      provider: "openai_realtime",
      status: hasKey ? "adapter_ready" : "not_configured",
      model,
      voice,
      modalities: input.modalities || ["audio", "text"],
      instructions,
      client: {
        ephemeralTokenUrl: "/api/riomind/voice/realtime/openai/token",
        websocketReady: false,
        note: "Server-side session config is ready. Ephemeral token minting and browser WebRTC/WebSocket wiring come next.",
      },
    },
  };
}
