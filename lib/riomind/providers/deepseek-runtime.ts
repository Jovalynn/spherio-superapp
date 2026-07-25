export type RioMindDeepSeekRuntimeInput = {
  message: string;
  systemPrompt: string;
  model?: string;
};

export type RioMindDeepSeekRuntimeResult = {
  ok: boolean;
  provider: "deepseek";
  model: string;
  response: string | null;
  error: string | null;
};

export async function runDeepSeekRuntime(
  input: RioMindDeepSeekRuntimeInput
): Promise<RioMindDeepSeekRuntimeResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const model =
    input.model ??
    process.env.RIOMIND_DEEPSEEK_MODEL?.trim() ??
    "deepseek-chat";

  if (!apiKey) {
    return {
      ok: false,
      provider: "deepseek",
      model,
      response: null,
      error: "DEEPSEEK_API_KEY is not configured.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("https://api.deepseek.com/chat/completions", {
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
        provider: "deepseek",
        model,
        response: null,
        error:
          data?.error?.message ??
          data?.message ??
          `DeepSeek request failed with status ${res.status}.`,
      };
    }

    const outputText = data?.choices?.[0]?.message?.content ?? null;

    return {
      ok: true,
      provider: "deepseek",
      model,
      response: outputText,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "deepseek",
      model,
      response: null,
      error: error instanceof Error ? error.message : "Unknown DeepSeek runtime error.",
    };
  }
}
