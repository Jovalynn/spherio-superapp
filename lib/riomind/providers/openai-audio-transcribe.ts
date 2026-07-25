import OpenAI from "openai";

export async function transcribeAudioWithOpenAI(audioFile: File, sourceLanguage = "en") {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return { ok: false, error: "OPENAI_API_KEY is not configured.", text: "" };
  }

  const openai = new OpenAI({ apiKey });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: sourceLanguage === "auto" ? undefined : sourceLanguage,
    temperature: 0,
    prompt:
      "This is a live business/meeting speech transcript. Only transcribe words actually spoken by the speaker. Do not add filler phrases such as thank you for watching, subscribe, goodbye, captions by, music, applause, or outro text.",
  });

  return {
    ok: true,
    text: transcription.text || "",
  };
}
