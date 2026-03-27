// lib/rusdQueries.ts
// Institutional rule:
// - Always call relative /api/* behind NGINX.
// - Parse numeric strings from Postgres (NUMERIC) into JS numbers.

export type RusdSupply = { total_supply: number };

export type RusdBacking = {
  height: number;
  collateral_value: number;
  liability_value: number;
  overcollateral_ratio: number;
  reserve_coverage: number;

  // optional extended fields (your indexer returns these)
  supply?: number;
  backing_value?: number;
  ratio?: number;
  buffer?: number;
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
    throw new Error(`RUSD API ${path} failed: ${res.status} ${txt}`.trim());
  }

  return res.json();
}

export async function getRUSDSupply(): Promise<RusdSupply> {
  const j = await fetchJSON("/api/rusd/supply");
  return { total_supply: num(j.total_supply) };
}

export async function getRUSDBacking(): Promise<RusdBacking> {
  const j = await fetchJSON("/api/rusd/backing");
  return {
    height: num(j.height),
    collateral_value: num(j.collateral_value),
    liability_value: num(j.liability_value),
    overcollateral_ratio: num(j.overcollateral_ratio),
    reserve_coverage: num(j.reserve_coverage),

    supply: num(j.supply),
    backing_value: num(j.backing_value),
    ratio: num(j.ratio),
    buffer: num(j.buffer),
  };
}
