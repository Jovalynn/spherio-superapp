const TX_HASH = /^[A-Fa-f0-9]{64}$/;

/**
 * A lifecycle label from an application table is not settlement evidence.
 * Graduation is trusted only when a server-verified proof binds the canonical
 * chain, token, pair, block, transaction, and positive reserve snapshot.
 */
export function hasCanonicalPumpLiquidityProof(proof, expected = {}) {
  if (!proof || proof.verified !== true) return false;
  if (typeof proof.chainId !== "string" || !proof.chainId.trim()) return false;
  if (typeof proof.tokenAddress !== "string" || !proof.tokenAddress.trim()) return false;
  if (typeof proof.pairAddress !== "string" || !proof.pairAddress.trim()) return false;
  if (expected.tokenAddress && proof.tokenAddress.toLowerCase() !== String(expected.tokenAddress).toLowerCase()) return false;
  if (expected.pairAddress && proof.pairAddress.toLowerCase() !== String(expected.pairAddress).toLowerCase()) return false;
  if (!Number.isSafeInteger(proof.height) || proof.height <= 0) return false;
  if (typeof proof.txHash !== "string" || !TX_HASH.test(proof.txHash)) return false;
  if (typeof proof.blockHash !== "string" || !TX_HASH.test(proof.blockHash)) return false;
  if (!Number.isSafeInteger(proof.observedAtMs) || proof.observedAtMs <= 0) return false;
  if (!Number.isSafeInteger(expected.nowMs) || !Number.isSafeInteger(expected.maxAgeMs) || expected.maxAgeMs <= 0) return false;
  const age = expected.nowMs - proof.observedAtMs;
  if (age < 0 || age > expected.maxAgeMs) return false;
  if (proof.reserve0BaseUnits == null || proof.reserve1BaseUnits == null) return false;
  if (!/^\d+$/.test(String(proof.reserve0BaseUnits)) || !/^\d+$/.test(String(proof.reserve1BaseUnits))) return false;
  if (BigInt(proof.reserve0BaseUnits) <= 0n || BigInt(proof.reserve1BaseUnits) <= 0n) return false;
  if (proof.lpLocked !== true) return false;
  if (!Number.isSafeInteger(proof.lpLockUntilMs) || proof.lpLockUntilMs < expected.nowMs + 365 * 24 * 60 * 60 * 1000) return false;
  return true;
}

export function mapPumpDiscoveryStage(row, proof = null, expected = {}) {
  const verified = hasCanonicalPumpLiquidityProof(proof, {
    ...expected,
    tokenAddress: expected.tokenAddress ?? row?.token_address,
    pairAddress: expected.pairAddress ?? row?.riodex_pair_address ?? row?.pair_address,
  });
  const tokenStatus = String(row?.token_status || "").toLowerCase();
  const graduationStatus = String(row?.graduation_status || "").toLowerCase();
  if (verified && (tokenStatus === "graduated" || graduationStatus === "completed")) return "graduated";
  if (tokenStatus === "graduating" || graduationStatus === "pair_created" || graduationStatus === "completed" || tokenStatus === "graduated") return "ready";
  if (Number(row?.real_rio_reserve_urio) > 0) return "watch";
  return "momentum";
}

export function hasPumpBoardSettlementProof(row) {
  return Boolean(
    row?.graduationProofVerified === true &&
    row?.liquidityProofVerified === true &&
    typeof row?.pairAddress === "string" && row.pairAddress.trim()
  );
}

export function mapPumpLifecycleDataStage(row, proof = null, expected = {}) {
  const verified = hasCanonicalPumpLiquidityProof(proof, {
    ...expected,
    tokenAddress: expected.tokenAddress ?? row?.token_address,
    pairAddress: expected.pairAddress ?? row?.riodex_pair_address ?? row?.pair_address,
  });
  const tokenStatus = String(row?.token_status || "").toLowerCase();
  const graduationStatus = String(row?.graduation_status || "").toLowerCase();
  const hasLiquidity = Number(row?.reserve_0) > 0 || Number(row?.reserve_1) > 0;
  if (verified && (tokenStatus === "graduated" || graduationStatus === "completed")) {
    return hasLiquidity ? "market_live" : "graduated_liquidity_seeded";
  }
  if (verified && graduationStatus === "pair_created") return "graduated_liquidity_seeded";
  if (["graduating", "graduated"].includes(tokenStatus) || ["pair_created", "completed"].includes(graduationStatus)) return "graduation_pending";
  return row ? "bonding_curve_live" : "draft";
}

export function isPumpLiquiditySeeded(row, proof = null, expected = {}) {
  return hasCanonicalPumpLiquidityProof(proof, {
    ...expected,
    tokenAddress: expected.tokenAddress ?? row?.token_address,
    pairAddress: expected.pairAddress ?? row?.riodex_pair_address ?? row?.pair_address,
  });
}
