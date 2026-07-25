import { NextResponse } from "next/server";
import { SPHERIO } from "@/lib/spherioConfig";

export const dynamic = "force-dynamic";

const RIO_LOGO_URI =
  process.env.NEXT_PUBLIC_RIO_LOGO_URI ||
  process.env.NEXT_PUBLIC_RIO_LOGO_URL ||
  "https://raw.githubusercontent.com/Lerivee/RUSD/refs/heads/main/Untitled%20design.png";

async function loadRioValuation(origin: string) {
  try {
    const response = await fetch(`${origin}/api/rioex/valuation/rio`, {
      cache: "no-store",
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || json?.ok === false) {
      return null;
    }

    return json?.price?.rio || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const price = await loadRioValuation(origin);

  const now = new Date().toISOString();

  return NextResponse.json({
    ok: true,
    asset: {
      chainId: SPHERIO.chainId,
      chainName: SPHERIO.chainName,

      denom: "urio",
      baseDenom: "urio",
      displayDenom: "RIO",

      symbol: "RIO",
      displayName: "RIO",
      name: "Real-World Interconnected On-chain",
      description:
        "RIO is the native asset of SpherioChain, used for fees, execution, liquidity, treasury routing, and ecosystem settlement.",

      decimals: 6,
      coinDecimals: 6,
      coinMinimalDenom: "urio",
      coinDenom: "RIO",

      logoURI: RIO_LOGO_URI,
      logoUrl: RIO_LOGO_URI,

      assetType: "native",
      bech32Prefix: "rio",

      price: {
        rusd: price?.rusd ?? null,
        usd: price?.usd ?? price?.rusd ?? null,
        usdt: price?.usdt ?? price?.rusd ?? null,
        btc: price?.btc ?? null,
      },

      priceSource: price ? "rioex_valuation_rio" : "unavailable",
      valuationRoute: "/api/rioex/valuation/rio",
      portfolioValuationRoute: "/api/riolight/portfolio/value",
      explorerRoute: "/rioexplorer",
      updatedAt: now,
    },
  });
}
