function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function transcribeAudioWithAssemblyAI(audioFile: File, sourceLanguage = "en") {
  const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();

  if (!apiKey) return { ok: false, error: "ASSEMBLYAI_API_KEY is not configured.", text: "" };

  const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: { authorization: apiKey },
    body: audioFile,
  });

  const uploadJson = await uploadRes.json().catch(() => ({}));

  if (!uploadRes.ok || !uploadJson.upload_url) {
    return { ok: false, error: uploadJson?.error || "AssemblyAI upload failed.", text: "" };
  }

  const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: uploadJson.upload_url,
      language_code: sourceLanguage && sourceLanguage !== "auto" ? sourceLanguage : undefined,
    }),
  });

  const transcriptJson = await transcriptRes.json().catch(() => ({}));

  if (!transcriptRes.ok || !transcriptJson.id) {
    return { ok: false, error: transcriptJson?.error || "AssemblyAI transcript creation failed.", text: "" };
  }

  for (let i = 0; i < 12; i++) {
    await sleep(1500);

    const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptJson.id}`, {
      headers: { authorization: apiKey },
    });

    const pollJson = await pollRes.json().catch(() => ({}));

    if (pollJson.status === "completed") {
      return { ok: true, text: String(pollJson.text || "").trim() };
    }

    if (pollJson.status === "error") {
      return { ok: false, error: pollJson.error || "AssemblyAI transcription failed.", text: "" };
    }
  }

  return { ok: false, error: "AssemblyAI transcription timed out.", text: "" };
}
