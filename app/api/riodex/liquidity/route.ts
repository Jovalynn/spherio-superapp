import { NextRequest, NextResponse } from "next/server";

type RegistryMarket = {
  pairAddress: string;
  displaySymbol?: string;
  canonicalSymbol?: string;
  baseAssetId?: string;
  quoteAssetId?: string;
  baseSymbol?: string;
  quoteSymbol?: string;
  feeBps?: number;
  isCanonical?: boolean;
  isLive?: boolean;
  liquidityUsd?: number;
  liquidityHeight?: string | number | null;
  liquidityTime?: string | null;
  liquiditySource?: string | null;
  liquidityUpdatedAt?: string | null;
  lastSwapTime?: string | null;
  lastSwapTxHash?: string | null;
  feeRecipientAddress?: string | null;
  feePolicy?: string | null;
  routes?: {
    assetTerminal?: string;
    marketBoard?: string;
    hero?: string;
    trade?: string;
    pool?: string;
    swap?: string;
    liquidity?: string;
  };
  source?: string;
};

type RegistryMarketsResponse = {
  ok?: boolean;
  markets?: RegistryMarket[];
  error?: string;
};

function candidateIndexerBaseUrls() {
  const candidates = [
    process.env.SPHERIO_INDEXER_URL,
    process.env.INDEXER_URL,
    process.env.NEXT_PUBLIC_INDEXER_URL,
    process.env.INDEXER_BASE_URL,
    process.env.NEXT_PUBLIC_INDEXER_BASE_URL,
    "http://127.0.0.1:4000",
    "http://localhost:4000",
    "http://spherio_indexer:4000",
    "http://indexer:4000",
    "http://host.docker.internal:4000",
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return Array.from(new Set(candidates));
}

async function fetchText(url: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    const raw = await response.text();
    return { response, raw };
  } finally {
    clearTimeout(timeout);
  }
}

function parseJson<T>(raw: string, status: number): T {
  try {
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    throw new Error(`Route returned non-JSON (${status})`);
  }
}

function fromRegistryDisplayLabel(market: RegistryMarket) {
  const raw = String(market.displaySymbol || "").trim();
  if (raw && raw.toLowerCase() !== "urio") return raw;

  const base = String(market.baseSymbol || "").trim() || "RIO";
  let quote = String(market.quoteSymbol || "").trim() || "RUSD";

  if (quote.toLowerCase().startsWith("rio14nur")) {
    quote = "RUSD";
  }

  if (base && quote) return `${base} / ${quote}`;

  if (market.canonicalSymbol?.trim()) {
    return market.canonicalSymbol.replace("/", " / ");
  }

  return raw || "—";
}

async function fetchRegistryMarketsDirect() {
  const errors: string[] = [];

  for (const baseUrl of candidateIndexerBaseUrls()) {
    try {
      const upstream = new URL("/api/rioex/markets", baseUrl);
      upstream.searchParams.set("canonicalOnly", "false");
      upstream.searchParams.set("sort", "liquidity");

      const { response, raw } = await fetchText(upstream.toString(), 5000);
      const json = parseJson<RegistryMarketsResponse>(raw, response.status);

      if (!response.ok || json?.ok === false) {
        throw new Error(json?.error || `Registry request failed: ${response.status}`);
      }

      return {
        markets: json?.markets || [],
        upstream: baseUrl,
        errors,
      };
    } catch (error: any) {
      errors.push(`${baseUrl} :: ${error?.message || "fetch_failed"}`);
    }
  }

  throw new Error(errors[0] || "Failed to load registry markets from indexer");
}

export async function GET(_request: NextRequest) {
  try {
    const { markets, upstream, errors } = await fetchRegistryMarketsDirect();

    const pools = markets.map((market) => ({
      pairAddress: market.pairAddress,
      pairKey: market.pairAddress,
      displayLabel: fromRegistryDisplayLabel(market),
      isCanonical: Boolean(market.isCanonical),
      isLive: Boolean(market.isLive),
      asset0: 0,
      asset1: 0,
      price: 0,
      lpShare: "0",
      feeBps: market.feeBps ?? 0,
      liquidityUsd: Number(market.liquidityUsd || 0),
      liquiditySource: market.liquiditySource || null,
      marketSource: market.source || null,
      createdAtHeight: market.liquidityHeight || null,
      createdAtTime: market.liquidityTime || null,
      asset0Id: market.baseAssetId || null,
      asset1Id: market.quoteAssetId || null,
      routes: market.routes || {
        assetTerminal: `/rioex/markets/${encodeURIComponent(market.pairAddress)}`,
        marketBoard: "/rioex",
        hero: "/rioex",
        trade: `/rioex/markets/${encodeURIComponent(market.pairAddress)}/trades`,
        pool: `/riodex/pool/${encodeURIComponent(market.pairAddress)}`,
        swap: `/riodex/swap?pair=${encodeURIComponent(market.pairAddress)}`,
        liquidity: `/riodex/liquidity?pool=${encodeURIComponent(market.pairAddress)}`,
      },
    }));

    return NextResponse.json(
      {
        ok: true,
        source: {
          type: "registry_only_liquidity",
          upstream,
          attemptedIndexers: candidateIndexerBaseUrls(),
          errors,
        },
        count: pools.length,
        pools,
      },
      {
        status: 200,
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load RioDex liquidity.",
        attemptedIndexers: candidateIndexerBaseUrls(),
      },
      { status: 502 }
    );
  }
}
