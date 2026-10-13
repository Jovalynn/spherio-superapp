import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  hasCanonicalPumpLiquidityProof,
  hasPumpBoardSettlementProof,
  mapPumpDiscoveryStage,
  mapPumpLifecycleDataStage,
  isPumpLiquiditySeeded,
} from "../lib/pump/discovery-authority.mjs";

const nowMs = 1_800_000_000_000;
const proof = {
  verified: true,
  chainId: "spherio-1",
  tokenAddress: "rio1token",
  pairAddress: "rio1pair",
  height: 100,
  txHash: "a".repeat(64),
  blockHash: "b".repeat(64),
  observedAtMs: nowMs - 1_000,
  reserve0BaseUnits: "2000000000000",
  reserve1BaseUnits: "15000000000",
  lpLocked: true,
  lpLockUntilMs: nowMs + 365 * 24 * 60 * 60 * 1000,
};
const expected = { tokenAddress: "rio1token", pairAddress: "rio1pair", nowMs, maxAgeMs: 60_000 };

test("database graduation labels and pair rows cannot claim graduation without canonical proof", () => {
  for (const row of [
    { token_status: "graduated", graduation_status: "completed", pair_address: "rio1pair" },
    { token_status: "graduating", graduation_status: "pair_created", pair_address: "rio1pair" },
  ]) {
    assert.notEqual(mapPumpDiscoveryStage(row, null, expected), "graduated");
  }
  assert.equal(hasPumpBoardSettlementProof({
    stage: "graduated", graduationStatus: "completed", liquidityStatus: "live", pairAddress: "rio1pair",
  }), false);
  const lifecycleRow = { token_address: "rio1token", token_status: "graduated", graduation_status: "completed", pair_address: "rio1pair", reserve_0: "1", reserve_1: "2" };
  assert.equal(mapPumpLifecycleDataStage(lifecycleRow, null), "graduation_pending");
  assert.equal(isPumpLiquiditySeeded(lifecycleRow, null), false);
});

test("canonical fresh chain settlement proof is accepted only when identity, reserve and LP-lock evidence bind", () => {
  assert.equal(hasCanonicalPumpLiquidityProof(proof, expected), true);
  assert.equal(mapPumpDiscoveryStage({ token_status: "graduated" }, proof, expected), "graduated");
  assert.equal(hasPumpBoardSettlementProof({
    graduationProofVerified: true, liquidityProofVerified: true, pairAddress: "rio1pair",
  }), true);
  const lifecycleRow = { token_address: "rio1token", token_status: "graduated", graduation_status: "completed", pair_address: "rio1pair", reserve_0: "1", reserve_1: "2" };
  assert.equal(mapPumpLifecycleDataStage(lifecycleRow, proof, expected), "market_live");
  assert.equal(isPumpLiquiditySeeded(lifecycleRow, proof, expected), true);
});

test("missing, stale, future, mismatched, incomplete and malformed proof fails closed", () => {
  const invalid = [
    null,
    { ...proof, observedAtMs: nowMs - 60_001 },
    { ...proof, observedAtMs: nowMs + 1 },
    { ...proof, tokenAddress: "rio1other" },
    { ...proof, pairAddress: "rio1other" },
    { ...proof, txHash: "not-a-hash" },
    { ...proof, height: Number.MAX_SAFE_INTEGER + 1 },
    { ...proof, reserve0BaseUnits: "0" },
    { ...proof, reserve1BaseUnits: "1.5" },
    { ...proof, lpLocked: false },
    { ...proof, lpLockUntilMs: nowMs + 364 * 24 * 60 * 60 * 1000 },
    { ...proof, verified: false },
  ];
  for (const candidate of invalid) assert.equal(hasCanonicalPumpLiquidityProof(candidate, expected), false);
  assert.notEqual(mapPumpDiscoveryStage({ token_status: "graduated" }, null, expected), "graduated");
});

test("API and lifecycle consumers do not promote database status into canonical proof", async () => {
  const [discovery, lifecycle] = await Promise.all([
    readFile(new URL("../app/api/pump/discover/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/pump/pump-lifecycle-data.ts", import.meta.url), "utf8"),
  ]);
  assert.match(discovery, /return mapPumpDiscoveryStage\(row, null\)/);
  assert.match(discovery, /graduationProofVerified: false/);
  assert.match(discovery, /liquidityProofVerified: false/);
  assert.match(discovery, /pairAddress: stage === "graduated" \? pairAddress : null/);
  assert.match(discovery, /trade: stage === "graduated" && pairAddress/);
  assert.match(lifecycle, /return mapPumpLifecycleDataStage\(row, null\)/);
  assert.match(lifecycle, /isPumpLiquiditySeeded\(row, null\)/);
});
