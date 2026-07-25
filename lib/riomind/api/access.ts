export type RioMindApiAccessResult = {
  ok: boolean;
  status: "authorized" | "missing_api_key" | "invalid_api_key" | "api_keys_not_configured";
  apiKeyId: string | null;
  error: string | null;
};

function maskKey(key: string) {
  if (key.length <= 10) return "key";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export function getRioMindConfiguredApiKeys() {
  return (process.env.RIOMIND_API_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

export function readRioMindApiKey(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";

  return (
    request.headers.get("x-riomind-api-key")?.trim() ||
    bearer ||
    ""
  );
}

export function verifyRioMindApiAccess(request: Request): RioMindApiAccessResult {
  const configuredKeys = getRioMindConfiguredApiKeys();

  if (configuredKeys.length === 0) {
    return {
      ok: false,
      status: "api_keys_not_configured",
      apiKeyId: null,
      error: "RIOMIND_API_KEYS is not configured.",
    };
  }

  const providedKey = readRioMindApiKey(request);

  if (!providedKey) {
    return {
      ok: false,
      status: "missing_api_key",
      apiKeyId: null,
      error: "Missing RioMind API key. Use x-riomind-api-key or Authorization: Bearer.",
    };
  }

  if (!configuredKeys.includes(providedKey)) {
    return {
      ok: false,
      status: "invalid_api_key",
      apiKeyId: null,
      error: "Invalid RioMind API key.",
    };
  }

  return {
    ok: true,
    status: "authorized",
    apiKeyId: maskKey(providedKey),
    error: null,
  };
}
