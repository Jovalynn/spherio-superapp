import { NextRequest, NextResponse } from "next/server";
import { getPrimeLaunchSurfaceState } from "@/lib/launch/authority";
import {
  addLaunchEconomicsBlock,
  enrichEconomicDeep,
  fetchRioPriceContext,
} from "@/lib/rioEconomicEnrichment";

export async function GET(request: NextRequest) {
  try {
    const { origin } = new URL(request.url);
    const rioPrice = await fetchRioPriceContext(origin);

    const state = addLaunchEconomicsBlock(
      enrichEconomicDeep(getPrimeLaunchSurfaceState(), rioPrice),
      rioPrice,
    );

    const standardCreationFeeRusd = 10;
    const standardCreationFeeRio =
      rioPrice.rioRusd && rioPrice.rioRusd > 0
        ? standardCreationFeeRusd / rioPrice.rioRusd
        : null;

    return NextResponse.json({
      ok: true,
      state: {
        ...state,
        authority: {
          issuerGrade: true,
          route: "prime_authority_shape_rusd_enriched",
          marketHandoffTarget: "lp_then_screener_then_trade_then_rioex",
        },
        primeEconomics: {
          creationFeeRio: standardCreationFeeRio,
          creationFeeRusd: standardCreationFeeRusd,
          creationFeeUsd: standardCreationFeeRusd,
          creationFeeUsdt: standardCreationFeeRusd,
          liquidityGrades: {
            minister: {
              label: "Minister",
              minRusd: 500,
              maxRusd: 1000,
              minRio:
                rioPrice.rioRusd && rioPrice.rioRusd > 0
                  ? 500 / rioPrice.rioRusd
                  : null,
              maxRio:
                rioPrice.rioRusd && rioPrice.rioRusd > 0
                  ? 1000 / rioPrice.rioRusd
                  : null,
            },
            seniorMinister: {
              label: "Senior Minister",
              minRusd: 1000,
              maxRusd: 10000,
              minRio:
                rioPrice.rioRusd && rioPrice.rioRusd > 0
                  ? 1000 / rioPrice.rioRusd
                  : null,
              maxRio:
                rioPrice.rioRusd && rioPrice.rioRusd > 0
                  ? 10000 / rioPrice.rioRusd
                  : null,
            },
            primeMinister: {
              label: "Prime Minister",
              minRusd: 10000,
              maxRusd: null,
              minRio:
                rioPrice.rioRusd && rioPrice.rioRusd > 0
                  ? 10000 / rioPrice.rioRusd
                  : null,
              maxRio: null,
            },
          },
          valuationSource: rioPrice.source,
          valuationAuthority: rioPrice.authority,
        },
      },
      valuation: {
        rioRusd: rioPrice.rioRusd,
        rioUsd: rioPrice.rioUsd,
        rioUsdt: rioPrice.rioUsdt,
        source: rioPrice.source,
        authority: rioPrice.authority,
        updatedAt: rioPrice.updatedAt,
      },
      source: "prime_authority_shape_rusd_enriched",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Prime launch surface state.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
