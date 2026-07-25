export type RioMindVisionInput = {
  name?: string;
  mimeType?: string;
  dataUrl?: string;
  url?: string;
};

export type RioMindOpenAiRuntimeInput = {
  message: string;
  systemPrompt: string;
  model?: string;
  maxOutputTokens?: number;
  images?: RioMindVisionInput[];
};

export type RioMindOpenAiRuntimeResult = {
  ok: boolean;
  provider: "openai";
  model: string;
  response: string | null;
  error: string | null;
};

export async function runOpenAiRuntime(
  input: RioMindOpenAiRuntimeInput
): Promise<RioMindOpenAiRuntimeResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  const model = input.model ?? process.env.RIOMIND_OPENAI_MODEL?.trim() ?? "gpt-4.1-mini";

  if (!apiKey) {
    return {
      ok: false,
      provider: "openai",
      model,
      response: null,
      error: "OPENAI_API_KEY is not configured.",
    };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        ...(input.maxOutputTokens ? { max_output_tokens: input.maxOutputTokens } : {}),
        input: [
          {
            role: "system",
            content: input.systemPrompt,
          },
          {
            role: "user",
            content: 
                input.images && input.images.length > 0
                  ? [
                      { type: "input_text", text: input.message },
                      ...input.images
                        .map((image) => image.dataUrl || image.url)
                        .filter(Boolean)
                        .map((imageUrl) => ({
                          type: "input_image",
                          image_url: imageUrl,
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
        provider: "openai",
        model,
        response: null,
        error:
          data?.error?.message ??
          `OpenAI request failed with status ${res.status}.`,
      };
    }

    const outputText =
      typeof data?.output_text === "string"
        ? data.output_text
        : Array.isArray(data?.output)
          ? data.output
              .flatMap((item: any) => item?.content ?? [])
              .map((content: any) => content?.text ?? "")
              .filter(Boolean)
              .join("\n")
          : null;

    return {
      ok: true,
      provider: "openai",
      model,
      response: outputText,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "openai",
      model,
      response: null,
      error: error instanceof Error ? error.message : "Unknown OpenAI runtime error.",
    };
  }
}
