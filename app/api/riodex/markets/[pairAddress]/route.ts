import { NextResponse } from "next/server";
import { getRioExRegistryPool, resolvePairByAddress } from "@/lib/rioex/registry";
import {
  MARKET_NORMALIZATION_GUARANTEES,
  normalizePairDetail,
} from "@/lib/riodex/market-normalization";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: { params: Promise<{ pairAddress: string }> }
) {
  try {
    const { pairAddress } = await context.params;
    const cleanPairAddress = String(pairAddress || "").trim();

    if (!cleanPairAddress) {
      return NextResponse.json(
        { ok: false, error: "Missing pair address." },
        { status: 400 }
      );
    }

    const pool = getRioExRegistryPool();
    const pair = await resolvePairByAddress(cleanPairAddress, pool);

    if (!pair) {
      return NextResponse.json(
        { ok: false, error: "Pair not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      source: {
        type: "registry_backed_truth",
        database:
          process.env.POSTGRES_DB ||
          process.env.PGDATABASE ||
          process.env.DB_NAME ||
          "spherio_indexer",
        tables: [
          "rioex_pairs_registry",
          "rioex_assets",
          "riodex_pairs",
          "riodex_liquidity_snapshots",
          "riodex_swaps",
        ],
      },
      normalized: {
        version: "pair-detail.v1",
        guarantees: MARKET_NORMALIZATION_GUARANTEES,
      },
      pair: normalizePairDetail(pair),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load RioDex pair context.",
      },
      { status: 500 }
    );
  }
}
