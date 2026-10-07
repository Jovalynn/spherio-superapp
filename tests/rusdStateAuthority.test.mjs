import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("app/api/rusd/state/route.ts", "utf8");
const page = readFileSync("app/rusd/page.tsx", "utf8");

test("RUSD SuperApp state consumes canonical attestation only", () => {
  assert.match(route, /\/api\/rusd\/attestation/);
  assert.match(route, /authoritative_monetary_truth !== true/);
  assert.match(route, /isExactInteger\(attestation\.total_supply_leri\)/);
  assert.match(route, /formatLeri\(attestation\.total_supply_leri\)/);
  assert.doesNotMatch(route, /total_supply_rusd\?/);
  assert.match(route, /reserve\.supply_snapshot_id === attestation\.supply_snapshot_id/);
  assert.match(route, /return unavailable\(503\)/);
  assert.doesNotMatch(route, /6_000_000|20_000_000|7_200_000|fallback_attestation/);
});

test("RUSD SuperApp does not infer a bootstrap phase without reserve evidence", () => {
  assert.match(page, /Reserve posture unverified/);
  assert.match(page, /No current reserve phase is inferred/);
  assert.doesNotMatch(page, /code: "phase_1"/);
});
