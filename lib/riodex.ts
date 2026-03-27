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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

function withQuery(
  path: string,
  params?: Record<string, string | number | undefined | null>
) {
  const usp = new URLSearchParams();

  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === "") continue;
    usp.set(key, String(value));
  }

  const qs = usp.toString();
  return qs ? `${path}?${qs}` : path;
}

export type RioDexPair = {
  pair_address: string;
  factory_address?: string | null;
  lp_token_address?: string | null;
  pair_key?: string | null;
  asset_0_type?: string | null;
  asset_0_id?: string | null;
  asset_1_type?: string | null;
  asset_1_id?: string | null;
  display_symbol?: string | null;
  fee_bps?: number | null;
  created_height?: string | number | null;
  created_time?: string | null;
  is_canonical?: boolean | null;
  is_live?: boolean | null;
  last_synced_height?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RioDexLiquiditySnapshot = {
  pair_address?: string;
  reserve_0: string;
  reserve_1: string;
  total_share: string;
  block_height: string | number;
  block_time: string;
  tx_hash?: string;
  event_type?: string;
};

export type RioDexSwap = {
  tx_hash: string;
  pair_address: string;
  sender?: string | null;
  recipient?: string | null;
  offer_asset_id: string;
  ask_asset_id: string;
  offer_amount: string;
  return_amount: string;
  commission_amount: string;
  spread_amount: string;
  effective_price?: string | null;
  block_height: string | number;
  block_time: string;
};

export type RioDexCandle = {
  bucket_start: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume0: string;
  volume1: string;
  trades: number;
};

export type RioDexPairDetail = {
  pair: RioDexPair | null;
  last_swap: RioDexSwap | null;
  last_liquidity: RioDexLiquiditySnapshot | null;
  volume_24h?: {
    volume_offer?: string;
    volume_return?: string;
    trades?: number;
  } | null;
};

export type RioDexTicker = {
  pair_address: string;
  market_symbol: string;
  last_price: string;
  price_change_24h?: string;
  price_change_pct_24h?: string;
  volume_base_24h?: string;
  volume_quote_24h?: string;
  trades_24h?: number;
  liquidity_quote?: string;
  updated_at?: string;
};

export type RioDexSummary = {
  total_pairs?: number;
  total_swaps_24h?: number;
  total_liquidity_quote?: string;
  total_volume_24h?: string;
  latest_indexed_height?: number;
  [key: string]: unknown;
};

export type RioExMarket = {
  marketSymbol?: string;
  pairAddress?: string;
  baseAssetId?: string;
  quoteAssetId?: string;
  lastPrice?: string;
  volume24h?: string;
  liquidity?: string;
  [key: string]: unknown;
};

export type RusdAttestation = {
  report_date?: string | null;
  attestation_period?: string | null;
  rusd_supply?: string | number | null;
  reserve_value_usd?: string | number | null;
  collateral_ratio?: string | number | null;
  auditor?: string | null;
  opinion?: string | null;
  statement_url?: string | null;
  signature_url?: string | null;
  published_at?: string | null;
  [key: string]: unknown;
};

export async function getRioDexPairs(): Promise<{ ok?: boolean; pairs?: RioDexPair[] } | any> {
  return fetchJson(withQuery("/api/v1/riodex/pairs"));
}

export async function getRioDexPair(
  pairAddress: string
): Promise<{ ok?: boolean } & RioDexPairDetail> {
  return fetchJson(`/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}`);
}

export async function getRioDexPairSwaps(
  pairAddress: string,
  limit = 50,
  offset = 0
): Promise<{ ok?: boolean; swaps?: RioDexSwap[] } | any> {
  return fetchJson(
    withQuery(`/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/swaps`, {
      limit,
      offset,
    })
  );
}

export async function getRioDexPairLiquidity(
  pairAddress: string,
  limit = 100
): Promise<{ ok?: boolean; liquidity?: RioDexLiquiditySnapshot[] } | any> {
  return fetchJson(
    withQuery(`/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/liquidity`, {
      limit,
    })
  );
}

export async function getRioDexCandles(
  pairAddress: string,
  resolution = "1m",
  from?: string,
  to?: string
): Promise<{ ok?: boolean; candles?: RioDexCandle[] } | any> {
  return fetchJson(
    withQuery(`/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/candles`, {
      resolution,
      from,
      to,
    })
  );
}

export async function getRioDexTickers(): Promise<{ ok?: boolean; tickers?: RioDexTicker[] } | any> {
  return fetchJson("/api/v1/riodex/tickers");
}

export async function getRioDexSummary(): Promise<{ ok?: boolean; summary?: RioDexSummary } | any> {
  return fetchJson("/api/v1/riodex/summary");
}

export async function getRioDexQuote(
  pairAddress: string,
  offerAssetId: string,
  offerAmount: string
): Promise<any> {
  return fetchJson(
    withQuery(`/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/quote`, {
      offer_asset_id: offerAssetId,
      offer_amount: offerAmount,
    })
  );
}

export async function getRioDexDepth(
  pairAddress: string,
  side = "both"
): Promise<any> {
  return fetchJson(
    withQuery(`/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/depth`, {
      side,
    })
  );
}

/**
 * RioEx Phase 1: public market intelligence
 * Keep this here so current imports from "@/lib/riodex" do not break.
 */
export async function getRioExMarkets(): Promise<{ ok?: boolean; markets?: RioExMarket[] } | any> {
  return fetchJson("/api/v1/rioex/markets");
}

/**
 * Keep RUSD attestation import compatibility.
 * We can repoint this later if your final attestation route differs.
 */
export async function getLatestRusdAttestation(): Promise<RusdAttestation | null> {
  return fetchJson<RusdAttestation | null>("/api/v1/rusd/attestation/latest");
}
