import { SPHERIO_FEE_POLICY, SPHERIO_TREASURY_MULTISIG } from "@/lib/protocol/treasury";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_PAIR_ADDR =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";

const RIO_DENOM = "urio";

function treasuryPolicyPayload() {
  return {
    feeRecipient: SPHERIO_TREASURY_MULTISIG,
    treasuryRecipient: SPHERIO_TREASURY_MULTISIG,
    feePolicy: SPHERIO_FEE_POLICY.policy,
    feePolicySource: SPHERIO_FEE_POLICY.source,
  };
}

const DEFAULT_DECIMALS = 6;
const DEFAULT_MAX_SPREAD = "0.01";

function toBaseUnits(displayAmount: string, decimals = DEFAULT_DECIMALS) {
  const n = Number(displayAmount || "0");
  if (!Number.isFinite(n) || n <= 0) return "0";
  return String(Math.floor(n * 10 ** decimals));
}

function isNativeAsset(assetId: string, assetType?: string | null) {
  return assetType === "native" || assetId === RIO_DENOM || assetId === "urio";
}

function makeAssetInfo(assetId: string, assetType?: string | null) {
  if (isNativeAsset(assetId, assetType)) {
    return {
      native_token: {
        denom: assetId,
      },
    };
  }

  return {
    token: {
      contract_addr: assetId,
    },
  };
}


function isMismatchedFallback(simulation: any) {
  const warning = String(simulation?.warning || simulation?.error || "").toLowerCase();
  const mode = String(simulation?.mode || "").toLowerCase();

  return Boolean(
    simulation?.fallback === true &&
      (
        warning.includes("asset mismatch") ||
        warning.includes("unknown request") ||
        mode.includes("reserve_fallback")
      )
  );
}




const RIOLIGHT_QUOTE_CACHE_TTL_MS = 2 * 60_000;

type RioLightQuoteCacheEntry = {
  expiresAt: number;
  payload: any;
};

const riolightQuoteCache: Map<string, RioLightQuoteCacheEntry> =
  (globalThis as any).__riolightQuoteCache || new Map<string, RioLightQuoteCacheEntry>();

(globalThis as any).__riolightQuoteCache = riolightQuoteCache;

function makeRioLightQuoteCacheKey(input: {
  pairAddress: string;
  fromAssetId: string;
  toAssetId: string;
  amountIn: string;
}) {
  return [
    input.pairAddress,
    input.fromAssetId,
    input.toAssetId,
    input.amountIn,
  ].join("|");
}

function getCachedRioLightQuote(key: string) {
  const cached = riolightQuoteCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    riolightQuoteCache.delete(key);
    return null;
  }

  return cached.payload;
}

function setCachedRioLightQuote(key: string, payload: any) {
  riolightQuoteCache.set(key, {
    expiresAt: Date.now() + RIOLIGHT_QUOTE_CACHE_TTL_MS,
    payload,
  });
}


function formatCaughtError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}

function normalizeAssetId(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "spherio-native-rio") return RIO_DENOM;
  return raw;
}

function getPairAddressFromRow(row: any) {
  return String(row?.pairAddress || row?.pair_address || row?.pair || row?.address || "").trim();
}

function getPairAsset0(row: any) {
  return normalizeAssetId(row?.asset0Id || row?.asset_0_id || row?.baseAssetId || row?.base_asset_id || row?.token0 || row?.token_0);
}

function getPairAsset1(row: any) {
  return normalizeAssetId(row?.asset1Id || row?.asset_1_id || row?.quoteAssetId || row?.quote_asset_id || row?.token1 || row?.token_1);
}

function pairMatches(row: any, fromAssetId: string, toAssetId: string) {
  const a0 = getPairAsset0(row);
  const a1 = getPairAsset1(row);
  const from = normalizeAssetId(fromAssetId);
  const to = normalizeAssetId(toAssetId);

  return Boolean(
    getPairAddressFromRow(row) &&
      (
        (a0 === from && a1 === to) ||
        (a0 === to && a1 === from)
      )
  );
}


const RIOLIGHT_PAIR_CACHE_TTL_MS = 10 * 60_000;

