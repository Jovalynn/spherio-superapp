import type { RioValuationResponse } from "@/lib/rioValuation";

export type RioEconomicValue = {
  rio: number | null;
  rusd: number | null;
  usd: number | null;
  usdt: number | null;
  btc: number | null;
  source: string;
  status: "priced" | "unpriced";
};

export function asFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function getRioPriceRusd(valuation: RioValuationResponse | null | undefined): number | null {
  return valuation?.price?.rio?.rusd ?? null;
}

export function valueRioAmount(
  rioAmount: unknown,
  valuation: RioValuationResponse | null | undefined,
  source = "rioex_valuation_rio",
): RioEconomicValue {
  const rio = asFiniteNumber(rioAmount);
  const price = getRioPriceRusd(valuation);

  if (rio === null || price === null || price <= 0) {
    return {
      rio,
      rusd: null,
      usd: null,
      usdt: null,
      btc: null,
      source,
      status: "unpriced",
    };
  }

  const rusd = rio * price;

  return {
    rio,
    rusd,
    usd: rusd,
    usdt: rusd,
    btc: null,
    source,
    status: "priced",
  };
}

export function valueMarketCapRio(
  marketCapRio: unknown,
  valuation: RioValuationResponse | null | undefined,
): RioEconomicValue {
  return valueRioAmount(marketCapRio, valuation, "market_cap_rio_x_rioex_valuation");
}

export function valueLaunchEconomicsRio(params: {
  valuation: RioValuationResponse | null | undefined;
  creationFeeRio?: unknown;
  liquiditySeedRio?: unknown;
  graduationTargetRio?: unknown;
  creatorRewardRio?: unknown;
}) {
  return {
    creation_fee: valueRioAmount(params.creationFeeRio, params.valuation, "prime_creation_fee_rio"),
    liquidity_seed: valueRioAmount(params.liquiditySeedRio, params.valuation, "launch_liquidity_seed_rio"),
    graduation_target: valueRioAmount(params.graduationTargetRio, params.valuation, "pump_prime_graduation_target_rio"),
    creator_reward: valueRioAmount(params.creatorRewardRio, params.valuation, "creator_reward_rio"),
  };
}

export function formatEconomicValue(value: number | null | undefined, max = 6): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
  }).format(value);
}
