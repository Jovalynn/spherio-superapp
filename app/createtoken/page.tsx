"use client";

// app/createtoken/page.tsx
import { useMemo, useState } from "react";
import { getKeplrSigner, getSigningClient } from "@/lib/cosm";
import { SPHERIO } from "@/lib/spherioConfig";
import { useTx } from "@/context/TxContext";
import TokenCreateSuccess from "@/components/spo20/TokenCreateSuccess";

import CreateTokenConfirmModal, {
  CREATE_TOKEN_POLICY,
} from "@/components/createtoken/CreateTokenConfirmModal";

import {
  humanToBaseUnitsStrict,
  formatBigintCommas,
  SPO20_DECIMALS,
} from "@/lib/createtoken/units";

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function extractContractAddressFromExecute(res: any): string | null {
  // CosmJS execute result usually has `logs` or `events`
  const logs = res?.logs;
  if (Array.isArray(logs)) {
    for (const log of logs) {
      const events = log?.events;
      if (!Array.isArray(events)) continue;
      for (const ev of events) {
        const attrs = ev?.attributes;
        if (!Array.isArray(attrs)) continue;
        for (const a of attrs) {
          const key = String(a?.key ?? "");
          const value = String(a?.value ?? "");
          if (key === "_contract_address" || key === "contract_address") {
            if (value.startsWith("rio1")) return value;
          }
        }
      }
    }
  }

  const events = res?.events;
  if (Array.isArray(events)) {
    for (const ev of events) {
      const attrs = ev?.attributes;
      if (!Array.isArray(attrs)) continue;
      for (const a of attrs) {
        const key = String(a?.key ?? "");
        const value = String(a?.value ?? "");
        if (key === "_contract_address" || key === "contract_address") {
          if (value.startsWith("rio1")) return value;
        }
      }
    }
  }

  return null;
}

