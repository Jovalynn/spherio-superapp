import { NextResponse } from "next/server";

type CanonicalAttestation = {
  available?: boolean;
  authority?: string;
  authoritative_monetary_truth?: boolean;
  contract_address?: string | null;
  supply_snapshot_id?: string | null;
  height?: string | null;
  time?: string | null;
  total_supply_leri?: string | null;
  reserve_truth?: {
    available?: boolean;
    id?: string | null;
    supply_snapshot_id?: string | null;
    eligible_reserve_value?: string | null;
    collateral_ratio?: string | null;
    target_ratio?: string | null;
    reserve_status?: string | null;
    created_at?: string | null;
  } | null;
};

function getIndexerBaseUrl() {
  return (
    process.env.INTERNAL_INDEXER_URL ||
    process.env.INDEXER_URL ||
    "http://indexer:4000"
  );
}

function unavailable(status = 503) {
  return NextResponse.json(
    {
      available: false,
      authority: "unavailable",
      authoritative_monetary_truth: false,
      source: "canonical_indexer_rusd_attestation",
      error: "canonical_rusd_attestation_unavailable",
    },
    { status },
  );
}

function isExactInteger(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]+$/.test(value);
}

function formatLeri(value: string): string {
  const amount = BigInt(value);
  const whole = amount / 1_000_000n;
  const fraction = (amount % 1_000_000n).toString().padStart(6, "0");
  return `${whole.toString()}.${fraction}`;
}

export async function GET() {
  try {
    const response = await fetch(
      `${getIndexerBaseUrl()}/api/rusd/attestation`,
      {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) return unavailable(503);

    const attestation = (await response.json()) as CanonicalAttestation;
    if (
      attestation.available !== true ||
      attestation.authoritative_monetary_truth !== true ||
      typeof attestation.supply_snapshot_id !== "string" ||
      !attestation.supply_snapshot_id.trim() ||
      typeof attestation.contract_address !== "string" ||
      !attestation.contract_address.trim() ||
      !isExactInteger(attestation.total_supply_leri)
    ) {
      return unavailable(503);
    }

    const reserve = attestation.reserve_truth;
    const reserveAvailable =
      reserve?.available === true &&
      reserve.supply_snapshot_id === attestation.supply_snapshot_id;
    const ratio = reserveAvailable ? reserve?.collateral_ratio ?? null : null;
    const ratioNumber = ratio !== null ? Number(ratio) : Number.NaN;
    const ratioPercent = Number.isFinite(ratioNumber)
      ? `${(ratioNumber * 100).toFixed(2)}%`
      : null;
    const eligibleReserve = reserveAvailable
      ? reserve?.eligible_reserve_value ?? null
      : null;

    return NextResponse.json({
      available: true,
      authority: "canonical_monetary_truth",
      authoritative_monetary_truth: true,
      asset: "RUSD",
      unit: "leri",
      contract_address: attestation.contract_address,
      supply_snapshot_id: attestation.supply_snapshot_id,
      height: attestation.height ?? null,
      issued_supply: {
        raw: attestation.total_supply_leri,
        formatted: formatLeri(attestation.total_supply_leri),
      },
      supply_ceiling: null,
      remaining_issuance_capacity: null,
      backing_value: eligibleReserve === null
        ? null
        : { raw: eligibleReserve, formatted: eligibleReserve },
      backing_unit: "USD",
      collateralization_ratio: ratioPercent === null
        ? null
        : { raw: ratio, percent: ratioPercent },
      reserve: {
        available: reserveAvailable,
        status: reserveAvailable ? reserve?.reserve_status ?? null : null,
        snapshot_id: reserveAvailable ? reserve?.id ?? null : null,
        supply_snapshot_id: reserveAvailable ? reserve?.supply_snapshot_id ?? null : null,
        observed_at: reserveAvailable ? reserve?.created_at ?? null : null,
      },
      mint_policy: null,
      source: {
        mode: "canonical_indexer_attestation",
        issued_supply: "canonical_chain_snapshot",
        reserve: reserveAvailable ? "supply_matched_canonical_snapshot" : "unavailable",
        policy_fields: "unavailable",
        derived_fields: ratioPercent === null ? "unavailable" : "display_only_from_canonical_ratio",
      },
      updated_at: attestation.time ?? null,
    });
  } catch {
    return unavailable(503);
  }
}