type RioLightPairCacheEntry = {
  expiresAt: number;
  pair: any;
};

const riolightPairCache: Map<string, RioLightPairCacheEntry> =
  (globalThis as any).__riolightPairCache || new Map<string, RioLightPairCacheEntry>();

(globalThis as any).__riolightPairCache = riolightPairCache;

function makeRioLightPairCacheKey(fromAssetId: string, toAssetId: string) {
  return [fromAssetId, toAssetId].sort().join("|");
}

function getCachedRioLightPair(fromAssetId: string, toAssetId: string) {
  const key = makeRioLightPairCacheKey(fromAssetId, toAssetId);
  const cached = riolightPairCache.get(key);

  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    riolightPairCache.delete(key);
    return null;
  }

  return cached.pair;
}

function setCachedRioLightPair(fromAssetId: string, toAssetId: string, pair: any) {
  const key = makeRioLightPairCacheKey(fromAssetId, toAssetId);
  riolightPairCache.set(key, {
    expiresAt: Date.now() + RIOLIGHT_PAIR_CACHE_TTL_MS,
    pair,
  });
}


async function resolveRioDexPairAddress(origin: string, fromAssetId: string, toAssetId: string) {
  const cachedPair = getCachedRioLightPair(fromAssetId, toAssetId);
  if (cachedPair?.pairAddress) {
    return {
      ...cachedPair,
      source: "memory_pair_cache",
    };
  }

  const pairSources = [
    `${origin}/api/v1/riodex/pairs?limit=1000`,
    "https://app.spheriochain.io/api/v1/riodex/pairs?limit=1000",
    "https://api.spheriochain.io/api/v1/riodex/pairs?limit=1000",
  ];

  for (const url of pairSources) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      });

      if (!res.ok) {
        continue;
      }

      const payload = await res.json().catch(() => null);
      const rows = Array.isArray(payload?.pairs)
        ? payload.pairs
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.rows)
            ? payload.rows
            : Array.isArray(payload?.markets)
              ? payload.markets
              : Array.isArray(payload)
                ? payload
                : [];

      const match = rows.find((row: any) => pairMatches(row, fromAssetId, toAssetId));

      if (!match) {
        continue;
      }

      const resolved = {
        pairAddress: getPairAddressFromRow(match),
        asset0Id: getPairAsset0(match),
        asset1Id: getPairAsset1(match),
        asset0Type: getPairAsset0(match) === RIO_DENOM ? "native" : "token",
        asset1Type: getPairAsset1(match) === RIO_DENOM ? "native" : "token",
        source: url.includes("api.spheriochain.io")
          ? "api_spheriochain_riodex_pairs"
          : url.includes("app.spheriochain.io")
            ? "app_spheriochain_riodex_pairs"
            : "request_origin_riodex_pairs",
        raw: match,
      };

      setCachedRioLightPair(fromAssetId, toAssetId, resolved);

      return resolved;
    } catch {
      continue;
    }
  }

  return null;
}

function getRequestOrigin(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host");

  if (host) {
    return `${forwardedProto || "http"}://${host}`;
  }

  return req.nextUrl.origin;
}

function asPositiveAmount(value: unknown) {
  const amount = String(value ?? "0").trim();
  const n = Number(amount);
  return Number.isFinite(n) && n > 0 ? amount : "0";
}

