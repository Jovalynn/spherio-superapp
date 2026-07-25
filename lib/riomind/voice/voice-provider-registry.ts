export type RioMindVoiceCapability = "stt" | "tts" | "realtime" | "translation";

export type RioMindVoiceProvider = {
  id: string;
  name: string;
  capabilities: RioMindVoiceCapability[];
  status: "available" | "planned" | "not_configured";
  envKeys: string[];
};

export const RIOMIND_VOICE_PROVIDERS: RioMindVoiceProvider[] = [
  {
    id: "openai_realtime",
    name: "OpenAI Realtime",
    capabilities: ["stt", "tts", "realtime", "translation"],
    status: process.env.OPENAI_API_KEY ? "available" : "not_configured",
    envKeys: ["OPENAI_API_KEY"],
  },
  {
    id: "deepgram",
    name: "Deepgram",
    capabilities: ["stt", "realtime"],
    status: process.env.DEEPGRAM_API_KEY ? "available" : "not_configured",
    envKeys: ["DEEPGRAM_API_KEY"],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    capabilities: ["tts", "realtime"],
    status: process.env.ELEVENLABS_API_KEY ? "available" : "not_configured",
    envKeys: ["ELEVENLABS_API_KEY"],
  },
  {
    id: "livekit",
    name: "LiveKit",
    capabilities: ["realtime"],
    status: process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET ? "available" : "not_configured",
    envKeys: ["LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"],
  },
  {
    id: "azure_speech",
    name: "Azure Speech",
    capabilities: ["stt", "tts", "translation"],
    status: process.env.AZURE_SPEECH_KEY ? "available" : "not_configured",
    envKeys: ["AZURE_SPEECH_KEY"],
  },
  {
    id: "google_speech",
    name: "Google Speech",
    capabilities: ["stt", "tts", "translation"],
    status: process.env.GOOGLE_APPLICATION_CREDENTIALS ? "available" : "not_configured",
    envKeys: ["GOOGLE_APPLICATION_CREDENTIALS"],
  },
  {
    id: "aws_speech",
    name: "AWS Transcribe/Polly",
    capabilities: ["stt", "tts"],
    status: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? "available" : "not_configured",
    envKeys: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
  },
  {
    id: "mock_voice",
    name: "Mock Voice Runtime",
    capabilities: ["stt", "tts", "realtime", "translation"],
    status: "available",
    envKeys: [],
  },
];

export function listRioMindVoiceProviders() {
  return RIOMIND_VOICE_PROVIDERS;
}

export function selectRioMindVoiceProvider(capability: RioMindVoiceCapability, preferred?: string) {
  if (preferred) {
    const match = RIOMIND_VOICE_PROVIDERS.find((provider) => provider.id === preferred);
    if (match && match.capabilities.includes(capability)) return match;
  }

  return (
    RIOMIND_VOICE_PROVIDERS.find((provider) => provider.status === "available" && provider.capabilities.includes(capability)) ||
    RIOMIND_VOICE_PROVIDERS.find((provider) => provider.id === "mock_voice")!
  );
}
