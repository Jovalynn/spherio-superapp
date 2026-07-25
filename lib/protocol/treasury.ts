export const SPHERIO_TREASURY_MULTISIG =
  "rio1nnhxsa49cc5e9vyxj6r6s3hwlkymcrletx7wch";

export const SPHERIO_TREASURY_LABEL = "Spherio Treasury Multisig";

export const SPHERIO_FEE_POLICY = {
  treasuryRecipient: SPHERIO_TREASURY_MULTISIG,
  feeRecipient: SPHERIO_TREASURY_MULTISIG,
  label: SPHERIO_TREASURY_LABEL,
  policy: "treasury_multisig",
  source: "spherio_protocol_fee_policy",
} as const;

export function resolveTreasuryRecipient(candidate?: string | null) {
  const value = String(candidate || "").trim();
  return value || SPHERIO_TREASURY_MULTISIG;
}
