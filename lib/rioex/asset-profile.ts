export type RioExAssetProfileInput = {
  projectId: string;
  tokenAddress: string;
  projectName: string;
  symbol: string;
  templateId: string;
  templateName: string;
  hybridLabel?: string;
  liquidityBase: string;
  liquidityMode: string;
  aiContext: string;
  aiOutputs: string[];
  powerUps: string[];
  liquidityGuidance: string[];
  requiredDisclosures: string[];
  reviewSections: {
    id: string;
    title: string;
    items: string[];
  }[];
  screenerLabel: string;
  successActions: string[];
};

export type RioExAssetProfile = {
  assetAddress: string;
  assetSymbol: string;
  assetName: string;
  profileType: "prime_launch";
  classification: {
    templateId: string;
    templateName: string;
    hybridLabel?: string;
    screenerLabel: string;
  };
  launch: {
    projectId: string;
    liquidityBase: string;
    liquidityMode: string;
  };
  intelligence: {
    aiContext: string;
    aiOutputs: string[];
    powerUps: string[];
    liquidityGuidance: string[];
    requiredDisclosures: string[];
    reviewSections: {
      id: string;
      title: string;
      items: string[];
    }[];
  };
  actions: string[];
};

export function buildRioExAssetProfile(
  input: RioExAssetProfileInput,
): RioExAssetProfile {
  return {
    assetAddress: input.tokenAddress,
    assetSymbol: input.symbol,
    assetName: input.projectName,
    profileType: "prime_launch",
    classification: {
      templateId: input.templateId,
      templateName: input.templateName,
      hybridLabel: input.hybridLabel,
      screenerLabel: input.screenerLabel,
    },
    launch: {
      projectId: input.projectId,
      liquidityBase: input.liquidityBase,
      liquidityMode: input.liquidityMode,
    },
    intelligence: {
      aiContext: input.aiContext,
      aiOutputs: input.aiOutputs ?? [],
      powerUps: input.powerUps ?? [],
      liquidityGuidance: input.liquidityGuidance ?? [],
      requiredDisclosures: input.requiredDisclosures ?? [],
      reviewSections: input.reviewSections ?? [],
    },
    actions: input.successActions ?? [],
  };
}
