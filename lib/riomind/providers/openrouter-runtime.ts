export type RioMindVisionInput = {
  name?: string;
  mimeType?: string;
  dataUrl?: string;
  url?: string;
};

export type RioMindOpenRouterRuntimeInput = {
  message: string;
  systemPrompt: string;
  model?: string;
  maxOutputTokens?: number;
  images?: RioMindVisionInput[];
};

export type RioMindOpenRouterRuntimeResult = {
  ok: boolean;
  provider: "openrouter";
  model: string;
  response: string | null;
  error: string | null;
};

export async function runOpenRouterRuntime(
  input: RioMindOpenRouterRuntimeInput
): Promise<RioMindOpenRouterRuntimeResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  const model =
    input.model ??
    process.env.RIOMIND_OPENROUTER_MODEL?.trim() ??
    "openrouter/auto";

  if (!apiKey) {
    return {
      ok: false,
      provider: "openrouter",
      model,
      response: null,
      error: "OPENROUTER_API_KEY is not configured.",
    };
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.RIOMIND_PUBLIC_URL ?? "https://riolight.spheriochain.io",
        "X-Title": "RioMind Nexus",
      },
      body: JSON.stringify({
        model,
        ...(input.maxOutputTokens ? { max_tokens: input.maxOutputTokens } : {}),
        messages: [
          {
            role: "system",
            content: input.systemPrompt,
          },
          {
            role: "user",
            content: 
                input.images && input.images.length > 0
                  ? [
                      { type: "text", text: input.message },
                      ...input.images
                        .map((image) => image.dataUrl || image.url)
                        .filter(Boolean)
                        .map((imageUrl) => ({
                          type: "image_url",
                          image_url: {
                            url: imageUrl,
                          },
                        })),
                    ]
                  : input.message,
          },
        ],
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        provider: "openrouter",
        model,
        response: null,
        error:
          data?.error?.message ??
          `OpenRouter request failed with status ${res.status}.`,
      };
    }

    const outputText =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      null;

    return {
      ok: true,
      provider: "openrouter",
      model,
      response: outputText,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "openrouter",
      model,
      response: null,
      error: error instanceof Error ? error.message : "Unknown OpenRouter runtime error.",
    };
  }
}
