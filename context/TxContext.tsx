"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type TxStatus = "idle" | "pending" | "success" | "error";

export type TxState = {
  status: TxStatus;
  title?: string;
  hash?: string;
  error?: string;
};

type TxContextValue = {
  tx: TxState;
  openTx: (next: TxState) => void;
  closeTx: () => void;
};

const TxContext = createContext<TxContextValue | null>(null);

export function TxProvider({ children }: { children: React.ReactNode }) {
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const value = useMemo(
    () => ({
      tx,
      openTx: (next: TxState) => setTx(next),
      closeTx: () => setTx({ status: "idle" }),
    }),
    [tx]
  );

  return <TxContext.Provider value={value}>{children}</TxContext.Provider>;
}

export function useTx() {
  const ctx = useContext(TxContext);
  if (!ctx) throw new Error("TxProvider missing in app/layout.tsx");
  return ctx;
}
