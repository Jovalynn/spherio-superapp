// lib/riodex/liquidity-intelligence.ts

export type LiquiditySource = "manual" | "prime" | "pump_graduation";

export type LiquidityExecutionMode =
  | "manual_user_funded"
  | "prime_user_funded"
  | "pump_protocol_seeded";

export type LiquidityPosture =
  | "user_controlled"
  | "prime_optional_verified"
  | "protocol_seeded_burned";

export type LpDisposition = "keep" | "burn" | "lock" | "vest";

export type AssetSelectionBehavior = {
  baseAsset: {
    selectable: boolean;
    locked: boolean;
    defaultSymbol?: string;
    reason: string;
  };
  quoteAsset: {
    selectable: boolean;
    locked: boolean;
    defaultSymbol?: string;
    reason: string;
  };
};

export type LiquidityApprovalPolicy = {
  rioLightApprovalRequired: boolean;
  protocolAutomation: boolean;
  approvalLabel: string;
  reason: string;
};

export type LiquidityVerificationPolicy = {
  primeVerifiedEligible: boolean;
  requiresBurnLockOrVest: boolean;
  minVestDays: number | null;
  recommendedVestDays: number | null;
  eligibleDispositions: LpDisposition[];
  badgeLabel: string | null;
  explanation: string;
};

export type PumpGraduationPolicy = {
  enabled: boolean;
  seedRusdEquivalent: number | null;
  seedAssetSymbol: string | null;
  protocolLpDisposition: Extract<LpDisposition, "burn"> | null;
  userApprovalRequired: boolean;
  explanation: string;
};

export type LiquidityDiscoveryPolicy = {
  pool: boolean;
  screener: boolean;
  rioEx: boolean;
  rioExplorer: boolean;
  expectedProofs: string[];
};

export type LiquidityNextActionState =
  | "connect_wallet"
  | "enter_amounts"
  | "review_in_riolight"
  | "protocol_ready"
  | "execution_unavailable";

export type LiquidityIntelligenceInput = {
  source?: LiquiditySource;
  mode?: "add" | "remove" | string;
  walletConnected?: boolean;
  amountsReady?: boolean;
  pairAddress?: string | null;
  pairLabel?: string | null;
  baseAssetSymbol?: string | null;
  quoteAssetSymbol?: string | null;
  createdTokenSymbol?: string | null;
  tvlRusd?: number | null;
  poolTruthAvailable?: boolean;
  liquidityActionHidden?: boolean;
};

export type LiquidityIntelligenceResult = {
  source: LiquiditySource;
  executionMode: LiquidityExecutionMode;
  posture: LiquidityPosture;
  title: string;
  subtitle: string;
  assetSelection: AssetSelectionBehavior;
  approval: LiquidityApprovalPolicy;
  lpDispositionOptions: LpDisposition[];
  defaultLpDisposition: LpDisposition;
  verification: LiquidityVerificationPolicy;
  pumpGraduation: PumpGraduationPolicy;
  discovery: LiquidityDiscoveryPolicy;
  disclosures: string[];
  warnings: string[];
  nextAction: {
    state: LiquidityNextActionState;
    label: string;
    disabled: boolean;
    reason: string;
  };
};

export const PRIME_VERIFIED_MIN_VEST_DAYS = 30;
export const PRIME_VERIFIED_RECOMMENDED_VEST_DAYS = 90;
export const PUMP_GRADUATION_SEED_RUSD_EQUIVALENT = 15_000;

// Canonical LP dead-wallet policy is intentionally pending.
// Do not hardcode the final burn destination until governance/protocol policy is finalized.
export const SPHERIO_LP_DEAD_WALLET_PENDING = true;

export function normalizeLiquiditySource(source?: string | null): LiquiditySource {
  const value = String(source || "").trim().toLowerCase();

  if (value === "prime" || value === "createtoken") return "prime";

  if (
    value === "pump" ||
    value === "pumplive" ||
    value === "pump_live" ||
    value === "pump_graduation"
  ) {
    return "pump_graduation";
  }

  return "manual";
}

function resolveNextAction(input: {
  source: LiquiditySource;
  walletConnected: boolean;
  amountsReady: boolean;
  poolTruthAvailable: boolean;
  liquidityActionHidden: boolean;
}): LiquidityIntelligenceResult["nextAction"] {
  if (input.liquidityActionHidden) {
    return {
      state: "execution_unavailable",
      label: "Liquidity Unavailable",
      disabled: true,
      reason: "Liquidity Action is hidden for this pool.",
    };
  }

  if (!input.poolTruthAvailable) {
    return {
      state: "execution_unavailable",
      label: "Pool Truth Required",
      disabled: true,
      reason:
        "Liquidity execution should not proceed until Pool Truth is available.",
    };
  }

  if (input.source === "pump_graduation") {
    return {
      state: "protocol_ready",
      label: "Protocol Graduation Ready",
      disabled: false,
      reason:
        "Pump graduation liquidity is protocol-seeded and does not require user RioLight approval.",
    };
  }

  if (!input.walletConnected) {
    return {
      state: "connect_wallet",
      label: "Connect RioLight",
      disabled: true,
      reason: "A connected RioLight wallet is required for user-funded liquidity.",
    };
  }

  if (!input.amountsReady) {
    return {
      state: "enter_amounts",
      label: "Enter Liquidity Amounts",
      disabled: true,
      reason: "Enter both asset amounts before RioLight review.",
    };
  }

  return {
    state: "review_in_riolight",
    label: "Review in RioLight",
    disabled: false,
    reason:
      "User-funded liquidity requires RioLight review and approval before broadcast.",
  };
}

