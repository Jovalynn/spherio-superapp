"use client";

import { useMemo, useState } from "react";

export type ConfirmRow = {
  k: string;
  v: string;
  mono?: boolean;
};

export default function LaunchConfirmModal<TArgs extends Record<string, any> = {}>({
  open,
  onClose,
  title,
  subtitle,
  rows,
  acknowledgements,
  confirmPhraseExpected,
  confirmCta,
  busyLabel,
  confirmArgs,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  rows: ConfirmRow[];
  acknowledgements: { id: string; title: string; desc: string }[];
  confirmPhraseExpected: string;
  confirmCta: string;
  busyLabel?: string;
  confirmArgs?: TArgs;
  onConfirm: (args: TArgs) => Promise<void>;
}) {
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const allAcksChecked = useMemo(() => {
    if (!acknowledgements?.length) return true;
    return acknowledgements.every((a) => !!acks[a.id]);
  }, [acknowledgements, acks]);

  const phraseOk =
    confirmText.trim().toUpperCase() === confirmPhraseExpected.trim().toUpperCase();

  const canProceed = allAcksChecked && phraseOk && !busy;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[6px]" />

      {/* Click outside to close */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      {/* Modal card (glass) */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] shadow-[0_30px_120px_-60px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
        {/* Neon wash */}
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(800px_circle_at_20%_10%,rgba(255,138,50,0.18),transparent_55%),radial-gradient(700px_circle_at_90%_0%,rgba(208,56,59,0.16),transparent_55%),radial-gradient(700px_circle_at_80%_85%,rgba(186,60,187,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-25 [background:linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%,rgba(255,255,255,0.05))]" />

        <div className="relative p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">
                Confirmation
              </div>
              <div className="mt-2 text-xl font-semibold text-white">{title}</div>
              {subtitle ? (
                <div className="mt-1 text-sm text-slate-200/80">{subtitle}</div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white hover:bg-black/35"
            >
              Close
            </button>
          </div>

          {/* Summary */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-4 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="grid grid-cols-1 gap-3 text-sm">
              {rows.map((r) => (
                <Row key={r.k} k={r.k} v={r.v} mono={r.mono} />
              ))}
            </div>
          </div>

          {/* Acknowledgements */}
          <div className="mt-5 space-y-3">
            {acknowledgements.map((a) => (
              <label
                key={a.id}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <input
                  type="checkbox"
                  checked={!!acks[a.id]}
                  onChange={(e) => setAcks((p) => ({ ...p, [a.id]: e.target.checked }))}
                  className="mt-1 h-4 w-4 accent-white"
                />
                <div>
                  <div className="text-sm font-semibold text-white">{a.title}</div>
                  <div className="mt-1 text-xs text-slate-300/80">{a.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Confirm phrase */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold text-white">Type to confirm</div>
            <div className="mt-1 text-xs text-slate-300/80">
              Type{" "}
              <span className="font-semibold text-white">
                {confirmPhraseExpected || "CONFIRM"}
              </span>{" "}
              to proceed.
            </div>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmPhraseExpected ? `Type ${confirmPhraseExpected}` : "Type CONFIRM"}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/25"
            />
          </div>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <button
            disabled={!canProceed}
            onClick={async () => {
              setErr(null);
              if (!canProceed) return;

              try {
                setBusy(true);
                await onConfirm((confirmArgs ?? ({} as TArgs)) as TArgs);
              } catch (e: any) {
                setErr(e?.message || "Action failed");
              } finally {
                setBusy(false);
              }
            }}
            className={[
              "mt-4 relative w-full overflow-hidden rounded-2xl px-5 py-3 text-sm font-semibold transition",
              canProceed
                ? "bg-white/10 text-white hover:bg-white/15 shadow-[0_20px_60px_-30px_rgba(255,138,50,0.55)]"
                : "bg-white/10 text-white/40",
            ].join(" ")}
          >
            {canProceed ? (
              <span className="pointer-events-none absolute inset-0 opacity-70 [background:linear-gradient(90deg,rgba(255,138,50,0.22),rgba(208,56,59,0.18),rgba(186,60,187,0.22))]" />
            ) : null}
            <span className="relative">{busy ? busyLabel || "Working…" : confirmCta}</span>
          </button>

          <div className="mt-3 text-center text-[11px] text-slate-300/70">
            Always verify the contract address after execution.
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
          mono ? "text-right text-xs break-all text-slate-100" : "text-right text-slate-100"
        }
      >
        {v}
      </div>
    </div>
  );
}