export async function POST(req: NextRequest) {
  let quoteStage = "start";

  try {
    const body = await req.json();

    const explicitPairAddress = String(
      body?.pairAddress || body?.pair || body?.pool || ""
    ).trim();

    let pairAddress = explicitPairAddress || DEFAULT_PAIR_ADDR;

    const amountIn = asPositiveAmount(
      body?.amountIn ?? body?.amount ?? body?.displayAmountIn
    );

    const asset0Id = String(body?.asset0Id || body?.asset_0_id || RIO_DENOM);
    const asset1Id = String(body?.asset1Id || body?.asset_1_id || "");

    const asset0Type = body?.asset0Type || body?.asset_0_type || "native";
    const asset1Type = body?.asset1Type || body?.asset_1_type || "token";

    const fromAssetId = String(
      body?.fromAssetId || body?.from || body?.fromToken || asset0Id
    );

    const toAssetId = String(
      body?.toAssetId ||
        body?.to ||
        body?.toToken ||
        (fromAssetId === asset0Id ? asset1Id : asset0Id)
    );

    const fromAssetType =
      body?.fromAssetType || (fromAssetId === asset0Id ? asset0Type : asset1Type);

    const toAssetType =
      body?.toAssetType || (toAssetId === asset0Id ? asset0Type : asset1Type);

    const maxSpread = String(body?.maxSpread || body?.max_spread || DEFAULT_MAX_SPREAD);

    const origin = getRequestOrigin(req);

    quoteStage = "resolve_pair";

    const resolvedPair = explicitPairAddress
      ? null
      : await resolveRioDexPairAddress(origin, fromAssetId, toAssetId);

    if (resolvedPair?.pairAddress) {
      pairAddress = resolvedPair.pairAddress;
    }

    const effectiveAsset0Id = resolvedPair?.asset0Id || asset0Id;
    const effectiveAsset1Id = resolvedPair?.asset1Id || asset1Id;
    const effectiveAsset0Type = resolvedPair?.asset0Type || asset0Type;
    const effectiveAsset1Type = resolvedPair?.asset1Type || asset1Type;

    if (!explicitPairAddress && !resolvedPair?.pairAddress && pairAddress === DEFAULT_PAIR_ADDR) {
      return NextResponse.json(
        {
          ok: true,
          quoteAvailable: false,
          mode: "pair_not_resolved",
          pairAddress: "",
          fromAssetId,
          toAssetId,
          amountIn,
          amountOut: "0",
          displayAmountIn: amountIn,
          displayAmountOut: "0",
          feeBps: 0,
          routeLabel: "RioLight → RioDex",
          ...treasuryPolicyPayload(),
          execution: null,
          error: "No verified RioDex pair is available for the selected assets.",
        },
        { status: 200 }
      );
    }

    if (!pairAddress || !fromAssetId || !toAssetId || !amountIn || amountIn === "0") {
      return NextResponse.json(
        {
          ok: true,
          quoteAvailable: false,
          mode: "empty",
          pairAddress,
          fromAssetId,
          toAssetId,
          amountIn,
          amountOut: "0",
          displayAmountIn: amountIn,
          displayAmountOut: "0",
          feeBps: 0,
          routeLabel: "RioLight → RioDex",
          ...treasuryPolicyPayload(),
          execution: null,
        },
        { status: 200 }
      );
    }

    const quoteCacheKey = makeRioLightQuoteCacheKey({
      pairAddress,
      fromAssetId,
      toAssetId,
      amountIn,
    });

    const cachedQuote = getCachedRioLightQuote(quoteCacheKey);
    if (cachedQuote?.quoteAvailable) {
      return NextResponse.json({
        ...cachedQuote,
        cache: {
          hit: true,
          ttlMs: RIOLIGHT_QUOTE_CACHE_TTL_MS,
        },
      });
    }

      quoteStage = "cpmm_quote_fetch";

      const slippagePct = String(body?.slippagePct || body?.slippage_pct || "0.5");

      const cpmmQuoteUrls = [
        process.env.SPHERIO_INTERNAL_SUPERAPP_ORIGIN
          ? `${process.env.SPHERIO_INTERNAL_SUPERAPP_ORIGIN}/api/riodex/cpmm/quote`
          : null,
        `${origin}/api/riodex/cpmm/quote`,
        "https://app.spheriochain.io/api/riodex/cpmm/quote",
      ].filter(Boolean) as string[];

      const cpmmAttempts: Array<{ url: string; ok: boolean; status?: number; error?: string }> = [];
      let cpmmRes: Response | null = null;
      let cpmmUrl = "";
      let cpmmQuote: any = null;

      for (const baseUrl of cpmmQuoteUrls) {
        const url =
          `${baseUrl}?pair=${encodeURIComponent(pairAddress)}` +
          `&from=${encodeURIComponent(fromAssetId)}` +
          `&amount=${encodeURIComponent(amountIn)}` +
          `&slippagePct=${encodeURIComponent(slippagePct)}`;

        try {
          const res = await fetch(url, {
            method: "GET",
            cache: "no-store",
            headers: {
              accept: "application/json",
            },
          });

          cpmmAttempts.push({ url, ok: res.ok, status: res.status });
          cpmmRes = res;
          cpmmUrl = url;

          const raw = await res.text();

          try {
            cpmmQuote = raw ? JSON.parse(raw) : null;
          } catch {
            cpmmQuote = null;
          }

          if (res.ok && cpmmQuote?.ok) {
            break;
          }
        } catch (error: any) {
          cpmmAttempts.push({
            url,
            ok: false,
            error: error?.message || "fetch failed",
          });
        }
      }

      if (!cpmmRes || !cpmmQuote) {
        return NextResponse.json(
          {
            ok: false,
            quoteAvailable: false,
            error: "RioDex CPMM quote fetch failed.",
            stage: quoteStage,
            pairAddress,
            fromAssetId,
            toAssetId,
            cpmmAttempts,
          },
          { status: 502 }
        );
      }

      if (!cpmmRes.ok || !cpmmQuote?.ok) {
        return NextResponse.json(
          {
            ok: true,
            quoteAvailable: false,
            mode: "cpmm_quote_unavailable",
            pairAddress,
            fromAssetId,
            toAssetId,
            amountIn,
            amountOut: "0",
            displayAmountIn: amountIn,
            displayAmountOut: "0",
            feeBps: 0,
            routeLabel: "RioLight → RioDex CPMM",
            ...treasuryPolicyPayload(),
            execution: null,
            error:
              cpmmQuote?.error ||
              cpmmQuote?.message ||
              `RioDex CPMM quote failed with status ${cpmmRes.status}.`,
            cpmmQuote,
            cpmmUrl,
            cpmmAttempts,
          },
          { status: 200 }
        );
      }

      const amountOut = String(cpmmQuote?.amountOut ?? "0");
      const quoteAvailable = Number(amountOut) > 0;

      const offerAssetInfo = makeAssetInfo(fromAssetId, fromAssetType);
      const askAssetInfo = makeAssetInfo(toAssetId, toAssetType);
      const offerAmountBaseUnits = toBaseUnits(amountIn);

      const responsePayload = {
        ok: true,
        quoteAvailable,
        mode: cpmmQuote?.source || "spherio_cpmm_pool_truth",
        source: "spherio_cpmm_pool_truth",
        invariant: cpmmQuote?.invariant || "x*y=k",
        pairAddress,
        fromAssetId,
        toAssetId,
        amountIn,
        amountOut,
        minimumOut: cpmmQuote?.minimumOut,
        displayAmountIn: amountIn,
        displayAmountOut: amountOut,
        feeAmount: cpmmQuote?.feeAmount,
        feeBps: Number(cpmmQuote?.feeBps ?? body?.feeBps ?? body?.fee_bps ?? 30),
        routeLabel: "RioLight → RioDex CPMM",
        direction: cpmmQuote?.direction,
        spotPrice: cpmmQuote?.spotPrice,
        executionPrice: cpmmQuote?.executionPrice,
        priceImpactPct: cpmmQuote?.priceImpactPct,
        reserves: cpmmQuote?.reserves,
        proof: cpmmQuote?.proof,
        ...treasuryPolicyPayload(),
        execution: quoteAvailable
          ? {
              kind: "riodex_pair_swap",
              pairAddress,
              offerAssetInfo,
              askAssetInfo,
              offerAmountBaseUnits,
              maxSpread,
              ...treasuryPolicyPayload(),
            }
          : null,
        cpmmQuote,
        cpmmUrl,
        cache: {
          hit: false,
          ttlMs: RIOLIGHT_QUOTE_CACHE_TTL_MS,
        },
      };

      if (quoteAvailable) {
        setCachedRioLightQuote(quoteCacheKey, responsePayload);
      }

      return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        quoteAvailable: false,
        error: error?.message || "Failed to create RioLight swap quote.",
        stage: quoteStage,
        diagnostic: formatCaughtError(error),
      },
      { status: 500 }
    );
  }
}
