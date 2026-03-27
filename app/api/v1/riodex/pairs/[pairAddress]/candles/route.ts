import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const INDEXER_BASE =
  process.env.INDEXER_BASE_URL ||
  process.env.NEXT_PUBLIC_INDEXER_BASE_URL ||
  "http://indexer:4000";

function requestedResolution(searchParams: URLSearchParams) {
  return (
    searchParams.get("resolution") ||
    searchParams.get("interval") ||
    "1m"
  );
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ pairAddress: string }> }
) {
  try {
    const { pairAddress } = await ctx.params;
    const { searchParams } = new URL(req.url);

    const resolution = requestedResolution(searchParams);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = searchParams.get("limit");

    const qs = new URLSearchParams();
    qs.set("resolution", resolution);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (limit) qs.set("limit", limit);

    const upstream = await fetch(
      `${INDEXER_BASE}/api/riodex/pairs/${encodeURIComponent(
        pairAddress
      )}/candles?${qs.toString()}`,
      {
        cache: "no-store",
        headers: { accept: "application/json" },
      }
    );

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to fetch RioDex candles",
      },
      { status: 500 }
    );
  }
}
