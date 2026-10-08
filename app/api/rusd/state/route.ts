import { NextResponse } from "next/server";
import {
  getRusdTruthPolicy,
  isSupplyMatchedReserveEvidence,
  validateRusdAttestation,
} from "../../../../lib/monetaryTruthBoundary";

function unavailable(reason: string, status = 503) {
  return NextResponse.json(
    {
      available: false,
      authority: "unavailable",
      authoritative_monetary_truth: false,
      asset: "RUSD",
      source: "canonical_indexer_rusd_attestation",
      reason,
    },
    { status, headers: { "cache-control": "no-store" } },
  );
}

function getIndexerBaseUrl() {
  return process.env.INTERNAL_INDEXER_URL || process.env.INDEXER_URL || "http://indexer:4000";
}

export async function GET() {
  const policy = getRusdTruthPolicy();
  if (!policy) return unavailable("CANONICAL_RUSD_IDENTITY_OR_FRESHNESS_POLICY_UNCONFIGURED");

  try {
    const response = await fetch(`${getIndexerBaseUrl()}/api/rusd/attestation`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return unavailable("CANONICAL_RUSD_ATTESTATION_UNAVAILABLE");

    const attestation = await response.json();
    const validation = validateRusdAttestation(attestation, policy);
    if (!validation.ok) return unavailable(validation.reason);

    const reserve = attestation.reserve_truth;
    const reserveAvailable = isSupplyMatchedReserveEvidence(reserve, attestation.supply_snapshot_id);
    const ratio = reserveAvailable && typeof reserve.collateral_ratio === "string" &&
      /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(reserve.collateral_ratio)
      ? reserve.collateral_ratio
      : null;

    return NextResponse.json(
      {
        available: true,
        authority: "canonical_monetary_truth",
        authoritative_monetary_truth: true,
        asset: "RUSD",
        unit: "leri",
        chain_id: policy.chainId,
        contract_address: policy.contractAddress,
        supply_snapshot_id: attestation.supply_snapshot_id,
        height: attestation.height,
        updated_at: attestation.time,
        observed_at: attestation.time,
        issued_supply: {
          raw: attestation.total_supply_leri,
          formatted: formatLeri(attestation.total_supply_leri),
        },
        supply_ceiling: null,
        remaining_issuance_capacity: null,
        backing_value: reserveAvailable
          ? {
              raw: String(reserve.eligible_reserve_value),
              formatted: String(reserve.eligible_reserve_value),
            }
          : null,
        backing_unit: reserveAvailable ? "USD" : null,
        collateralization_ratio: ratio === null
          ? null
          : { raw: ratio, percent: formatRatioPercent(ratio) },
        reserve: {
          available: reserveAvailable,
          status: reserveAvailable ? reserve.reserve_status ?? null : null,
          snapshot_id: reserveAvailable ? reserve.id ?? null : null,
          supply_snapshot_id: reserveAvailable ? reserve.supply_snapshot_id : null,
          observed_at: reserveAvailable ? reserve.created_at ?? null : null,
        },
        mint_policy: null,
        source: {
          mode: "canonical_indexer_attestation",
          issued_supply: "canonical_chain_snapshot",
          reserve: reserveAvailable ? "supply_matched_canonical_snapshot" : "unavailable",
          policy_fields: "unavailable",
          derived_fields: ratio === null ? "unavailable" : "display_only_from_canonical_ratio",
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return unavailable("CANONICAL_RUSD_ATTESTATION_UNAVAILABLE");
  }
}

function formatLeri(value: string): string {
  const amount = BigInt(value);
  const whole = amount / 1_000_000n;
  const fraction = (amount % 1_000_000n).toString().padStart(6, "0");
  return `${whole.toString()}.${fraction}`;
}

function formatRatioPercent(value: string): string {
  const [whole = "0", fraction = ""] = value.split(".");
  const denominator = 10n ** BigInt(fraction.length);
  const numerator = BigInt(`${whole}${fraction}` || "0");
  const hundredthsOfPercent = (numerator * 10_000n + denominator / 2n) / denominator;
  return `${hundredthsOfPercent / 100n}.${(hundredthsOfPercent % 100n).toString().padStart(2, "0")}%`;
}
