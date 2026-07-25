export type CaptionLine = {
  id: string;
  participantId: string | null;
  speakerName: string;
  sourceText: string;
  translatedText: string | null;
  sourceLanguage: string;
  targetLanguage: string | null;
  startedAt: string;
  completedAt: string | null;
};
