// No approved RIO/RUSD oracle or freshness/gap/identity policy is configured.
// Request bodies, indexed estimates and environment constants cannot authorize value.
export function unavailablePumpPrice() {
  return { ok: false, available: false, authoritative: false, status: 503,
    code: "CANONICAL_REFERENCE_PRICE_UNAVAILABLE",
    error: "An approved, sufficiently fresh RIO/RUSD price source is required for seed preparation.",
    canonicalSource: null, freshnessPolicy: null, maximumGapPolicy: null,
    rioReferencePriceRusd: null, requiredSeedRio: null, requiredSeedUrio: null,
    executionPlan: null, canExecuteFreshSeed: false };
}
export function pumpMonetaryMeasurements(_indexedRow) {
  // These columns have no authenticated conversion provenance. Even a positive
  // stored estimate cannot prove a RUSD or USD value or a reward threshold.
  return { bondingCurveProgressPercent: null, bondingCurveRaisedStableEquivalent: null,
    liquiditySeedStableEquivalent: null, marketCapUsd: null, liquidityUsd: null,
    graduationThresholdReached: false };
}

export function unavailablePumpDiscoveryMeasurements(_row) {
  return { valuationAvailable: false, valuationSource: null, valuationAuthority: false,
    progressPercent: null, raisedRusdEquivalent: null, impliedMarketCapRusd: null,
    impliedMarketCapRio: null, effectivePriceRio: null, volume24hRio: null,
    requiredSeedRio: null, graduationUnderseeded: null };
}
export function formatMonetaryMeasurement(value) {
  return value === null || value === undefined || value === "" || !Number.isFinite(Number(value))
    ? "Unavailable" : Number(value).toLocaleString("en-US", { maximumFractionDigits: 6 });
}
