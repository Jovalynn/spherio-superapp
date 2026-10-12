import {
  getPrimeTemplateById,
  PRIME_TREASURY_RECIPIENT,
  PrimeFeeTier,
} from "./templates";
import { getApprovedHybridByLabel } from "./hybrids";

export type PrimeFeeQuote = {
  templateId: string;
  tier: PrimeFeeTier;
  feeUsd: null;
  feeRio: null;
  rioPriceUsd: null;
  available: false;
  authoritative: false;
  configuredFeeReferenceUsd: number;
  label: string;
  hybridLabel?: string;
  feeRecipient: string;
};

const BASE_USD_BY_TIER: Record<PrimeFeeTier, number> = {
  standard: 10,
  advanced: 20,
  premium: 35,
  hybrid: 50,
};

export function quotePrimeFee(params: {
  templateId: string;
  rioPriceUsd: number;
  hybridLabel?: string;
}): PrimeFeeQuote {
  const template = getPrimeTemplateById(params.templateId);
  if (!template) {
    throw new Error(`Unknown template id: ${params.templateId}`);
  }

  let feeUsd = BASE_USD_BY_TIER[template.feeTier];
  let label = `${template.name} (${template.feeTier})`;

  if (template.id === "hybrid" && params.hybridLabel) {
    const rule = getApprovedHybridByLabel(params.hybridLabel);
    if (rule) {
      feeUsd = Math.round(BASE_USD_BY_TIER.hybrid * rule.feeMultiplier);
      label = `${template.name}: ${rule.label}`;
    }
  }

  // Caller prices do not establish an approved executable fee conversion.

  return {
    templateId: template.id,
    tier: template.feeTier,
    feeUsd:null,
    feeRio:null,
    rioPriceUsd:null,
    available:false,authoritative:false,configuredFeeReferenceUsd:feeUsd,
    label,
    hybridLabel: params.hybridLabel,
    feeRecipient: PRIME_TREASURY_RECIPIENT,
  };
}
