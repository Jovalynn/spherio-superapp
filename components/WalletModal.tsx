"use client";

import React, { useState } from "react";
import { useWallet } from "@cosmos-kit/react";
import { RioLightWalletValueMini } from "@/components/riolight/RioLightWalletValueMini";

type WalletModalProps = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const WALLET_CANDIDATES = [
  {
    label: "Keplr",
    ids: ["keplr-extension", "keplr", "Keplr"],
    note: "Proven desktop Cosmos adapter",
  },
  {
    label: "Leap",
    ids: ["leap-extension", "leap", "Leap"],
    note: "Cosmos adapter available",
  },
  {
    label: "Cosmostation",
    ids: ["cosmostation-extension", "cosmostation", "Cosmostation"],
    note: "Cosmos adapter available",
  },
];

const FUTURE_ROUTE_LAYERS = ["IBC", "Axelar", "Hyperlane", "WalletConnect", "EVM"];

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
        // Try the next CosmosKit wallet id.
      }
    }

    setConnectingTo(null);
    setError(
      `${label} could not be opened. Confirm the extension is installed, unlocked, and allowed on this site.`
    );
  }

  function openRioLightAccess() {
    window.location.href = "/riolight";
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-neutral-950/95 ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-lg font-semibold text-white">Connect RioLight</div>
            <div className="mt-1 text-xs uppercase tracking-[0.22em] text-white/45">
              Spherio wallet access · spherio-1
            </div>
          </div>
          <button
            className="rounded-xl px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                  Primary wallet
                </div>
                <div className="mt-2 text-xl font-semibold text-white">
                  RioLight
                </div>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/68">
                  Native Spherio wallet layer for RIO, RUSD, SPO-20 assets,
                  Pump.live, Prime, RioDex approvals, and future signing flows.
                </p>
              </div>

              <span className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                Recommended
              </span>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300"
              onClick={openRioLightAccess}
            >
              Open RioLight Access
            </button>

            <p className="mt-3 text-xs leading-5 text-white/50">
              RioLight wallet actions happen inside the extension. This app
              displays connected portfolio state and execution surfaces.
            </p>
          </div>

          <div className="text-sm text-white/70">
            Status: <span className="text-white">{String(status ?? "")}</span>
          </div>

          {address ? (
            <div className="space-y-4">
              <RioLightWalletValueMini address={String(address)} compact />

              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                  Connected external adapter
                </div>
                <div className="mt-2 break-all text-sm font-semibold text-white">
                  {String(address)}
                </div>
                {username ? (
                  <div className="mt-1 text-xs text-white/60">{String(username)}</div>
                ) : null}
                <button
                  className="mt-3 w-full rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                  onClick={() => disconnect?.()}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                  External Cosmos wallets
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {WALLET_CANDIDATES.map((w) => (
                    <button
                      key={w.label}
                      className="rounded-2xl bg-white/5 px-4 py-4 text-left text-white ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-60"
                      onClick={() => tryWallet(w.ids, w.label)}
                      disabled={connectingTo !== null}
                    >
                      <div className="text-sm font-bold">{w.label}</div>
                      <div className="mt-1 text-xs leading-5 text-white/55">
                        {connectingTo === w.label ? "Opening..." : w.note}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                  Future route layers
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FUTURE_ROUTE_LAYERS.map((layer) => (
                    <span
                      key={layer}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/62"
                    >
                      {layer}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-white/50">
                  These are interoperability and route layers, not replacements
                  for RioLight. They will surface progressively as bridge,
                  IBC, and EVM access matures.
                </p>
              </div>

              <div className="rounded-2xl bg-amber-500/10 p-4 text-sm leading-6 text-amber-100/80 ring-1 ring-amber-300/20">
                RIO visibility in third-party wallets depends on SpherioChain
                registry metadata, mobile wallet support, and market-data
                integrations. Keplr desktop may show RIO before mobile wallets do.
              </div>

              {error ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                  {error}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-6 py-4 text-xs leading-5 text-white/50">
          By connecting, you acknowledge Spherio does not custody funds. Verify
          chain details, asset symbols, and transaction prompts inside your wallet.
        </div>
      </div>
    </div>
  );
}
