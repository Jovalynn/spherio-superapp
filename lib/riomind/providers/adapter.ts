import { RIOMIND_PROVIDER_REGISTRY } from "@/lib/riomind/providers/registry";

export type RioMindProviderAdapterStatus =
  | "configured"
  | "missing_key"
  | "local_endpoint_missing"
  | "unknown_provider";

export type RioMindProviderAdapter = {
  id: string;
  name: string;
  requiredEnv: string[];
  optionalEnv?: string[];
  status: RioMindProviderAdapterStatus;
  configuredEnv: string[];
  missingEnv: string[];
};

const PROVIDER_ENV_MAP: Record<string, { requiredEnv: string[]; optionalEnv?: string[] }> = {
  openai: {
    requiredEnv: ["OPENAI_API_KEY"],
  },
  anthropic: {
    requiredEnv: ["ANTHROPIC_API_KEY"],
  },
  gemini: {
    requiredEnv: ["GOOGLE_GENERATIVE_AI_API_KEY"],
    optionalEnv: ["GEMINI_API_KEY"],
  },
  deepseek: {
    requiredEnv: ["DEEPSEEK_API_KEY"],
  },
  grok: {
    requiredEnv: ["XAI_API_KEY"],
    optionalEnv: ["GROK_API_KEY"],
  },
  mistral: {
    requiredEnv: ["MISTRAL_API_KEY"],
  },
  cohere: {
    requiredEnv: ["COHERE_API_KEY"],
  },
  perplexity: {
    requiredEnv: ["PERPLEXITY_API_KEY"],
  },
  openrouter: {
    requiredEnv: ["OPENROUTER_API_KEY"],
  },
  local_models: {
    requiredEnv: ["LOCAL_MODEL_BASE_URL"],
  },
};

const PROVIDER_ENV_VALUES: Record<string, string | undefined> = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  XAI_API_KEY: process.env.XAI_API_KEY,
  GROK_API_KEY: process.env.GROK_API_KEY,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  COHERE_API_KEY: process.env.COHERE_API_KEY,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  LOCAL_MODEL_BASE_URL: process.env.LOCAL_MODEL_BASE_URL,
};

function hasEnv(key: string) {
  const value = PROVIDER_ENV_VALUES[key];
  return Boolean(typeof value === "string" && value.trim().length > 0);
}

export function getProviderAdapterStatus(providerId: string): RioMindProviderAdapter {
  const provider = RIOMIND_PROVIDER_REGISTRY.find((item) => item.id === providerId);
  const envConfig = PROVIDER_ENV_MAP[providerId];

  if (!provider || !envConfig) {
    return {
      id: providerId,
      name: provider?.name ?? providerId,
      requiredEnv: [],
      optionalEnv: [],
      status: "unknown_provider",
      configuredEnv: [],
      missingEnv: [],
    };
  }

  const allAcceptedEnv = [
    ...envConfig.requiredEnv,
    ...(envConfig.optionalEnv ?? []),
  ];

  const configuredEnv = allAcceptedEnv.filter(hasEnv);

  const missingRequiredEnv = envConfig.requiredEnv.filter((key) => {
    if (hasEnv(key)) return false;

    if (providerId === "gemini" && hasEnv("GEMINI_API_KEY")) return false;
    if (providerId === "grok" && hasEnv("GROK_API_KEY")) return false;

    return true;
  });

  const status =
    missingRequiredEnv.length === 0
      ? "configured"
      : providerId === "local_models"
        ? "local_endpoint_missing"
        : "missing_key";

  return {
    id: provider.id,
    name: provider.name,
    requiredEnv: envConfig.requiredEnv,
    optionalEnv: envConfig.optionalEnv ?? [],
    status,
    configuredEnv,
    missingEnv: missingRequiredEnv,
  };
}

export function getAllProviderAdapterStatuses() {
  return RIOMIND_PROVIDER_REGISTRY.map((provider) =>
    getProviderAdapterStatus(provider.id)
  );
}

export function getConfiguredProviders() {
  return getAllProviderAdapterStatuses().filter(
    (provider) => provider.status === "configured"
  );
}

export function getFirstConfiguredProvider(preferredProviders: string[] = []) {
  const configured = getConfiguredProviders();

  const preferred = preferredProviders
    .map((id) => configured.find((provider) => provider.id === id))
    .find(Boolean);

  return preferred ?? configured[0] ?? null;
}
