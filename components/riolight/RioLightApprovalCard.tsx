"use client";

import type { ReactNode } from "react";

type RioLightCardMode = "review" | "pending" | "confirmed" | "failed";

export type RioLightApprovalCardProps = {
  open: boolean;
  mode: RioLightCardMode;

  title?: string;
  subtitle?: string;

  fromAvatar: ReactNode;
  toAvatar: ReactNode;

  fromLabel: string;
  fromAmount: string;
  toLabel: string;
  toAmount: string;

  routeLabel: string;
  quoteSourceLabel: string;
  minReceivedLabel: string;
  feeSlippageLabel: string;

  treasuryRecipientLabel: string;
  auditIdentityLabel: string;

  executionStage?: string | null;
  executionMessage?: string | null;
  gateReason?: string | null;

  receiptAmountLabel?: string | null;
  receiptTokenLabel?: string | null;
  receiptExplorerHref?: string | null;
  failureMessage?: string | null;

  canApprove: boolean;
  approvalPending: boolean;
  executing: boolean;

  approveLabel?: string;
  pendingLabel?: string;

  onApprove: () => void;
  onCancel: () => void;
  onDone: () => void;
};

export function RioLightApprovalCard({
  open,
  mode,

  title,
  subtitle,

  fromAvatar,
  toAvatar,

  fromLabel,
  fromAmount,
  toLabel,
  toAmount,

  routeLabel,
  quoteSourceLabel,
  minReceivedLabel,
  feeSlippageLabel,

  treasuryRecipientLabel,
  auditIdentityLabel,

  executionStage,
  executionMessage,
  gateReason,

  receiptAmountLabel,
  receiptTokenLabel,
  receiptExplorerHref,
  failureMessage,

  canApprove,
  approvalPending,
  executing,

  approveLabel = "Approve Swap",
  pendingLabel = "Awaiting Approval",

  onApprove,
  onCancel,
  onDone,
}: RioLightApprovalCardProps) {
  if (!open) return null;

  const confirmed = mode === "confirmed";
  const failed = mode === "failed";
  const pending = mode === "pending" || approvalPending || executing;

  const heading =
    title ||
    (confirmed ? "Swap Confirmed" : failed ? "Swap Failed" : "Review Swap");

  const body =
    subtitle ||
    (confirmed
      ? "Settlement complete. Your receipt is ready."
      : failed
        ? "The approval or settlement did not complete."
        : "Review route, quote, slippage, and fee before continuing.");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl">
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(10,24,58,0.98),rgba(4,11,28,0.98))] shadow-[0_0_70px_rgba(34,211,238,0.18)]">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300/80">
            Swap Review
          </div>
          <div className="mt-2 text-2xl font-black text-white">{heading}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{body}</div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {fromAvatar}
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">From</div>
                  <div className="text-lg font-bold text-white">
                    {fromAmount} {fromLabel}
                  </div>
                </div>
              </div>

              <div className="text-slate-500">→</div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">To</div>
                  <div className="text-lg font-bold text-white">
                    {toAmount} {toLabel}
                  </div>
                </div>
                {toAvatar}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
              <div className="text-xs text-slate-500">Route</div>
              <div className="mt-1 text-sm font-semibold text-white">{routeLabel}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
              <div className="text-xs text-slate-500">Quote Source</div>
              <div className="mt-1 text-sm font-semibold text-white">{quoteSourceLabel}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
              <div className="text-xs text-slate-500">Min Received</div>
              <div className="mt-1 text-sm font-semibold text-white">{minReceivedLabel}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
              <div className="text-xs text-slate-500">Fee / Slippage</div>
              <div className="mt-1 text-sm font-semibold text-white">{feeSlippageLabel}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.04] p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-400">Treasury fee route</span>
              <span className="font-mono text-xs text-cyan-100">{treasuryRecipientLabel}</span>
            </div>
            <div className="mt-2 truncate font-mono text-[10px] uppercase tracking-[0.08em] text-cyan-100/45">
              {auditIdentityLabel}
            </div>
          </div>

          {confirmed ? (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Receipt</div>
              <div className="mt-2 text-2xl font-black text-white">
                {receiptAmountLabel ? `+${receiptAmountLabel} ${receiptTokenLabel || ""}` : "Settlement confirmed"}
              </div>
              <div className="mt-1 text-sm text-emerald-100/80">
                {receiptTokenLabel ? `${receiptTokenLabel} received` : "Received"}
              </div>
              {receiptExplorerHref ? (
                <a
                  href={receiptExplorerHref}
                  className="mt-4 inline-flex rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-300/15"
                >
                  RioExplorer proof
                </a>
              ) : null}
            </div>
          ) : null}

          {failed ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
              {failureMessage || executionMessage || "Approval or settlement failed."}
            </div>
          ) : null}

          {!confirmed && !failed && (pending || executionStage || executionMessage) ? (
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Execution status</span>
                <span className="font-semibold text-cyan-100">
                  {executionStage || "Preparing"}
                </span>
              </div>
              {executionMessage ? (
                <div className="mt-2 text-xs leading-5 text-cyan-100/70">
                  {executionMessage}
                </div>
              ) : null}
            </div>
          ) : null}

          {gateReason ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
              {gateReason}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-5 sm:flex-row">
          {confirmed ? (
            <>
              {receiptExplorerHref ? (
                <a
                  href={receiptExplorerHref}
                  className="flex-1 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-center text-sm font-semibold text-emerald-50 transition hover:bg-emerald-300/15"
                >
                  RioExplorer Proof
                </a>
              ) : null}
              <button
                type="button"
                onClick={onDone}
                className="flex-1 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#081229] transition hover:brightness-105"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (!pending) onCancel();
                }}
                disabled={pending}
                className={[
                  "flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold transition",
                  pending
                    ? "cursor-not-allowed bg-white/[0.03] text-slate-500"
                    : "bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]",
                ].join(" ")}
              >
                {failed ? "Close" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={onApprove}
                disabled={!canApprove || pending}
                className={[
                  "flex-1 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.14em] transition",
                  canApprove && !pending
                    ? "bg-cyan-400 text-[#081229] shadow-[0_14px_34px_rgba(34,211,238,0.22)] hover:brightness-105"
                    : "cursor-not-allowed bg-white/10 text-white/50",
                ].join(" ")}
              >
                {pending ? pendingLabel : failed ? "Try Again" : approveLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
