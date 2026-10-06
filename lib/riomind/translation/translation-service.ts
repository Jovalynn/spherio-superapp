import { runOpenAiRuntime } from "@/lib/riomind/providers/openai-runtime";
import { runMistralRuntime } from "@/lib/riomind/providers/mistral-runtime";

export type TranslationServiceRequest = {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  provider?: string;
};

export type TranslationServiceResult = {
  ok: boolean;
  translatedText?: string;
  provider: string;
  sourceLanguage: string;
  targetLanguage: string;
  error?: string;
};

const SYSTEM_PROMPT = `You are RioMind Nexus real-time meeting translator.

Translate the user's text accurately from the source language into the target language.

Rules:
- Return ONLY the translated text.
- Do not explain.
- Do not add quotes.
- Preserve names, numbers, URLs, technical terms, and formatting where appropriate.
- Preserve the speaker's meaning and tone.
- Do not summarize.
- Do not omit content.
- If source language is "auto", infer the source language from the text.
`;

export async function translateWithRioMindProvider(
  input: TranslationServiceRequest,
): Promise<TranslationServiceResult> {
  const sourceLanguage = input.sourceLanguage || "auto";
  const targetLanguage = input.targetLanguage;

  if (!input.text.trim()) {
    return {
      ok: false,
      provider: "none",
      sourceLanguage,
      targetLanguage,
      error: "Text is required",
    };
  }

  const message = `Source language: ${sourceLanguage}
Target language: ${targetLanguage}

Text:
${input.text}`;

  const requestedProvider = input.provider?.trim().toLowerCase();

  if (!requestedProvider || requestedProvider === "openai") {
    const openAi = await runOpenAiRuntime({
      message,
      systemPrompt: SYSTEM_PROMPT,
      maxOutputTokens: 700,
    });

    if (openAi.ok && openAi.response?.trim()) {
      return {
        ok: true,
        translatedText: openAi.response.trim(),
        provider: "openai",
        sourceLanguage,
        targetLanguage,
      };
    }

    if (requestedProvider === "openai") {
      return {
        ok: false,
        provider: "openai",
        sourceLanguage,
        targetLanguage,
        error: "OpenAI translation provider failed",
      };
    }
  }

  if (!requestedProvider || requestedProvider === "mistral") {
    const mistral = await runMistralRuntime({
      message,
      systemPrompt: SYSTEM_PROMPT,
    });

    if (mistral.ok && mistral.response?.trim()) {
      return {
        ok: true,
        translatedText: mistral.response.trim(),
        provider: "mistral",
        sourceLanguage,
        targetLanguage,
      };
    }

    return {
      ok: false,
      provider: "mistral",
      sourceLanguage,
      targetLanguage,
      error: "Mistral translation provider failed",
    };
  }

  return {
    ok: false,
    provider: requestedProvider,
    sourceLanguage,
    targetLanguage,
    error: `Unsupported translation provider: ${requestedProvider}`,
  };
}
