import { NextRequest, NextResponse } from "next/server";
import {
  enrichEconomicDeep,
  fetchRioPriceContext,
} from "@/lib/rioEconomicEnrichment";

const INDEXER_SCREENER_URL =
  process.env.INDEXER_SCREENER_URL ||
  "http://indexer:4000/api/riodex/screener";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const rioPrice = await fetchRioPriceContext(origin);

  try {
    const qs = request.nextUrl.searchParams.toString();
    const upstreamUrl = qs
      ? `${INDEXER_SCREENER_URL}?${qs}`
      : INDEXER_SCREENER_URL;

    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const raw = await upstream.text();

    let body = raw;

    try {
      const parsed = JSON.parse(raw);
      const enriched = enrichEconomicDeep(parsed, rioPrice) as any;

      enriched.valuation = {
        ...(enriched.valuation ?? {}),
        rioRusd: rioPrice.rioRusd,
        rioUsd: rioPrice.rioUsd,
        rioUsdt: rioPrice.rioUsdt,
        source: rioPrice.source,
        authority: rioPrice.authority,
        updatedAt: rioPrice.updatedAt,
      };

      body = JSON.stringify(enriched);
    } catch {
      body = raw;
    }

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ||
          "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-spherio-normalized": "screener.v1.rusd-enriched",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Screener upstream proxy failed",
        valuation: {
          rioRusd: rioPrice.rioRusd,
          source: rioPrice.source,
          authority: rioPrice.authority,
        },
      },
      { status: 500 },
    );
  }
}
