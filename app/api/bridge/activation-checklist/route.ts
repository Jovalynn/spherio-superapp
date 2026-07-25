import { NextResponse } from "next/server";
import { getBridgeActivationChecklist } from "@/lib/bridge/activation-checklist";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    activation: getBridgeActivationChecklist(),
  });
}
