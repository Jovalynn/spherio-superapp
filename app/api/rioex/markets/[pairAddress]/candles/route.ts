import { NextRequest, NextResponse } from "next/server";
import {
  getRioExRegistryPool,
  resolvePairByAddress,
} from "@/lib/rioex/registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SwapRow = {
  block_time: string;
  offer_asset_id: string | null;
  ask_asset_id: string | null;
  offer_amount: string | number | null;
  return_amount: string | number | null;
  tx_hash: string | null;
};

type IntervalMode =
  | "1m"
  | "2m"
  | "5m"
  | "10m"
  | "15m"
  | "1h"
  | "4h"
  | "1d"
  | "1w";

type CanonicalSwap = {
  bucketTime: string;
  price: number;
  baseVolumeRaw: number;
  quoteVolumeRaw: number;
};

type CandleAccumulator = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeBaseRaw: number;
  volumeQuoteRaw: number;
  trades: number;
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
        `/api/rioex/markets/${encodeURIComponent(pairAddress)}/candles`,
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
      error: "Failed to derive RioEx candles.",
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

function normalizeInterval(raw?: string | null): IntervalMode {
  const value = String(raw || "").trim().toLowerCase();

  if (
    ["1m", "2m", "5m", "10m", "15m", "1h", "4h", "1d", "1w"].includes(value)
  ) {
    return value as IntervalMode;
  }

  return "1h";
}

function normalizeLimit(raw?: string | null) {
  const value = Number(raw ?? 500);
  if (!Number.isFinite(value)) return 500;
  return Math.min(5000, Math.max(25, Math.floor(value)));
}

