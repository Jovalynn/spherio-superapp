import { requiresMarketIntegrity, enforceAPIMarketIntegrity } from "./lib/market-integrity/api-guard";
import { requiresRioMindOperator, isRioMindOperator } from "./lib/riomind/unscoped-api-access";
import { getVerifiedOwnerKey } from "./lib/riomind/owner-auth";
import { NextRequest, NextResponse } from "next/server";

const RIOLIGHT_HOSTS = new Set([
  "riolight.spheriochain.io",
  "wallet.spheriochain.io",
]);

const NEXUS_HOSTS = new Set([
  "nexus.riomind.spheriochain.io",
  "nexus.spheriochain.io",
  "riomind.spheriochain.io",
  "nexus.riomind.ai",
  "app.riomind.ai",
]);

function cleanHost(host: string | null) {
  return (host || "").split(":")[0].toLowerCase();
}

function isAssetOrApiPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export async function proxy(request: NextRequest) {
  const host = cleanHost(request.headers.get("host"));
  const pathname = request.nextUrl.pathname;

  if (pathname === "/api/riomind" || pathname.startsWith("/api/riomind/")) {
    try {
      const subject = await getVerifiedOwnerKey(request.headers);
      if (requiresRioMindOperator(pathname) && !isRioMindOperator(subject)) return NextResponse.json({ok:false,error:"Operator access required"}, {status:403});
    }
    catch { return NextResponse.json({ ok: false, error: "Authenticated identity required" }, { status: 401 }); }
  }

  if (requiresMarketIntegrity(pathname,request.method)) {
    const rejected=await enforceAPIMarketIntegrity(request,false);
    if(rejected)return NextResponse.json(rejected,{status:503});
  }

  if (isAssetOrApiPath(pathname)) {
    return NextResponse.next();
  }

  if (NEXUS_HOSTS.has(host)) {
    if (!pathname.startsWith("/nexus")) {
      const url = request.nextUrl.clone();
      url.pathname = "/nexus";
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  if (RIOLIGHT_HOSTS.has(host)) {
    if (!pathname.startsWith("/riolight")) {
      const url = request.nextUrl.clone();
      url.pathname = "/riolight";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
