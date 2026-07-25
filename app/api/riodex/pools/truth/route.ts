import { NextRequest, NextResponse } from "next/server";
import {
  buildPoolTruthRecord,
  type LiquiditySnapshotLike,
  type RegistryMarketLike,
} from "@/lib/riodex/pool-truth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RegistryMarketsResponse = {
  ok?: boolean;
  markets?: RegistryMarketLike[];
  pair?: RegistryMarketLike | null;
  item?: RegistryMarketLike | null;
  error?: string;
};

type LiquidityResponse = {
  ok?: boolean;
  liquidity?: LiquiditySnapshotLike[];
  error?: string;
};

function originFromRequest(request: NextRequest) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  const raw = await response.text();
  let json: any = null;

  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Route returned non-JSON (${response.status})`);
  }

  if (!response.ok || json?.ok === false) {
    throw new Error(json?.error || `Request failed: ${response.status}`);
  }

  return json as T;
}

async function getLatestLiquidity(origin: string, pairAddress: string) {
  if (!pairAddress) return null;

  try {
    const url = `${origin}/api/v1/riodex/pairs/${encodeURIComponent(pairAddress)}/liquidity?limit=1`;
    const json = await fetchJson<LiquidityResponse>(url);
    return json?.liquidity?.[0] || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const origin = originFromRequest(request);
    const url = new URL(request.url);

    const pair = String(url.searchParams.get("pair") || url.searchParams.get("pool") || "").trim();
    const token = String(url.searchParams.get("token") || "").trim().toLowerCase();

    if (pair) {
      const marketUrl = `${origin}/api/rioex/markets/${encodeURIComponent(pair)}`;
      const marketJson = await fetchJson<RegistryMarketsResponse>(marketUrl);
      const market = marketJson?.pair || marketJson?.item || null;

      if (!market) {
        return NextResponse.json(
          {
            ok: false,
            error: "Pool truth not found for pair.",
            pair,
          },
          { status: 404 }
        );
      }

      const latestLiquidity = await getLatestLiquidity(origin, pair);
      const truth = buildPoolTruthRecord({ market, latestLiquidity });

      return NextResponse.json(
        {
          ok: true,
          mode: "single",
          pair,
          truth,
        },
        {
          headers: {
            "cache-control": "no-store",
          },
        }
      );
    }

    const marketsUrl = new URL(`${origin}/api/rioex/markets`);
    marketsUrl.searchParams.set("canonicalOnly", "false");
    marketsUrl.searchParams.set("sort", "liquidity");

    const marketsJson = await fetchJson<RegistryMarketsResponse>(marketsUrl.toString());
    let markets = marketsJson?.markets || [];

    if (token) {
      markets = markets.filter((market) => {
        const haystack = [
          market.pairAddress,
          market.displaySymbol,
          market.canonicalSymbol,
          market.baseAssetId,
          market.quoteAssetId,
          market.baseSymbol,
          market.quoteSymbol,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(token);
      });
    }

    const truth = await Promise.all(
      markets.map(async (market) => {
        const latestLiquidity = await getLatestLiquidity(origin, String(market.pairAddress || ""));
        return buildPoolTruthRecord({ market, latestLiquidity });
      })
    );

    const visibleTruth = truth.filter((item) => item.visibility.showInScreener);

    return NextResponse.json(
      {
        ok: true,
        mode: "list",
        count: visibleTruth.length,
        truth: visibleTruth,
        source: {
          type: "pool_truth_composed",
          upstreams: [
            "/api/rioex/markets",
            "/api/rioex/markets/[pair]",
            "/api/v1/riodex/pairs/[pair]/liquidity",
            "lib/protocol/treasury",
          ],
        },
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to compose Pool Truth.",
      },
      { status: 502 }
    );
  }
}
