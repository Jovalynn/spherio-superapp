import { speakTextWithOpenAI } from "@/lib/riomind/providers/openai-audio-speech";
import { speakTextWithDeepgram } from "@/lib/riomind/providers/deepgram-audio-speech";

function getTtsProviderOrder() {
  return String(process.env.RIOMIND_TTS_PROVIDER_ORDER || "openai,deepgram")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export async function speakTextWithRouter(text: string, language = "en", voiceStyle = "alloy") {
  const attempts: any[] = [];

  for (const provider of getTtsProviderOrder()) {
    try {
      if (provider === "openai") {
        return {
          ok: true,
          provider,
          audioBuffer: await speakTextWithOpenAI(text, language, voiceStyle),
          contentType: "audio/mpeg",
          attempts,
        };
      }

      if (provider === "deepgram") {
        return {
          ok: true,
          provider,
          audioBuffer: await speakTextWithDeepgram(text, language, process.env.DEEPGRAM_TTS_MODEL || "aura-2-thalia-en"),
          contentType: "audio/mpeg",
          attempts,
        };
      }
    } catch (error: any) {
      attempts.push({ provider, ok: false, error: error?.message || "TTS failed." });
    }
  }

  throw new Error(attempts.map((a) => `${a.provider}: ${a.error}`).join(" | ") || "No TTS provider succeeded.");
}
