type MarketIntelligenceProps = {
  price: number;
  liquidityUsd: number;
  flow24hUsd: number;
  trades24h: number;
  reserve0: number;
  reserve1: number;
  isCanonical: boolean;
  isLive: boolean;
  lastActivityTime?: string | null;
};

function formatMoney(value: number, max = 0) {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
  }).format(Number.isFinite(value) ? value : 0)}`;
}

function formatNumber(value: number, max = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
  }).format(Number.isFinite(value) ? value : 0);
}

function hoursSince(value?: string | null) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return null;
  return Math.max(0, (Date.now() - ts) / 3600000);
}

function classifyLiquidity(liquidityUsd: number) {
  if (liquidityUsd >= 1_000_000) return { label: "Institutional", tone: "emerald" };
  if (liquidityUsd >= 100_000) return { label: "Strong", tone: "cyan" };
  if (liquidityUsd >= 10_000) return { label: "Developing", tone: "amber" };
  return { label: "Thin", tone: "rose" };
}

function classifyActivity(trades24h: number, flow24hUsd: number, lastActivityTime?: string | null) {
  const hours = hoursSince(lastActivityTime);

  if (trades24h >= 25 || flow24hUsd >= 100_000) {
    return { label: "High Activity", tone: "emerald" };
  }
  if (trades24h >= 5 || flow24hUsd >= 10_000) {
    return { label: "Moderate Activity", tone: "cyan" };
  }
  if (hours !== null && hours > 24 * 7) {
    return { label: "Dormant", tone: "rose" };
  }
  return { label: "Light Activity", tone: "amber" };
}

function classifyFlow(flow24hUsd: number, liquidityUsd: number) {
  const ratio = liquidityUsd > 0 ? flow24hUsd / liquidityUsd : 0;

  if (ratio >= 1) return { label: "High Turnover", tone: "emerald", ratio };
  if (ratio >= 0.25) return { label: "Healthy Turnover", tone: "cyan", ratio };
  if (ratio > 0) return { label: "Low Turnover", tone: "amber", ratio };
  return { label: "No Turnover", tone: "rose", ratio };
}

function classifyReserveBalance(reserve0: number, reserve1: number, price: number) {
  const baseUsd = reserve0 * price;
  const quoteUsd = reserve1;
  const larger = Math.max(baseUsd, quoteUsd);
  const smaller = Math.min(baseUsd, quoteUsd);

  if (larger <= 0) return { label: "Unbalanced", tone: "rose", ratio: 0 };

  const ratio = smaller / larger;

  if (ratio >= 0.9) return { label: "Balanced", tone: "emerald", ratio };
  if (ratio >= 0.6) return { label: "Acceptable", tone: "cyan", ratio };
  if (ratio > 0) return { label: "Skewed", tone: "amber", ratio };
  return { label: "Unbalanced", tone: "rose", ratio };
}

function toneClasses(tone: string) {
  if (tone === "emerald") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }
  if (tone === "cyan") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-200";
  }
  if (tone === "amber") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  }
  return "border-rose-400/20 bg-rose-500/10 text-rose-200";
}

function cardClass() {
  return "rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5 backdrop-blur-xl";
}

export default function MarketIntelligence({
  price,
  liquidityUsd,
  flow24hUsd,
  trades24h,
  reserve0,
  reserve1,
  isCanonical,
  isLive,
  lastActivityTime,
}: MarketIntelligenceProps) {
  const liquidity = classifyLiquidity(liquidityUsd);
  const activity = classifyActivity(trades24h, flow24hUsd, lastActivityTime);
  const turnover = classifyFlow(flow24hUsd, liquidityUsd);
  const reserveBalance = classifyReserveBalance(reserve0, reserve1, price);

  const convictionScore = [
    isCanonical ? 30 : 0,
    isLive ? 20 : 0,
    liquidityUsd >= 100_000 ? 20 : liquidityUsd >= 10_000 ? 10 : 0,
    trades24h >= 5 ? 15 : trades24h > 0 ? 8 : 0,
    flow24hUsd > 0 ? 15 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-6 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
        Market Intelligence
      </div>

      <div className="mt-2 text-2xl font-semibold text-white">
        Qualification & Microstructure Signals
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={cardClass()}>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Liquidity Health
          </div>
          <div className="mt-2 text-xl font-semibold text-white">{liquidity.label}</div>
          <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClasses(liquidity.tone)}`}>
            {formatMoney(liquidityUsd, 0)}
          </div>
        </div>

        <div className={cardClass()}>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Activity State
          </div>
          <div className="mt-2 text-xl font-semibold text-white">{activity.label}</div>
          <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClasses(activity.tone)}`}>
            {formatNumber(trades24h, 0)} txns / 24h
          </div>
        </div>

        <div className={cardClass()}>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Flow Turnover
          </div>
          <div className="mt-2 text-xl font-semibold text-white">{turnover.label}</div>
          <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClasses(turnover.tone)}`}>
            {formatNumber(turnover.ratio * 100, 1)}%
          </div>
        </div>

        <div className={cardClass()}>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Reserve Balance
          </div>
          <div className="mt-2 text-xl font-semibold text-white">{reserveBalance.label}</div>
          <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClasses(reserveBalance.tone)}`}>
            {formatNumber(reserveBalance.ratio * 100, 1)}%
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className={cardClass()}>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Intelligence Summary
          </div>
          <div className="mt-3 space-y-2 text-sm text-white/75">
            <div>Liquidity presently reads as <span className="font-semibold text-white">{liquidity.label}</span>.</div>
            <div>Market activity currently reads as <span className="font-semibold text-white">{activity.label}</span>.</div>
            <div>24h turnover relative to liquidity reads as <span className="font-semibold text-white">{turnover.label}</span>.</div>
            <div>Reserve posture currently reads as <span className="font-semibold text-white">{reserveBalance.label}</span>.</div>
          </div>
        </div>

        <div className={cardClass()}>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Conviction Score
          </div>
          <div className="mt-2 text-3xl font-semibold text-white">{convictionScore}/100</div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(217,70,239,0.9),rgba(34,211,238,0.9))]"
              style={{ width: `${Math.max(4, convictionScore)}%` }}
            />
          </div>
          <div className="mt-3 text-sm text-white/65">
            Composite score derived from canonical state, live state, liquidity depth, trade activity, and turnover.
          </div>
        </div>
      </div>
    </div>
  );
}
