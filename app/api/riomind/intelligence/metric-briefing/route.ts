import { NextRequest, NextResponse } from "next/server";
import { getRioMindMetricBriefing } from "@/lib/riomind/intelligence/metric-briefing";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const metricName = url.searchParams.get("metric") || "Revenue";

    const result = await getRioMindMetricBriefing({
      aiLayer: (url.searchParams.get("aiLayer") || "nexus_ai") as any,
      metricName,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown metric briefing error" },
      { status: 500 }
    );
  }
}
