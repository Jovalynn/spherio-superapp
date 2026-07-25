export const RIOMIND_TRANSLATION_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "ur", label: "Urdu" },
  { code: "tr", label: "Turkish" },
  { code: "ru", label: "Russian" },
  { code: "pl", label: "Polish" },
  { code: "uk", label: "Ukrainian" },
  { code: "sw", label: "Swahili" },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
  { code: "am", label: "Amharic" },
  { code: "el", label: "Greek" },
];

export function normalizeRioMindTranslationTargets(input?: unknown) {
  const allowed = new Set(RIOMIND_TRANSLATION_LANGUAGES.map((lang) => lang.code));

  if (Array.isArray(input) && input.length) {
    return input.map(String).filter((code) => allowed.has(code));
  }

  return ["en"];
}
