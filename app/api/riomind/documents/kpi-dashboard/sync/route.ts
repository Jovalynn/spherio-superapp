import { NextRequest, NextResponse } from "next/server";
import { persistRioMindKpiDashboardSummary } from "@/lib/riomind/documents/kpi-dashboard";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const result = await persistRioMindKpiDashboardSummary({
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      limit: body.limit || 1000,
    });

    return NextResponse.json({
      ok: true,
      summary: result.dashboard.summary,
      node: result.node,
      memory: result.memory,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown KPI dashboard sync error" },
      { status: 500 }
    );
  }
}
