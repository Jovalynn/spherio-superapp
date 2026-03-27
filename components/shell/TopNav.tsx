"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TOP_NAV } from "./nav-config";
import { getKeplrSigner } from "@/lib/cosm";

const RIO_LOGO =
  "https://avatars.githubusercontent.com/u/175851528?s=400&u=b0c1a871d1e739566c4c2bf96a97720fedfc03ab&v=4";

const WALLET_STORAGE_KEY = "spherio_wallet_address";
const WALLET_EVENT = "spherio:wallet-changed";

function shortAddr(v?: string | null, left = 10, right = 8) {
  if (!v) return "—";
  if (v.length <= left + right) return v;
  return `${v.slice(0, left)}…${v.slice(-right)}`;
}

function readStoredWalletAddress() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(WALLET_STORAGE_KEY);
}

function writeStoredWalletAddress(address: string | null) {
  if (typeof window === "undefined") return;
  if (address) {
    window.localStorage.setItem(WALLET_STORAGE_KEY, address);
  } else {
    window.localStorage.removeItem(WALLET_STORAGE_KEY);
  }
  window.dispatchEvent(
    new CustomEvent(WALLET_EVENT, {
      detail: { address },
    })
  );
}

export function TopNav({ activeSection }: { activeSection: string }) {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    function syncWallet() {
      setConnectedAddress(readStoredWalletAddress());
    }

    function onStorage(e: StorageEvent) {
      if (e.key === WALLET_STORAGE_KEY) {
        syncWallet();
      }
    }

    function onWalletChanged() {
      syncWallet();
    }

    syncWallet();

    window.addEventListener("storage", onStorage);
    window.addEventListener(WALLET_EVENT, onWalletChanged as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WALLET_EVENT, onWalletChanged as EventListener);
    };
  }, []);

  async function handleConnect() {
    try {
      setConnecting(true);
      const { address } = await getKeplrSigner();
      setConnectedAddress(address);
      writeStoredWalletAddress(address);
    } catch (e: any) {
      console.error("TopNav wallet connect failed", e);
      alert(e?.message || "Failed to connect Keplr");
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setConnectedAddress(null);
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
                className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-slate-200"
                title={connectedAddress || ""}
              >
                {shortAddr(connectedAddress, 10, 8)}
              </div>
              <button
                onClick={handleDisconnect}
                className="rounded-xl border border-[#ff7a95]/20 bg-[linear-gradient(180deg,rgba(171,29,72,0.90),rgba(104,16,41,0.96))] px-4 py-2 text-sm font-semibold text-white"
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
              {connecting ? "Connecting..." : "Connect"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
