import { NextRequest, NextResponse } from "next/server";
import { getRioMindKpiDashboard } from "@/lib/riomind/documents/kpi-dashboard";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const result = await getRioMindKpiDashboard({
      aiLayer: (url.searchParams.get("aiLayer") || "nexus_ai") as any,
      limit: Number(url.searchParams.get("limit") || 1000),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown KPI dashboard error" },
      { status: 500 }
    );
  }
}
