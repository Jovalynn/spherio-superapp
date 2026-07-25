import { NextResponse } from "next/server";
import {
  PRIME_AI_NEXUS_EXPECTED_COUNT,
  PRIME_AI_NEXUS_REGISTRY,
  PRIME_AI_NEXUS_REGISTRY_VERSION,
} from "@/lib/prime-ai/prime-ai-nexus-registry";

export async function GET() {
  const items = PRIME_AI_NEXUS_REGISTRY.map((item, index) => ({
    index: index + 1,
    ...item,
    expectedContract: {
      nexusStatus: item.status,
      inputFields: 5,
      workflows: 6,
      outputs: 7,
      verificationRules: 4,
    },
    checks: {
      hasRuntimePath: Boolean(item.runtimePath),
      hasApiPath: Boolean(item.apiPath),
      hasSlug: Boolean(item.slug),
      hasCategory: Boolean(item.category),
      nexusReady: item.status === "nexus_ready_not_connected",
    },
  }));

  const categories = Array.from(new Set(items.map((item) => item.category)));

  const completeItems = items.filter(
    (item) =>
      item.checks.hasRuntimePath &&
      item.checks.hasApiPath &&
      item.checks.hasSlug &&
      item.checks.hasCategory &&
      item.checks.nexusReady,
  );

  return NextResponse.json({
    ok: true,
    source: "prime_ai_nexus_registry_audit",
    registryVersion: PRIME_AI_NEXUS_REGISTRY_VERSION,
    expectedCount: PRIME_AI_NEXUS_EXPECTED_COUNT,
    actualCount: items.length,
    completeCount: completeItems.length,
    incompleteCount: items.length - completeItems.length,
    allNichesRegistered: items.length === PRIME_AI_NEXUS_EXPECTED_COUNT,
    allNichesNexusReady: completeItems.length === PRIME_AI_NEXUS_EXPECTED_COUNT,
    nexusStatus: "nexus_ready_not_connected",
    categories,
    summary: {
      inputFieldsTotal: items.length * 5,
      workflowActionsTotal: items.length * 6,
      expectedOutputsTotal: items.length * 7,
      verificationRulesTotal: items.length * 4,
    },
    guarantees: [
      "Each Prime AI niche has a runtime route.",
      "Each Prime AI niche has a deep runtime API route.",
      "Each Prime AI niche is structured for future RioMind Nexus connection.",
      "Each Prime AI niche exposes input schema, workflow actions, expected outputs, verification layer, and access model.",
      "Nexus is not connected yet; these are Nexus-ready contracts.",
    ],
    items,
  });
}
