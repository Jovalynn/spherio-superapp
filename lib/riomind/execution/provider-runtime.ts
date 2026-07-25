import {
  getAllProviderAdapterStatuses,
  getFirstConfiguredProvider,
} from "@/lib/riomind/providers/adapter";
import { RIOMIND_PROVIDER_REGISTRY } from "@/lib/riomind/providers/registry";

export type RioMindProviderExecutionPlan = {
  preferredProviders: string[];
  registeredProviders: string[];
  configuredProviders: string[];
  selectedProvider: string | null;
  status: "provider_connection_pending" | "provider_ready";
};

export function createProviderExecutionPlan(preferredProviders: string[]): RioMindProviderExecutionPlan {
  const registeredProviders = preferredProviders.filter((providerId) =>
    RIOMIND_PROVIDER_REGISTRY.some((provider) => provider.id === providerId)
  );

  const adapterStatuses = getAllProviderAdapterStatuses();

  const configuredProviders = preferredProviders.filter((providerId) =>
    adapterStatuses.some(
      (provider) => provider.id === providerId && provider.status === "configured"
    )
  );

  const selectedProvider = getFirstConfiguredProvider(preferredProviders);

  return {
    preferredProviders,
    registeredProviders,
    configuredProviders,
    selectedProvider: selectedProvider?.id ?? null,
    status: selectedProvider ? "provider_ready" : "provider_connection_pending",
  };
}
