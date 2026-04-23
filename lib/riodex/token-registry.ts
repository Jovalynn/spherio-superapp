export type RioDexTokenRegistryRow = {
  id: string | number;
  asset_id: string;
  symbol: string;
  name: string;
  decimals: number;
  logo_url: string | null;
  logo_svg: string | null;
  origin_type: "native" | "canonical" | "spo20" | "bridged" | "reference";
  origin_chain: string | null;
  bridge_provider: string | null;
  external_symbol: string | null;
  external_address: string | null;
  spherio_contract_address: string | null;
  spherio_denom: string | null;
  is_verified: boolean;
  is_tradeable: boolean;
  is_canonical: boolean;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type TokenRegistryListResponse = {
  ok?: boolean;
  count?: number;
  items?: RioDexTokenRegistryRow[];
  error?: string;
};

type TokenRegistryItemResponse = {
  ok?: boolean;
  item?: RioDexTokenRegistryRow | null;
  error?: string;
};

const APP_BASE =
  process.env.NEXT_PUBLIC_SUPERAPP_URL ||
  process.env.SUPERAPP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://127.0.0.1:3000";

function apiUrl(path: string) {
  if (typeof window !== "undefined") return path;
  return `${APP_BASE}${path}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    cache: "no-store",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const raw = await res.text();
  let json: any = null;

  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Token registry route returned non-JSON (${res.status})`);
  }

  if (!res.ok || (json && json.ok === false)) {
    throw new Error(json?.error || `Token registry request failed (${res.status})`);
  }

  return json as T;
}

export async function getRioDexTokenRegistry(): Promise<RioDexTokenRegistryRow[]> {
  const data = await fetchJson<TokenRegistryListResponse>("/api/riodex/token-registry");
  return data?.items || [];
}

export async function getRioDexTokenRegistryItem(
  assetId: string
): Promise<RioDexTokenRegistryRow | null> {
  const id = String(assetId || "").trim();
  if (!id) return null;

  const data = await fetchJson<TokenRegistryItemResponse>(
    `/api/riodex/token-registry/${encodeURIComponent(id)}`
  );

  return data?.item || null;
}

export async function getRioDexTokenRegistryBatch(
  assetIds: Array<string | null | undefined>
): Promise<RioDexTokenRegistryRow[]> {
  const ids = [...new Set(assetIds.map((v) => String(v || "").trim()).filter(Boolean))];
  if (!ids.length) return [];

  const qs = new URLSearchParams({
    asset_ids: ids.join(","),
  });

  const data = await fetchJson<TokenRegistryListResponse>(
    `/api/riodex/token-registry-batch?${qs.toString()}`
  );

  return data?.items || [];
}

export function buildTokenRegistryMap(items: RioDexTokenRegistryRow[]) {
  const map = new Map<string, RioDexTokenRegistryRow>();

  for (const item of items || []) {
    const keys = [
      item.asset_id,
      item.spherio_contract_address,
      item.spherio_denom,
      item.external_address,
    ]
      .map((v) => String(v || "").trim())
      .filter(Boolean);

    for (const key of keys) {
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
  }

  return map;
}

export function getRegistryDisplaySymbol(
  registryMap: Map<string, RioDexTokenRegistryRow>,
  assetId?: string | null,
  fallback = "—"
) {
  const key = String(assetId || "").trim();
  if (!key) return fallback;

  return registryMap.get(key)?.symbol || fallback;
}

export function getRegistryLogoUrl(
  registryMap: Map<string, RioDexTokenRegistryRow>,
  assetId?: string | null
) {
  const key = String(assetId || "").trim();
  if (!key) return null;

  return registryMap.get(key)?.logo_url || null;
}

export function getRegistryLogoSvg(
  registryMap: Map<string, RioDexTokenRegistryRow>,
  assetId?: string | null
) {
  const key = String(assetId || "").trim();
  if (!key) return null;

  return registryMap.get(key)?.logo_svg || null;
}

export function getRegistryPairLabel(
  registryMap: Map<string, RioDexTokenRegistryRow>,
  asset0Id?: string | null,
  asset1Id?: string | null
) {
  const left = getRegistryDisplaySymbol(registryMap, asset0Id, "—");
  const right = getRegistryDisplaySymbol(registryMap, asset1Id, "—");
  return `${left} / ${right}`;
}