export default function CreateTokenPage() {
  const { openTx } = useTx();

  // Wallet / tx
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [supply, setSupply] = useState(""); // human tokens (e.g. 1000000)
  const [logoUrl, setLogoUrl] = useState("");
  const [projectStatement, setProjectStatement] = useState("");
  const [showOptional, setShowOptional] = useState(true);
  const [success, setSuccess] = useState<{
  contractAddress: string;
  txHash: string;
} | null>(null); 

  const confirmDraft = useMemo(
    () => ({
      name,
      symbol: ticker,
      totalSupplyHuman: supply,
    }),
    [name, ticker, supply]
  );

  const supplyPreview = useMemo(() => {
    try {
      const base = humanToBaseUnitsStrict(supply, SPO20_DECIMALS);
      return {
        ok: true as const,
        base,
        baseFormatted: formatBigintCommas(base),
      };
    } catch (e: any) {
      return {
        ok: false as const,
        err: e?.message ?? "Invalid supply",
        base: BigInt(0),
        baseFormatted: "—",
      };
    }
  }, [supply]);

  const canSubmit =
    name.trim().length >= 3 &&
    /^[A-Z0-9]{2,12}$/.test(ticker.trim()) &&
    supply.trim().length > 0 &&
    supplyPreview.ok;

  const feeText = useMemo(() => {
    return `Creation fee is ${CREATE_TOKEN_POLICY.feeRioDisplay} RIO. Network fees apply.`;
  }, []);

{success ? (
  <TokenCreateSuccess
    title="CreateToken"
    contractAddress={success.contractAddress}
    txHash={success.txHash}
    name={name}
    symbol={ticker}
    totalSupplyHuman={supply}
    logoUrl={logoUrl}
    // rioDexHref can be wired later once RioDex route is defined
  />
) : null} 


 async function connectWallet() {
    try {
      setConnecting(true);
      const { address } = await getKeplrSigner();
      setAddress(address);
    } catch (e: any) {
      openTx({
        status: "error",
        title: "Wallet",
        error: e?.message || "Failed to connect wallet",
      });
    } finally {
      setConnecting(false);

  }
 }

  async function broadcastCreateToken(baseSupply: bigint) {
    if (!SPHERIO.factoryAddress) {
      openTx({
        status: "error",
        title: "CreateToken",
        error: "Missing NEXT_PUBLIC_SPO20_FACTORY_ADDRESS in .env.production",
      });
      return;
    }

    try {
      setCreating(true);
      openTx({ status: "pending", title: "CreateToken" });

      const { signer, address: sender } = await getKeplrSigner();
      setAddress(sender);

      const client = await getSigningClient(signer);

      // SPO-20 v15 factory message:
      // - decimals fixed at 6 (do not send decimals)
      // - mintable must exist and false
      const msg = {
        create_token: {
          name: name.trim(),
          symbol: ticker.trim(),
          initial_supply: baseSupply.toString(),
          mintable: false,
        },
      };

      // Send fee in urio, display in UI as RIO
      const funds = [{ denom: "urio", amount: CREATE_TOKEN_POLICY.feeUrio }];

      const res = await client.execute(
        sender,
        SPHERIO.factoryAddress,
        msg,
        "auto",
        "SPO-20 CreateToken",
        funds
      );
      const contract = extractContractAddressFromExecute(res);
      if (contract) {
      setSuccess({ contractAddress: contract, txHash: res.transactionHash });
}
      openTx({
        status: "success",
        title: "CreateToken",
        hash: res.transactionHash,
      });
    } catch (e: any) {
      openTx({
        status: "error",
        title: "CreateToken",
        error: e?.message || "Transaction failed",
      });
    } finally {
      setCreating(false);
    }
  }

  // Reusable styles
  const card =
    "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]";
  const label = "text-[11px] font-bold uppercase tracking-wider text-slate-200";
  const input =
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#FF8A32]/40 focus:ring-2 focus:ring-[#D0388B]/20";
  const helper = "mt-2 text-xs text-slate-300/80";

  return (
    <div className="min-h-[calc(100vh-64px)] w-full text-white relative overflow-hidden bg-[#060B16]">
      {/* Dark-but-bright glowing background (no white wash) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-[560px] w-[560px] rounded-full bg-[#FF8A32]/25 blur-[160px]" />
        <div className="absolute top-16 right-[-160px] h-[560px] w-[560px] rounded-full bg-[#D0388B]/25 blur-[170px]" />
        <div className="absolute bottom-[-220px] left-[18%] h-[720px] w-[720px] rounded-full bg-[#BA3CBB]/18 blur-[210px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),rgba(0,0,0,0.55))]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-10">
        {/* Header */}
        <div className={clsx(card, "p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between")}>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
              CreateToken
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Create Token
            </div>
            <div className="mt-2 text-sm text-slate-200">
              Instant SPO-20 issuance with RioDEX readiness. Review policy, confirm, then sign.
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-slate-200">
                <span className="text-slate-400">Network</span>
                <span className="font-semibold">{CREATE_TOKEN_POLICY.chainId}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-slate-200">
                <span className="text-slate-400">Decimals</span>
                <span className="font-semibold">{SPO20_DECIMALS}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-slate-200">
                <span className="text-slate-400">Admin</span>
                <span className="font-semibold">None</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <div className="text-xs text-slate-400">Wallet</div>
              <div className="text-sm text-slate-200">
                {address ? (
                  <span className="font-semibold">
                    {address.slice(0, 10)}…{address.slice(-6)}
                  </span>
                ) : (
                  <span className="text-slate-400">Not connected</span>
                )}
              </div>
            </div>

            <button
              onClick={connectWallet}
              disabled={connecting}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 active:bg-white/10 disabled:opacity-60"
            >
              {address ? "Connected" : connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className={clsx(card, "lg:col-span-2 p-6")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold tracking-wide text-white">
                  Issuance Parameters
                </div>
                <div className="mt-1 text-xs text-slate-300/90">
                  Enter supply in whole tokens. Decimals are fixed by protocol.
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-slate-200">
                SPO-20
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={label}>Token Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spherio Gold"
                  className={input}
                />
              </div>

              <div>
                <label className={label}>Symbol</label>
                <input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g. SGLD"
                  className={input}
                />
                <div className={helper}>
                  Allowed: A–Z, 0–9 (2–12 chars). Symbols can be duplicated by third parties.
                </div>
              </div>

              <div>
                <label className={label}>Total Supply (tokens)</label>
                <input
                  inputMode="numeric"
                  value={supply}
                  onChange={(e) => setSupply(e.target.value)}
                  placeholder="e.g. 1000000"
                  className={input}
                />
                {!supplyPreview.ok && supply.trim() ? (
                  <div className="mt-2 text-xs text-red-300">{supplyPreview.err}</div>
                ) : null}
                {supplyPreview.ok && supply.trim() ? (
                  <div className={helper}>
                    Base units:{" "}
                    <span className="font-semibold text-white">
                      {supplyPreview.baseFormatted}
                    </span>
                  </div>
                ) : null}
              </div>

              <div>
                <label className={label}>Decimals (fixed)</label>
                <input value={String(SPO20_DECIMALS)} disabled className={clsx(input, "text-white/70")} />
                <div className={helper}>Decimals are fixed at {SPO20_DECIMALS} (SPO-20 v15).</div>
              </div>
            </div>

            {/* Optional details */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <button
                type="button"
                onClick={() => setShowOptional((v) => !v)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
              >
                <span>Optional details</span>
                <span className="text-xs text-slate-300">{showOptional ? "Hide" : "Show"}</span>
              </button>

              {showOptional ? (
                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div>
                    <label className={label}>Token Mark (logo URL)</label>
                    <input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://… (unverified)"
                      className={input}
                    />
                    <div className={helper}>
                      Display-only. Unverified until RioExplorer is live. Always verify the contract address.
                    </div>
                  </div>

                  <div>
                    <label className={label}>Project Statement (optional)</label>
                    <textarea
                      value={projectStatement}
                      onChange={(e) => setProjectStatement(e.target.value)}
                      placeholder="What is this token for? (optional)"
                      className={clsx(input, "min-h-[120px]")}
                    />
                    <div className={helper}>
                      Issuer-provided information. Spherio does not verify or endorse project statements.
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-xs text-slate-200">{feeText}</div>

              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!canSubmit || creating}
                className={clsx(
                  "relative overflow-hidden rounded-2xl px-6 py-3 text-sm font-extrabold tracking-wide transition",
                  canSubmit && !creating
                    ? "text-white shadow-[0_18px_70px_-40px_rgba(0,0,0,0.85)]"
                    : "bg-white/10 text-white/40"
                )}
              >
                {canSubmit && !creating ? (
                  <span className="pointer-events-none absolute inset-0 opacity-90 bg-[linear-gradient(90deg,rgba(255,138,50,0.50),rgba(208,56,139,0.45),rgba(186,60,187,0.45))]" />
                ) : null}
                <span className="relative">{creating ? "Preparing…" : "Review & Create"}</span>
              </button>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Protocol policy */}
            <div className={clsx(card, "p-6")}>
              <div className="text-sm font-bold tracking-wide text-white">Protocol Policy</div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-300">Creation Fee</dt>
                  <dd className="font-extrabold text-white">
                    {CREATE_TOKEN_POLICY.feeRioDisplay} RIO
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-300">Recipient</dt>
                  <dd className="text-right text-xs break-all text-slate-200">
                    {CREATE_TOKEN_POLICY.feeRecipient}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-300">Decimals</dt>
                  <dd className="font-semibold text-white">{SPO20_DECIMALS}</dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-300">Contract Admin</dt>
                  <dd className="font-semibold text-white">None</dd>
                </div>
              </dl>

              {/* Preview */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-300">
                  Preview
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-300">Token Mark</span>
                    <div className="flex items-center gap-2">
                      {logoUrl.trim() ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoUrl.trim()}
                          alt="Token mark (unverified)"
                          className="h-9 w-9 rounded-2xl border border-white/10 bg-black/20 object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-2xl border border-white/10 bg-black/20" />
                      )}
                      <span className="text-xs text-slate-300">
                        {logoUrl.trim() ? "Unverified" : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-300">Name</span>
                    <span className="text-right text-white">{name.trim() || "—"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-300">Symbol</span>
                    <span className="text-right text-white">{ticker.trim() || "—"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-300">Total Supply</span>
                    <span className="text-right text-white">
                      {supply.trim() ? `${supply.trim()} ${ticker.trim() || ""}` : "—"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-300">Base Units</span>
                    <span className="text-right text-white">
                      {supplyPreview.ok ? supplyPreview.baseFormatted : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Notice (anti-fraud / protect you) */}
            <div className="rounded-3xl border border-[#FF8A32]/30 bg-gradient-to-br from-[#FF8A32]/12 to-[#D0388B]/12 backdrop-blur-xl p-6 shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]">
              <div className="text-sm font-bold tracking-wide text-white">Safety Notice</div>
              <div className="mt-2 text-sm text-slate-200 leading-relaxed">
                Token names, symbols, logos, and project statements are issuer-provided and may be duplicated or used
                for impersonation. Always verify and share the{" "}
                <span className="font-extrabold text-white">contract address</span> after creation.
              </div>
              <div className="mt-3 text-xs text-slate-200/90">
                The confirmation step requires symbol re-entry and an immutability acknowledgement.
              </div>
            </div>
          </div>
        </div>

        {/* REQUIRED CONFIRMATION MODAL */}
        <CreateTokenConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          draft={confirmDraft}
          onConfirm={async ({ baseSupply }) => {
            await broadcastCreateToken(baseSupply);
            setConfirmOpen(false);
          }}
        />
      </div>
    </div>
  );
}
