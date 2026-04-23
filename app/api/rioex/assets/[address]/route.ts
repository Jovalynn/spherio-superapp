import { NextRequest, NextResponse } from "next/server";
import { buildRioExAssetProfile } from "@/lib/rioex/asset-profile";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> },
) {
  const { address } = await context.params;
  const { searchParams } = new URL(request.url);

  const templateId = searchParams.get("templateId") || "unknown";
  const templateName = searchParams.get("templateName") || "Unknown";
  const hybridLabel = searchParams.get("hybridLabel") || undefined;
  const projectId = searchParams.get("projectId") || "untracked_prime_project";
  const projectName = searchParams.get("projectName") || "Unknown Project";
  const symbol = searchParams.get("symbol") || "UNKNOWN";
  const liquidityBase = searchParams.get("liquidityBase") || "RIO";
  const liquidityMode = searchParams.get("liquidityMode") || "guided";
  const aiContext = searchParams.get("aiContext") || "";
  const screenerLabel = searchParams.get("screenerLabel") || templateName;

  const aiOutputs = searchParams.getAll("aiOutputs");
  const powerUps = searchParams.getAll("powerUps");
  const liquidityGuidance = searchParams.getAll("liquidityGuidance");
  const requiredDisclosures = searchParams.getAll("requiredDisclosures");
  const successActions = searchParams.getAll("successActions");

  const profile = buildRioExAssetProfile({
    projectId,
    tokenAddress: address,
    projectName,
    symbol,
    templateId,
    templateName,
    hybridLabel,
    liquidityBase,
    liquidityMode,
    aiContext,
    aiOutputs,
    powerUps,
    liquidityGuidance,
    requiredDisclosures,
    reviewSections: [],
    screenerLabel,
    successActions,
  });
  return NextResponse.json({
    ok: true,
    profile,
  });
}
