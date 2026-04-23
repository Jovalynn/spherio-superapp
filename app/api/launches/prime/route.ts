import { NextResponse } from "next/server";
import { getPrimeLaunchSurfaceState } from "@/lib/launch/authority";

export async function GET() {
  try {
    const state = getPrimeLaunchSurfaceState();

    return NextResponse.json({
      ok: true,
      state: {
        ...state,
        authority: {
          issuerGrade: true,
          route: "prime_authority_shape",
          marketHandoffTarget: "lp_then_screener_then_trade_then_rioex",
        },
      },
      source: "prime_authority_shape",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Prime launch surface state.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
