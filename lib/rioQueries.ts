// lib/rioQueries.ts
// Institutional rule: always call relative /api behind NGINX.
// - Works in dev, Docker, and mainnet domains.
// - No localhost. No forwarded-header logic. No ambiguity.

async function fetchJSON<T>(path: string): Promise<T> {
  const p = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(p, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`RIO API ${p} failed: ${res.status} ${txt}`.trim());
  }

  return (await res.json()) as T;
}

// Types (align with indexer responses)
export type RioState = {
  total_supply: number;
  circulating: number;
  bonded: number;
  forever_lock?: number;
  treasury?: number;
  staking_ratio?: number;
  dead_locked?: number;
};

// Primary calls
export async function getRIOState() {
  return fetchJSON<RioState>("/api/rio/state");
}

export async function getRIOBreakdown() {
  return fetchJSON<any>("/api/rio/breakdown");
}

export async function getRIOHistory() {
  return fetchJSON<any[]>("/api/rio/history");
}
