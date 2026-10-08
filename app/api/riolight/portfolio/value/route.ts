import { NextRequest, NextResponse } from "next/server";
import {
  RioValuationResponse,
  ValuedPortfolio,
  asNumber,
  valuePortfolioWithRioPrice,
} from "@/lib/rioValuation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidRioAddress(address: string): boolean {
  return /^rio1[a-z0-9]{20,90}$/i.test(address);
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  const text = await response.text();

  try {
    const json = text ? JSON.parse(text) : null;
    return {
      ok: response.ok,
      status: response.status,
      json,
      text,
    };
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      json: null,
      text,
    };
  }
}

function isLikelySpo20Asset(asset: any): boolean {
  const kind = String(asset?.kind ?? "").toLowerCase();
  const assetId = String(asset?.asset_id ?? "").trim();

  if (kind === "spo20") return true;
  if (/^rio1[a-z0-9]{20,90}$/i.test(assetId)) return true;

  return false;
}

async function enrichSpo20Assets(params: {
  origin: string;
  portfolio: ValuedPortfolio;
}): Promise<ValuedPortfolio> {
  const { origin, portfolio } = params;

  const rioPriceRusd = portfolio.valuation?.price?.rio?.rusd ?? null;

  if (!rioPriceRusd || rioPriceRusd <= 0) {
    return portfolio;
  }

  const enrichedAssets = await Promise.all(
    portfolio.assets.map(async (asset) => {
      if (!isLikelySpo20Asset(asset)) {
        return asset;
      }

      // Already priced by base logic.
      if (asset.valuation_status === "priced") {
        return asset;
      }

      try {
        const valuationUrl = `${origin}/api/spo20/valuation?asset=${encodeURIComponent(
          asset.asset_id,
        )}`;

        const result = await fetchJson(valuationUrl);

        if (!result.ok || !result.json?.ok) {
          return {
            ...asset,
            valuation_source: "spo20_cpmm_unpriced",
            valuation_status: "unpriced" as const,
          };
        }

        const priceRio = asNumber(result.json?.price?.asset?.rio);
        const priceRusd = asNumber(result.json?.price?.asset?.rusd);

        if (!priceRio || priceRio <= 0) {
          return {
            ...asset,
            valuation_source: "spo20_cpmm_unpriced",
            valuation_status: "unpriced" as const,
          };
        }

        const valueRio = asset.amount * priceRio;
        const valueRusd =
          priceRusd && priceRusd > 0
            ? asset.amount * priceRusd
            : valueRio * rioPriceRusd;
        const priceUsd = asNumber(result.json?.price?.asset?.usd);
        const priceUsdt = asNumber(result.json?.price?.asset?.usdt);

        return {
          ...asset,
          value_rio: valueRio,
          value_rusd: valueRusd,
          value_usd: priceUsd !== null ? asset.amount * priceUsd : null,
          value_usdt: priceUsdt !== null ? asset.amount * priceUsdt : null,
          valuation_source: "spo20_riodex_cpmm",
          valuation_status: "priced" as const,
        };
      } catch {
        return {
          ...asset,
          valuation_source: "spo20_cpmm_error",
          valuation_status: "unpriced" as const,
        };
      }
    }),
  );

  const completeTotal = (values: Array<number | null>) =>
    values.every((value) => value !== null)
      ? values.reduce<number>((sum, value) => sum + (value as number), 0)
      : null;

  const totalRusd = completeTotal(enrichedAssets.map((asset) => asset.value_rusd));
  const totalUsd = completeTotal(enrichedAssets.map((asset) => asset.value_usd));
  const totalUsdt = completeTotal(enrichedAssets.map((asset) => asset.value_usdt));
  const totalRio = completeTotal(enrichedAssets.map((asset) => asset.value_rio));

  return {
    ...portfolio,
    totals: {
      rio: Number.isFinite(totalRio) ? totalRio : null,
      rusd: totalRusd,
      usd: totalUsd,
      usdt: totalUsdt,
      btc: null,
    },
    assets: enrichedAssets,
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const address = String(searchParams.get("address") ?? "").trim();

  if (!address || !isValidRioAddress(address)) {
    return NextResponse.json(
      {
        ok: false,
        error: "A valid rio1 wallet address is required.",
        expected: "/api/riolight/portfolio/value?address=rio1...",
      },
      { status: 400 },
    );
  }

  try {
    const portfolioUrl = `${origin}/api/riolight/portfolio?address=${encodeURIComponent(address)}`;
    const valuationUrl = `${origin}/api/rioex/valuation/rio`;

    const [portfolioResult, valuationResult] = await Promise.all([
      fetchJson(portfolioUrl),
      fetchJson(valuationUrl),
    ]);

    if (!portfolioResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to load RioLight portfolio source.",
          portfolio_status: portfolioResult.status,
          portfolio_response: portfolioResult.json ?? portfolioResult.text,
        },
        { status: 502 },
      );
    }

    if (!valuationResult.ok || !valuationResult.json?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to load RIO valuation source.",
          valuation_status: valuationResult.status,
          valuation_response: valuationResult.json ?? valuationResult.text,
          portfolio_response: portfolioResult.json,
        },
        { status: 502 },
      );
    }

    const baseValued = valuePortfolioWithRioPrice({
      address,
      rawPortfolio: portfolioResult.json,
      valuation: valuationResult.json as RioValuationResponse,
    });

    const enriched = await enrichSpo20Assets({
      origin,
      portfolio: baseValued,
    });

    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    console.error("[/api/riolight/portfolio/value] failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown RioLight portfolio valuation error",
      },
      { status: 500 },
    );
  }
}
