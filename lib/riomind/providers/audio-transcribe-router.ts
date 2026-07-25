import { transcribeAudioWithOpenAI } from "@/lib/riomind/providers/openai-audio-transcribe";
import { transcribeAudioWithGroq } from "@/lib/riomind/providers/groq-audio-transcribe";
import { transcribeAudioWithDeepgram } from "@/lib/riomind/providers/deepgram-audio-transcribe";
import { transcribeAudioWithAssemblyAI } from "@/lib/riomind/providers/assemblyai-audio-transcribe";
import { transcribeAudioWithSelfHostedWhisper } from "@/lib/riomind/providers/self-hosted-whisper-transcribe";

type TranscribeAttempt = {
  provider: string;
  ok: boolean;
  error?: string;
};

function getProviderOrder() {
  return String(
    process.env.RIOMIND_STT_PROVIDER_ORDER ||
      "openai,groq,deepgram,assemblyai,selfhosted"
  )
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function transcribeAudioWithRouter(audioFile: File, sourceLanguage = "en") {
  const attempts: TranscribeAttempt[] = [];

  const providers: Record<string, () => Promise<any>> = {
    openai: () => transcribeAudioWithOpenAI(audioFile, sourceLanguage),
    groq: () => transcribeAudioWithGroq(audioFile, sourceLanguage),
    deepgram: () => transcribeAudioWithDeepgram(audioFile, sourceLanguage),
    assemblyai: () => transcribeAudioWithAssemblyAI(audioFile, sourceLanguage),
    selfhosted: () => transcribeAudioWithSelfHostedWhisper(audioFile, sourceLanguage),
  };

  for (const provider of getProviderOrder()) {
    const run = providers[provider];
    if (!run) continue;

    try {
      const result = await run();

      if (result.ok && result.text) {
        return {
          ok: true,
          provider,
          text: result.text,
          attempts,
        };
      }

      attempts.push({
        provider,
        ok: false,
        error: result.error || `${provider} returned empty transcription.`,
      });
    } catch (error: any) {
      attempts.push({
        provider,
        ok: false,
        error: error?.message || `${provider} transcription failed.`,
      });
    }
  }

  return {
    ok: false,
    provider: null,
    text: "",
    recoverable: true,
    attempts,
    error:
      attempts.map((item) => `${item.provider}: ${item.error}`).join(" | ") ||
      "No transcription provider succeeded.",
  };
}
