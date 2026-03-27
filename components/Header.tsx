"use client";

import React from "react";
import { useChain } from "@cosmos-kit/react";

type WalletModalProps = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

function shortAddr(v?: string | null, left = 10, right = 8) {
  if (!v) return "—";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

export default function WalletModal({ isOpen, setOpen }: WalletModalProps) {
  const {
    status,
    address,
    username,
    openView,
    disconnect,
    wallet,
  } = useChain("spherio");

  if (!isOpen) return null;

  async function handleOpenWalletSelector() {
    try {
      await openView();
    } catch (e) {
      console.error("Failed to open CosmosKit wallet view", e);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect();
    } catch (e) {
      console.error("Failed to disconnect wallet", e);
    }
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
              <div className="text-xs text-white/60">Connected wallet</div>
              <div className="mt-1 text-sm font-medium text-white">
                {wallet?.prettyName || wallet?.name || "Wallet"}
              </div>
              <div className="mt-2 break-all text-sm text-white">{String(address)}</div>
              <div className="mt-1 text-xs text-white/60">
                {username ? String(username) : shortAddr(address)}
              </div>

              <div className="mt-4 grid gap-2">
                <button
                  className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                  onClick={() => setOpen(false)}
                >
                  Continue
                </button>
                <button
                  className="w-full rounded-xl bg-[#7a1635] px-4 py-2 text-sm text-white hover:bg-[#8f1c40]"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-left text-white ring-1 ring-white/10 hover:bg-white/10"
                onClick={handleOpenWalletSelector}
              >
                <div className="text-sm font-medium">Open wallet selector</div>
                <div className="text-xs text-white/60">
                  Use CosmosKit to choose Keplr, Leap, or Cosmostation
                </div>
              </button>

              <div className="rounded-xl bg-white/5 p-4 text-sm text-white/70 ring-1 ring-white/10">
                Make sure your wallet extension is installed, unlocked, and allowed for this browser profile.
              </div>
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
