import {
  ensureRioMindAiFoundationSchema,
  getRioMindAiFoundationPool,
  normalizeAiLayer,
} from "../ai-foundation/db";
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
  sourceLanguage?: string;
  targetLanguage?: string;
  translationMode?: boolean;
  metadata?: Record<string, unknown>;
};

export async function createOpenAiRealtimeSession(
  input: OpenAiRealtimeSessionInput,
) {
  await ensureRioMindAiFoundationSchema();

  const aiLayer = normalizeAiLayer(input.aiLayer || "nexus_ai");
  const db = getRioMindAiFoundationPool();

  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim());

  const model =
    input.model ||
    process.env.RIOMIND_OPENAI_REALTIME_MODEL ||
    "gpt-4o-realtime-preview";

  const voice =
    input.voice ||
    process.env.RIOMIND_OPENAI_REALTIME_VOICE ||
    "alloy";

  const sourceLanguage =
    String(input.sourceLanguage || "auto").trim();

  const targetLanguage =
    String(input.targetLanguage || "en").trim();

  const translationMode =
    input.translationMode !== false;

  const instructions =
    input.instructions ||
    [
      "You are RioMind Nexus realtime meeting translation assistant.",
      "Listen to the incoming speaker audio.",
      translationMode
        ? `Translate speech from ${sourceLanguage} into ${targetLanguage}.`
        : "Respond naturally to the incoming conversation.",
      "Preserve the speaker's meaning and intent.",
      "Preserve names, numbers, URLs, scripture references, technical terms, and proper nouns.",
      "Do not summarize.",
      "Do not omit meaningful content.",
      "Do not invent content.",
      "Return natural spoken language.",
      "Keep responses concise enough for realtime conversation.",
    ].join(" ");

  const session = await db.query(
    `INSERT INTO riomind_voice_sessions
     (ai_layer, surface, session_type, provider, status, meeting_code, owner_user_id, metadata)
     VALUES ($1,$2,'openai_realtime','openai_realtime',$3,$4,$5,$6)
     RETURNING *`,
    [
      aiLayer,
      input.surface || "nexus_teams",
      hasKey ? "ready" : "not_configured",
      input.meetingCode || null,
      input.ownerUserId || "local-user",
      JSON.stringify({
        model,
        voice,
        modalities: input.modalities || ["audio"],
        instructions,
        sourceLanguage,
        targetLanguage,
        translationMode,
        providerStatus: hasKey
          ? "available"
          : "missing_openai_api_key",
        clientSecretMode: "ephemeral",
        transport: "websocket_or_webrtc",
        ...(input.metadata || {}),
      }),
    ],
  );

  const sessionRow = session.rows[0];

  await recordRioMindVoiceEvent({
    sessionId: sessionRow.id,
    eventType: "openai_realtime_session_created",
    direction: "internal",
    payload: {
      model,
      voice,
      meetingCode: input.meetingCode || null,
      sourceLanguage,
      targetLanguage,
      translationMode,
      hasKey,
      transport: "websocket_or_webrtc",
    },
  });

  const sessionNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "voice_session",
    nodeKey: sessionRow.id,
    title: `OpenAI Realtime Session: ${
      input.meetingCode || sessionRow.id
    }`,
    description: "RioMind OpenAI realtime translation session.",
    metadata: sessionRow,
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
    session: sessionRow,
    realtime: {
      provider: "openai_realtime",
      status: hasKey ? "ready" : "not_configured",
      model,
      voice,
      modalities: input.modalities || ["audio"],
      instructions,
      sourceLanguage,
      targetLanguage,
      translationMode,
      transport: "websocket_or_webrtc",
      client: {
        ephemeralTokenUrl:
          "/api/riomind/voice/realtime/openai/token",
        websocketReady: false,
        webrtcReady: false,
      },
    },
  };
}
