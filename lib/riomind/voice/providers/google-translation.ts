import { GoogleAuth } from "google-auth-library";

export type TranslationProviderRequest = {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  projectId?: string;
  location?: string;
};

export type TranslationProviderResult = {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: string;
  detectedSourceLanguage?: string;
};

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-translation"],
});

async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  if (!token.token) {
    throw new Error("Unable to obtain Google Cloud access token.");
  }

  return token.token;
}

export async function translateWithGoogle(
  request: TranslationProviderRequest,
): Promise<TranslationProviderResult> {
  const projectId =
    request.projectId ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT_ID;

  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT is not configured.");
  }

  const location =
    request.location ||
    process.env.GOOGLE_TRANSLATION_LOCATION ||
    "global";

  const sourceLanguage =
    request.sourceLanguage &&
    request.sourceLanguage !== "auto"
      ? request.sourceLanguage
      : undefined;

  const accessToken = await getAccessToken();

  const endpoint =
    location === "global"
      ? "translation.googleapis.com"
      : `translate-${location}.googleapis.com`;

  const url =
    `https://${endpoint}/v3/projects/${encodeURIComponent(projectId)}` +
    `/locations/${encodeURIComponent(location)}:translateText`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceLanguageCode: sourceLanguage,
      targetLanguageCode: request.targetLanguage,
      mimeType: "text/plain",
      contents: [request.text],
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `Google Translation failed with HTTP ${response.status}`,
    );
  }

  const translation = payload?.translations?.[0];

  if (!translation?.translatedText) {
    throw new Error("Google Translation returned no translated text.");
  }

  return {
    translatedText: translation.translatedText,
    sourceLanguage:
      translation.detectedLanguageCode ||
      sourceLanguage ||
      "auto",
    targetLanguage: request.targetLanguage,
    provider: "google_cloud_translation",
    detectedSourceLanguage:
      translation.detectedLanguageCode || undefined,
  };
}
