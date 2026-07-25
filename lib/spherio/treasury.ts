export {
  SPHERIO_TREASURY_MULTISIG,
  SPHERIO_TREASURY_LABEL,
  SPHERIO_FEE_POLICY,
  resolveTreasuryRecipient,
} from "@/lib/protocol/treasury";

export function isSpherioTreasuryAddress(value?: string | null) {
  return String(value || "").trim() === SPHERIO_TREASURY_MULTISIG;
}

import { SPHERIO_TREASURY_MULTISIG } from "@/lib/protocol/treasury";
