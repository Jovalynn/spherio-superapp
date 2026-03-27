"use client";

import React, { useState } from "react";
import { useWallet } from "@cosmos-kit/react";

type WalletModalProps = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const WALLET_CANDIDATES = [
  {
    label: "Keplr",
    ids: ["keplr-extension", "keplr", "Keplr"],
    note: "Browser extension",
  },
  {
    label: "Leap",
    ids: ["leap-extension", "leap", "Leap"],
    note: "Browser extension",
  },
  {
    label: "Cosmostation",
    ids: ["cosmostation-extension", "cosmostation", "Cosmostation"],
    note: "Browser extension",
  },
];

export default function WalletModal({ isOpen, setOpen }: WalletModalProps) {
  const wallet = useWallet();

  const status: any = (wallet as any).status;
  const address: any = (wallet as any).address;
  const username: any = (wallet as any).username;

  const connect = (wallet as any).connect as (walletName?: string) => Promise<void>;
  const disconnect = (wallet as any).disconnect as () => Promise<void>;

  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function tryWallet(ids: string[], label: string) {
    setError(null);
    setConnectingTo(label);

    for (const id of ids) {
      try {
        await connect?.(id);
        setConnectingTo(null);
        setOpen(false);
        return;
      } catch {
        // try next id
      }
    }

    setConnectingTo(null);
    setError(
      `${label} could not be opened. Confirm the extension is installed, unlocked, and allowed on this site.`
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-950/95 ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-base font-semibold text-white">Connect wallet</div>
            <div className="text-xs text-white/60">Spherio (spherio-1)</div>
          </div>
          <button
            className="rounded-lg px-3 py-1 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="text-sm text-white/70">
            Status: <span className="text-white">{String(status ?? "")}</span>
          </div>

          {address ? (
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="text-xs text-white/60">Connected</div>
              <div className="mt-1 break-all text-sm text-white">{String(address)}</div>
              {username ? (
                <div className="mt-1 text-xs text-white/60">{String(username)}</div>
              ) : null}
              <button
                className="mt-3 w-full rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                onClick={() => disconnect?.()}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {WALLET_CANDIDATES.map((w) => (
                <button
                  key={w.label}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-left text-white ring-1 ring-white/10 hover:bg-white/10"
                  onClick={() => tryWallet(w.ids, w.label)}
                  disabled={connectingTo !== null}
                >
                  <div className="text-sm font-medium">{w.label}</div>
                  <div className="text-xs text-white/60">
                    {connectingTo === w.label ? "Opening..." : w.note}
                  </div>
                </button>
              ))}

              <div className="rounded-xl bg-white/5 p-4 text-sm text-white/70 ring-1 ring-white/10">
                Install and unlock Keplr, Leap, or Cosmostation, then refresh if no popup appears.
              </div>

              {error ? (
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                  {error}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-white/50">
          By connecting, you acknowledge Spherio does not custody funds and you verify chain details in your wallet.
        </div>
      </div>
    </div>
  );
}
