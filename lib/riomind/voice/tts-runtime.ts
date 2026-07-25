import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { selectRioMindVoiceProvider } from "./voice-provider-registry";
import { recordRioMindVoiceEvent } from "./voice-event-bus";


async function synthesizeWithElevenLabsShell(input: {
  text: string;
  voice?: string;
  language?: string;
}) {
  // Phase 3B: ElevenLabs adapter shell.
  // Real audio generation will be added next with binary/audio response handling.
  if (!process.env.ELEVENLABS_API_KEY) {
    return {
      mode: "mock",
      audioUrl: null,
      providerStatus: "not_configured",
      note: "Missing ELEVENLABS_API_KEY. Mock TTS pipeline confirmed.",
    };
  }

  return {
    mode: "adapter_ready",
    audioUrl: null,
    providerStatus: "available",
    note: "ElevenLabs adapter selected. Real audio generation endpoint comes next.",
  };
}

export async function runRioMindTts(input: {
  aiLayer?: unknown;
  provider?: string;
  sessionId?: string;
  text: string;
  voice?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();

  const aiLayer = normalizeAiLayer(input.aiLayer || "nexus_ai");
  const provider = selectRioMindVoiceProvider("tts", input.provider);

  const synthesis =
    provider.id === "elevenlabs"
      ? await synthesizeWithElevenLabsShell({
          text: input.text,
          voice: input.voice,
          language: input.language,
        })
      : {
          mode: provider.id === "mock_voice" ? "mock" : "provider_pending",
          audioUrl: null,
          providerStatus: provider.status,
          note:
            provider.id === "mock_voice"
              ? "Mock TTS pipeline confirmed. Connect a provider key to generate real audio."
              : "Provider runtime selected; real audio adapter will be connected in the next phase.",
        };

  await recordRioMindVoiceEvent({
    sessionId: input.sessionId || null,
    eventType: "tts_requested",
    direction: "outbound",
    payload: {
      aiLayer,
      provider: provider.id,
      providerStatus: synthesis.providerStatus,
      text: input.text,
      voice: input.voice || "default",
      language: input.language || "en",
      mode: synthesis.mode,
      audioUrl: synthesis.audioUrl,
      ...(input.metadata || {}),
    },
  });

  return {
    ok: true,
    provider,
    audio: {
      mode: synthesis.mode,
      text: input.text,
      voice: input.voice || "default",
      language: input.language || "en",
      audioUrl: synthesis.audioUrl,
      note: synthesis.note,
    },
  };
}
