export type RioMindGeminiRuntimeInput = {
  message: string;
  systemPrompt: string;
  model?: string;
};

export type RioMindGeminiRuntimeResult = {
  ok: boolean;
  provider: "gemini";
  model: string;
  response: string | null;
  error: string | null;
};

export async function runGeminiRuntime(
  input: RioMindGeminiRuntimeInput
): Promise<RioMindGeminiRuntimeResult> {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();

  const model =
    input.model ??
    process.env.RIOMIND_GEMINI_MODEL?.trim() ??
    "gemini-2.0-flash";

  if (!apiKey) {
    return {
      ok: false,
      provider: "gemini",
      model,
      response: null,
      error: "GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY is not configured.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: input.systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: input.message }],
            },
          ],
        }),
      }
    );

    clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        provider: "gemini",
        model,
        response: null,
        error:
          data?.error?.message ??
          `Gemini request failed with status ${res.status}.`,
      };
    }

    const outputText =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part?.text ?? "")
        ?.filter(Boolean)
        ?.join("\n") ?? null;

    return {
      ok: true,
      provider: "gemini",
      model,
      response: outputText,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "gemini",
      model,
      response: null,
      error: error instanceof Error ? error.message : "Unknown Gemini runtime error.",
    };
  }
}
