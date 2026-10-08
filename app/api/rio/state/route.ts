import { NextResponse } from "next/server";
import {
  getRioStatePolicy,
  validateRioState,
} from "../../../../lib/monetaryTruthBoundary";

function unavailable(reason: string, status = 503) {
  return NextResponse.json(
    {
      available: false,
      authority: "unavailable",
      authoritative_monetary_truth: false,
      source: "canonical_rio_chain_observation",
      reason,
    },
    { status, headers: { "cache-control": "no-store" } },
  );
}

function getIndexerBaseUrl() {
  return process.env.INTERNAL_INDEXER_URL || process.env.INDEXER_URL || "http://indexer:4000";
}

export async function GET() {
  const policy = getRioStatePolicy();
  if (!policy) return unavailable("CANONICAL_CHAIN_STATE_POLICY_UNCONFIGURED");

  try {
    const response = await fetch(`${getIndexerBaseUrl()}/api/rio/state`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return unavailable("CANONICAL_RIO_STATE_UNAVAILABLE");

    const state = await response.json();
    const validation = validateRioState(state, policy);
    if (!validation.ok) return unavailable(validation.reason);

    return NextResponse.json(state, { headers: { "cache-control": "no-store" } });
  } catch {
    return unavailable("CANONICAL_RIO_STATE_UNAVAILABLE");
  }
}
