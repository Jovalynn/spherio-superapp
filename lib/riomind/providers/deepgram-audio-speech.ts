export async function speakTextWithDeepgram(text: string, language = "en", voiceStyle = "aura-2-thalia-en") {
  const apiKey = process.env.DEEPGRAM_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is not configured.");
  }

  const model = process.env.DEEPGRAM_TTS_MODEL || voiceStyle || "aura-2-thalia-en";

  const res = await fetch(
    `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=mp3`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(err || "Deepgram TTS failed.");
  }

  return Buffer.from(await res.arrayBuffer());
}
