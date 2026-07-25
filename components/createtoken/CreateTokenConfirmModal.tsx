"use client";
import { SPHERIO_TREASURY_MULTISIG } from "@/lib/protocol/treasury";

import { useMemo, useState } from "react";
import {
  humanToBaseUnitsStrict,
  formatBigintCommas,
  SPO20_DECIMALS,
} from "@/lib/createtoken/units";

export const CREATE_TOKEN_POLICY = {
  chainId: "spherio-1",
  feeUrio: "1000000",
  feeRioDisplay: "1.000000",
  feeRecipient: SPHERIO_TREASURY_MULTISIG,
};

export type CreateTokenDraft = {
  name: string;
  symbol: string;
  totalSupplyHuman: string; // tokens (human)
};

export default function CreateTokenConfirmModal({
  open,
  onClose,
  draft,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  draft: CreateTokenDraft;
  onConfirm: (args: { baseSupply: bigint }) => Promise<void>;
}) {
  const [ackImmutable, setAckImmutable] = useState(false);
  const [confirmSymbol, setConfirmSymbol] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parsed = useMemo(() => {
    try {
      const base = humanToBaseUnitsStrict(draft.totalSupplyHuman, SPO20_DECIMALS);
      return { ok: true as const, base, baseFormatted: formatBigintCommas(base) };
    } catch (e: any) {
      return {
        ok: false as const,
        err: e?.message ?? "Invalid supply",
        base: BigInt(0),
        baseFormatted: "—",
      };
    }
  }, [draft.totalSupplyHuman]);

  const symbolTrim = draft.symbol.trim().toUpperCase();
  const canProceed =
    parsed.ok &&
    ackImmutable &&
    confirmSymbol.trim().toUpperCase() === symbolTrim &&
    draft.name.trim().length >= 3 &&
    /^[A-Z0-9]{2,12}$/.test(symbolTrim);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 z-0 bg-black/70 backdrop-blur-[6px]" />

      {/* Click outside to close (must be UNDER the card) */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 z-10 cursor-default"
      />

      {/* Modal card (meme-glass) */}
      <div className="relative z-20 w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] shadow-[0_30px_120px_-60px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
        {/* Neon wash */}
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(800px_circle_at_20%_10%,rgba(255,138,50,0.18),transparent_55%),radial-gradient(700px_circle_at_90%_0%,rgba(208,56,59,0.16),transparent_55%),radial-gradient(700px_circle_at_80%_85%,rgba(186,60,187,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-25 [background:linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%,rgba(255,255,255,0.05))]" />

        {/* KEY FIX: make card a bounded column with scrollable body + sticky footer */}
        <div className="relative flex max-h-[85vh] flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">
                Confirmation
              </div>
              <div className="mt-2 text-xl font-semibold text-white">
                Confirm Token Creation
              </div>
              <div className="mt-1 text-sm text-slate-200/80">
                Network:{" "}
                <span className="font-semibold text-slate-100">
                  {CREATE_TOKEN_POLICY.chainId}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white hover:bg-black/35"
            >
              Close
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <Row k="Token Name" v={draft.name.trim() || "—"} />
                <Row k="Symbol" v={symbolTrim || "—"} />
                <Row k="Total Supply (tokens)" v={draft.totalSupplyHuman.trim() || "—"} />
                <Row k="Base units" v={parsed.ok ? parsed.baseFormatted : "—"} />
                <Row k="Fee" v={`${CREATE_TOKEN_POLICY.feeRioDisplay} RIO`} />
                <Row k="Recipient" v={CREATE_TOKEN_POLICY.feeRecipient} mono />
                <Row k="Immutable" v="Token contract admin is empty (non-migratable)" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {!parsed.ok ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  Supply error: {parsed.err}
                </div>
              ) : null}

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <input
                  type="checkbox"
                  checked={ackImmutable}
                  onChange={(e) => setAckImmutable(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-white"
                />
                <div>
                  <div className="text-sm font-semibold text-white">
                    I understand this token is immutable
                  </div>
                  <div className="mt-1 text-xs text-slate-300/80">
                    Contract admin is empty. This token cannot be migrated or upgraded.
                  </div>
                </div>
              </label>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold text-white">
                  Re-enter symbol to confirm
                </div>
                <div className="mt-1 text-xs text-slate-300/80">
                  Type{" "}
                  <span className="font-semibold text-white">
                    {symbolTrim || "—"}
                  </span>{" "}
                  to proceed.
                </div>
                <input
                  value={confirmSymbol}
                  onChange={(e) => setConfirmSymbol(e.target.value.toUpperCase())}
                  placeholder={symbolTrim ? `Type ${symbolTrim}` : "Type symbol"}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/25"
                />
              </div>

              {/* Anti-fraud layer */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300/70">
                  Safety Notice
                </div>
                <div className="mt-2 text-xs leading-relaxed text-slate-200/80">
                  Token names, symbols, logos, and project statements may be unverified and can be duplicated by third parties.
                  Always verify the{" "}
                  <span className="font-semibold text-white">contract address</span>{" "}
                  after creation before sharing links or accepting funds.
                </div>
              </div>

              {err ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {err}
                </div>
              ) : null}
            </div>
          </div>

          {/* Sticky footer (CTA always visible) */}
          <div className="border-t border-white/10 p-6">
            <button
              disabled={!canProceed || busy}
              onClick={async () => {
                setErr(null);
                if (!canProceed) return;

                try {
                  setBusy(true);
                  await onConfirm({ baseSupply: parsed.base });
                } catch (e: any) {
                  setErr(e?.message || "Failed to broadcast transaction");
                } finally {
                  setBusy(false);
                }
              }}
              className={[
                "relative w-full overflow-hidden rounded-2xl px-5 py-3 text-sm font-semibold transition",
                canProceed && !busy
                  ? "bg-white/10 text-white hover:bg-white/15 shadow-[0_20px_60px_-30px_rgba(255,138,50,0.55)]"
                  : "bg-white/10 text-white/40",
              ].join(" ")}
            >
              {canProceed && !busy ? (
                <span className="pointer-events-none absolute inset-0 opacity-70 [background:linear-gradient(90deg,rgba(255,138,50,0.22),rgba(208,56,59,0.18),rgba(186,60,187,0.22))]" />
              ) : null}
              <span className="relative">{busy ? "Broadcasting…" : "Confirm & Broadcast"}</span>
            </button>

            <div className="mt-3 text-center text-[11px] text-slate-300/70">
              Fee shown in RIO for clarity. On-chain payment is in{" "}
              <span className="font-semibold">urio</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-slate-300/70">{k}</div>
      <div
        className={
          mono
            ? "text-right text-xs break-all text-slate-100"
            : "text-right text-slate-100"
        }
      >
        {v}
      </div>
    </div>
  );
}
