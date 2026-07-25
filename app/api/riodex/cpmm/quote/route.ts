import { NextRequest, NextResponse } from "next/server";
import { calculateCpmmQuote, directionFromPoolTruth, toFiniteNumber } from "@/lib/riodex/cpmm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function originFromRequest(request: NextRequest) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
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

export async function GET(request: NextRequest) {
  try {
    const origin = originFromRequest(request);
    const url = new URL(request.url);

    const pair = String(url.searchParams.get("pair") || url.searchParams.get("pool") || "").trim();
    const from = String(url.searchParams.get("from") || url.searchParams.get("offer") || "").trim();
    const amountIn = toFiniteNumber(url.searchParams.get("amount") || url.searchParams.get("amountIn"));
    const slippagePct = toFiniteNumber(url.searchParams.get("slippagePct") || "1", 1);

    if (!pair) {
      return NextResponse.json({ ok: false, error: "CPMM quote requires pair." }, { status: 400 });
    }

    if (!from) {
      return NextResponse.json({ ok: false, error: "CPMM quote requires from asset symbol or asset id." }, { status: 400 });
    }

    if (amountIn <= 0) {
      return NextResponse.json({ ok: false, error: "CPMM quote requires positive amount." }, { status: 400 });
    }

    const truthUrl = `${origin}/api/riodex/pools/truth?pair=${encodeURIComponent(pair)}`;
    const truthJson = await fetchJson<any>(truthUrl);
    const truth = truthJson?.truth;

    if (!truth) {
      return NextResponse.json({ ok: false, error: "Pool Truth not found for CPMM quote.", pair }, { status: 404 });
    }

    const direction = directionFromPoolTruth(truth, from);

    if (!direction) {
      return NextResponse.json(
        {
          ok: false,
          error: "Input asset does not belong to this pool.",
          pair,
          from,
          pool: {
            base: truth?.baseAsset?.symbol,
            quote: truth?.quoteAsset?.symbol,
          },
        },
        { status: 400 }
      );
    }

    const feeBps = toFiniteNumber(truth?.pool?.feeBps, 30);
    const quote = calculateCpmmQuote({
      amountIn,
      reserveIn: direction.reserveIn,
      reserveOut: direction.reserveOut,
      feeBps,
    });

    if (!quote.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: quote.error || "CPMM quote failed.",
          pair,
          from,
          quote,
        },
        { status: 400 }
      );
    }

    const minimumOut = quote.amountOut * (1 - Math.max(0, slippagePct) / 100);

    return NextResponse.json(
      {
        ok: true,
        source: "spherio_cpmm_pool_truth",
        invariant: "x*y=k",
        pair,
        direction: direction.direction,
        fromAsset: {
          symbol: direction.fromAsset?.symbol,
          assetId: direction.fromAsset?.assetId,
          logoUrl: direction.fromAsset?.logoUrl,
        },
        toAsset: {
          symbol: direction.toAsset?.symbol,
          assetId: direction.toAsset?.assetId,
          logoUrl: direction.toAsset?.logoUrl,
        },
        amountIn,
        amountOut: quote.amountOut,
        minimumOut,
        slippagePct,
        feeAmount: quote.feeAmount,
        feeBps: quote.feeBps,
        spotPrice: quote.spotPrice,
        executionPrice: quote.executionPrice,
        priceImpactPct: quote.priceImpactPct,
        reserves: {
          before: {
            in: quote.reserveInBefore,
            out: quote.reserveOutBefore,
          },
          after: {
            in: quote.reserveInAfter,
            out: quote.reserveOutAfter,
          },
        },
        k: {
          before: quote.kBefore,
          after: quote.kAfter,
        },
        proof: {
          poolTruth: `/api/riodex/pools/truth?pair=${encodeURIComponent(pair)}`,
          rioExplorer:
            truth?.routes?.rioExplorer ||
            truth?.routes?.explorer ||
            `/rioexplorer/address/${encodeURIComponent(pair)}`,
        },
      },
      {
        headers: { "cache-control": "no-store" },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to compute CPMM quote.",
      },
      { status: 502 }
    );
  }
}
