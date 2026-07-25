export type RioMindGrokRuntimeInput = {
  message: string;
  systemPrompt: string;
  model?: string;
};

export type RioMindGrokRuntimeResult = {
  ok: boolean;
  provider: "grok";
  model: string;
  response: string | null;
  error: string | null;
};

export async function runGrokRuntime(
  input: RioMindGrokRuntimeInput
): Promise<RioMindGrokRuntimeResult> {
  const apiKey =
    process.env.XAI_API_KEY?.trim() ||
    process.env.GROK_API_KEY?.trim();

  const model =
    input.model ??
    process.env.RIOMIND_GROK_MODEL?.trim() ??
    "grok-4.3";

  if (!apiKey) {
    return {
      ok: false,
      provider: "grok",
      model,
      response: null,
      error: "XAI_API_KEY or GROK_API_KEY is not configured.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
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
        provider: "grok",
        model,
        response: null,
        error:
          data?.error?.message ??
          data?.message ??
          `Grok request failed with status ${res.status}.`,
      };
    }

    const outputText = data?.choices?.[0]?.message?.content ?? null;

    return {
      ok: true,
      provider: "grok",
      model,
      response: outputText,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "grok",
      model,
      response: null,
      error: error instanceof Error ? error.message : "Unknown Grok runtime error.",
    };
  }
}
