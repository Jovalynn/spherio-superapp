import { runOpenAiRuntime } from "@/lib/riomind/providers/openai-runtime";
import { runOpenRouterRuntime } from "@/lib/riomind/providers/openrouter-runtime";
import { runGeminiRuntime } from "@/lib/riomind/providers/gemini-runtime";
import { runDeepSeekRuntime } from "@/lib/riomind/providers/deepseek-runtime";
import { runMistralRuntime } from "@/lib/riomind/providers/mistral-runtime";
import { runGrokRuntime } from "@/lib/riomind/providers/grok-runtime";
import { runLocalModelsRuntime } from "@/lib/riomind/providers/local-models-runtime";

export type RioMindVisionInput = {
  name?: string;
  mimeType?: string;
  dataUrl?: string;
  url?: string;
};

export type RioMindProviderRuntimeInput = {
  selectedProvider: string | null;
  candidateProviders?: string[];
  message: string;
  systemPrompt: string;
  images?: RioMindVisionInput[];
  model?: string;
  maxOutputTokens?: number;
};

export type RioMindProviderRuntimeAttempt = {
  provider: string;
  ok: boolean;
  model: string | null;
  error: string | null;
  status:
    | "completed"
    | "provider_runtime_not_connected"
    | "provider_runtime_error";
};

export type RioMindProviderRuntimeResult = {
  ok: boolean;
  provider: string | null;
  model: string | null;
  response: string | null;
  error: string | null;
  status:
    | "completed"
    | "completed_with_fallback"
    | "provider_not_selected"
    | "provider_runtime_not_connected"
    | "provider_runtime_error";
  attemptedProviders: RioMindProviderRuntimeAttempt[];
  fallbackUsed: boolean;
};

function uniqueProviders(providers: Array<string | null | undefined>) {
  return providers.filter((provider, index, list): provider is string =>
    Boolean(provider) && list.indexOf(provider) === index
  );
}

async function runSingleProvider(
  provider: string,
  message: string,
  systemPrompt: string,
  images?: RioMindVisionInput[],
  model?: string,
  maxOutputTokens?: number
): Promise<{
  ok: boolean;
  provider: string;
  model: string | null;
  response: string | null;
  error: string | null;
  status: "completed" | "provider_runtime_not_connected" | "provider_runtime_error";
}> {
  if (provider === "deepseek") {
    const result = await runDeepSeekRuntime({ message, systemPrompt });

    return {
      ok: result.ok,
      provider: result.provider,
      model: result.model,
      response: result.response,
      error: result.error,
      status: result.ok ? "completed" : "provider_runtime_error",
    };
  }

  if (provider === "openai") {
    const result = await runOpenAiRuntime({ message, systemPrompt, images, model, maxOutputTokens });

    return {
      ok: result.ok,
      provider: result.provider,
      model: result.model,
      response: result.response,
      error: result.error,
      status: result.ok ? "completed" : "provider_runtime_error",
    };
  }

  if (provider === "local_models") {
    const result = await runLocalModelsRuntime({ message, systemPrompt });

    return {
      ok: result.ok,
      provider: result.provider,
      model: result.model,
      response: result.response,
      error: result.error,
      status: result.ok ? "completed" : "provider_runtime_error",
    };
  }

  if (provider === "grok") {
    const result = await runGrokRuntime({ message, systemPrompt });

    return {
      ok: result.ok,
      provider: result.provider,
      model: result.model,
      response: result.response,
      error: result.error,
      status: result.ok ? "completed" : "provider_runtime_error",
    };
  }

  if (provider === "mistral") {
    const result = await runMistralRuntime({ message, systemPrompt });

    return {
      ok: result.ok,
      provider: result.provider,
      model: result.model,
      response: result.response,
      error: result.error,
      status: result.ok ? "completed" : "provider_runtime_error",
    };
  }

  if (provider === "openrouter") {
    const result = await runOpenRouterRuntime({ message, systemPrompt, images, model, maxOutputTokens });

    return {
      ok: result.ok,
      provider: result.provider,
      model: result.model,
      response: result.response,
      error: result.error,
      status: result.ok ? "completed" : "provider_runtime_error",
    };
  }

  if (provider === "gemini") {
    const result = await runGeminiRuntime({ message, systemPrompt });

    return {
      ok: result.ok,
      provider: result.provider,
      model: result.model,
      response: result.response,
      error: result.error,
      status: result.ok ? "completed" : "provider_runtime_error",
    };
  }

  return {
    ok: false,
    provider,
    model: null,
    response: null,
    error: `Provider runtime for ${provider} is not connected yet.`,
    status: "provider_runtime_not_connected",
  };
}

export async function runProviderRuntime(
  input: RioMindProviderRuntimeInput
): Promise<RioMindProviderRuntimeResult> {
  const providersToTry = uniqueProviders([
    input.selectedProvider,
    ...(input.candidateProviders ?? []),
  ]);

  if (providersToTry.length === 0) {
    return {
      ok: false,
      provider: null,
      model: null,
      response: null,
      error: "No configured provider selected.",
      status: "provider_not_selected",
      attemptedProviders: [],
      fallbackUsed: false,
    };
  }

  const attemptedProviders: RioMindProviderRuntimeAttempt[] = [];

  for (const provider of providersToTry) {
    const result = await runSingleProvider(
      provider,
      input.message,
      input.systemPrompt,
      input.images,
      input.model,
      input.maxOutputTokens
    );

    attemptedProviders.push({
      provider: result.provider,
      ok: result.ok,
      model: result.model,
      error: result.error,
      status: result.status,
    });

    if (result.ok && result.response) {
      const fallbackUsed = provider !== input.selectedProvider;

      return {
        ok: true,
        provider: result.provider,
        model: result.model,
        response: result.response,
        error: null,
        status: fallbackUsed ? "completed_with_fallback" : "completed",
        attemptedProviders,
        fallbackUsed,
      };
    }
  }

  const lastAttempt = attemptedProviders[attemptedProviders.length - 1];

  return {
    ok: false,
    provider: lastAttempt?.provider ?? input.selectedProvider,
    model: lastAttempt?.model ?? null,
    response: null,
    error: attemptedProviders.map((attempt) =>
      `${attempt.provider}: ${attempt.error ?? attempt.status}`
    ).join(" | "),
    status: "provider_runtime_error",
    attemptedProviders,
    fallbackUsed: attemptedProviders.length > 1,
  };
}
