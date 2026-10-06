import { runOpenAiRuntime } from "../providers/openai-runtime";

export type RioMindTranslationRequest = {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  provider?: string;
  realtime?: boolean;
};

export type RioMindTranslationResult = {
  ok: boolean;
  translatedText: string | null;
  provider: string;
  sourceLanguage: string;
  targetLanguage: string;
  error?: string;
};

const TRANSLATION_SYSTEM_PROMPT = `You are RioMind Nexus realtime meeting translator.

Translate the supplied speech/text accurately from the source language into the target language.

Rules:
- Return ONLY the translated text.
- Do not explain.
- Do not add quotes.
- Preserve names.
- Preserve numbers.
- Preserve URLs and technical terms.
- Preserve scripture references and proper nouns.
- Preserve speaker intent and meaning.
- Do not summarize.
- Do not omit meaningful words.
- Do not invent content.
- Keep the output natural for spoken conversation.
- When the source and target language are the same, return the original text unchanged.`;

export async function translateWithRioMindProvider(
  input: RioMindTranslationRequest,
): Promise<RioMindTranslationResult> {
  const text = String(input.text || "").trim();
  const sourceLanguage = String(input.sourceLanguage || "auto").trim();
  const targetLanguage = String(input.targetLanguage || "en").trim();

  if (!text) {
    return {
      ok: false,
      translatedText: null,
      provider: "none",
      sourceLanguage,
      targetLanguage,
      error: "Text is required",
    };
  }

  if (!targetLanguage) {
    return {
      ok: false,
      translatedText: null,
      provider: "none",
      sourceLanguage,
      targetLanguage,
      error: "Target language is required",
    };
  }

  if (
    sourceLanguage !== "auto" &&
    sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()
  ) {
    return {
      ok: true,
      translatedText: text,
      provider: "passthrough",
      sourceLanguage,
      targetLanguage,
    };
  }

  const provider = input.provider || "openai";

  if (provider !== "openai" && provider !== "openai_realtime") {
    return {
      ok: false,
      translatedText: null,
      provider,
      sourceLanguage,
      targetLanguage,
      error: `Unsupported translation provider: ${provider}`,
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      ok: false,
      translatedText: null,
      provider,
      sourceLanguage,
      targetLanguage,
      error: "OPENAI_API_KEY is not configured",
    };
  }

  const message = `Source language: ${sourceLanguage}
Target language: ${targetLanguage}

${input.realtime ? "Realtime speech translation. Keep the response concise and immediately speakable." : "Meeting translation."}

Text:
${text}`;

  try {
    const response = await runOpenAiRuntime({
      message,
      systemPrompt: TRANSLATION_SYSTEM_PROMPT,
      maxOutputTokens: input.realtime ? 500 : 900,
    });

    if (!response.ok || !response.response?.trim()) {
      return {
        ok: false,
        translatedText: null,
        provider,
        sourceLanguage,
        targetLanguage,
        error: response.error || "Translation provider returned no text",
      };
    }

    return {
      ok: true,
      translatedText: response.response.trim(),
      provider,
      sourceLanguage,
      targetLanguage,
    };
  } catch (error) {
    return {
      ok: false,
      translatedText: null,
      provider,
      sourceLanguage,
      targetLanguage,
      error: error instanceof Error
        ? error.message
        : "Translation provider failed",
    };
  }
}

export async function translateManyWithRioMindProvider(
  input: Omit<RioMindTranslationRequest, "targetLanguage"> & {
    targetLanguages: string[];
  },
) {
  const uniqueLanguages = Array.from(
    new Set(
      input.targetLanguages
        .map((language) => String(language || "").trim())
        .filter(Boolean),
    ),
  );

  const results = await Promise.all(
    uniqueLanguages.map((targetLanguage) =>
      translateWithRioMindProvider({
        ...input,
        targetLanguage,
      }),
    ),
  );

  return results;
}
