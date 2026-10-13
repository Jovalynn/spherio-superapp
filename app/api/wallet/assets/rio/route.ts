import { NextResponse } from "next/server";
import { SPHERIO } from "@/lib/spherioConfig";
import { getRioWalletMarketState } from "@/lib/wallet-adapters/rio-market-state";

export const dynamic = "force-dynamic";

const RIO_LOGO_URI =
  process.env.NEXT_PUBLIC_RIO_LOGO_URI ||
  process.env.NEXT_PUBLIC_RIO_LOGO_URL ||
  "https://raw.githubusercontent.com/Lerivee/RUSD/refs/heads/main/Untitled%20design.png";

export async function GET(request: Request) {
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

      ...getRioWalletMarketState(),
      valuationRoute: "/api/rioex/valuation/rio",
      portfolioValuationRoute: "/api/riolight/portfolio/value",
      explorerRoute: "/rioexplorer",
    },
  });
}
