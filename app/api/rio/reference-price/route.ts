import { NextResponse } from "next/server";
import {
  getReferencePolicy,
  validateReferenceEvidence,
} from "../../../../lib/monetaryTruthBoundary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const emptyTwap = { "5m": null, "1h": null, "6h": null, "24h": null };

function unavailable(reason: string, status = 503) {
  const tiers = ["RUSD", "USDC", "USDT"].map((symbol, index) => ({
    symbol,
    priority: ["primary", "secondary", "tertiary"][index],
    pairAddress: null,
    displaySymbol: null,
    spot: null,
    twap: emptyTwap,
    rioReserve: null,
    quoteReserve: null,
    liquidityUsdEstimate: null,
    status: "unavailable",
    source: null,
    updatedAt: null,
  }));

  return NextResponse.json(
    {
      ok: false,
      available: false,
      authoritative_market_data: false,
      authority: "unavailable",
      symbol: "RIO",
      quote: "USD",
      spot: null,
      twap: emptyTwap,
      sourcePair: null,
      source: "canonical_market_observation",
      status: "unavailable",
      primary: tiers[0],
      secondary: tiers[1],
      tertiary: tiers[2],
      tiers,
      liquidity: { rio: null, quote: null, quoteSymbol: null, liquidityUsdEstimate: null },
      warning: reason,
      updatedAt: null,
    },
    { status, headers: { "cache-control": "no-store" } },
  );
}

export async function GET() {
  const policy = getReferencePolicy();
  if (!policy) return unavailable("CANONICAL_MARKET_POLICY_UNCONFIGURED");

  const indexerBase = (process.env.INTERNAL_INDEXER_URL || process.env.INDEXER_URL || "http://indexer:4000")
    .trim()
    .replace(/\/+$/, "");

  try {
    const response = await fetch(`${indexerBase}/api/rio/reference-price`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) return unavailable("CANONICAL_MARKET_OBSERVATION_UNAVAILABLE");

    const evidence = await response.json();
    const validation = validateReferenceEvidence(evidence, policy);
    if (!validation.ok) return unavailable(validation.reason);

    return NextResponse.json(
      {
        ok: true,
        available: true,
        authoritative_market_data: true,
        authority: "observed_market_data",
        symbol: "RIO",
        quote: "USD",
        spot: evidence.spot,
        twap: emptyTwap,
        sourcePair: evidence.pool_address,
        source: evidence.source_type,
        status: "observed_spot_only",
        chain_id: evidence.chain_id,
        height: evidence.height,
        observed_at: evidence.observed_at,
        quote_asset_id: evidence.quote_asset_id,
        primary: null,
        secondary: null,
        tertiary: null,
        tiers: [],
        liquidity: { rio: null, quote: null, quoteSymbol: null, liquidityUsdEstimate: null },
        warning: "TWAP and liquidity valuation are unavailable in this response.",
        updatedAt: evidence.observed_at,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return unavailable("CANONICAL_MARKET_OBSERVATION_UNAVAILABLE");
  }
}
