export const SPHERIO_TREASURY_MULTISIG =
  process.env.NEXT_PUBLIC_SPHERIO_TREASURY_MULTISIG ||
  "rio1nnhxsa49cc5e9vyxj6r6s3hwlkymcrletx7wch";

export function hasSpherioTreasuryMultisig(): boolean {
  return SPHERIO_TREASURY_MULTISIG.trim().startsWith("rio1");
}
