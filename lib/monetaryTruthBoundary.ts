export interface MonetaryTruthPolicy {
  chainId: string;
  maxAgeSeconds: number;
}

export interface RusdTruthPolicy extends MonetaryTruthPolicy {
  contractAddress: string;
}

function positiveInteger(value: string | undefined): number | null {
  if (!value || !/^[1-9][0-9]*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function getRusdTruthPolicy(
  env: NodeJS.ProcessEnv = process.env,
): RusdTruthPolicy | null {
  if (env.RUSD_CANONICAL_IDENTITY_VERIFIED !== "true") return null;
  const contractAddress = env.RUSD_CANONICAL_CONTRACT?.trim().toLowerCase();
  const chainId = env.RUSD_CANONICAL_CHAIN_ID?.trim();
  const maxAgeSeconds = positiveInteger(env.RUSD_SUPPLY_MAX_AGE_SECONDS);
  if (!contractAddress || !chainId || !maxAgeSeconds) return null;
  return { contractAddress, chainId, maxAgeSeconds };
}

export function getRioStatePolicy(
  env: NodeJS.ProcessEnv = process.env,
): MonetaryTruthPolicy | null {
  if (env.SPHERIO_CHAIN_ID_VERIFIED !== "true") return null;
  const chainId = env.SPHERIO_CANONICAL_CHAIN_ID?.trim();
  const maxAgeSeconds = positiveInteger(env.SPHERIO_STATE_MAX_AGE_SECONDS);
  return chainId && maxAgeSeconds ? { chainId, maxAgeSeconds } : null;
}

export interface ReferencePolicy extends MonetaryTruthPolicy {
  quoteAssetIds: ReadonlySet<string>;
}

export function getReferencePolicy(
  env: NodeJS.ProcessEnv = process.env,
): ReferencePolicy | null {
  if (env.SPHERIO_CHAIN_ID_VERIFIED !== "true" || env.RIO_MARKET_DATA_POLICY_VERIFIED !== "true") return null;
  const chainId = env.SPHERIO_CANONICAL_CHAIN_ID?.trim();
  const maxAgeSeconds = positiveInteger(env.RIO_REFERENCE_MAX_AGE_SECONDS);
  const quoteAssetIds = new Set(
    (env.RIO_CANONICAL_USD_ASSET_IDS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  if (!chainId || !maxAgeSeconds || quoteAssetIds.size === 0) return null;
  return { chainId, maxAgeSeconds, quoteAssetIds };
}

function isFresh(value: unknown, maxAgeSeconds: number, now: Date): boolean {
  if (typeof value !== "string") return false;
  const observedAt = Date.parse(value);
  const ageMs = now.getTime() - observedAt;
  return Number.isFinite(observedAt) && ageMs >= 0 && ageMs <= maxAgeSeconds * 1000;
}

export type Validation = { ok: true } | { ok: false; reason: string };

export function validateRusdAttestation(
  value: any,
  policy: RusdTruthPolicy | null,
  now: Date = new Date(),
): Validation {
  if (!policy) return { ok: false, reason: "CANONICAL_RUSD_IDENTITY_OR_FRESHNESS_POLICY_UNCONFIGURED" };
  if (!value || value.available !== true || value.authoritative_monetary_truth !== true) {
    return { ok: false, reason: "CANONICAL_RUSD_ATTESTATION_UNAVAILABLE" };
  }
  if (String(value.chain_id ?? "").trim() !== policy.chainId) {
    return { ok: false, reason: "RUSD_CHAIN_ID_MISMATCH" };
  }
  if (String(value.contract_address ?? "").trim().toLowerCase() !== policy.contractAddress) {
    return { ok: false, reason: "RUSD_CONTRACT_IDENTITY_MISMATCH" };
  }
  if (value.source_type !== "cosmwasm_token_info.total_supply") {
    return { ok: false, reason: "RUSD_SUPPLY_SOURCE_UNVERIFIED" };
  }
  if (!/^[1-9][0-9]*$/.test(String(value.height ?? ""))) {
    return { ok: false, reason: "RUSD_OBSERVATION_HEIGHT_INVALID" };
  }
  if (!isFresh(value.time, policy.maxAgeSeconds, now)) {
    return { ok: false, reason: "RUSD_SUPPLY_OBSERVATION_STALE_OR_INVALID" };
  }
  if (!String(value.supply_snapshot_id ?? "").trim()) {
    return { ok: false, reason: "RUSD_SUPPLY_SNAPSHOT_ID_MISSING" };
  }
  if (!/^[0-9]+$/.test(String(value.total_supply_leri ?? ""))) {
    return { ok: false, reason: "RUSD_SUPPLY_AMOUNT_INVALID" };
  }
  return { ok: true };
}

export function isSupplyMatchedReserveEvidence(
  reserve: any,
  supplySnapshotId: string,
): boolean {
  return Boolean(
    reserve?.available === true &&
    typeof supplySnapshotId === "string" && supplySnapshotId.trim() &&
    reserve.supply_snapshot_id === supplySnapshotId &&
    /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(String(reserve.eligible_reserve_value ?? "")),
  );
}

export function validateRioState(
  value: any,
  policy: MonetaryTruthPolicy | null,
  now: Date = new Date(),
): Validation {
  if (!policy) return { ok: false, reason: "CANONICAL_CHAIN_STATE_POLICY_UNCONFIGURED" };
  if (!value || value.available !== true || value.authoritative_monetary_truth !== true) {
    return { ok: false, reason: "CANONICAL_RIO_STATE_UNAVAILABLE" };
  }
  if (String(value.chain_id ?? "").trim() !== policy.chainId) {
    return { ok: false, reason: "RIO_CHAIN_ID_MISMATCH" };
  }
  if (value.authority !== "observed_chain_state" || value.source !== "chain_bank_supply_snapshot") {
    return { ok: false, reason: "RIO_STATE_SOURCE_UNVERIFIED" };
  }
  if (!/^[1-9][0-9]*$/.test(String(value.height ?? "")) || !/^[0-9]+$/.test(String(value.total_supply_urio ?? ""))) {
    return { ok: false, reason: "RIO_CHAIN_OBSERVATION_INVALID" };
  }
  if (!isFresh(value.observed_at, policy.maxAgeSeconds, now)) {
    return { ok: false, reason: "RIO_CHAIN_OBSERVATION_STALE_OR_INVALID" };
  }
  if ("dead_locked" in value || "forever_locked" in value || "dead_locked_urio" in value || "forever_locked_urio" in value) {
    return { ok: false, reason: "OBSOLETE_FOREVER_LOCK_CLASSIFICATION_REJECTED" };
  }
  return { ok: true };
}

export function validateReferenceEvidence(
  value: any,
  policy: ReferencePolicy | null,
  now: Date = new Date(),
): Validation {
  if (!policy) return { ok: false, reason: "CANONICAL_MARKET_POLICY_UNCONFIGURED" };
  if (!value || value.available !== true || value.authoritative_market_data !== true) {
    return { ok: false, reason: "CANONICAL_MARKET_OBSERVATION_UNAVAILABLE" };
  }
  if (String(value.chain_id ?? "").trim() !== policy.chainId) {
    return { ok: false, reason: "MARKET_CHAIN_ID_MISMATCH" };
  }
  if (value.source_type !== "chain_pool_observation" || !String(value.pool_address ?? "").trim()) {
    return { ok: false, reason: "MARKET_OBSERVATION_SOURCE_UNVERIFIED" };
  }
  if (!policy.quoteAssetIds.has(String(value.quote_asset_id ?? "").trim().toLowerCase())) {
    return { ok: false, reason: "MARKET_QUOTE_ASSET_IDENTITY_UNVERIFIED" };
  }
  if (!/^[1-9][0-9]*$/.test(String(value.height ?? "")) || !isFresh(value.observed_at, policy.maxAgeSeconds, now)) {
    return { ok: false, reason: "MARKET_OBSERVATION_STALE_OR_INVALID" };
  }
  if (typeof value.spot !== "number" || !Number.isFinite(value.spot) || value.spot <= 0) {
    return { ok: false, reason: "MARKET_PRICE_INVALID" };
  }
  return { ok: true };
}
