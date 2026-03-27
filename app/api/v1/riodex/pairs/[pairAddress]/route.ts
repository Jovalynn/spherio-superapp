import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const INDEXER_BASE =
  process.env.INDEXER_BASE_URL ||
  process.env.NEXT_PUBLIC_INDEXER_BASE_URL ||
  "http://indexer:4000";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ pairAddress: string }> }
) {
  try {
    const { pairAddress } = await ctx.params;

    const upstream = await fetch(
      `${INDEXER_BASE}/api/riodex/pairs/${encodeURIComponent(pairAddress)}`,
      {
        cache: "no-store",
        headers: { accept: "application/json" },
      }
    );

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to fetch RioDex pair detail",
      },
      { status: 500 }
    );
  }
}
