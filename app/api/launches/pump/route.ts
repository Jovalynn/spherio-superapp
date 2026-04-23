import { NextResponse } from "next/server";
import { getPumpLaunchSurfaceState } from "@/lib/launch/authority";

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

export async function GET() {
  try {
    const fallback = getPumpLaunchSurfaceState();

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

          const effectivePrice = toNum(item.market?.effective_price, 0.00053);
          const reserve0 = toNum(item.market?.reserve_0, 0);
          const reserve1 = toNum(item.market?.reserve_1, 0);
          const volume24h = toNum(item.market?.volume_24h, 0);

          const marketCapSeed =
            effectivePrice > 0
              ? Math.max(effectivePrice * 1_000_000_000, 2400)
              : index === 0
                ? 707580
                : index === 1
                  ? 621740
                  : Math.max(2400, 540000 - index * 73000);

          const progressSeed =
            reserve1 > 0
              ? Math.max(8, Math.min(100, Math.round((reserve1 / 62500) * 100)))
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
            marketCapUsd: marketCapSeed,
            progressPercent: progressSeed,
            trend,
            accent,
            _marketMeta: {
              volume24h,
              reserve0,
              reserve1,
              trades24h: item.market?.trades_24h ?? 0,
            },
          };
        });

        const apexLeader = sourceCards[0] ?? fallback.apexLeader;
        const monitorCards = sourceCards.slice(0, 4).map(({ _marketMeta, ...rest }) => rest);
        const newlyLaunched = sourceCards.slice(4, 5).map(({ _marketMeta, ...rest }) => rest);

        return NextResponse.json({
          ok: true,
          source: "indexer_registry_market_bridge",
          state: {
            ...fallback,
            apexLeader: apexLeader ? (({ _marketMeta, ...rest }) => rest)(apexLeader) : fallback.apexLeader,
            monitorCards: monitorCards.length ? monitorCards : fallback.monitorCards,
            newlyLaunched: newlyLaunched.length ? newlyLaunched : fallback.newlyLaunched,
          },
        });
      }
    } catch {
      // fallback below
    }

    return NextResponse.json({
      ok: true,
      state: fallback,
      source: "fallback_authority_shape",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Pump launch surface state.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
