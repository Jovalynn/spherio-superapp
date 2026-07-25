export type RioMindLocalModelsRuntimeInput = {
  message: string;
  systemPrompt: string;
  model?: string;
};

export type RioMindLocalModelsRuntimeResult = {
  ok: boolean;
  provider: "local_models";
  model: string;
  response: string | null;
  error: string | null;
};

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export async function runLocalModelsRuntime(
  input: RioMindLocalModelsRuntimeInput
): Promise<RioMindLocalModelsRuntimeResult> {
  const baseUrl = normalizeBaseUrl(
    process.env.LOCAL_MODEL_BASE_URL?.trim() ||
      process.env.OLLAMA_BASE_URL?.trim() ||
      process.env.VLLM_BASE_URL?.trim() ||
      "http://host.docker.internal:11434"
  );

  const apiKey =
    process.env.LOCAL_MODEL_API_KEY?.trim() ||
    process.env.OLLAMA_API_KEY?.trim() ||
    process.env.VLLM_API_KEY?.trim() ||
    "local";

  const model =
    input.model ??
    process.env.RIOMIND_LOCAL_MODEL?.trim() ??
    process.env.OLLAMA_MODEL?.trim() ??
    process.env.VLLM_MODEL?.trim() ??
    "llama3.1";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
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
        provider: "local_models",
        model,
        response: null,
        error:
          data?.error?.message ??
          data?.message ??
          `Local model request failed with status ${res.status}. Base URL: ${baseUrl}`,
      };
    }

    const outputText = data?.choices?.[0]?.message?.content ?? null;

    return {
      ok: true,
      provider: "local_models",
      model,
      response: outputText,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "local_models",
      model,
      response: null,
      error: error instanceof Error ? error.message : "Unknown local model runtime error.",
    };
  }
}
