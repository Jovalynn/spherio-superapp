// lib/stressQueries.ts
// Institutional rule: always call relative /api/* behind NGINX.
// Parse numeric strings into numbers.

export type StressScenario = { shock_pct: number; ratio: number };

export type StressResult = {
  height: number;
  base: { collateral_value: number; liability_value: number };
  scenarios: StressScenario[];
};

function num(v: any, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function fetchJSON(path: string) {
  const res = await fetch(path, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Stress API ${path} failed: ${res.status} ${txt}`.trim());
  }

  return res.json();
}

export async function getStress(): Promise<StressResult> {
  const j = await fetchJSON("/api/stress/simulate");
  return {
    height: num(j.height),
    base: {
      collateral_value: num(j.base?.collateral_value),
      liability_value: num(j.base?.liability_value),
    },
    scenarios: Array.isArray(j.scenarios)
      ? j.scenarios.map((s: any) => ({
          shock_pct: num(s.shock_pct),
          ratio: num(s.ratio),
        }))
      : [],
  };
}
