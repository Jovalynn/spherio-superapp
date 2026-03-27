"use client";

import Link from "next/link";

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function RioExplorerHome() {
  const card =
    "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]";

  const tile =
    "rounded-2xl border border-white/10 bg-black/25 p-5 transition hover:bg-white/5";

  return (
    <div className="min-h-[calc(100vh-64px)] w-full text-white relative overflow-hidden bg-[#060B16]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-[560px] w-[560px] rounded-full bg-[#FF8A32]/18 blur-[170px]" />
        <div className="absolute top-16 right-[-160px] h-[560px] w-[560px] rounded-full bg-[#22C55E]/10 blur-[180px]" />
        <div className="absolute bottom-[-220px] left-[18%] h-[720px] w-[720px] rounded-full bg-[#1F2937]/40 blur-[210px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(0,0,0,0.65))]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-10">
        <div className={clsx(card, "p-6")}>
          <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
            RioExplorer
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
            SpherioChain Explorer
          </div>
          <div className="mt-2 text-sm text-slate-200">
            Token standards, on-chain metadata, holders, and activity — indexed and verifiable.
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link href="/rioexplorer/spo20" className={tile}>
              <div className="text-sm font-bold">SPO-20 Tokens</div>
              <div className="mt-1 text-sm text-slate-200">
                Browse issued tokens, search by symbol/address, open holders & activity.
              </div>
            </Link>

            {/* ✅ NOW ACTIVE */}
            <Link href="/rioexplorer/blocks" className={tile}>
              <div className="text-sm font-bold">Blocks / Transactions</div>
              <div className="mt-1 text-sm text-slate-200">
                Live chain feed: latest blocks and recent transactions (RPC-backed).
              </div>
              <div className="mt-2 text-xs text-slate-300">
                Indexed search & advanced filters will come after C4.
              </div>
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200 leading-relaxed">
            <span className="font-semibold text-white">Security:</span> Always verify contract addresses. Names and
            symbols may be duplicated by third parties.
          </div>
        </div>
      </div>
    </div>
  );
}
