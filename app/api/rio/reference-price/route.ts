import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TierSymbol = "RUSD" | "USDC" | "USDT";

type ReferenceTier = {
  symbol: TierSymbol;
  priority: "primary" | "secondary" | "tertiary";
  pairAddress: string | null;
  displaySymbol: string | null;
  spot: number | null;
  twap: {
    "5m": number | null;
    "1h": number | null;
    "6h": number | null;
    "24h": number | null;
  };
  rioReserve: number | null;
  quoteReserve: number | null;
  liquidityUsdEstimate: number | null;
  status: "live" | "missing" | "invalid_reserves" | "twap_pending";
  source: string | null;
  updatedAt: string | null;
};

type ReferenceResponse = {
  ok: boolean;
  symbol: "RIO";
  quote: "USD";
  spot: number | null;
  twap: {
    "5m": number | null;
    "1h": number | null;
    "6h": number | null;
    "24h": number | null;
  };
  sourcePair: string | null;
  source: string;
  status:
    | "live"
    | "reserve_spot_only"
    | "partial"
    | "missing_reference_markets"
    | "upstream_reference"
    | "error";
  primary: ReferenceTier;
  secondary: ReferenceTier;
  tertiary: ReferenceTier;
  tiers: ReferenceTier[];
  liquidity: {
    rio: number | null;
    quote: number | null;
    quoteSymbol: TierSymbol | null;
    liquidityUsdEstimate: number | null;
  };
  weighting: "liquidity_weighted";
  warning: string | null;
  updatedAt: string;
  attempted_upstreams?: string[];
  details?: string[];
};

const RIO_DENOM = "urio";
const RUSD_CONTRACT =
  "rio14nurau9scuqhr3sczktx63sr8kdpvwh00zyftamrrn685vex2uus7ne2df";

const TIER_ORDER: Array<{
  symbol: TierSymbol;
  priority: ReferenceTier["priority"];
  aliases: string[];
}> = [
  {
    symbol: "RUSD",
    priority: "primary",
    aliases: ["rusd", "leri", RUSD_CONTRACT.toLowerCase()],
  },
  {
    symbol: "USDC",
    priority: "secondary",
    aliases: [
      "usdc",
      "uusdc",
      ...String(process.env.RIO_REFERENCE_USDC_ASSET_IDS || "")
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    ],
  },
  {
    symbol: "USDT",
    priority: "tertiary",
    aliases: [
      "usdt",
      "uusdt",
      ...String(process.env.RIO_REFERENCE_USDT_ASSET_IDS || "")
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    ],
  },
];

