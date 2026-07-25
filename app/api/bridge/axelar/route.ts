import { NextResponse } from "next/server";
import { getSpherioAxelarRegistry } from "@/lib/bridge/axelar";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    axelar: getSpherioAxelarRegistry(),
  });
}
