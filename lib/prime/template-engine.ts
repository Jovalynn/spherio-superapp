import { quotePrimeFee } from "./fees";
import {
  getPrimeTemplateById,
  PrimeLiquidityBase,
  PrimeLiquidityMode,
  PRIME_TREASURY_RECIPIENT,
  type PrimeReviewSection,
} from "./templates";
import { getApprovedHybridByLabel } from "./hybrids";

export type PrimeProjectInput = {
  templateId: string;
  projectName: string;
  symbol: string;
  totalSupply: string;
  statement?: string;
  logoUrl?: string;
  hybridLabel?: string;
  liquidityBase?: PrimeLiquidityBase;
  liquidityMode?: PrimeLiquidityMode;
  rioPriceUsd: number;
};

export type PrimeLifecycleStep =
  | "create"
  | "lp"
  | "screener"
  | "trade"
  | "rioex"
  | "cmc_gecko";

export type PrimeProjectConfig = {
  templateId: string;
  templateName: string;
  hybridLabel?: string;
  projectName: string;
  symbol: string;
  totalSupply: string;
  statement?: string;
  logoUrl?: string;
  decimals: number;

  feeUsd: number;
  feeRio: number;
  feeLabel: string;
  feeRecipient: string;

  liquidityBase: PrimeLiquidityBase;
  liquidityMode: PrimeLiquidityMode;

  allocationDefaults: string[];
  trustDefaults: string[];
  readinessDefaults: string[];

  aiContext: string;
  aiOutputs: string[];
  powerUps: string[];
  liquidityGuidance: string[];
  requiredDisclosures: string[];
  reviewSections: PrimeReviewSection[];
  screenerLabel: string;
  successActions: string[];

  lifecycle: {
    rail: "prime";
    progressPercent: number;
    steps: {
      key: PrimeLifecycleStep;
      label: string;
      status: "complete" | "active" | "pending" | "optional";
    }[];
  };

  authority: {
    issuerGrade: true;
    registryMode: "prime_authority_shape";
    marketHandoffTarget: "lp_then_screener_then_trade_then_rioex";
    verificationStatus: "unverified";
  };

  discovery: {
    featuredNicheName: string;
    featuredNicheCategory: string;
  };
};

export function buildPrimeProjectConfig(input: PrimeProjectInput): PrimeProjectConfig {
  const template = getPrimeTemplateById(input.templateId);
  if (!template) {
    throw new Error(`Unknown template id: ${input.templateId}`);
  }

  if (template.id === "hybrid" && input.hybridLabel) {
    const rule = getApprovedHybridByLabel(input.hybridLabel);
    if (!rule) {
      throw new Error(`Unknown hybrid label: ${input.hybridLabel}`);
    }
  }

  const feeQuote = quotePrimeFee({
    templateId: template.id,
    rioPriceUsd: input.rioPriceUsd,
    hybridLabel: input.hybridLabel,
  });

  return {
    templateId: template.id,
    templateName: template.name,
    hybridLabel: input.hybridLabel,
    projectName: input.projectName,
    symbol: input.symbol,
    totalSupply: input.totalSupply,
    statement: input.statement,
    logoUrl: input.logoUrl,
    decimals: 6,

    feeUsd: feeQuote.feeUsd,
    feeRio: feeQuote.feeRio,
    feeLabel: feeQuote.label,
    feeRecipient: PRIME_TREASURY_RECIPIENT,

    liquidityBase: input.liquidityBase ?? template.defaultLiquidityBases[0],
    liquidityMode: input.liquidityMode ?? template.defaultLiquidityMode,

    allocationDefaults: template.allocationDefaults,
    trustDefaults: template.trustDefaults,
    readinessDefaults: template.readinessDefaults,

    aiContext: template.aiContext,
    aiOutputs: template.aiOutputs ?? [],
    powerUps: template.powerUps ?? [],
    liquidityGuidance: template.liquidityGuidance ?? [],
    requiredDisclosures: template.requiredDisclosures ?? [],
    reviewSections: template.reviewSections ?? [],
    screenerLabel: template.screenerLabel,
    successActions: template.successActions,

    lifecycle: {
      rail: "prime",
      progressPercent: 8,
      steps: [
        { key: "create", label: "Create", status: "active" },
        { key: "lp", label: "LP", status: "pending" },
        { key: "screener", label: "Screener", status: "pending" },
        { key: "trade", label: "Trade", status: "pending" },
        { key: "rioex", label: "RioEx", status: "pending" },
        { key: "cmc_gecko", label: "CMC/Gecko", status: "pending" },
      ],
    },

    authority: {
      issuerGrade: true,
      registryMode: "prime_authority_shape",
      marketHandoffTarget: "lp_then_screener_then_trade_then_rioex",
      verificationStatus: "unverified",
    },

    discovery: {
      featuredNicheName: template.name,
      featuredNicheCategory: template.category,
    },
  };
}

export type PrimeCreateSuccess = {
  projectId: string;
  templateId: string;
  templateName: string;
  hybridLabel?: string;
  tokenAddress: string;
  explorerUrl: string;
  screenerUrl: string;
  liquidityUrl: string;
  verifiedStatus: "verified" | "unverified";
  feePaidRio: number;
  feeUsdReference: number;
  feeRecipient: string;
  successActions: string[];
  aiOutputs: string[];
  powerUps: string[];
  liquidityGuidance: string[];
  requiredDisclosures: string[];
  reviewSections: PrimeReviewSection[];

  lifecycle: PrimeProjectConfig["lifecycle"];
  authority: PrimeProjectConfig["authority"];
  discovery: PrimeProjectConfig["discovery"];
};

export function buildPrimeSuccessPayload(params: {
  projectId: string;
  tokenAddress: string;
  config: PrimeProjectConfig;
  explorerBaseUrl: string;
  screenerBaseUrl: string;
  liquidityBaseUrl: string;
}): PrimeCreateSuccess {
  return {
    projectId: params.projectId,
    templateId: params.config.templateId,
    templateName: params.config.templateName,
    hybridLabel: params.config.hybridLabel,
    tokenAddress: params.tokenAddress,
    explorerUrl: `${params.explorerBaseUrl.replace(/\/$/, "")}/${params.tokenAddress}`,
    screenerUrl: `${params.screenerBaseUrl.replace(/\/$/, "")}/${params.tokenAddress}`,
    liquidityUrl: `${params.liquidityBaseUrl.replace(/\/$/, "")}?token=${params.tokenAddress}&base=${params.config.liquidityBase}`,
    verifiedStatus: params.config.authority.verificationStatus,
    feePaidRio: params.config.feeRio,
    feeUsdReference: params.config.feeUsd,
    feeRecipient: params.config.feeRecipient,
    successActions: params.config.successActions,
    aiOutputs: params.config.aiOutputs,
    powerUps: params.config.powerUps,
    liquidityGuidance: params.config.liquidityGuidance,
    requiredDisclosures: params.config.requiredDisclosures,
    reviewSections: params.config.reviewSections,
    lifecycle: params.config.lifecycle,
    authority: params.config.authority,
    discovery: params.config.discovery,
  };
}
