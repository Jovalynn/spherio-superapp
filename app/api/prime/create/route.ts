import { NextRequest, NextResponse } from "next/server";
import {
  buildPrimeProjectConfig,
  buildPrimeSuccessPayload,
} from "@/lib/prime/template-engine";
import { getPrimeAiBlueprint } from "@/lib/prime/ai-blueprint-engine";
import { getPrimeAiCodebasePackage } from "@/lib/prime/ai-codebase-engine";

declare global {
  // eslint-disable-next-line no-var
  var __primeCreatePgPool: any;
}

async function getPrimeCreatePgPool() {
  if (!globalThis.__primeCreatePgPool) {
    const { Pool } = await import("pg");
    globalThis.__primeCreatePgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      max: 5,
    });
  }

  return globalThis.__primeCreatePgPool;
}

function primeToBaseUnits(value: string, decimals = 6): string {
  const raw = String(value || "").trim();
  if (!raw) return "0";

  const [wholePart, fracPart = ""] = raw.split(".");
  const whole = wholePart.replace(/[^\d]/g, "") || "0";
  const frac = fracPart.replace(/[^\d]/g, "").slice(0, decimals).padEnd(decimals, "0");

  return BigInt(`${whole}${frac}`).toString();
}

function sanitize(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tokenAddress = sanitize(body.tokenAddress);
    const txHash = sanitize(body.txHash);
    const creatorAddress = sanitize(body.creatorAddress);
    const createdHeight = Number(body.createdHeight || 0);
    const factoryAddress = sanitize(body.factoryAddress);

    if (!tokenAddress || !tokenAddress.startsWith("rio1")) {
      return NextResponse.json(
        { ok: false, error: "Real Prime token address is required." },
        { status: 400 },
      );
    }

    if (!txHash) {
      return NextResponse.json(
        { ok: false, error: "Prime creation tx hash is required." },
        { status: 400 },
      );
    }

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

    const success = buildPrimeSuccessPayload({
      projectId,
      tokenAddress,
      config,
      explorerBaseUrl: "/rioexplorer",
      screenerBaseUrl: "/rioex",
      liquidityBaseUrl: "/riodex/pools",
    });

    success.explorerUrl = `/rioexplorer/spo20/${encodeURIComponent(tokenAddress)}?proof=prime`;
    success.screenerUrl = `/rioex?token=${encodeURIComponent(tokenAddress)}`;
    success.tokenPageUrl = `https://prime.spheriochain.io/token/${encodeURIComponent(tokenAddress)}`;
    success.liquidityUrl =
      `/riodex/liquidity/action?source=prime&mode=add` +
      `&token=${encodeURIComponent(tokenAddress)}` +
      `&base=${encodeURIComponent(config.liquidityBase)}` +
      `&symbol=${encodeURIComponent(config.symbol || "")}` +
      `&project=${encodeURIComponent(projectId)}` +
      `&grade=${encodeURIComponent(sanitize(body.liquidityGrade) || "senior_minister")}`;

    const creatorUtilities = Array.isArray(body.creatorUtilities) ? body.creatorUtilities : [];
    const creatorUtilityLabels = Array.isArray(body.creatorUtilityLabels)
      ? body.creatorUtilityLabels
      : [];

    const aiAllocationDefaults = Array.isArray(body.aiAllocationDefaults)
      ? body.aiAllocationDefaults
      : [];
    const aiTrustDefaults = Array.isArray(body.aiTrustDefaults)
      ? body.aiTrustDefaults
      : [];
    const aiReadinessExpectations = Array.isArray(body.aiReadinessExpectations)
      ? body.aiReadinessExpectations
      : [];

    const aiBlueprint = getPrimeAiBlueprint({
      nicheId: sanitize(body.aiNicheId) || null,
      nicheTitle: sanitize(body.aiNicheTitle) || null,
      nicheCategory: sanitize(body.aiNicheCategory) || null,
      creatorUtilities,
      creatorUtilityLabels,
    });

    const aiCodebasePackage = getPrimeAiCodebasePackage(sanitize(body.aiNicheId) || null);

    const metadataJson = {
      family: "spo20",
      rail: "prime",
      source: "prime_create_api",
      template_id: config.templateId,
      template_name: config.templateName,
      hybrid_label: config.hybridLabel || null,
      project_category: sanitize(body.projectCategory) || config.templateName,
      project_idea: sanitize(body.projectIdea) || null,
      project_statement: sanitize(body.statement) || null,

      niche_family: sanitize(body.nicheFamily) || "core",
      niche_family_label: sanitize(body.nicheFamilyLabel) || "Prime Core Launch Niches",
      ai_niche_id: sanitize(body.aiNicheId) || null,
      ai_niche_title: sanitize(body.aiNicheTitle) || null,
      ai_niche_category: sanitize(body.aiNicheCategory) || null,
      ai_niche_badge: sanitize(body.aiNicheBadge) || null,
      ai_launch_model: sanitize(body.aiLaunchModel) || null,
      ai_allocation_defaults: aiAllocationDefaults,
      ai_trust_defaults: aiTrustDefaults,
      ai_readiness_expectations: aiReadinessExpectations,
      ai_architecture: body.aiArchitecture && typeof body.aiArchitecture === "object"
        ? body.aiArchitecture
        : null,
      ai_blueprint: aiBlueprint,
      ai_codebase_package: aiCodebasePackage,
      creator_utilities: creatorUtilities,
      creator_utility_labels: creatorUtilityLabels,
      riomind_nexus_ready: Boolean(body.rioMindNexusReady),

      liquidity_grade: sanitize(body.liquidityGrade) || "senior_minister",
      liquidity_base: config.liquidityBase,
      liquidity_mode: config.liquidityMode,
      factory_address: factoryAddress || null,
      create_tx_hash: txHash,
      first_seen_height: Number.isFinite(createdHeight) ? createdHeight : 0,
      metadata_standard: "spo20_shared_metadata",
    };

    const pool = await getPrimeCreatePgPool();

    await pool.query(
      `
      INSERT INTO spo20_tokens (
        contract_address,
        symbol,
        creator,
        height,
        name,
        factory_address,
        tx_hash,
        decimals,
        total_supply,
        description,
        logo_url,
        metadata_json
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,6,$8,$9,$10,$11::jsonb)
      ON CONFLICT (contract_address) DO UPDATE SET
        symbol = COALESCE(EXCLUDED.symbol, spo20_tokens.symbol),
        creator = COALESCE(EXCLUDED.creator, spo20_tokens.creator),
        height = LEAST(spo20_tokens.height, EXCLUDED.height),
        name = COALESCE(EXCLUDED.name, spo20_tokens.name),
        factory_address = COALESCE(EXCLUDED.factory_address, spo20_tokens.factory_address),
        tx_hash = COALESCE(EXCLUDED.tx_hash, spo20_tokens.tx_hash),
        total_supply = COALESCE(NULLIF(EXCLUDED.total_supply, '0'), spo20_tokens.total_supply),
        description = COALESCE(EXCLUDED.description, spo20_tokens.description),
        logo_url = COALESCE(EXCLUDED.logo_url, spo20_tokens.logo_url),
        metadata_json = COALESCE(spo20_tokens.metadata_json, '{}'::jsonb) || COALESCE(EXCLUDED.metadata_json, '{}'::jsonb)
      `,
      [
        tokenAddress,
        config.symbol,
        creatorAddress || null,
        Number.isFinite(createdHeight) ? createdHeight : 0,
        config.projectName,
        factoryAddress || null,
        txHash,
        primeToBaseUnits(String(body.totalSupply || "1000000000"), 6),
        sanitize(body.statement) || null,
        sanitize(body.logoUrl) || null,
        JSON.stringify(metadataJson),
      ],
    );

    const metadataPackage = {
      projectId: success.projectId,
      templateId: config.templateId,
      templateName: config.templateName,
      hybridLabel: config.hybridLabel,
      tokenAddress,
      tokenPageUrl: success.tokenPageUrl,
      symbol: config.symbol,
      projectName: config.projectName,
      liquidityBase: config.liquidityBase,
      liquidityMode: config.liquidityMode,
      liquidityGrade: sanitize(body.liquidityGrade) || "senior_minister",
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
      nicheFamily: metadataJson.niche_family,
      nicheFamilyLabel: metadataJson.niche_family_label,
      aiNicheId: metadataJson.ai_niche_id,
      aiNicheTitle: metadataJson.ai_niche_title,
      aiNicheCategory: metadataJson.ai_niche_category,
      aiNicheBadge: metadataJson.ai_niche_badge,
      aiLaunchModel: metadataJson.ai_launch_model,
      aiAllocationDefaults: metadataJson.ai_allocation_defaults,
      aiTrustDefaults: metadataJson.ai_trust_defaults,
      aiReadinessExpectations: metadataJson.ai_readiness_expectations,
      aiArchitecture: metadataJson.ai_architecture,
      aiBlueprint: metadataJson.ai_blueprint,
      aiCodebasePackage: metadataJson.ai_codebase_package,
      creatorUtilities: metadataJson.creator_utilities,
      creatorUtilityLabels: metadataJson.creator_utility_labels,
      rioMindNexusReady: metadataJson.riomind_nexus_ready,
      metadataJson,
      rioExProfilePreviewUrl: `/api/rioex/assets/${encodeURIComponent(tokenAddress)}?projectId=${encodeURIComponent(
        success.projectId,
      )}`,
    };

    return NextResponse.json({
      ok: true,
      config,
      success,
      metadataPackage,
      source: "prime_spo20_registered",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
