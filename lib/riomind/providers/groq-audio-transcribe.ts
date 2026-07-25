export async function transcribeAudioWithGroq(audioFile: File, sourceLanguage = "en") {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) return { ok: false, error: "GROQ_API_KEY is not configured.", text: "" };

  const formData = new FormData();
  formData.append("file", audioFile, audioFile.name || "voice.webm");
  formData.append("model", process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo");
  if (sourceLanguage && sourceLanguage !== "auto") formData.append("language", sourceLanguage);

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: json?.error?.message || "Groq transcription failed.", text: "" };
  }

  return { ok: true, text: String(json.text || "").trim() };
}
