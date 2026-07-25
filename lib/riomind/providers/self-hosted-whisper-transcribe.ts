export async function transcribeAudioWithSelfHostedWhisper(audioFile: File, sourceLanguage = "en") {
  const endpoint = process.env.SELF_HOSTED_WHISPER_URL?.trim();

  if (!endpoint) return { ok: false, error: "SELF_HOSTED_WHISPER_URL is not configured.", text: "" };

  const formData = new FormData();
  formData.append("audio", audioFile, audioFile.name || "voice.webm");
  formData.append("sourceLanguage", sourceLanguage || "en");

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: json?.error || "Self-hosted Whisper transcription failed.", text: "" };
  }

  return { ok: true, text: String(json.text || json.transcriptText || "").trim() };
}
