import { NextResponse } from "next/server";

import { getRioMindConfiguredApiKeys } from "@/lib/riomind/api/access";

export async function GET() {
  const configuredApiKeys = getRioMindConfiguredApiKeys();

  return NextResponse.json({
    ok: true,
    source: "riomind_public_api_status",
    version: "v1",
    status:
      configuredApiKeys.length > 0
        ? "api_access_ready"
        : "api_keys_not_configured",
    standard: "sovereign_foundation",
    summary: {
      apiKeysConfigured: configuredApiKeys.length,
      endpoints: [
        "/api/riomind/v1/status",
        "/api/riomind/v1/chat",
      ],
      auth: [
        "x-riomind-api-key",
        "Authorization: Bearer <RIOMIND_API_KEY>",
      ],
    },
  });
}
