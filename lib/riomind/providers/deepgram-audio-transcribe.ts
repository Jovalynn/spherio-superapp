export async function transcribeAudioWithDeepgram(audioFile: File, sourceLanguage = "en") {
  const apiKey = process.env.DEEPGRAM_API_KEY?.trim();

  if (!apiKey) return { ok: false, error: "DEEPGRAM_API_KEY is not configured.", text: "" };

  const language = sourceLanguage && sourceLanguage !== "auto" ? `&language=${encodeURIComponent(sourceLanguage)}` : "";
  const url = `https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true${language}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": audioFile.type || "audio/webm",
    },
    body: audioFile,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: json?.err_msg || json?.error || "Deepgram transcription failed.", text: "" };
  }

  const text =
    json?.results?.channels?.[0]?.alternatives?.[0]?.transcript ||
    json?.results?.utterances?.map((u: any) => u.transcript).join(" ") ||
    "";

  return { ok: true, text: String(text || "").trim() };
}
