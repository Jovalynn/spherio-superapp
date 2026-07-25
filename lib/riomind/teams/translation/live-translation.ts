export type TranslationRequest = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

export type TranslationResult = {
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  completedAt: string;
};

export async function translateMeetingText(
  request: TranslationRequest,
  translator: (
    request: TranslationRequest,
  ) => Promise<string>,
): Promise<TranslationResult> {
  const translatedText =
    await translator(request);

  return {
    sourceText: request.text,
    translatedText,
    sourceLanguage:
      request.sourceLanguage,
    targetLanguage:
      request.targetLanguage,
    completedAt:
      new Date().toISOString(),
  };
}
