import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const INDEXER_BASE =
  process.env.INDEXER_BASE_URL ||
  process.env.NEXT_PUBLIC_INDEXER_BASE_URL ||
  "http://indexer:4000";

export async function GET(req: NextRequest) {
  try {
    const assetIds =
      req.nextUrl.searchParams.get("asset_ids") ||
      req.nextUrl.searchParams.get("assetIds") ||
      req.nextUrl.searchParams.get("ids") ||
      "";

    const upstream = await fetch(
      `${INDEXER_BASE}/api/riodex/token-registry-batch?asset_ids=${encodeURIComponent(assetIds)}`,
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
        error:
          error?.message || "Failed to fetch RioDex token registry batch",
      },
      { status: 500 }
    );
  }
}
