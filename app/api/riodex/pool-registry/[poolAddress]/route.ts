import { NextResponse } from "next/server";

function getIndexerBaseUrl() {
  return (
    process.env.INTERNAL_INDEXER_URL ||
    process.env.INDEXER_URL ||
    process.env.NEXT_PUBLIC_INDEXER_URL ||
    "http://indexer:4000"
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ poolAddress: string }> }
) {
  try {
    const { poolAddress } = await context.params;

    const upstreamUrl = new URL(
      `/api/riodex/pool-registry/${encodeURIComponent(poolAddress)}`,
      getIndexerBaseUrl()
    );

    const response = await fetch(upstreamUrl.toString(), {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to proxy pool registry entry",
      },
      { status: 500 }
    );
  }
}
