import { NextResponse } from "next/server";

import {
  getAllProviderAdapterStatuses,
  getConfiguredProviders,
} from "@/lib/riomind/providers/adapter";
import { RIOMIND_PROVIDER_REGISTRY } from "@/lib/riomind/providers/registry";

export async function GET() {
  const providers = getAllProviderAdapterStatuses();
  const configuredProviders = getConfiguredProviders();

  return NextResponse.json({
    ok: true,
    source: "riomind_provider_adapter_audit",
    status:
      configuredProviders.length > 0
        ? "provider_connection_available"
        : "provider_connection_pending",
    standard: "sovereign_foundation",
    summary: {
      registeredProviders: RIOMIND_PROVIDER_REGISTRY.length,
      configuredProviders: configuredProviders.length,
      missingProviders: providers.length - configuredProviders.length,
    },
    configuredProviderIds: configuredProviders.map((provider) => provider.id),
    providers,
  });
}
