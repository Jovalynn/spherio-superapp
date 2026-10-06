export async function speakTextWithElevenLabs(
  text: string,
  language = "en",
  voiceId?: string,
) {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  const resolvedVoiceId =
    voiceId ||
    process.env.ELEVENLABS_DEFAULT_VOICE_ID?.trim();

  if (!resolvedVoiceId) {
    throw new Error(
      "ELEVENLABS_DEFAULT_VOICE_ID is not configured and no voiceId was supplied.",
    );
  }

  const modelId =
    process.env.ELEVENLABS_TTS_MODEL?.trim() ||
    "eleven_flash_v2_5";

  const outputFormat =
    process.env.ELEVENLABS_OUTPUT_FORMAT?.trim() ||
    "mp3_44100_128";

  const params = new URLSearchParams({
    output_format: outputFormat,
  });

  const body: Record<string, unknown> = {
    text,
    model_id: modelId,
  };

  if (
    language &&
    modelId !== "eleven_multilingual_v2"
  ) {
    body.language_code = language;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      resolvedVoiceId,
    )}?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");

    throw new Error(
      errorText ||
        `ElevenLabs TTS failed with HTTP ${response.status}.`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}
