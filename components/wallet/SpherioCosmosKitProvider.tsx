"use client";

import type { ReactNode } from "react";

type SpherioCosmosKitProviderProps = {
  children: ReactNode;
};

/**
 * Runtime foundation for CosmosKit.
 *
 * Direct adapters remain authoritative today:
 * RioLight → Keplr → Leap → Cosmostation.
 *
 * This provider exists so CosmosKit can be wired safely without replacing
 * the current stable connection path until the runtime pass is verified.
 */
export function SpherioCosmosKitProvider({
  children,
}: SpherioCosmosKitProviderProps) {
  return <>{children}</>;
}
