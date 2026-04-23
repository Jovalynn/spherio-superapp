import { NextRequest, NextResponse } from "next/server";
import { buildPumpGraduationState } from "@/lib/pump/graduation";
import {
  buildPumpProtectionState,
  getDefaultPumpProtectionInput,
} from "@/lib/pump/protection";
import { getPumpEconomicsPolicy, getPumpFeePolicy } from "@/lib/pump/economics";

function pseudoAddress(symbol: string) {
  const safe = symbol.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "pump";
  return `rio1pump${safe}launch000000000000`;
}

type PumpCreateBody = {
  tokenName?: string;
  symbol?: string;
  totalSupply?: string;
  description?: string;
  website?: string;
  xHandle?: string;
  telegram?: string;
  discord?: string;
  youtube?: string;
  logoUrl?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PumpCreateBody;

    const tokenName = (body.tokenName || "Pump Launch").trim();
    const symbol = (body.symbol || "PUMP").trim().toUpperCase();
    const totalSupply = (body.totalSupply || "1000000000").trim();
    const description = (body.description || "").trim();
    const website = (body.website || "").trim();
    const xHandle = (body.xHandle || "").trim();
    const telegram = (body.telegram || "").trim();
    const discord = (body.discord || "").trim();
    const youtube = (body.youtube || "").trim();
    const logoUrl = (body.logoUrl || "").trim() || undefined;

    const projectId = `pump_${Date.now()}`;
    const tokenAddress = pseudoAddress(symbol);
    const economicsPolicy = getPumpEconomicsPolicy();
    const feePolicy = getPumpFeePolicy();

    const screenerUrl = `/riodex/markets?token=${encodeURIComponent(tokenAddress)}`;
    const tradeUrl = `/riodex/markets?token=${encodeURIComponent(tokenAddress)}&live=1`;
    const liquidityUrl = `/riodex/liquidity?source=pumplive&mode=add&token=${encodeURIComponent(
      tokenAddress,
    )}&base=${encodeURIComponent(economicsPolicy.defaultBaseAsset)}&symbol=${encodeURIComponent(
      symbol,
    )}&project=${encodeURIComponent(projectId)}`;

    const graduation = buildPumpGraduationState({
      tokenAddress,
      symbol,
      launchRail: "pump.live",
      baseAsset: economicsPolicy.defaultBaseAsset,
      totalSupply,
      holders: 12,
      watchers: 38,
      momentumScore: 18,
      communityScore: 24,
      liquidityCommittedRio: 0,
      realBaseReserveRio: 0,
      volume24hUsd: 0,
    });

    const protection = buildPumpProtectionState(
      getDefaultPumpProtectionInput({
        tokenAddress,
        symbol,
      }),
    );

    const rioExUrl = `/rioex/assets/${encodeURIComponent(tokenAddress)}?projectId=${encodeURIComponent(
      projectId,
    )}&projectName=${encodeURIComponent(tokenName)}&symbol=${encodeURIComponent(
      symbol,
    )}&templateId=pump_launch&templateName=${encodeURIComponent(
      "Pump Launch",
    )}&liquidityBase=${encodeURIComponent(
      economicsPolicy.defaultBaseAsset,
    )}&liquidityMode=graduation&screenerLabel=${encodeURIComponent(
      symbol,
    )}&aiContext=${encodeURIComponent(
      "Pump.live launch structure for fast SPO-20 momentum issuance, graduation readiness, and downstream RioDex/RioEx market flow.",
    )}&aiOutputs=${encodeURIComponent(
      "Pump launch structure",
    )}&aiOutputs=${encodeURIComponent(
      "Momentum framing",
    )}&aiOutputs=${encodeURIComponent(
      "Graduation readiness prompts",
    )}&powerUps=${encodeURIComponent(
      "Fast-launch retail rail",
    )}&powerUps=${encodeURIComponent(
      "Momentum-first progression",
    )}&powerUps=${encodeURIComponent(
      "RIO-based graduation path",
    )}&liquidityGuidance=${encodeURIComponent(
      `Graduation target policy: $${economicsPolicy.graduationTargetUsdMin.toLocaleString()}–$${economicsPolicy.graduationTargetUsdMax.toLocaleString()} USD equivalent.`,
    )}&liquidityGuidance=${encodeURIComponent(
      `Default LP target on graduation: $${economicsPolicy.lpTargetUsd.toLocaleString()} USD equivalent in ${economicsPolicy.defaultBaseAsset}.`,
    )}&requiredDisclosures=${encodeURIComponent(
      "What the token represents inside the launch community or meme narrative.",
    )}&requiredDisclosures=${encodeURIComponent(
      "That launch momentum does not itself guarantee long-term utility or value.",
    )}`;

    const success = {
      projectId,
      tokenAddress,
      tokenName,
      symbol,
      totalSupply,
      description,
      website,
      xHandle,
      telegram,
      discord,
      youtube,
      logoUrl,
      screenerUrl,
      tradeUrl,
      liquidityUrl,
      rioExUrl,
      economicsPolicy,
      protection,
      feeRecipient: feePolicy.feeRecipient,
      curveFeeBps: feePolicy.curveFeeBps,
      momentum: {
        stage: graduation.stage,
        graduationTarget: "lp_activation" as const,
        baseAsset: economicsPolicy.defaultBaseAsset,
        launchRail: "pump.live" as const,
        standard: "SPO-20" as const,
      },
      graduation,
      lpActivation: {
        ready: graduation.lpActivationReady,
        label: graduation.narrative.lpActivationLabel,
        targetRio: graduation.requirements.lpTargetRio,
        remainingRio: graduation.remaining.liquidityCommittedRio,
      },
    };

    const metadataPackage = {
      projectId,
      tokenAddress,
      tokenName,
      symbol,
      totalSupply,
      description,
      website,
      xHandle,
      telegram,
      discord,
      youtube,
      logoUrl,
      templateId: "pump_launch",
      templateName: "Pump Launch",
      liquidityBase: economicsPolicy.defaultBaseAsset,
      liquidityMode: "graduation",
      screenerLabel: symbol,
      launchRail: "pump.live",
      standard: "SPO-20",
      economicsPolicy,
      protection,
      feeRecipient: feePolicy.feeRecipient,
      curveFeeBps: feePolicy.curveFeeBps,
      aiContext:
        "Pump.live launch structure for fast SPO-20 momentum issuance, graduation readiness, and downstream RioDex/RioEx market flow.",
      aiOutputs: [
        "Pump launch structure",
        "Momentum framing",
        "Graduation readiness prompts",
      ],
      powerUps: [
        "Fast-launch retail rail",
        "Momentum-first progression",
        "RIO-based graduation path",
      ],
      liquidityGuidance: [
        `Graduation target policy: $${economicsPolicy.graduationTargetUsdMin.toLocaleString()}–$${economicsPolicy.graduationTargetUsdMax.toLocaleString()} USD equivalent.`,
        `Default LP target on graduation: $${economicsPolicy.lpTargetUsd.toLocaleString()} USD equivalent in ${economicsPolicy.defaultBaseAsset}.`,
      ],
      requiredDisclosures: [
        "What the token represents inside the launch community or meme narrative.",
        "That launch momentum does not itself guarantee long-term utility or value.",
      ],
      rioExProfilePreviewUrl: rioExUrl,
      graduation,
      lpActivation: {
        ready: graduation.lpActivationReady,
        label: graduation.narrative.lpActivationLabel,
        targetRio: graduation.requirements.lpTargetRio,
        remainingRio: graduation.remaining.liquidityCommittedRio,
      },
    };

    return NextResponse.json({
      ok: true,
      treasuryRecipient: feePolicy.feeRecipient,
      success,
      metadataPackage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
