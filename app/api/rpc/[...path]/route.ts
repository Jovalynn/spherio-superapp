import { NextResponse } from "next/server";

const RPC = process.env.RPC || "http://172.17.0.1:26657";

function joinPath(parts: string[]) {
  return parts.map((p) => p.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
}

async function proxy(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;

  const url = new URL(req.url);
  const target = new URL(RPC);

  // build target URL: RPC + /<path> + ?query
  const targetPath = joinPath(path);
  const out = new URL(target.toString());
  out.pathname = "/" + targetPath;
  out.search = url.search;

  // Forward as GET (Tendermint RPC for these endpoints is GET)
  const r = await fetch(out.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await r.text();

  // Return same-origin response (browser is happy)
  return new NextResponse(text, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function GET(req: Request, ctx: any) {
  try {
    return await proxy(req, ctx);
  } catch (e: any) {
    return NextResponse.json(
      { error: "RPC proxy failed", message: e?.message || String(e) },
      { status: 502 }
    );
  }
}
