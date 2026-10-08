import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("app/api/rusd/state/route.ts", "utf8");
const rioRoute = readFileSync("app/api/rio/state/route.ts", "utf8");
const referenceRoute = readFileSync("app/api/rio/reference-price/route.ts", "utf8");
const page = readFileSync("app/rusd/page.tsx", "utf8");

test("RUSD SuperApp state consumes canonical attestation only", () => {
  assert.match(route, /\/api\/rusd\/attestation/);
  assert.match(route, /getRusdTruthPolicy/);
  assert.match(route, /validateRusdAttestation/);
  assert.match(route, /isSupplyMatchedReserveEvidence/);
  assert.match(route, /formatLeri\(attestation\.total_supply_leri\)/);
  assert.match(route, /available: false/);
  assert.match(route, /authoritative_monetary_truth: false/);
  assert.doesNotMatch(route, /6_000_000|20_000_000|7_200_000|120\.00%/);
  assert.match(route, /return unavailable\(/);
});

test("RIO state rejects legacy monetary snapshots and forwards only verified chain evidence", () => {
  assert.match(rioRoute, /validateRioState/);
  assert.match(rioRoute, /getRioStatePolicy/);
  assert.match(rioRoute, /return unavailable/);
  assert.doesNotMatch(rioRoute, /dead_locked|forever_locked|300_000_000|161_000_000/);
});

test("RIO reference price has no reserve-derived fallback", () => {
  assert.match(referenceRoute, /validateReferenceEvidence/);
  assert.match(referenceRoute, /getReferencePolicy/);
  assert.match(referenceRoute, /available: false/);
  assert.doesNotMatch(referenceRoute, /tryBuildReferenceFromScreener|quoteReserve! \* 2|0\.1/);
});

test("RUSD SuperApp does not infer a bootstrap phase without reserve evidence", () => {
  assert.match(page, /Reserve posture unverified/);
  assert.match(page, /No current reserve phase is inferred/);
  assert.doesNotMatch(page, /code: "phase_1"/);
});
