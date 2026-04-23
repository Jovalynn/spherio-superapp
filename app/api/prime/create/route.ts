import { NextRequest, NextResponse } from "next/server";
import {
  buildPrimeProjectConfig,
  buildPrimeSuccessPayload,
} from "@/lib/prime/template-engine";

function pseudoAddress(symbol: string) {
  const safe = symbol.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "prime";
  return `rio1prime${safe}contractxyz000000000000`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const projectId = `prime_${Date.now()}`;

    const config = buildPrimeProjectConfig({
      templateId: body.templateId,
      projectName: body.projectName,
      symbol: body.symbol,
      totalSupply: body.totalSupply,
      statement: body.statement,
      logoUrl: body.logoUrl,
      hybridLabel: body.hybridLabel,
      liquidityBase: body.liquidityBase,
      liquidityMode: body.liquidityMode,
      rioPriceUsd: Number(body.rioPriceUsd),
    });

    const tokenAddress = pseudoAddress(body.symbol);

    const success = buildPrimeSuccessPayload({
      projectId,
      tokenAddress,
      config,
      explorerBaseUrl: "/rioexplorer",
      screenerBaseUrl: "/riodex/markets",
      liquidityBaseUrl: "/riodex/liquidity",
    });

    success.explorerUrl = `/rioexplorer?address=${encodeURIComponent(tokenAddress)}`;
    success.screenerUrl = `/riodex/markets?token=${encodeURIComponent(tokenAddress)}`;
    success.liquidityUrl = `/riodex/liquidity?source=createtoken&mode=add&token=${encodeURIComponent(
      tokenAddress,
    )}&base=${encodeURIComponent(config.liquidityBase)}&symbol=${encodeURIComponent(
      body.symbol || "",
    )}&project=${encodeURIComponent(projectId)}`;

    const metadataPackage = {
      projectId: success.projectId,
      templateId: config.templateId,
      templateName: config.templateName,
      hybridLabel: config.hybridLabel,
      tokenAddress,
      symbol: config.symbol,
      projectName: config.projectName,
      liquidityBase: config.liquidityBase,
      liquidityMode: config.liquidityMode,
      aiContext: config.aiContext,
      aiOutputs: config.aiOutputs,
      powerUps: config.powerUps,
      liquidityGuidance: config.liquidityGuidance,
      requiredDisclosures: config.requiredDisclosures,
      reviewSections: config.reviewSections,
      screenerLabel: config.screenerLabel,
      successActions: config.successActions,
      feeRecipient: config.feeRecipient,
      feeLabel: config.feeLabel,
      feeRio: config.feeRio,
      feeUsd: config.feeUsd,
      lifecycle: config.lifecycle,
      authority: config.authority,
      discovery: config.discovery,
      rioExProfilePreviewUrl: `/api/rioex/assets/${encodeURIComponent(tokenAddress)}?projectId=${encodeURIComponent(
        success.projectId,
      )}&projectName=${encodeURIComponent(config.projectName)}&symbol=${encodeURIComponent(
        config.symbol,
      )}&templateId=${encodeURIComponent(config.templateId)}&templateName=${encodeURIComponent(
        config.templateName,
      )}&hybridLabel=${encodeURIComponent(config.hybridLabel || "")}&liquidityBase=${encodeURIComponent(
        config.liquidityBase,
      )}&liquidityMode=${encodeURIComponent(config.liquidityMode)}&aiContext=${encodeURIComponent(
        config.aiContext,
      )}${config.aiOutputs.map((x) => `&aiOutputs=${encodeURIComponent(x)}`).join("")}${config.powerUps
        .map((x) => `&powerUps=${encodeURIComponent(x)}`)
        .join("")}${config.liquidityGuidance
        .map((x) => `&liquidityGuidance=${encodeURIComponent(x)}`)
        .join("")}${config.requiredDisclosures
        .map((x) => `&requiredDisclosures=${encodeURIComponent(x)}`)
        .join("")}${config.successActions
        .map((x) => `&successActions=${encodeURIComponent(x)}`)
        .join("")}&screenerLabel=${encodeURIComponent(config.screenerLabel)}`,
    };

    return NextResponse.json({
      ok: true,
      config,
      success,
      metadataPackage,
      source: "prime_authority_shape",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