function bucketStartIso(rawTime: string, interval: IntervalMode) {
  const d = new Date(rawTime);
  if (Number.isNaN(d.getTime())) return null;

  if (interval === "1m") {
    d.setUTCSeconds(0, 0);
    return d.toISOString();
  }

  if (interval === "2m") {
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 2) * 2, 0, 0);
    return d.toISOString();
  }

  if (interval === "5m") {
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 5) * 5, 0, 0);
    return d.toISOString();
  }

  if (interval === "10m") {
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 10) * 10, 0, 0);
    return d.toISOString();
  }

  if (interval === "15m") {
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 15) * 15, 0, 0);
    return d.toISOString();
  }

  if (interval === "1h") {
    d.setUTCMinutes(0, 0, 0);
    return d.toISOString();
  }

  if (interval === "4h") {
    d.setUTCHours(Math.floor(d.getUTCHours() / 4) * 4, 0, 0, 0);
    return d.toISOString();
  }

  if (interval === "1d") {
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  const utcDay = d.getUTCDay();
  const daysSinceMonday = (utcDay + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function canonicalizeSwap(
  row: SwapRow,
  pair: Awaited<ReturnType<typeof resolvePairByAddress>>,
  interval: IntervalMode
): CanonicalSwap | null {
  if (!pair) return null;

  const baseId = String(pair.baseAssetId || "").trim();
  const quoteId = String(pair.quoteAssetId || "").trim();

  if (!baseId || !quoteId) return null;

  let offerId = String(row.offer_asset_id || "").trim();
let askId = String(row.ask_asset_id || "").trim();

const offerUnknown = !offerId || offerId === "unknown";
const askUnknown = !askId || askId === "unknown";

if (offerUnknown && askUnknown) {
  offerId = baseId;
  askId = quoteId;
}

  const offerRaw = toNumber(row.offer_amount);
  const returnRaw = toNumber(row.return_amount);

  const baseDecimals = pair.baseAsset.decimals ?? 6;
  const quoteDecimals = pair.quoteAsset.decimals ?? 6;

  let price = 0;
  let baseVolumeRaw = 0;
  let quoteVolumeRaw = 0;

offerId = offerId.trim();
askId = askId.trim();

const isForward = offerId === baseId && askId === quoteId;
const isReverse = offerId === quoteId && askId === baseId;
const hasAmounts = offerRaw > 0 && returnRaw > 0;

if ((isForward || isReverse) && hasAmounts) {
  let baseDisplay: number;
  let quoteDisplay: number;

  if (isForward) {
    baseDisplay = toDisplay(offerRaw, baseDecimals);
    quoteDisplay = toDisplay(returnRaw, quoteDecimals);

    baseVolumeRaw = offerRaw;
    quoteVolumeRaw = returnRaw;
  } else {
    baseDisplay = toDisplay(returnRaw, baseDecimals);
    quoteDisplay = toDisplay(offerRaw, quoteDecimals);

    baseVolumeRaw = returnRaw;
    quoteVolumeRaw = offerRaw;
  }

  if (baseDisplay <= 0 || quoteDisplay <= 0) return null;

  price = quoteDisplay / baseDisplay;
} else if (hasAmounts) {
  const baseDisplay = toDisplay(returnRaw, baseDecimals);
  const quoteDisplay = toDisplay(offerRaw, quoteDecimals);

  if (baseDisplay <= 0 || quoteDisplay <= 0) return null;

  price = quoteDisplay / baseDisplay;
  baseVolumeRaw = returnRaw;
  quoteVolumeRaw = offerRaw;

  console.warn("⚠️ candle fallback mapping applied", {
    offerId,
    askId,
    baseId,
    quoteId,
  });
} else {
  return null;
}

  if (!Number.isFinite(price) || price <= 0) return null;

  const bucketTime = bucketStartIso(row.block_time, interval);
  if (!bucketTime) return null;

  return {
    bucketTime,
    price,
    baseVolumeRaw,
    quoteVolumeRaw,
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
    const url = new URL(_request.url);
    const interval = normalizeInterval(url.searchParams.get("interval"));
    const limit = normalizeLimit(url.searchParams.get("limit"));

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

    const swapsResult = await pool.query<SwapRow>(
      `
      select
        block_time,
        offer_asset_id,
        ask_asset_id,
        offer_amount,
        return_amount,
        tx_hash
      from riodex_swaps
      where pair_address = $1
      order by block_time asc
      `,
      [cleanPairAddress]
    );

    const buckets = new Map<string, CandleAccumulator>();
    let canonicalizedRows = 0;

    for (const row of swapsResult.rows) {
      const normalized = canonicalizeSwap(row, pair, interval);
      if (!normalized) continue;

      canonicalizedRows += 1;

      const existing = buckets.get(normalized.bucketTime);

      if (!existing) {
        buckets.set(normalized.bucketTime, {
          time: normalized.bucketTime,
          open: normalized.price,
          high: normalized.price,
          low: normalized.price,
          close: normalized.price,
          volumeBaseRaw: normalized.baseVolumeRaw,
          volumeQuoteRaw: normalized.quoteVolumeRaw,
          trades: 1,
        });
        continue;
      }

      existing.high = Math.max(existing.high, normalized.price);
      existing.low = Math.min(existing.low, normalized.price);
      existing.close = normalized.price;
      existing.volumeBaseRaw += normalized.baseVolumeRaw;
      existing.volumeQuoteRaw += normalized.quoteVolumeRaw;
      existing.trades += 1;
    }

    const candles = Array.from(buckets.values())
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(-limit)
      .map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volumeOfferDisplay: toDisplay(
          candle.volumeBaseRaw,
          pair.baseAsset.decimals
        ),
        volumeReturnDisplay: toDisplay(
          candle.volumeQuoteRaw,
          pair.quoteAsset.decimals
        ),
        volume: toDisplay(candle.volumeBaseRaw, pair.baseAsset.decimals),
        trades: candle.trades,
      }));

    return NextResponse.json({
      ok: true,
      pairAddress: cleanPairAddress,
      interval,
      limit,
      source: {
        type: "registry_backed_truth",
        database:
          process.env.POSTGRES_DB ||
          process.env.PGDATABASE ||
          process.env.DB_NAME ||
          "spherio_indexer",
        tables: [
          "riodex_swaps",
          "rioex_assets(optional)",
          "rioex_pairs_registry(optional)",
        ],
        quoteConvention: pair.quoteConvention,
        registryMode: pair.source,
      },
      pair: {
        label: pair.displaySymbol,
        baseAssetId: pair.baseAssetId,
        quoteAssetId: pair.quoteAssetId,
        baseSymbol: pair.baseAsset.symbol,
        quoteSymbol: pair.quoteAsset.symbol,
        baseLogoUrl: pair.baseAsset.logoUrl,
        quoteLogoUrl: pair.quoteAsset.logoUrl,
        displaySymbol: pair.displaySymbol,
        canonicalSymbol: pair.canonicalSymbol,
      },
      diagnostics: {
        swapRows: swapsResult.rows.length,
        canonicalizedRows,
        bucketCount: candles.length,
      },
      candles,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to derive RioEx candles.",
      },
      { status: 500 }
    );
  }
}
