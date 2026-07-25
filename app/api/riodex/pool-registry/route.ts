import { NextResponse } from "next/server";

function getIndexerBaseUrl() {
  return (
    process.env.INTERNAL_INDEXER_URL ||
    process.env.INDEXER_URL ||
    process.env.NEXT_PUBLIC_INDEXER_URL ||
    "http://indexer:4000"
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const upstreamUrl = new URL("/api/riodex/pool-registry", getIndexerBaseUrl());

    url.searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.set(key, value);
    });

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
        error: error?.message || "Failed to proxy pool registry",
      },
      { status: 500 }
    );
  }
}
