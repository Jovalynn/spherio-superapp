import { NextRequest, NextResponse } from "next/server";
import { getRioExRegistryPool, resolvePairRegistry } from "@/lib/rioex/registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SortMode =
  | "canonical"
  | "liquidity"
  | "recent"
  | "alphabetical";

function toBoolean(value: string | null, fallback = false) {
  if (value === null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function normalizeSort(raw: string | null): SortMode {
  const value = String(raw || "").trim().toLowerCase();

  if (
    value === "canonical" ||
    value === "liquidity" ||
    value === "recent" ||
    value === "alphabetical"
  ) {
    return value;
  }

  return "canonical";
}

function sortPairs<T extends {
  canonicalSymbol: string;
  isCanonical: boolean;
  isLive: boolean;
  liquidityUsd: number;
  lastSwapTime: string | null;
}>(pairs: T[], sort: SortMode) {
  const clone = [...pairs];

  if (sort === "alphabetical") {
    return clone.sort((a, b) =>
      a.canonicalSymbol.localeCompare(b.canonicalSymbol)
    );
  }

  if (sort === "liquidity") {
    return clone.sort((a, b) => {
      const liq = Number(b.liquidityUsd || 0) - Number(a.liquidityUsd || 0);
      if (liq !== 0) return liq;
      return a.canonicalSymbol.localeCompare(b.canonicalSymbol);
    });
  }

  if (sort === "recent") {
    return clone.sort((a, b) => {
      const at = a.lastSwapTime ? new Date(a.lastSwapTime).getTime() : 0;
      const bt = b.lastSwapTime ? new Date(b.lastSwapTime).getTime() : 0;
      if (bt !== at) return bt - at;
      return a.canonicalSymbol.localeCompare(b.canonicalSymbol);
    });
  }

  return clone.sort((a, b) => {
    if (a.isCanonical !== b.isCanonical) return a.isCanonical ? -1 : 1;
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;

    const liq = Number(b.liquidityUsd || 0) - Number(a.liquidityUsd || 0);
    if (liq !== 0) return liq;

    const at = a.lastSwapTime ? new Date(a.lastSwapTime).getTime() : 0;
    const bt = b.lastSwapTime ? new Date(b.lastSwapTime).getTime() : 0;
    if (bt !== at) return bt - at;

    return a.canonicalSymbol.localeCompare(b.canonicalSymbol);
  });
}

function candidateIndexerBaseUrls() {
  const candidates = [
    process.env.SPHERIO_INDEXER_URL,
    process.env.INDEXER_URL,
    process.env.NEXT_PUBLIC_INDEXER_URL,
    process.env.INDEXER_BASE_URL,
    process.env.NEXT_PUBLIC_INDEXER_BASE_URL,
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "http://spherio_indexer:4000",
    "http://indexer:4000",
    "http://host.docker.internal:4000",
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return Array.from(new Set(candidates));
}

async function proxyToIndexer(request: NextRequest, localError?: unknown) {
  const errors: string[] = [];

  if (localError) {
    errors.push(
      `local_registry :: ${localError instanceof Error ? localError.message : String(localError)}`
    );
  }

  for (const baseUrl of candidateIndexerBaseUrls()) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const upstream = new URL("/api/rioex/markets", baseUrl);

    request.nextUrl.searchParams.forEach((value, key) => {
      upstream.searchParams.set(key, value);
    });

    const response = await fetch(upstream.toString(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    const raw = await response.text();
    clearTimeout(timeout);

    return new NextResponse(raw, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ||
          "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-spherio-upstream": baseUrl,
      },
    });
  } catch (error: any) {
    clearTimeout(timeout);
    errors.push(`${baseUrl} :: ${error?.message || "fetch_failed"}`);
  }
}

  return NextResponse.json(
    {
      ok: false,
      error: "Failed to load RioEx market board.",
      attempted_upstreams: candidateIndexerBaseUrls(),
      details: errors,
    },
    { status: 502 }
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const liveOnly = toBoolean(url.searchParams.get("liveOnly"), false);
  const canonicalOnly = toBoolean(url.searchParams.get("canonicalOnly"), false);
  const sort = normalizeSort(url.searchParams.get("sort"));
  const q = String(url.searchParams.get("q") || "").trim().toLowerCase();

  try {
    const pool = getRioExRegistryPool();

    const registry = await Promise.race([
      resolvePairRegistry(pool),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("local_registry_timeout")), 2500)
      ),
    ]);

    let markets = Array.from(registry.values()).map((pair) => ({
      pairAddress: pair.pairAddress,
      displaySymbol: pair.displaySymbol,
      canonicalSymbol: pair.canonicalSymbol,
      baseAssetId: pair.baseAssetId,
      quoteAssetId: pair.quoteAssetId,
      baseSymbol: pair.baseAsset.symbol,
      quoteSymbol: pair.quoteAsset.symbol,
      baseDisplayName: pair.baseAsset.displayName,
      quoteDisplayName: pair.quoteAsset.displayName,
      baseLogoUrl: pair.baseAsset.logoUrl,
      quoteLogoUrl: pair.quoteAsset.logoUrl,
      feeBps: pair.feeBps,
      isCanonical: pair.isCanonical,
      isLive: pair.isLive,
      liquidityUsd: pair.liquidityUsd,
      liquidityHeight: pair.liquidityHeight,
      liquidityTime: pair.liquidityTime,
      liquiditySource: pair.liquiditySource,
      liquidityUpdatedAt: pair.liquidityUpdatedAt,
      lastSwapTime: pair.lastSwapTime,
      lastSwapTxHash: pair.lastSwapTxHash,
      feeRecipientAddress: pair.feeRecipientAddress,
      feePolicy: pair.feePolicy,
      quoteConvention: pair.quoteConvention,
      routes: pair.routes,
      source: pair.source,
    }));

    if (liveOnly) {
      markets = markets.filter((market) => market.isLive);
    }

    if (canonicalOnly) {
      markets = markets.filter((market) => market.isCanonical);
    }

    if (q) {
      markets = markets.filter((market) => {
        const haystack = [
          market.displaySymbol,
          market.canonicalSymbol,
          market.baseAssetId,
          market.quoteAssetId,
          market.baseSymbol,
          market.quoteSymbol,
          market.baseDisplayName,
          market.quoteDisplayName,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    markets = sortPairs(markets, sort);

    return NextResponse.json({
      ok: true,
      source: {
        type: "registry_backed_truth",
        database:
          process.env.POSTGRES_DB ||
          process.env.PGDATABASE ||
          process.env.DB_NAME ||
          "spherio_indexer",
        tables: [
          "rioex_pairs_registry",
          "rioex_assets",
          "riodex_pairs",
          "riodex_swaps",
          "riodex_liquidity_snapshots",
        ],
        registryMode: "rioex_pairs_registry_table",
      },
      filters: {
        liveOnly,
        canonicalOnly,
        sort,
        q,
      },
      count: markets.length,
      markets,
    });
  } catch (error: any) {
    return proxyToIndexer(request, error);
  }
}
