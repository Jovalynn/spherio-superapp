import { NextResponse } from "next/server";
import { getPumpLivePolicy } from "../../../../../lib/pump-live/policy";

export const dynamic = "force-dynamic";

export async function GET() {
  const policy = getPumpLivePolicy();

  return NextResponse.json(
    {
      ok: true,
      source: "pump_live_policy_v1",
      policy,
      generatedAt: new Date().toISOString()
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
