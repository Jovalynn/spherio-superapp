"use client";
import { SPHERIO_TREASURY_MULTISIG } from "@/lib/protocol/treasury";

import { useMemo, useState } from "react";
import { getKeplrSigner, getSigningClient } from "@/lib/cosm";
import { SPHERIO } from "@/lib/spherioConfig";
import { useTx } from "@/context/TxContext";

import LaunchConfirmModal, {
  ConfirmRow,
} from "@/components/advancelaunch/LaunchConfirmModal";

import {
  humanToBaseUnitsStrict,
  formatBigintCommas,
  SPO20_DECIMALS,
} from "@/lib/createtoken/units";

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export const HYBRID_POLICY = {
  chainId: SPHERIO.chainId,
  feeUrio: "1000000",
  feeRioDisplay: "1.000000",
  feeRecipient: SPHERIO_TREASURY_MULTISIG,
};

function extractInstantiatedContractAddress(res: any): string | null {
  const events = res?.events ?? [];
  for (const ev of events) {
    const attrs = ev?.attributes ?? [];
    for (const a of attrs) {
      const key = a?.key;
      if (key === "_contract_address" || key === "contract_address") {
        return a?.value ?? null;
      }
    }
  }
  return null;
}

export default function HybridLaunchPage() {
  const { openTx } = useTx();

  // Wallet / tx
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Form
  const [projectName, setProjectName] = useState("");
  const [ticker, setTicker] = useState("");
  const [supply, setSupply] = useState("");
  const [allowlistEnabled, setAllowlistEnabled] = useState(false);

  // Result
  const [createdTokenAddr, setCreatedTokenAddr] = useState<string | null>(null);

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
    projectName.trim().length >= 3 &&
    /^[A-Z0-9]{2,12}$/.test(ticker.trim().toUpperCase()) &&
    supply.trim().length > 0 &&
    supplyPreview.ok;

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

  async function broadcastHybridCreateToken(baseSupply: bigint) {
    if (!SPHERIO.factoryAddress) {
      openTx({
        status: "error",
        title: "Hybrid",
        error: "Missing NEXT_PUBLIC_SPO20_FACTORY_ADDRESS in .env.production",
      });
      return;
    }

    try {
      setCreating(true);
      setCreatedTokenAddr(null);

      openTx({ status: "pending", title: "Hybrid" });

      const { signer, address: sender } = await getKeplrSigner();
      setAddress(sender);

      const client = await getSigningClient(signer);

      const msg = {
        create_token: {
          name: projectName.trim(),
          symbol: ticker.trim().toUpperCase(),
          initial_supply: baseSupply.toString(),
          mintable: false,
        },
      };

      const funds = [{ denom: "urio", amount: HYBRID_POLICY.feeUrio }];

      const res = await client.execute(
        sender,
        SPHERIO.factoryAddress,
        msg,
        "auto",
        "Hybrid Launch",
        funds
      );

      const tokenAddr = extractInstantiatedContractAddress(res);
      if (tokenAddr) setCreatedTokenAddr(tokenAddr);

      openTx({
        status: "success",
        title: "Hybrid",
        hash: res.transactionHash,
      });
    } catch (e: any) {
      openTx({
        status: "error",
        title: "Hybrid",
        error: e?.message || "Transaction failed",
      });
    } finally {
      setCreating(false);
    }
  }

  const card =
    "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_80px_-60px_rgba(0,0,0,0.75)]";
  const label = "text-[11px] font-bold uppercase tracking-wider text-slate-200";
  const input =
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-white/25";
  const helper = "mt-2 text-xs text-slate-300/80";

  const confirmRows: ConfirmRow[] = [
    { k: "Project name", v: projectName.trim() || "—" },
    { k: "Symbol", v: ticker.trim().toUpperCase() || "—" },
    { k: "Total supply (tokens)", v: supply.trim() || "—" },
    { k: "Base units", v: supplyPreview.ok ? supplyPreview.baseFormatted : "—" },
    { k: "Fee", v: `${HYBRID_POLICY.feeRioDisplay} RIO` },
    { k: "Fee recipient", v: HYBRID_POLICY.feeRecipient, mono: true },
    { k: "Allowlist", v: allowlistEnabled ? "Enabled" : "Disabled" },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] w-full text-white relative overflow-hidden bg-[#060B16]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-[560px] w-[560px] rounded-full bg-[#FF8A32]/18 blur-[160px]" />
        <div className="absolute top-16 right-[-160px] h-[560px] w-[560px] rounded-full bg-[#D0388B]/16 blur-[170px]" />
        <div className="absolute bottom-[-220px] left-[18%] h-[720px] w-[720px] rounded-full bg-[#BA3CBB]/14 blur-[210px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),rgba(0,0,0,0.55))]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        {/* Header */}
        <div
          className={clsx(
            card,
            "p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          )}
        >
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300/90">
              AdvancedLaunch
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Hybrid Launch
            </div>
            <div className="mt-2 text-sm text-slate-200">
              Policy-gated issuance using the SPO-20 factory. Review, confirm, then sign.
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-slate-200">
                <span className="text-slate-400">Network</span>
                <span className="font-semibold">{SPHERIO.chainId}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-slate-200">
                <span className="text-slate-400">Decimals</span>
                <span className="font-semibold">{SPO20_DECIMALS}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-slate-200">
                <span className="text-slate-400">Fee</span>
                <span className="font-semibold">{HYBRID_POLICY.feeRioDisplay} RIO</span>
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
                  Supply is entered in whole tokens. Decimals are fixed by protocol.
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-slate-200">
                Hybrid
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={label}>Project name</label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Spherio Labs"
                  className={input}
                />
              </div>

              <div>
                <label className={label}>Symbol</label>
                <input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g. LABS"
                  className={input}
                />
                <div className={helper}>
                  Allowed: A–Z, 0–9 (2–12 chars). Symbols can be duplicated.
                </div>
              </div>

              <div>
                <label className={label}>Total supply (tokens)</label>
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
                <input
                  value={String(SPO20_DECIMALS)}
                  disabled
                  className={clsx(input, "text-white/70")}
                />
                <div className={helper}>Decimals are fixed by protocol.</div>
              </div>
            </div>

            {createdTokenAddr ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300/80">
                  Token created
                </div>
                <div className="mt-2 text-xs text-slate-300">Contract address</div>
                <div className="mt-1 break-all text-sm font-semibold text-white">
                  {createdTokenAddr}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-xs text-slate-200">
                Issuer fee is {HYBRID_POLICY.feeRioDisplay} RIO. Network fees apply.
              </div>

              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!canSubmit || creating}
                className={clsx(
                  "rounded-2xl border border-white/10 px-6 py-3 text-sm font-extrabold transition",
                  canSubmit && !creating
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "bg-white/10 text-white/40"
                )}
              >
                {creating ? "Preparing…" : "Review & Launch"}
              </button>
            </div>
          </div>

          {/* Participation Policy */}
          <div className={clsx(card, "lg:col-span-1 p-6")}>
            <div className="text-sm font-bold tracking-wide text-white">
              Participation Policy
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={allowlistEnabled}
                  onChange={(e) => setAllowlistEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-white"
                />
                <div>
                  <div className="text-sm font-semibold text-white">
                    Enable allowlist (optional)
                  </div>
                  <div className="mt-1 text-xs text-slate-300/80">
                    Recorded as issuer policy for now. On-chain enforcement arrives later.
                  </div>
                </div>
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs text-slate-200/90">
              {allowlistEnabled
                ? "Allowlist policy recorded. Enforcement arrives later."
                : "Open participation policy recorded. Enforcement arrives later."}
            </div>

            <div className="mt-6 text-xs text-slate-300/80">
              Fee recipient:{" "}
              <span className="font-semibold text-slate-100 break-all">
                {HYBRID_POLICY.feeRecipient}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300/70">
                Safety Notice
              </div>
              <div className="mt-2 text-xs leading-relaxed text-slate-200/80">
                Names and symbols can be duplicated. Always verify the{" "}
                <span className="font-semibold text-white">contract address</span>{" "}
                after creation.
              </div>
            </div>
          </div>
        </div>

        {/* REQUIRED confirmation gate */}
        <LaunchConfirmModal<{ baseSupply: bigint }>
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Confirm Hybrid Launch"
          subtitle={`Network: ${SPHERIO.chainId}`}
          rows={confirmRows}
          acknowledgements={[
            {
              id: "ack_fee",
              title: "I understand the issuance fee will be charged",
              desc: `Hybrid launch charges ${HYBRID_POLICY.feeRioDisplay} RIO (paid on-chain in urio) to ${HYBRID_POLICY.feeRecipient}.`,
            },
            {
              id: "ack_verify",
              title: "I will verify the contract address after launch",
              desc: "Always verify the deployed contract address before sharing links or accepting funds.",
            },
          ]}
          confirmPhraseExpected={(ticker.trim().toUpperCase() || "CONFIRM").toUpperCase()}
          confirmCta="Confirm & Broadcast"
          busyLabel="Broadcasting…"
          confirmArgs={{ baseSupply: supplyPreview.base }}
          onConfirm={async ({ baseSupply }) => {
            await broadcastHybridCreateToken(baseSupply);
            setConfirmOpen(false);
          }}
        />
      </div>
    </div>
  );
}
