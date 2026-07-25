"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type TradeSide = "buy" | "sell";

type PumpTradePanelProps = {
  tokenAddress: string;
  symbol: string;
};

function formatNumber(value: unknown, decimals = 6) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";

  return n.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
}

export default function PumpTradePanel({
  tokenAddress,
  symbol,
}: PumpTradePanelProps) {
  const router = useRouter();
  const [side, setSide] = useState<TradeSide>("buy");
  const [amount, setAmount] = useState("0.5");
  const [traderAddress, setTraderAddress] = useState(
    "rio1testbuyer000000000000000000000000000000000",
  );
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const amountLabel = side === "buy" ? "RIO amount" : `${symbol} amount`;

  const disabled = useMemo(() => {
    const n = Number(amount);
    return !tokenAddress || !Number.isFinite(n) || n <= 0 || isPending;
  }, [amount, tokenAddress, isPending]);

  async function executeTrade() {
    setError(null);
    setResult(null);

    const n = Number(amount);

    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/pump/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            side,
            amount: n,
            tokenAddress,
            traderAddress,
            executionMode: "backend-test",
            previewOnly: false,
            slippageBps: 100,
            maxPriceImpactBps: 2500,
          }),
        });

        const json = await response.json();

        if (!response.ok || !json?.ok) {
          throw new Error(json?.error || "Pump trade failed.");
        }

        setResult(json);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Pump trade failed.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-500/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-fuchsia-100/60">
            Pump Trade
          </div>
          <div className="mt-1 text-xs leading-5 text-white/45">
            Backend-test execution through the authoritative curve engine.
          </div>
        </div>

        <div className="rounded-full border border-fuchsia-300/20 bg-black/20 px-3 py-1 text-xs font-semibold text-fuchsia-100">
          {symbol}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-amber-100/60">
          Execution Mode
        </div>
        <div className="mt-1 text-sm font-semibold text-amber-100">
          Backend-test mode active
        </div>
        <p className="mt-1 text-xs leading-5 text-amber-100/65">
          Trades are executed through the local authoritative curve engine and indexed into pump_live_trades. Wallet-signed RioLight execution is pending.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={
            side === "buy"
              ? "rounded-xl border border-emerald-300/40 bg-emerald-400/15 px-3 py-2 text-sm font-semibold text-emerald-100"
              : "rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold text-white/55"
          }
        >
          Buy
        </button>

        <button
          type="button"
          onClick={() => setSide("sell")}
          className={
            side === "sell"
              ? "rounded-xl border border-rose-300/40 bg-rose-400/15 px-3 py-2 text-sm font-semibold text-rose-100"
              : "rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold text-white/55"
          }
        >
          Sell
        </button>
      </div>

      <label className="mt-4 block">
        <div className="text-xs uppercase tracking-[0.16em] text-white/35">
          {amountLabel}
        </div>
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
        />
      </label>

      <label className="mt-3 block">
        <div className="text-xs uppercase tracking-[0.16em] text-white/35">
          Trader address
        </div>
        <input
          value={traderAddress}
          onChange={(event) => setTraderAddress(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs font-mono text-white outline-none transition focus:border-cyan-300/40"
        />
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={executeTrade}
        className={
          disabled
            ? "mt-4 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/35"
            : side === "buy"
              ? "mt-4 w-full rounded-xl border border-emerald-300/30 bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/20"
              : "mt-4 w-full rounded-xl border border-rose-300/30 bg-rose-400/15 px-4 py-3 text-sm font-semibold text-rose-100 hover:bg-rose-400/20"
        }
      >
        {isPending
          ? "Executing..."
          : side === "buy"
            ? `Buy ${symbol}`
            : `Sell ${symbol}`}
      </button>

      {error ? (
        <div className="mt-3 rounded-xl border border-rose-300/25 bg-rose-500/10 px-3 py-2 text-xs font-semibold leading-5 text-rose-100">
          {error}
        </div>
      ) : null}

      {result?.execution ? (
        <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-3 text-xs leading-5 text-emerald-100">
          <div className="font-semibold">
            {result.execution.status?.toUpperCase()} · {result.execution.side}
          </div>
          <div className="mt-1 text-emerald-100/75">
            Tx: {result.execution.txHash}
          </div>
          <div className="mt-1 text-emerald-100/75">
            In: {formatNumber(result.execution.amountIn)}{" "}
            {result.execution.amountInDenom}
          </div>
          <div className="text-emerald-100/75">
            Out: {formatNumber(result.execution.amountOut, 2)}{" "}
            {result.execution.amountOutDenom}
          </div>
          <div className="text-emerald-100/75">
            Progress: {formatNumber(result.execution.progressPercent, 4)}%
          </div>
        </div>
      ) : null}
    </div>
  );
}
