"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildCreateTokenLiquidityHref } from "@/lib/riodex/handoff";


function shortAddr(addr?: string, left = 10, right = 6) {
  if (!addr) return "";
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export type TokenCreateSuccessProps = {
  title?: string; // "CreateToken" | "Hybrid Launch" | "Pump.live"
  contractAddress: string;
  txHash: string;
  pairAddress?: string | null;
  tokenAddress?: string | null;
  symbol?: string;
  name?: string;
  totalSupplyHuman?: string; // user input supply (human)
  logoUrl?: string;
  // Optional: link to RioDex route (you can wire later)
  rioDexHref?: string;
};

export default function TokenCreateSuccess(props: TokenCreateSuccessProps) {
  const {
    title = "CreateToken",
    contractAddress,
    txHash,
    symbol,
    name,
    totalSupplyHuman,
    logoUrl,
    pairAddress,
    tokenAddress,
    rioDexHref,
  } = props;

  const router = useRouter();

  const [copiedWhat, setCopiedWhat] = useState<"" | "contract" | "tx">("");

  const explorerHref = useMemo(() => `/spo20/${contractAddress}`, [contractAddress]);

  return (
    <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/5 backdrop-blur-xl p-6 shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-200/90">
            RioExplorer • Confirmation
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Token created successfully
          </div>
          <div className="mt-2 text-sm text-slate-200">
            {title} broadcast confirmed. Verify and share the contract address.
          </div>
        </div>

        {pairAddress ? (
  <button
    onClick={() =>
      router.push(
        buildCreateTokenLiquidityHref({
          pairAddress,
          tokenAddress,
          txHash,
        })
      )
    }
    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
  >
    Manage Liquidity
  </button>
) : null}
   
         {logoUrl?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl.trim()}
            alt="Token logo"
            className="h-14 w-14 rounded-2xl border border-white/10 bg-black/20 object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="h-14 w-14 rounded-2xl border border-white/10 bg-black/20" />
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Contract</div>
          <div className="mt-2 font-mono text-sm text-white break-all">{contractAddress}</div>
          <div className="mt-3 flex gap-2">
            <button
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
              onClick={async () => {
                const ok = await copy(contractAddress);
                setCopiedWhat(ok ? "contract" : "");
                setTimeout(() => setCopiedWhat(""), 1200);
              }}
            >
              {copiedWhat === "contract" ? "Copied" : "Copy"}
            </button>

            <Link
              href={explorerHref}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
            >
              View on RioExplorer
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Transaction</div>
          <div className="mt-2 font-mono text-sm text-white break-all">{txHash}</div>
          <div className="mt-3 flex gap-2">
            <button
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
              onClick={async () => {
                const ok = await copy(txHash);
                setCopiedWhat(ok ? "tx" : "");
                setTimeout(() => setCopiedWhat(""), 1200);
              }}
            >
              {copiedWhat === "tx" ? "Copied" : "Copy"}
            </button>

            {rioDexHref ? (
              <Link
                href={rioDexHref}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
              >
                Open in RioDex
              </Link>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/50">
                RioDex (wire next)
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-300">Name:</span>
          <span className="font-semibold text-white">{name?.trim() || "—"}</span>

          <span className="text-slate-300">Symbol:</span>
          <span className="font-semibold text-white">{symbol?.trim() || "—"}</span>

          <span className="text-slate-300">Supply:</span>
          <span className="font-semibold text-white">
            {totalSupplyHuman?.trim() ? `${totalSupplyHuman.trim()} ${symbol?.trim() || ""}` : "—"}
          </span>

          <span className="text-slate-300">Address (short):</span>
          <span className="font-mono text-white">{shortAddr(contractAddress)}</span>
        </div>
      </div>
    </div>
  );
}
