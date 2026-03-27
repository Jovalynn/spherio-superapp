import { getRIOState } from "@/lib/rioQueries";
import { getRUSDBacking, getRUSDSupply } from "@/lib/rusdQueries";
import { getStress } from "@/lib/stressQueries";
import OverviewClient from "@/components/OverviewClient";
import PageShell from "@/components/PageShell";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Convert stress scenarios into a 0–100 index.
 * Institutional rule: deterministic, monotonic, explainable.
 *
 * Here: take the worst scenario ratio and map:
 * - ratio >= 1.00 -> risk 0
 * - ratio <= 0.00 -> risk 100
 * linear in between.
 */
function stressToRiskIndex(stress: { scenarios?: { ratio: number }[] } | null): number {
  const scenarios = stress?.scenarios ?? [];
  if (!scenarios.length) return 0;

  const worst = Math.min(...scenarios.map((s) => Number(s.ratio ?? 0)));
  const r = clamp(worst, 0, 1); // keep in [0..1]
  const risk = (1 - r) * 100; // 1 -> 0 risk, 0 -> 100 risk
  return Math.round(risk);
}

export default async function OverviewPage() {
  // hard fail is bad UX; sovereign rule: degrade gracefully
  let rio: any = null;
  let supply: any = null;
  let backing: any = null;
  let stress: any = null;

  try {
    rio = await getRIOState();
  } catch {}
  try {
    supply = await getRUSDSupply();
  } catch {}
  try {
    backing = await getRUSDBacking();
  } catch {}
  try {
    stress = await getStress();
  } catch {}

  // RIO circulating share (avoid NaN)
  const total = Number(rio?.total_supply ?? 0);
  const circulating = Number(rio?.circulating ?? 0);
  const locked = Math.max(0, total - circulating);

  const riskIndex = stressToRiskIndex(stress);

  return (
    <PageShell>
      <div className="space-y-10">
        <OverviewClient circulating={circulating} locked={locked} risk={riskIndex} />
      </div>
    </PageShell>
  );
}