export function getLiquidityIntelligence(
  input: LiquidityIntelligenceInput = {},
): LiquidityIntelligenceResult {
  const source = normalizeLiquiditySource(input.source);
  const walletConnected = Boolean(input.walletConnected);
  const amountsReady = Boolean(input.amountsReady);
  const poolTruthAvailable = input.poolTruthAvailable !== false;
  const liquidityActionHidden = Boolean(input.liquidityActionHidden);

  const baseAssetSymbol =
    input.baseAssetSymbol || (source === "pump_graduation" ? "RIO" : undefined);

  const quoteAssetSymbol =
    input.quoteAssetSymbol ||
    input.createdTokenSymbol ||
    (source === "manual" ? undefined : "Created Token");

  if (source === "prime") {
    return {
      source,
      executionMode: "prime_user_funded",
      posture: "prime_optional_verified",
      title: "Prime Liquidity Intelligence",
      subtitle:
        "Prime liquidity is user-funded, RioLight-approved, and can qualify for Prime Verified Liquidity.",
      assetSelection: {
        baseAsset: {
          selectable: true,
          locked: false,
          defaultSymbol: baseAssetSymbol || "RIO",
          reason:
            "Prime issuers choose the base asset used to seed their market.",
        },
        quoteAsset: {
          selectable: false,
          locked: true,
          defaultSymbol: quoteAssetSymbol || "Prime Token",
          reason:
            "The newly created Prime token should be preselected as the quote asset.",
        },
      },
      approval: {
        rioLightApprovalRequired: true,
        protocolAutomation: false,
        approvalLabel: "Prime liquidity requires RioLight approval",
        reason:
          "The issuer is funding liquidity from their own wallet, so explicit approval is required.",
      },
      lpDispositionOptions: ["keep", "burn", "lock", "vest"],
      defaultLpDisposition: "keep",
      verification: {
        primeVerifiedEligible: true,
        requiresBurnLockOrVest: true,
        minVestDays: PRIME_VERIFIED_MIN_VEST_DAYS,
        recommendedVestDays: PRIME_VERIFIED_RECOMMENDED_VEST_DAYS,
        eligibleDispositions: ["burn", "lock", "vest"],
        badgeLabel: "Prime Verified Liquidity",
        explanation:
          "Prime users are not forced to burn, lock, or vest LP. However, the Prime Verified Liquidity badge requires LP burn, LP lock, or vesting for at least 30 days. A 90-day vest is recommended for stronger market credibility.",
      },
      pumpGraduation: {
        enabled: false,
        seedRusdEquivalent: null,
        seedAssetSymbol: null,
        protocolLpDisposition: null,
        userApprovalRequired: true,
        explanation:
          "Prime liquidity is issuer-funded and is not a protocol Pump graduation seed.",
      },
      discovery: {
        pool: true,
        screener: true,
        rioEx: true,
        rioExplorer: true,
        expectedProofs: [
          "Prime token created",
          "Pair selected or created",
          "Liquidity added",
          "LP token minted",
          "Optional LP burn, lock, or vest proof",
          "Prime Verified Liquidity eligibility proof",
        ],
      },
      disclosures: [
        "RioLight approval is required for Prime liquidity.",
        "LP burn, lock, or vesting is optional.",
        "Prime Verified Liquidity requires burn, lock, or vesting for at least 30 days.",
        "A 90-day vest is recommended for stronger institutional credibility.",
        "The LP position must remain visible and copyable after execution.",
      ],
      warnings: SPHERIO_LP_DEAD_WALLET_PENDING
        ? [
            "Canonical LP dead-wallet policy is not finalized yet. Keep the burn destination configurable.",
          ]
        : [],
      nextAction: resolveNextAction({
        source,
        walletConnected,
        amountsReady,
        poolTruthAvailable,
        liquidityActionHidden,
      }),
    };
  }

  if (source === "pump_graduation") {
    return {
      source,
      executionMode: "pump_protocol_seeded",
      posture: "protocol_seeded_burned",
      title: "Pump Graduation Liquidity Intelligence",
      subtitle:
        "Pump graduation liquidity is protocol-seeded, deterministic, and does not require user RioLight approval.",
      assetSelection: {
        baseAsset: {
          selectable: false,
          locked: true,
          defaultSymbol: "RIO",
          reason:
            "Pump graduation uses protocol-funded RIO as the liquidity seed asset.",
        },
        quoteAsset: {
          selectable: false,
          locked: true,
          defaultSymbol: quoteAssetSymbol || "Graduated Token",
          reason:
            "The graduated Pump token is locked as the quote asset for graduation liquidity.",
        },
      },
      approval: {
        rioLightApprovalRequired: false,
        protocolAutomation: true,
        approvalLabel: "No user approval required",
        reason:
          "The protocol funds the graduation seed, so the creator should not manually approve this liquidity action.",
      },
      lpDispositionOptions: ["burn"],
      defaultLpDisposition: "burn",
      verification: {
        primeVerifiedEligible: false,
        requiresBurnLockOrVest: false,
        minVestDays: null,
        recommendedVestDays: null,
        eligibleDispositions: ["burn"],
        badgeLabel: null,
        explanation:
          "Pump graduation liquidity follows protocol rules, not Prime Verified Liquidity rules.",
      },
      pumpGraduation: {
        enabled: true,
        seedRusdEquivalent: PUMP_GRADUATION_SEED_RUSD_EQUIVALENT,
        seedAssetSymbol: "RIO",
        protocolLpDisposition: "burn",
        userApprovalRequired: false,
        explanation:
          "On graduation, the protocol seeds 15,000 RUSD-equivalent in RIO and burns or dead-wallets the protocol-funded LP position.",
      },
      discovery: {
        pool: true,
        screener: true,
        rioEx: true,
        rioExplorer: true,
        expectedProofs: [
          "Pump graduation event",
          "Protocol liquidity seed",
          "Pair created or activated",
          "LP token minted",
          "Protocol LP burned or sent to dead wallet",
          "Pool/Screener/RioEx/RioExplorer discovery",
        ],
      },
      disclosures: [
        "No user RioLight approval is required for protocol-funded Pump graduation liquidity.",
        "The protocol seed is 15,000 RUSD-equivalent in RIO.",
        "The protocol-funded LP position is burned or sent to the canonical dead wallet.",
        "The graduated market should become discoverable across Pool, Screener, RioEx, and RioExplorer.",
      ],
      warnings: SPHERIO_LP_DEAD_WALLET_PENDING
        ? [
            "Canonical LP dead-wallet policy is pending. Keep the burn/dead-wallet destination configurable.",
          ]
        : [],
      nextAction: resolveNextAction({
        source,
        walletConnected,
        amountsReady,
        poolTruthAvailable,
        liquidityActionHidden,
      }),
    };
  }

  return {
    source: "manual",
    executionMode: "manual_user_funded",
    posture: "user_controlled",
    title: "Manual Liquidity Intelligence",
    subtitle:
      "Manual liquidity is user-controlled. The user chooses the market, approves in RioLight, and decides what to do with the LP position.",
    assetSelection: {
      baseAsset: {
        selectable: true,
        locked: false,
        defaultSymbol: baseAssetSymbol || "RIO",
        reason:
          "Manual liquidity lets the user choose the base asset for the pool.",
      },
      quoteAsset: {
        selectable: true,
        locked: false,
        defaultSymbol: quoteAssetSymbol || "RUSD",
        reason:
          "Manual liquidity lets the user choose the quote asset or token.",
      },
    },
    approval: {
      rioLightApprovalRequired: true,
      protocolAutomation: false,
      approvalLabel: "Manual liquidity requires RioLight approval",
      reason:
        "The user is funding liquidity from their own wallet, so explicit approval is required.",
    },
    lpDispositionOptions: ["keep", "burn", "lock", "vest"],
    defaultLpDisposition: "keep",
    verification: {
      primeVerifiedEligible: false,
      requiresBurnLockOrVest: false,
      minVestDays: null,
      recommendedVestDays: null,
      eligibleDispositions: ["keep", "burn", "lock", "vest"],
      badgeLabel: null,
      explanation:
        "Manual liquidity gives the LP owner control. Burn, lock, or vest actions are optional and should not be forced.",
    },
    pumpGraduation: {
      enabled: false,
      seedRusdEquivalent: null,
      seedAssetSymbol: null,
      protocolLpDisposition: null,
      userApprovalRequired: true,
      explanation:
        "Manual liquidity is user-funded and does not use the Pump graduation seed.",
    },
    discovery: {
      pool: true,
      screener: true,
      rioEx: true,
      rioExplorer: true,
      expectedProofs: [
        "Liquidity added",
        "LP token minted",
        "User LP position",
        "Optional LP burn, lock, or vest proof",
        "RioExplorer transaction proof",
      ],
    },
    disclosures: [
      "RioLight approval is required.",
      "The LP token or LP position must appear after execution.",
      "The LP position must be copyable.",
      "The user decides whether to keep, burn, lock, or vest the LP position.",
    ],
    warnings: [],
    nextAction: resolveNextAction({
      source: "manual",
      walletConnected,
      amountsReady,
      poolTruthAvailable,
      liquidityActionHidden,
    }),
  };
}
