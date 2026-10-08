import assert from "node:assert/strict";
import test from "node:test";
import {
  getReferencePolicy,
  getRioStatePolicy,
  getRusdTruthPolicy,
  isSupplyMatchedReserveEvidence,
  validateReferenceEvidence,
  validateRioState,
  validateRusdAttestation,
} from "../lib/monetaryTruthBoundary.ts";

const now = new Date("2026-10-08T12:00:00.000Z");
const rusdPolicy = {
  contractAddress: "rio1canonicalrusd",
  chainId: "spherio-1",
  maxAgeSeconds: 300,
};
const attestation = {
  available: true,
  authoritative_monetary_truth: true,
  contract_address: rusdPolicy.contractAddress,
  chain_id: rusdPolicy.chainId,
  height: "1665000",
  time: "2026-10-08T11:59:00.000Z",
  source_type: "cosmwasm_token_info.total_supply",
  supply_snapshot_id: "snapshot-1",
  total_supply_leri: "7000000000000",
};

test("RUSD identity and freshness policy must be explicitly configured", () => {
  assert.equal(getRusdTruthPolicy({}), null);
  assert.equal(getRusdTruthPolicy({
    RUSD_CANONICAL_IDENTITY_VERIFIED: "true",
    RUSD_CANONICAL_CONTRACT: rusdPolicy.contractAddress,
    RUSD_CANONICAL_CHAIN_ID: rusdPolicy.chainId,
  }), null);
  assert.deepEqual(getRusdTruthPolicy({
    RUSD_CANONICAL_IDENTITY_VERIFIED: "true",
    RUSD_CANONICAL_CONTRACT: rusdPolicy.contractAddress,
    RUSD_CANONICAL_CHAIN_ID: rusdPolicy.chainId,
    RUSD_SUPPLY_MAX_AGE_SECONDS: "300",
  }), rusdPolicy);
});

test("RUSD accepts only fresh exact supply from the configured chain and contract", () => {
  assert.deepEqual(validateRusdAttestation(attestation, rusdPolicy, now), { ok: true });
  assert.equal(validateRusdAttestation(attestation, null, now).ok, false);
  assert.equal(validateRusdAttestation({ ...attestation, contract_address: "rio1other" }, rusdPolicy, now).ok, false);
  assert.equal(validateRusdAttestation({ ...attestation, chain_id: "other-1" }, rusdPolicy, now).ok, false);
  assert.equal(validateRusdAttestation({ ...attestation, time: "2026-10-08T11:00:00Z" }, rusdPolicy, now).ok, false);
  assert.equal(validateRusdAttestation({ ...attestation, time: "2026-10-08T12:00:01Z" }, rusdPolicy, now).ok, false);
  assert.equal(validateRusdAttestation({ ...attestation, total_supply_leri: "7.0" }, rusdPolicy, now).ok, false);
  assert.equal(validateRusdAttestation({ ...attestation, source_type: "database_cache" }, rusdPolicy, now).ok, false);
  assert.equal(validateRusdAttestation({ ...attestation, supply_snapshot_id: "" }, rusdPolicy, now).ok, false);
});

test("reserve evidence is available only when linked to the accepted supply snapshot", () => {
  const reserve = { available: true, supply_snapshot_id: "snapshot-1", eligible_reserve_value: "7200000.00" };
  assert.equal(isSupplyMatchedReserveEvidence(reserve, "snapshot-1"), true);
  assert.equal(isSupplyMatchedReserveEvidence({ ...reserve, supply_snapshot_id: "other" }, "snapshot-1"), false);
  assert.equal(isSupplyMatchedReserveEvidence({ ...reserve, eligible_reserve_value: "synthetic" }, "snapshot-1"), false);
  assert.equal(isSupplyMatchedReserveEvidence(null, "snapshot-1"), false);
});

test("RIO state rejects unavailable, stale, wrong-chain and abolished-lock representations", () => {
  const policy = { chainId: "spherio-1", maxAgeSeconds: 300 };
  const state = {
    available: true,
    authoritative_monetary_truth: true,
    authority: "observed_chain_state",
    source: "chain_bank_supply_snapshot",
    chain_id: "spherio-1",
    height: "1665000",
    total_supply_urio: "299880200060000",
    observed_at: "2026-10-08T11:59:00Z",
  };
  assert.deepEqual(validateRioState(state, policy, now), { ok: true });
  assert.equal(validateRioState({ ...state, total_supply: "300000000", dead_locked: "161000000" }, policy, now).ok, false);
  assert.equal(validateRioState({ ...state, chain_id: "other-1" }, policy, now).ok, false);
  assert.equal(validateRioState({ ...state, observed_at: "2026-10-08T11:00:00Z" }, policy, now).ok, false);
  assert.equal(validateRioState({ ...state, source: "application_database" }, policy, now).ok, false);
  assert.equal(validateRioState({ ...state, available: false }, policy, now).ok, false);
});

test("reference price requires explicit chain, quote identity, source and freshness", () => {
  const policy = { chainId: "spherio-1", maxAgeSeconds: 300, quoteAssetIds: new Set(["contract:canonical-usd"]) };
  assert.equal(getReferencePolicy({}), null);
  const evidence = {
    available: true,
    authoritative_market_data: true,
    chain_id: "spherio-1",
    source_type: "chain_pool_observation",
    pool_address: "rio1pool",
    quote_asset_id: "contract:canonical-usd",
    height: "1665000",
    observed_at: "2026-10-08T11:59:00Z",
    spot: 0.25,
  };
  assert.deepEqual(validateReferenceEvidence(evidence, policy, now), { ok: true });
  assert.equal(validateReferenceEvidence({ ...evidence, quote_asset_id: "RUSD" }, policy, now).ok, false);
  assert.equal(validateReferenceEvidence({ ...evidence, chain_id: "other-1" }, policy, now).ok, false);
  assert.equal(validateReferenceEvidence({ ...evidence, observed_at: "2026-10-08T11:00:00Z" }, policy, now).ok, false);
  assert.equal(validateReferenceEvidence({ ...evidence, source_type: "screener_estimate" }, policy, now).ok, false);
  assert.equal(validateReferenceEvidence({ ...evidence, spot: null }, policy, now).ok, false);
  assert.equal(validateReferenceEvidence({ ...evidence, available: false }, policy, now).ok, false);
});