function candidateIndexerBaseUrls() {
  return [
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
    .map((value) => String(value || "").trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const v = text(value);
    if (v) return v;
  }
  return "";
}

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toHumanAmount(value: unknown, decimals = 6): number | null {
  const n = numeric(value);
  if (n === null) return null;
  return n / 10 ** decimals;
}

function normal(value: unknown) {
  return text(value).toLowerCase();
}

function rowArray(payload: any): any[] {
  const rows = payload?.rows || payload?.items || payload?.pairs || payload?.markets || [];
  return Array.isArray(rows) ? rows : [];
}

function splitDisplaySymbols(display: string) {
  return display
    .replaceAll("\\", "/")
    .split("/")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
}

function rowLabels(row: any) {
  const display = firstText(
    row.displaySymbol,
    row.display_symbol,
    row.canonicalSymbol,
    row.canonical_symbol,
  );

  const displayParts = splitDisplaySymbols(display);

  const asset0Id = firstText(
    row.asset0Id,
    row.asset_0_id,
    row.baseAssetId,
    row.base_asset_id,
  );
  const asset1Id = firstText(
    row.asset1Id,
    row.asset_1_id,
    row.quoteAssetId,
    row.quote_asset_id,
  );

  const asset0Type = firstText(
    row.asset0Type,
    row.asset_0_type,
    row.baseAssetType,
    row.base_asset_type,
  );
  const asset1Type = firstText(
    row.asset1Type,
    row.asset_1_type,
    row.quoteAssetType,
    row.quote_asset_type,
  );

  const symbol0 = firstText(
    row.asset0Symbol,
    row.asset_0_symbol,
    row.baseSymbol,
    row.base_symbol,
    row.baseDisplayName,
    row.base_display_name,
    displayParts[0],
    asset0Id,
  ).toUpperCase();

  const symbol1 = firstText(
    row.asset1Symbol,
    row.asset_1_symbol,
    row.quoteSymbol,
    row.quote_symbol,
    row.quoteDisplayName,
    row.quote_display_name,
    displayParts[1],
    asset1Id,
  ).toUpperCase();

  return {
    display,
    asset0Id,
    asset1Id,
    asset0Type,
    asset1Type,
    symbol0,
    symbol1,
  };
}

function isRioSide(assetId: string, assetType: string, symbol: string) {
  const id = assetId.toLowerCase();
  const type = assetType.toLowerCase();
  const sym = symbol.toUpperCase();

  return (
    id === RIO_DENOM ||
    type === "native" && id === RIO_DENOM ||
    sym === "RIO" ||
    sym === "URIO"
  );
}

function matchesTierSide(assetId: string, symbol: string, tier: TierSymbol) {
  const id = assetId.toLowerCase();
  const sym = symbol.toLowerCase();
  const aliases = TIER_ORDER.find((x) => x.symbol === tier)?.aliases || [];
  return aliases.includes(id) || aliases.includes(sym) || sym === tier.toLowerCase();
}

function emptyTier(symbol: TierSymbol, priority: ReferenceTier["priority"]): ReferenceTier {
  return {
    symbol,
    priority,
    pairAddress: null,
    displaySymbol: null,
    spot: null,
    twap: {
      "5m": null,
      "1h": null,
      "6h": null,
      "24h": null,
    },
    rioReserve: null,
    quoteReserve: null,
    liquidityUsdEstimate: null,
    status: "missing",
    source: null,
    updatedAt: null,
  };
}

function resolveTierFromRows(
  rows: any[],
  tier: TierSymbol,
  priority: ReferenceTier["priority"],
): ReferenceTier {
  for (const row of rows) {
    const labels = rowLabels(row);

    const side0IsRio = isRioSide(labels.asset0Id, labels.asset0Type, labels.symbol0);
    const side1IsRio = isRioSide(labels.asset1Id, labels.asset1Type, labels.symbol1);

    const side0IsTier = matchesTierSide(labels.asset0Id, labels.symbol0, tier);
    const side1IsTier = matchesTierSide(labels.asset1Id, labels.symbol1, tier);

    const matches =
      (side0IsRio && side1IsTier) ||
      (side1IsRio && side0IsTier);

    if (!matches) continue;

    const pairAddress = firstText(row.pairAddress, row.pair_address);
    const reserve0 = toHumanAmount(
      row.reserve0Amount ?? row.reserve_0_amount ?? row.reserve0 ?? row.reserve_0,
      6,
    );
    const reserve1 = toHumanAmount(
      row.reserve1Amount ?? row.reserve_1_amount ?? row.reserve1 ?? row.reserve_1,
      6,
    );

    let rioReserve: number | null = null;
    let quoteReserve: number | null = null;

    if (side0IsRio && side1IsTier) {
      rioReserve = reserve0;
      quoteReserve = reserve1;
    } else if (side1IsRio && side0IsTier) {
      rioReserve = reserve1;
      quoteReserve = reserve0;
    }

    const valid =
      rioReserve !== null &&
      quoteReserve !== null &&
      rioReserve > 0 &&
      quoteReserve > 0;

    const spot = valid ? quoteReserve! / rioReserve! : null;
    const liquidityUsdEstimate = valid ? quoteReserve! * 2 : null;

    const status: ReferenceTier["status"] = valid ? "twap_pending" : "invalid_reserves";

    return {
      symbol: tier,
      priority,
      pairAddress: pairAddress || null,
      displaySymbol: labels.display || `RIO / ${tier}`,
      spot,
      twap: {
        "5m": numeric(row.twap5m ?? row.twap_5m) ?? null,
        "1h": numeric(row.twap1h ?? row.twap_1h) ?? null,
        "6h": numeric(row.twap6h ?? row.twap_6h) ?? null,
        "24h": numeric(row.twap24h ?? row.twap_24h) ?? null,
      },
      rioReserve,
      quoteReserve,
      liquidityUsdEstimate,
      status,
      source: firstText(row.source, "riodex_screener"),
      updatedAt: firstText(
        row.liquidityTime,
        row.liquidity_time,
        row.updatedAt,
        row.updated_at,
        row.lastSyncedAt,
        row.last_synced_at,
      ) || null,
    };
  }

  return emptyTier(tier, priority);
}

function weighted(values: Array<{ value: number | null; weight: number | null }>) {
  const usable = values.filter(
    (item) =>
      item.value !== null &&
      item.weight !== null &&
      Number.isFinite(item.value) &&
      Number.isFinite(item.weight) &&
      item.weight > 0,
  ) as Array<{ value: number; weight: number }>;

  if (!usable.length) return null;

  const totalWeight = usable.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;

  return usable.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

function weightedTwap(tiers: ReferenceTier[], key: keyof ReferenceTier["twap"]) {
  return weighted(
    tiers.map((tier) => ({
      value: tier.twap[key],
      weight: tier.liquidityUsdEstimate,
    })),
  );
}

function buildResponseFromTiers(tiers: ReferenceTier[], source: string): ReferenceResponse {
  const primary = tiers.find((tier) => tier.symbol === "RUSD") || emptyTier("RUSD", "primary");
  const secondary = tiers.find((tier) => tier.symbol === "USDC") || emptyTier("USDC", "secondary");
  const tertiary = tiers.find((tier) => tier.symbol === "USDT") || emptyTier("USDT", "tertiary");

  const spot = weighted(
    tiers.map((tier) => ({
      value: tier.spot,
      weight: tier.liquidityUsdEstimate,
    })),
  );

  const twap = {
    "5m": weightedTwap(tiers, "5m"),
    "1h": weightedTwap(tiers, "1h"),
    "6h": weightedTwap(tiers, "6h"),
    "24h": weightedTwap(tiers, "24h"),
  };

  const preferred =
    primary.spot !== null
      ? primary
      : secondary.spot !== null
        ? secondary
        : tertiary.spot !== null
          ? tertiary
          : null;

  const liveTiers = tiers.filter((tier) => tier.spot !== null);
  const anyTwap = Object.values(twap).some((value) => value !== null);

  const status: ReferenceResponse["status"] =
    liveTiers.length === 0
      ? "missing_reference_markets"
      : anyTwap
        ? "live"
        : liveTiers.length < 3
          ? "partial"
          : "reserve_spot_only";

  const warning =
    liveTiers.length === 0
      ? "No RIO reference markets were found. Seed RIO/RUSD, RIO/USDC, or RIO/USDT and index reserves."
      : anyTwap
        ? null
        : "Spot price is reserve-derived. TWAP will activate after market snapshots are indexed.";

  return {
    ok: true,
    symbol: "RIO",
    quote: "USD",
    spot,
    twap,
    sourcePair: preferred?.pairAddress || null,
    source,
    status,
    primary,
    secondary,
    tertiary,
    tiers: [primary, secondary, tertiary],
    liquidity: {
      rio: preferred?.rioReserve ?? null,
      quote: preferred?.quoteReserve ?? null,
      quoteSymbol: preferred?.symbol ?? null,
      liquidityUsdEstimate: preferred?.liquidityUsdEstimate ?? null,
    },
    weighting: "liquidity_weighted",
    warning,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeUpstreamReference(payload: any): ReferenceResponse | null {
  if (!payload || payload.ok === false) return null;

  const hasTiers =
    payload.primary ||
    payload.secondary ||
    payload.tertiary ||
    Array.isArray(payload.tiers);

  if (!hasTiers && payload.spot === undefined && payload.twap === undefined) {
    return null;
  }

  const tiers: ReferenceTier[] = TIER_ORDER.map(({ symbol, priority }) => {
    const sourceTier =
      payload?.[priority] ||
      payload?.[symbol.toLowerCase()] ||
      (Array.isArray(payload.tiers)
        ? payload.tiers.find((tier: any) => text(tier?.symbol).toUpperCase() === symbol)
        : null);

    if (!sourceTier) return emptyTier(symbol, priority);

    return {
      ...emptyTier(symbol, priority),
      ...sourceTier,
      symbol,
      priority,
      twap: {
        "5m": numeric(sourceTier?.twap?.["5m"] ?? sourceTier?.twap5m ?? sourceTier?.twap_5m),
        "1h": numeric(sourceTier?.twap?.["1h"] ?? sourceTier?.twap1h ?? sourceTier?.twap_1h),
        "6h": numeric(sourceTier?.twap?.["6h"] ?? sourceTier?.twap6h ?? sourceTier?.twap_6h),
        "24h": numeric(sourceTier?.twap?.["24h"] ?? sourceTier?.twap24h ?? sourceTier?.twap_24h),
      },
      spot: numeric(sourceTier?.spot),
      rioReserve: numeric(sourceTier?.rioReserve ?? sourceTier?.rio_reserve),
      quoteReserve: numeric(sourceTier?.quoteReserve ?? sourceTier?.quote_reserve),
      liquidityUsdEstimate: numeric(
        sourceTier?.liquidityUsdEstimate ??
          sourceTier?.liquidity_usd_estimate ??
          sourceTier?.liquidityUsd ??
          sourceTier?.liquidity_usd,
      ),
    };
  });

  const response = buildResponseFromTiers(tiers, firstText(payload.source, "indexer_reference_engine"));
  return {
    ...response,
    spot: numeric(payload.spot) ?? response.spot,
    twap: {
      "5m": numeric(payload?.twap?.["5m"] ?? payload?.twap5m ?? payload?.twap_5m) ?? response.twap["5m"],
      "1h": numeric(payload?.twap?.["1h"] ?? payload?.twap1h ?? payload?.twap_1h) ?? response.twap["1h"],
      "6h": numeric(payload?.twap?.["6h"] ?? payload?.twap6h ?? payload?.twap_6h) ?? response.twap["6h"],
      "24h": numeric(payload?.twap?.["24h"] ?? payload?.twap24h ?? payload?.twap_24h) ?? response.twap["24h"],
    },
    status: "upstream_reference",
    warning: payload.warning ?? response.warning,
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  const raw = await response.text();
  let json: any = null;

  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Non-JSON response from ${url} (${response.status})`);
  }

  if (!response.ok || json?.ok === false) {
    throw new Error(json?.error || `Request failed from ${url} (${response.status})`);
  }

  return json;
}

async function tryLoadReferenceFromIndexer(baseUrl: string) {
  const payload = await fetchJson(`${baseUrl}/api/rio/reference-price`);
  return normalizeUpstreamReference(payload);
}

async function tryBuildReferenceFromScreener(baseUrl: string) {
  const payload = await fetchJson(`${baseUrl}/api/riodex/screener?limit=500`);
  const rows = rowArray(payload);

  const tiers = TIER_ORDER.map(({ symbol, priority }) =>
    resolveTierFromRows(rows, symbol, priority),
  );

  return buildResponseFromTiers(tiers, firstText(payload.source, "riodex_screener_fallback"));
}

export async function GET() {
  const errors: string[] = [];
  const attempted = Array.from(new Set(candidateIndexerBaseUrls()));

  for (const baseUrl of attempted) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      // Prefer the dedicated indexer engine when it exists because it can expose true TWAP.
      const upstreamReference = await tryLoadReferenceFromIndexer(baseUrl);
      clearTimeout(timeout);

      if (upstreamReference) {
        return NextResponse.json(upstreamReference, {
          headers: {
            "cache-control": "no-store",
            "x-spherio-upstream": baseUrl,
            "x-spherio-reference-source": "indexer_reference_engine",
          },
        });
      }
    } catch (error: any) {
      clearTimeout(timeout);
      errors.push(`${baseUrl}/api/rio/reference-price :: ${error?.message || "fetch_failed"}`);
    }
  }

  for (const baseUrl of attempted) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      // Fallback: derive reserve spot from the existing RioDex screener pair truth.
      const fallbackReference = await tryBuildReferenceFromScreener(baseUrl);
      clearTimeout(timeout);

      return NextResponse.json(fallbackReference, {
        headers: {
          "cache-control": "no-store",
          "x-spherio-upstream": baseUrl,
          "x-spherio-reference-source": "riodex_screener_reserve_fallback",
        },
      });
    } catch (error: any) {
      clearTimeout(timeout);
      errors.push(`${baseUrl}/api/riodex/screener :: ${error?.message || "fetch_failed"}`);
    }
  }

  return NextResponse.json(
    {
      ok: false,
      symbol: "RIO",
      quote: "USD",
      error: "Failed to load RIO reference price.",
      attempted_upstreams: attempted,
      details: errors,
      updatedAt: new Date().toISOString(),
    },
    { status: 502 },
  );
}
