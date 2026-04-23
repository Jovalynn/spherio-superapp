import { NextRequest, NextResponse } from "next/server";

const INDEXER_SCREENER_URL =
  process.env.INDEXER_SCREENER_URL ||
  "http://indexer:4000/api/riodex/screener";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
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

    const body = await upstream.text();

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ||
          "application/json; charset=utf-8",
        "cache-control": "no-store",
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
      },
      { status: 500 },
    );
  }
}
