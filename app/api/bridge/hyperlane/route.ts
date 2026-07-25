import { NextResponse } from "next/server";
import { getSpherioHyperlaneRegistry } from "@/lib/bridge/hyperlane";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hyperlane: getSpherioHyperlaneRegistry(),
  });
}
