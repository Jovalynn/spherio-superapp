import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { selectRioMindVoiceProvider } from "./voice-provider-registry";
import { upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";
import { recordRioMindVoiceEvent } from "./voice-event-bus";


async function transcribeWithDeepgramTextFallback(input: {
  audioTextHint?: string;
  language?: string;
}) {
  // Phase 3A: Deepgram adapter shell.
  // Real binary/audio streaming will be wired through WebSocket/upload next.
  // For now, this confirms provider selection, session storage, transcript storage,
  // meeting intelligence, and KG links using the existing API contract.
  if (!process.env.DEEPGRAM_API_KEY) {
    return {
      transcript: input.audioTextHint || "[deepgram unavailable] Missing DEEPGRAM_API_KEY.",
      confidence: 0.3,
      providerStatus: "not_configured",
    };
  }

  return {
    transcript:
      input.audioTextHint ||
      "[deepgram adapter ready] Send audio bytes or streaming frames in the next phase.",
    confidence: 0.75,
    providerStatus: "adapter_ready",
  };
}

export async function runRioMindStt(input: {
  aiLayer?: unknown;
  provider?: string;
  sessionId?: string;
  meetingCode?: string;
  audioTextHint?: string;
  language?: string;
  speakerLabel?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();

  const aiLayer = normalizeAiLayer(input.aiLayer || "nexus_ai");
  const provider = selectRioMindVoiceProvider("stt", input.provider);
  const providerTranscript =
    provider.id === "deepgram"
      ? await transcribeWithDeepgramTextFallback({
          audioTextHint: input.audioTextHint,
          language: input.language,
        })
      : {
          transcript:
            input.audioTextHint ||
            "[mock transcript] STT provider is not yet connected. This placeholder confirms the STT pipeline works.",
          confidence: 0.5,
          providerStatus: provider.status,
        };

  const transcript = providerTranscript.transcript;

  let sessionId = input.sessionId || null;

  if (!sessionId && input.meetingCode) {
    const existing = await getRioMindAiFoundationPool().query(
      `SELECT id FROM riomind_voice_sessions
       WHERE ai_layer = $1 AND meeting_code = $2 AND session_type = 'realtime'
       ORDER BY created_at DESC LIMIT 1`,
      [aiLayer, input.meetingCode]
    );
    sessionId = existing.rows[0]?.id || null;
  }

  if (!sessionId) {
    const session = await getRioMindAiFoundationPool().query(
      `INSERT INTO riomind_voice_sessions
       (ai_layer, surface, session_type, provider, status, meeting_code, owner_user_id, metadata)
       VALUES ($1,'nexus','stt',$2,'created',$3,'local-user',$4)
       RETURNING *`,
      [aiLayer, provider.id, input.meetingCode || null, JSON.stringify({ providerName: provider.name })]
    );
    sessionId = session.rows[0].id;
  }

  const result = await getRioMindAiFoundationPool().query(
    `INSERT INTO riomind_voice_transcripts
     (session_id, meeting_code, speaker_label, source_language, transcript, confidence, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      sessionId,
      input.meetingCode || null,
      input.speakerLabel || "Speaker",
      input.language || "en",
      transcript,
      providerTranscript.confidence,
      JSON.stringify({ provider: provider.id, providerStatus: providerTranscript.providerStatus, ...(input.metadata || {}) }),
    ]
  );

  await recordRioMindVoiceEvent({
    sessionId,
    eventType: "stt_transcript_created",
    direction: "inbound",
    payload: {
      meetingCode: input.meetingCode || null,
      speakerLabel: input.speakerLabel || "Speaker",
      provider: provider.id,
      providerStatus: providerTranscript.providerStatus,
      transcriptId: result.rows[0].id,
      confidence: providerTranscript.confidence,
    },
  });

  const transcriptNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "voice_transcript",
    nodeKey: result.rows[0].id,
    title: `Transcript: ${input.speakerLabel || "Speaker"}`,
    description: transcript,
    metadata: result.rows[0],
  }).catch(() => null);

  if (transcriptNode && sessionId) {
    const sessionNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "voice_session",
      nodeKey: sessionId,
      title: `Voice Session ${sessionId}`,
      description: "RioMind voice session.",
    }).catch(() => null);

    if (sessionNode) {
      await upsertRioMindKgEdge({
        aiLayer,
        fromNodeId: sessionNode.id,
        toNodeId: transcriptNode.id,
        relation: "has_transcript",
        confidence: 1,
      }).catch(() => null);
    }
  }

  if (transcriptNode && input.meetingCode) {
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
        toNodeId: transcriptNode.id,
        relation: "has_transcript",
        confidence: 1,
      }).catch(() => null);
    }
  }

  return {
    ok: true,
    provider,
    transcript: result.rows[0],
  };
}
