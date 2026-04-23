import { getKeplrSigner } from "@/lib/cosm";

export async function connectRioWallet() {
  return getKeplrSigner();
}
