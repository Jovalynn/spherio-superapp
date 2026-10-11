import { NextResponse } from "next/server";
import { unavailablePumpPrice } from "@/lib/pump/price-authority.mjs";
export const dynamic = "force-dynamic";
export async function GET() {
  // Legacy sample cards and arbitrary reserve conversions are not live monetary data.
  return NextResponse.json({ ...unavailablePumpPrice(), source: "canonical_market_unavailable",
    state: null }, { status: 503 });
}
