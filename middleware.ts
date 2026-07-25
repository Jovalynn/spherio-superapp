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

export function middleware(request: NextRequest) {
  const host = cleanHost(request.headers.get("host"));
  const pathname = request.nextUrl.pathname;

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
