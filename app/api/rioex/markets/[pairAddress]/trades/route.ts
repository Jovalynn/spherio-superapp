import { NextRequest, NextResponse } from "next/server";
import { getRioExRegistryPool, resolvePairByAddress } from "@/lib/rioex/registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TradeRow = {
  tx_hash: string | null;
  offer_asset_id: string | null;
  ask_asset_id: string | null;
  offer_amount: string | number | null;
  return_amount: string | number | null;
  commission_amount: string | number | null;
  block_height: string | number | null;
  block_time: string | null;
};

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

async function proxyToIndexer(
  request: NextRequest,
  pairAddress: string,
  localError?: unknown
) {
  const errors: string[] = [];

  if (localError) {
    errors.push(
      `local_registry :: ${localError instanceof Error ? localError.message : String(localError)}`
    );
  }

  for (const baseUrl of candidateIndexerBaseUrls()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const upstream = new URL(
        `/api/rioex/markets/${encodeURIComponent(pairAddress)}/trades`,
        baseUrl
      );

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
      error: "Failed to load RioEx trade terminal.",
      attempted_upstreams: candidateIndexerBaseUrls(),
      details: errors,
    },
    { status: 502 }
  );
}

function toNumber(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toDisplay(raw: string | number | null | undefined, decimals = 6) {
  return toNumber(raw) / 10 ** decimals;
}

function effectivePrice(
  offerAmountDisplay: number,
  returnAmountDisplay: number
) {
  if (offerAmountDisplay <= 0) return 0;
  return returnAmountDisplay / offerAmountDisplay;
}

function normalizeTradeSides(
  row: TradeRow,
  pair: Awaited<ReturnType<typeof resolvePairByAddress>>
) {
  if (!pair) {
    return {
      offerAssetId: String(row.offer_asset_id || "").trim(),
      askAssetId: String(row.ask_asset_id || "").trim(),
      inferred: false,
    };
  }

  const baseId = String(pair.baseAssetId || "").trim();
  const quoteId = String(pair.quoteAssetId || "").trim();

  const rawOfferId = String(row.offer_asset_id || "").trim();
  const rawAskId = String(row.ask_asset_id || "").trim();

  const offerUnknown = !rawOfferId || rawOfferId === "unknown";
  const askUnknown = !rawAskId || rawAskId === "unknown";

  if (!offerUnknown && !askUnknown) {
    return {
      offerAssetId: rawOfferId,
      askAssetId: rawAskId,
      inferred: false,
    };
  }

  return {
    offerAssetId: baseId,
    askAssetId: quoteId,
    inferred: true,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ pairAddress: string }> }
) {
  const { pairAddress } = await context.params;
  const cleanPairAddress = String(pairAddress || "").trim();

  if (!cleanPairAddress) {
    return NextResponse.json(
      { ok: false, error: "Missing pair address." },
      { status: 400 }
    );
  }

  try {
    const pool = getRioExRegistryPool();

    const LOCAL_REGISTRY_TIMEOUT_MS = 10000;

const pair = await Promise.race([
  resolvePairByAddress(cleanPairAddress, pool),
  new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("local_registry_timeout")),
      LOCAL_REGISTRY_TIMEOUT_MS
    )
  ),
]);

    if (!pair) {
      return NextResponse.json(
        { ok: false, error: "Pair not found." },
        { status: 404 }
      );
    }

    const tradesResult = await pool.query<TradeRow>(
      `
      select
        tx_hash,
        offer_asset_id,
        ask_asset_id,
        offer_amount,
        return_amount,
        commission_amount,
        block_height,
        block_time
      from riodex_swaps
      where pair_address = $1
      order by block_time desc nulls last
      limit 50
      `,
      [cleanPairAddress]
    );

    const recentTrades = tradesResult.rows.map((row) => {
      const normalizedSides = normalizeTradeSides(row, pair);

const offerAsset =
  normalizedSides.offerAssetId === pair.baseAssetId
    ? pair.baseAsset
    : pair.quoteAsset;

const askAsset =
  normalizedSides.askAssetId === pair.baseAssetId
    ? pair.baseAsset
    : pair.quoteAsset;

      const offerDecimals = offerAsset?.decimals ?? 6;
      const askDecimals = askAsset?.decimals ?? 6;

      const offerAmountDisplay = toDisplay(row.offer_amount, offerDecimals);
      const returnAmountDisplay = toDisplay(row.return_amount, askDecimals);
      const commissionAmountDisplay = toDisplay(
        row.commission_amount,
        offerDecimals
      );

      return {
        txHash: row.tx_hash || "",
        offerAssetId: normalizedSides.offerAssetId,
        askAssetId: normalizedSides.askAssetId,
        offerAssetLabel: offerAsset?.symbol || row.offer_asset_id || "UNKNOWN",
        askAssetLabel: askAsset?.symbol || row.ask_asset_id || "UNKNOWN",
        offerAmountRaw: String(row.offer_amount ?? "0"),
        returnAmountRaw: String(row.return_amount ?? "0"),
        commissionAmountRaw: String(row.commission_amount ?? "0"),
        offerAmountDisplay,
        returnAmountDisplay,
        commissionAmountDisplay,
        effectivePrice: effectivePrice(offerAmountDisplay, returnAmountDisplay),
        blockHeight: row.block_height || "—",
        blockTime: row.block_time || null,
      };
    });

    const latestTrade = recentTrades[0] || null;
    const flow24hUsd = 0;

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
          "riodex_pairs",
          "riodex_liquidity_snapshots",
          "riodex_swaps",
          "rioex_assets",
          "rioex_pairs_registry",
        ],
      },
      market: {
        pairAddress: pair.pairAddress,
        label: pair.displaySymbol,
        asset0Id: pair.baseAssetId,
        asset1Id: pair.quoteAssetId,
        asset0LogoUrl: pair.baseAsset.logoUrl,
        asset1LogoUrl: pair.quoteAsset.logoUrl,
        feeBps: pair.feeBps,
        isCanonical: pair.isCanonical,
        isLive: pair.isLive,
        price: latestTrade?.effectivePrice || 0,
        liquidityUsd: pair.liquidityUsd,
        flow24hUsd,
        trades24h: recentTrades.length,
        reserves: {
          asset0Display: 0,
          asset1Display: 0,
          totalShareDisplay: 0,
        },
        timestamps: {
          createdTime: null,
          liquidityTime: pair.liquidityTime,
          lastSwapTime: pair.lastSwapTime,
          lastActivityTime: pair.lastSwapTime,
        },
        metadata: {
          liquidityHeight: pair.liquidityHeight,
          liquiditySource: pair.liquiditySource,
          liquidityUpdatedAt: pair.liquidityUpdatedAt,
          lastSwapTxHash: pair.lastSwapTxHash,
          displaySymbol: pair.displaySymbol,
          feeRecipientAddress: pair.feeRecipientAddress,
          feePolicy: pair.feePolicy,
        },
        routes: pair.routes,
      },
      summary: {
        latestTradePrice: latestTrade?.effectivePrice || 0,
        latestTradeTime: latestTrade?.blockTime || null,
        lastSwapTxHash: pair.lastSwapTxHash,
        trades24h: recentTrades.length,
        flow24hUsd,
      },
      recentTrades,
      candleReadiness: {
        status: "registry_backed",
        note: "Market identity, fee routing, and liquidity valuation now resolve from the authoritative registry layer.",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load RioEx trade terminal.",
      },
      { status: 500 }
    );
  }
}
