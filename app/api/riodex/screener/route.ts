import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const errors: string[] = [];

  for (const baseUrl of candidateIndexerBaseUrls()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const upstream = new URL("/api/riodex/screener", baseUrl);

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
      error: "Failed to load RioDex screener.",
      attempted_upstreams: candidateIndexerBaseUrls(),
      details: errors,
    },
    { status: 502 }
  );
}
