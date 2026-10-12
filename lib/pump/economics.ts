import { SPHERIO_TREASURY_MULTISIG } from "@/lib/spherio/treasury";

export type PumpFeePolicy = {
  feeRecipient: string;
  curveFeeBps: number;
};

export type PumpEconomicsPolicy = {
  graduationTargetUsd: number;
  graduationTargetUsdMin: number;
  graduationTargetUsdMax: number;
  lpTargetUsd: number;
  defaultBaseAsset: "RIO";
  minHolders: number;
  minMomentumScore: number;
  feePolicy: PumpFeePolicy;
};

export type PumpEconomicsResolved = PumpEconomicsPolicy & {
  available:false;
  authoritative:false;
  rioPriceUsd: null;
  graduationTargetRio: null;
  graduationTargetRioMin: null;
  graduationTargetRioMax: null;
  lpTargetRio: null;
};

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function getPumpFeePolicy(): PumpFeePolicy {
  return {
    feeRecipient: SPHERIO_TREASURY_MULTISIG,
    curveFeeBps: 100,
  };
}

export function getPumpEconomicsPolicy(): PumpEconomicsPolicy {
  return {
    graduationTargetUsd: 65000,
    graduationTargetUsdMin: 60000,
    graduationTargetUsdMax: 65000,
    lpTargetUsd: 15000,
    defaultBaseAsset: "RIO",
    minHolders: 160,
    minMomentumScore: 70,
    feePolicy: getPumpFeePolicy(),
  };
}

export function resolvePumpEconomics(rioPriceUsd: number): PumpEconomicsResolved {
  if (!Number.isFinite(rioPriceUsd) || rioPriceUsd <= 0) {
    throw new Error("rioPriceUsd must be greater than zero");
  }

  const policy = getPumpEconomicsPolicy();

  return {
    ...policy,
    available:false,authoritative:false,rioPriceUsd:null,graduationTargetRio:null,graduationTargetRioMin:null,graduationTargetRioMax:null,lpTargetRio:null,
  };
}
