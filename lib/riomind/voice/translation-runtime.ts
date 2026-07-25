import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { selectRioMindVoiceProvider } from "./voice-provider-registry";
import { recordRioMindVoiceEvent } from "./voice-event-bus";
import { upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";

export async function runRioMindVoiceTranslation(input: {
  aiLayer?: unknown;
  sessionId?: string;
  meetingCode?: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  provider?: string;
  speakerLabel?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();

  const aiLayer = normalizeAiLayer(input.aiLayer || "nexus_ai");
  const provider = selectRioMindVoiceProvider("translation", input.provider);
  const sourceLanguage = input.sourceLanguage || "auto";
  const targetLanguage = input.targetLanguage || "en";

  const translation =
    provider.id === "mock_voice"
      ? `[mock ${sourceLanguage}->${targetLanguage}] ${input.text}`
      : `[${sourceLanguage}->${targetLanguage}] ${input.text}`;

  const result = await getRioMindAiFoundationPool().query(
    `INSERT INTO riomind_voice_transcripts
     (session_id, meeting_code, speaker_label, source_language, target_language, transcript, translation, confidence, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      input.sessionId || null,
      input.meetingCode || null,
      input.speakerLabel || "Translator",
      sourceLanguage,
      targetLanguage,
      input.text,
      translation,
      provider.id === "mock_voice" ? 0.5 : null,
      JSON.stringify({
        provider: provider.id,
        providerStatus: provider.status,
        mode: "translation",
        ...(input.metadata || {}),
      }),
    ]
  );

  await recordRioMindVoiceEvent({
    sessionId: input.sessionId || null,
    eventType: "translation_created",
    direction: "internal",
    payload: {
      meetingCode: input.meetingCode || null,
      sourceLanguage,
      targetLanguage,
      provider: provider.id,
      providerStatus: provider.status,
      transcriptId: result.rows[0].id,
    },
  });

  const translationNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "voice_translation",
    nodeKey: result.rows[0].id,
    title: `Translation: ${sourceLanguage}->${targetLanguage}`,
    description: translation,
    metadata: result.rows[0],
  }).catch(() => null);

  if (translationNode && input.sessionId) {
    const sessionNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "voice_session",
      nodeKey: input.sessionId,
      title: `Voice Session ${input.sessionId}`,
      description: "RioMind voice session.",
    }).catch(() => null);

    if (sessionNode) {
      await upsertRioMindKgEdge({
        aiLayer,
        fromNodeId: sessionNode.id,
        toNodeId: translationNode.id,
        relation: "has_translation",
        confidence: 1,
      }).catch(() => null);
    }
  }

  if (translationNode && input.meetingCode) {
    const meetingNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "meeting",
      nodeKey: input.meetingCode,
      title: `Meeting ${input.meetingCode}`,
      description: "Nexus Teams meeting.",
    }).catch(() => null);

    if (meetingNode) {
      await upsertRioMindKgEdge({
        aiLayer,
        fromNodeId: meetingNode.id,
        toNodeId: translationNode.id,
        relation: "has_translation",
        confidence: 1,
      }).catch(() => null);
    }
  }

  return {
    ok: true,
    provider,
    translation: result.rows[0],
  };
}

export async function runRioMindRealtimeTranslation(input: {
  aiLayer?: unknown;
  sessionId?: string;
  meetingCode?: string;
  text: string;
  sourceLanguage?: string;
  targetLanguages?: string[];
  provider?: string;
  speakerLabel?: string;
  metadata?: Record<string, unknown>;
}) {
  const targets = Array.isArray(input.targetLanguages) && input.targetLanguages.length
    ? input.targetLanguages
    : ["en"];

  const translations = [];

  for (const targetLanguage of targets) {
    translations.push(await runRioMindVoiceTranslation({
      aiLayer: input.aiLayer,
      sessionId: input.sessionId,
      meetingCode: input.meetingCode,
      text: input.text,
      sourceLanguage: input.sourceLanguage || "auto",
      targetLanguage,
      provider: input.provider,
      speakerLabel: input.speakerLabel || "Realtime Translator",
      metadata: {
        ...(input.metadata || {}),
        realtime: true,
      },
    }));
  }

  return {
    ok: translations.every((item) => item.ok),
    count: translations.length,
    translations,
  };
}
