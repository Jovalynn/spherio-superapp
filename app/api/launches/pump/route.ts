import { NextRequest, NextResponse } from "next/server";
import { getPumpLaunchSurfaceState } from "@/lib/launch/authority";
import {
  addLaunchEconomicsBlock,
  enrichEconomicDeep,
  fetchRioPriceContext,
} from "@/lib/rioEconomicEnrichment";

type IndexerSpo20Item = {
  asset_id: string;
  token_address: string;
  contract_address: string;
  symbol: string;
  display_name: string;
  decimals: number;
  logo: string | null;
  asset_type: string;
  explorer_route: string;
  creator: string | null;
  height: number | null;
  created_at: string | null;
  is_verified: boolean;
  is_tradeable: boolean;
  is_canonical: boolean;
  source: string;
  market?: {
    pair_address: string | null;
    display_symbol: string | null;
    pair_created_time: string | null;
    effective_price: string | null;
    last_trade_time: string | null;
    reserve_0: string | null;
    reserve_1: string | null;
    total_share: string | null;
    trades_24h: number;
    volume_24h: string;
  } | null;
};

type IndexerSpo20Response = {
  ok: boolean;
  count?: number;
  registry_present?: boolean;
  items?: IndexerSpo20Item[];
};

function getIndexerBaseUrl() {
  return (
    process.env.INTERNAL_INDEXER_URL ||
    process.env.INDEXER_URL ||
    "http://indexer:4000"
  );
}

function buildAgeLabel(index: number, createdAt?: string | null) {
  if (createdAt) {
    const diffMs = Date.now() - new Date(createdAt).getTime();

    if (Number.isFinite(diffMs) && diffMs >= 0) {
      const minutes = Math.max(1, Math.floor(diffMs / 60000));

      if (minutes < 60) return `${minutes}m`;

      const hours = Math.floor(minutes / 60);

      if (hours < 24) return `${hours}h`;

      const days = Math.floor(hours / 24);
      return `${days}d`;
    }
  }

  const labels = ["3m", "7m", "12m", "18m", "25m", "41m"];
  return labels[index] ?? `${(index + 1) * 5}m`;
}

function toNum(value: string | number | null | undefined, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function baseToHuman(value: string | number | null | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;

  // Most RioDex/indexer reserve fields are base units.
  return Math.abs(n) >= 1_000_000 ? n / 1_000_000 : n;
}

export async function GET(request: NextRequest) {
  try {
    const { origin } = new URL(request.url);
    const rioPrice = await fetchRioPriceContext(origin);
    const fallback = addLaunchEconomicsBlock(
      enrichEconomicDeep(getPumpLaunchSurfaceState(), rioPrice),
      rioPrice,
    );

    try {
      const response = await fetch(`${getIndexerBaseUrl()}/api/spo20`, {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as IndexerSpo20Response;

      if (response.ok && data.ok && Array.isArray(data.items) && data.items.length > 0) {
        const sourceCards = data.items.slice(0, 6).map((item, index) => {
          const accent = fallback.monitorCards[index % fallback.monitorCards.length]?.accent ?? "mint";
          const trend = index === 0 ? "hot" : index === 1 ? "ready" : "watch";

          const effectivePriceRio = toNum(item.market?.effective_price, 0.00053);
          const reserve0Rio = baseToHuman(item.market?.reserve_0);
          const reserve1Token = baseToHuman(item.market?.reserve_1);
          const volume24hRio = baseToHuman(item.market?.volume_24h);

          const marketCapRio =
            effectivePriceRio > 0
              ? Math.max(effectivePriceRio * 1_000_000_000, 2400)
              : index === 0
                ? 707580
                : index === 1
                  ? 621740
                  : Math.max(2400, 540000 - index * 73000);

          const priceRusd =
            rioPrice.rioRusd !== null ? effectivePriceRio * rioPrice.rioRusd : null;
          const marketCapRusd =
            rioPrice.rioRusd !== null ? marketCapRio * rioPrice.rioRusd : null;
          const liquidityRusd =
            rioPrice.rioRusd !== null ? reserve0Rio * rioPrice.rioRusd : null;
          const volume24hRusd =
            rioPrice.rioRusd !== null ? volume24hRio * rioPrice.rioRusd : null;

          const progressSeed =
            reserve1Token > 0
              ? Math.max(8, Math.min(100, Math.round((reserve1Token / 65000) * 100)))
              : index === 0
                ? 76
                : index === 1
                  ? 68
                  : Math.max(18, 56 - index * 7);

          return {
            id: item.asset_id,
            rail: "pump" as const,
            tokenAddress: item.token_address,
            tokenName: item.display_name,
            symbol: item.symbol,
            logoUrl: item.logo || undefined,
            ageLabel: buildAgeLabel(index, item.created_at ?? item.market?.pair_created_time ?? null),

            // Legacy USD field is unavailable without independent USD pricing.
            marketCapUsd: null,

            marketCapRio,
            marketCapRusd,
            marketCapUsdt: null,
            priceRio: effectivePriceRio,
            priceRusd,
            priceUsd: null,
            priceUsdt: null,
            liquidityRio: reserve0Rio,
            liquidityRusd,
            liquidityUsd: null,
            liquidityUsdt: null,
            volume24hRio,
            volume24hRusd,
            volume24hUsd: null,
            volume24hUsdt: null,

            progressPercent: progressSeed,
            trend,
            accent,
            valuationStatus: rioPrice.rioRusd !== null ? "priced" : "unpriced",
            valuationSource: rioPrice.source,
            valuationAuthority: rioPrice.authority,
            _marketMeta: {
              volume24h: volume24hRio,
              volume24hRio,
              volume24hRusd,
              reserve0: reserve0Rio,
              reserve1: reserve1Token,
              trades24h: item.market?.trades_24h ?? 0,
              rioPrice,
            },
          };
        });

        const apexLeader = sourceCards[0] ?? fallback.apexLeader;
        const monitorCards = sourceCards.slice(0, 4).map(({ _marketMeta, ...rest }) => rest);
        const newlyLaunched = sourceCards.slice(4, 5).map(({ _marketMeta, ...rest }) => rest);

        return NextResponse.json({
          ok: true,
          source: "indexer_registry_market_bridge_rusd_enriched",
          valuation: {
            rioRusd: rioPrice.rioRusd,
            rioUsd: rioPrice.rioUsd,
            rioUsdt: rioPrice.rioUsdt,
            source: rioPrice.source,
            authority: rioPrice.authority,
            updatedAt: rioPrice.updatedAt,
          },
          state: addLaunchEconomicsBlock(
            {
              ...fallback,
              apexLeader: apexLeader ? (({ _marketMeta, ...rest }) => rest)(apexLeader) : fallback.apexLeader,
              monitorCards: monitorCards.length ? monitorCards : fallback.monitorCards,
              newlyLaunched: newlyLaunched.length ? newlyLaunched : fallback.newlyLaunched,
            },
            rioPrice,
          ),
        });
      }
    } catch {
      // fallback below
    }

    return NextResponse.json({
      ok: true,
      state: fallback,
      source: "fallback_authority_shape_rusd_enriched",
      valuation: {
        rioRusd: rioPrice.rioRusd,
        rioUsd: rioPrice.rioUsd,
        rioUsdt: rioPrice.rioUsdt,
        source: rioPrice.source,
        authority: rioPrice.authority,
        updatedAt: rioPrice.updatedAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Pump launch surface state.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
