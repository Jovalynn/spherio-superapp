import type { RioValuationResponse } from "@/lib/rioValuation";
import { asFiniteNumber, getRioPriceRusd } from "@/lib/rioEconomics";

export type ScreenerValuationFields = {
  price_rio: number | null;
  price_rusd: number | null;
  liquidity_rusd: number | null;
  market_cap_rusd: number | null;
  valuation_status: "priced" | "unpriced";
  valuation_source: string;
};

export function enrichScreenerRowWithRioValuation(
  row: any,
  valuation: RioValuationResponse | null | undefined,
): ScreenerValuationFields {
  const rioPriceRusd = getRioPriceRusd(valuation);

  const priceRio =
    asFiniteNumber(row?.price_rio) ??
    asFiniteNumber(row?.priceRio) ??
    asFiniteNumber(row?.price);

  const liquidityRio =
    asFiniteNumber(row?.liquidity_rio) ??
    asFiniteNumber(row?.liquidityRio);

  const liquidityRusdDirect =
    asFiniteNumber(row?.liquidity_rusd) ??
    asFiniteNumber(row?.liquidity_usd) ??
    asFiniteNumber(row?.liquidity_quote);

  const marketCapRio =
    asFiniteNumber(row?.market_cap_rio) ??
    asFiniteNumber(row?.marketCapRio);

  const marketCapRusdDirect =
    asFiniteNumber(row?.market_cap_rusd) ??
    asFiniteNumber(row?.market_cap) ??
    asFiniteNumber(row?.fdv_reference_value);

  const priceRusd =
    priceRio !== null && rioPriceRusd !== null
      ? priceRio * rioPriceRusd
      : asFiniteNumber(row?.price_rusd) ?? asFiniteNumber(row?.price_usd);

  const liquidityRusd =
    liquidityRusdDirect ??
    (liquidityRio !== null && rioPriceRusd !== null
      ? liquidityRio * rioPriceRusd
      : null);

  const marketCapRusd =
    marketCapRusdDirect ??
    (marketCapRio !== null && rioPriceRusd !== null
      ? marketCapRio * rioPriceRusd
      : null);

  const priced =
    priceRusd !== null ||
    liquidityRusd !== null ||
    marketCapRusd !== null;

  return {
    price_rio: priceRio,
    price_rusd: priceRusd,
    liquidity_rusd: liquidityRusd,
    market_cap_rusd: marketCapRusd,
    valuation_status: priced ? "priced" : "unpriced",
    valuation_source: priced ? "rioex_valuation_rio" : "unpriced",
  };
}
