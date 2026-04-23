import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function candidateBases() {
  return [
    process.env.INDEXER_INTERNAL_URL,
    process.env.NEXT_PUBLIC_INDEXER_URL,
    "http://indexer:4000",
    "http://spherio_indexer:4000",
    "http://127.0.0.1:4000",
  ].filter(Boolean) as string[];
}

export async function GET(req: Request) {
  const incoming = new URL(req.url);
  const qs = incoming.searchParams.toString();
  const path = `/api/rioexplorer/activity${qs ? `?${qs}` : ""}`;

  let lastError = "unknown_error";

  for (const base of candidateBases()) {
    const target = `${base}${path}`;

    try {
      const res = await fetch(target, {
        cache: "no-store",
        headers: { accept: "application/json" },
      });

      const text = await res.text();
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        lastError = `upstream_${res.status}_${target}`;
        continue;
      }

      if (!contentType.includes("application/json")) {
        lastError = `non_json_upstream_${target}`;
        continue;
      }

      return new NextResponse(text, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-spherio-upstream": base,
        },
      });
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error: "failed_to_fetch_rioexplorer_activity",
      details: lastError,
    },
    { status: 502 }
  );
}
