export type RioMindMistralRuntimeInput = {
  message: string;
  systemPrompt: string;
  model?: string;
};

export type RioMindMistralRuntimeResult = {
  ok: boolean;
  provider: "mistral";
  model: string;
  response: string | null;
  error: string | null;
};

export async function runMistralRuntime(
  input: RioMindMistralRuntimeInput
): Promise<RioMindMistralRuntimeResult> {
  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  const model =
    input.model ??
    process.env.RIOMIND_MISTRAL_MODEL?.trim() ??
    "mistral-small-latest";

  if (!apiKey) {
    return {
      ok: false,
      provider: "mistral",
      model,
      response: null,
      error: "MISTRAL_API_KEY is not configured.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.message },
        ],
      }),
    });

    clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        provider: "mistral",
        model,
        response: null,
        error:
          data?.error?.message ??
          data?.message ??
          `Mistral request failed with status ${res.status}.`,
      };
    }

    const outputText = data?.choices?.[0]?.message?.content ?? null;

    return {
      ok: true,
      provider: "mistral",
      model,
      response: outputText,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "mistral",
      model,
      response: null,
      error: error instanceof Error ? error.message : "Unknown Mistral runtime error.",
    };
  }
}
