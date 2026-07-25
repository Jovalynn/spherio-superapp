"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TOP_NAV } from "./nav-config";
import { connectRioLight } from "@/lib/riolight";

const RIO_LOGO =
  "/icons/riolight-official-rio.png";

const WALLET_STORAGE_KEY = "spherio_wallet_address";
const WALLET_STORAGE_KEYS = [
  "spherio_wallet_address",
  "riolight.activeAddress",
  "spherio.riolight.address",
  "spherio.wallet.address",
] as const;
const WALLET_EVENT = "spherio:wallet-changed";
const RIOLIGHT_CONNECTED_EVENT = "spherio:riolight-connected";

function shortAddr(v?: string | null, left = 10, right = 8) {
  if (!v) return "—";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

function readStoredWalletAddress() {
  if (typeof window === "undefined") return null;

  for (const key of WALLET_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value?.startsWith("rio1")) return value;
  }

  return null;
}

function writeStoredWalletAddress(address: string | null) {
  if (typeof window === "undefined") return;

  for (const key of WALLET_STORAGE_KEYS) {
    if (address) {
      window.localStorage.setItem(key, address);
    } else {
      window.localStorage.removeItem(key);
    }
  }

  window.dispatchEvent(
    new CustomEvent(WALLET_EVENT, {
      detail: { address },
    })
  );

  window.dispatchEvent(
    new CustomEvent(RIOLIGHT_CONNECTED_EVENT, {
      detail: { address },
    })
  );
}

export function TopNav({ activeSection }: { activeSection: string }) {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectNotice, setConnectNotice] = useState<string | null>(null);

  useEffect(() => {
    function syncWallet() {
      setConnectedAddress(readStoredWalletAddress());
    }

    function onStorage(e: StorageEvent) {
      if (!e.key || WALLET_STORAGE_KEYS.includes(e.key as any)) {
        syncWallet();
      }
    }

    function onWalletChanged() {
      syncWallet();
    }

    syncWallet();

    window.addEventListener("storage", onStorage);
    window.addEventListener(WALLET_EVENT, onWalletChanged as EventListener);
    window.addEventListener(RIOLIGHT_CONNECTED_EVENT, onWalletChanged as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WALLET_EVENT, onWalletChanged as EventListener);
      window.removeEventListener(RIOLIGHT_CONNECTED_EVENT, onWalletChanged as EventListener);
    };
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setConnectNotice(null);

    const timeout = window.setTimeout(() => {
      setConnecting(false);
      setConnectNotice("RioLight connection timed out. Open the RioLight extension, unlock it, then try again.");
    }, 12000);

    try {
      const wallet = await connectRioLight();
      window.clearTimeout(timeout);
      setConnectedAddress(wallet.address);
      writeStoredWalletAddress(wallet.address);
      setConnectNotice(null);
    } catch (e: any) {
      window.clearTimeout(timeout);
      console.error("TopNav RioLight connect failed", e);
      setConnectNotice(
        e?.message ||
          "Failed to connect RioLight. Open the RioLight extension, unlock it, then try again.",
      );
    } finally {
      window.clearTimeout(timeout);
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setConnectedAddress(null);
    setConnectNotice(null);
    writeStoredWalletAddress(null);
  }

  const connected = !!connectedAddress;

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[72px] border-b border-white/10 bg-[rgba(5,7,10,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1800px] items-center gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[rgba(255,255,255,0.04)]">
            <img
              src={RIO_LOGO}
              alt="RIO Logo"
              width={44}
              height={44}
              className="h-9 w-9 object-contain"
            />
          </div>

          <div className="min-w-0">
            <div className="truncate text-xl font-semibold tracking-[0.14em] text-white">
              SPHERIOCHAIN
            </div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Sovereign Infrastructure
            </div>
          </div>

          <div className="ml-3 hidden rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 lg:inline-flex">
            DEVNET
          </div>
        </div>

        <nav className="ml-6 hidden flex-1 items-center justify-center gap-1 lg:flex">
          {TOP_NAV.map((item) => {
            const active = item.key === activeSection;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[rgba(130,18,49,0.48)] text-white"
                    : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden rounded-xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-slate-200 lg:block">
            Central Bank
          </div>
          <div className="hidden rounded-xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-slate-200 lg:block">
            EN
          </div>
          <div className="rounded-xl border border-white/10 bg-[rgba(18,52,110,0.28)] px-3 py-2 text-sm text-sky-200">
            Integrity: LIVE
          </div>

          {connected ? (
            <>
              <div
                className="flex h-11 items-center gap-2 rounded-xl border border-cyan-300/18 bg-cyan-500/[0.07] px-3 text-sm text-slate-100"
                title={connectedAddress || ""}
              >
                <img
                  src="/icons/riolight-official-rio.png"
                  alt="RioLight"
                  className="h-5 w-5 rounded-md"
                />
                <div className="leading-tight">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200/70">
                    RioLight
                  </div>
                  <div className="text-xs font-semibold text-white">
                    Connected
                  </div>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="h-11 rounded-xl border border-[#ff7a95]/20 bg-[linear-gradient(180deg,rgba(171,29,72,0.86),rgba(104,16,41,0.94))] px-3 text-sm font-semibold text-white"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="rounded-xl border border-[#ff7a95]/20 bg-[linear-gradient(180deg,rgba(171,29,72,0.90),rgba(104,16,41,0.96))] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connecting ? "Connecting..." : "Connect RioLight"}
            </button>
          )}
        </div>

        {connectNotice ? (
          <div className="absolute right-4 top-[78px] z-[60] max-w-[360px] rounded-2xl border border-cyan-300/20 bg-[#061320]/95 px-4 py-3 text-sm leading-5 text-cyan-50 shadow-2xl backdrop-blur-xl">
            <div className="font-semibold text-white">RioLight connection</div>
            <div className="mt-1 text-cyan-50/75">{connectNotice}</div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
