const LANGUAGE_NAMES:
  Record<string, string> = {
    en: "English",
    fr: "French",
    de: "German",
    es: "Spanish",
    pt: "Portuguese",
    zh: "Chinese",
    ar: "Arabic",
    ha: "Hausa",
    ig: "Igbo",
    yo: "Yoruba",
  };

export function languageName(
  code: string,
): string {
  const normalized = code
    .trim()
    .toLowerCase();

  return (
    LANGUAGE_NAMES[normalized] ||
    code.toUpperCase()
  );
}
