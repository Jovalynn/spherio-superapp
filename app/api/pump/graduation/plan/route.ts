import { NextRequest, NextResponse } from "next/server";
import { unavailablePumpPrice } from "@/lib/pump/price-authority.mjs";
import { PUMP_GRADUATION_SEED_RUSD } from "@/lib/pump/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const tokenAddress = typeof body?.tokenAddress === "string" ? body.tokenAddress.trim()
    : typeof body?.token === "string" ? body.token.trim() : "";
  if (!tokenAddress) return NextResponse.json({ ok: false, error: "tokenAddress is required" }, { status: 400 });
  // No DB estimate, caller price, fixed conversion or stale snapshot is eligible.
  // The configured 15,000 RUSD seed policy remains; there is no executable conversion.
  return NextResponse.json({ ...unavailablePumpPrice(), tokenAddress,
    policy: { requiredSeedValueRusd: PUMP_GRADUATION_SEED_RUSD,
      rioReferencePriceRusd: null, requiredSeedRio: null, requiredSeedUrio: null },
    finalizer: { status: "canonical_price_unavailable", canExecuteFreshSeed: false } }, { status: 503 });
}
