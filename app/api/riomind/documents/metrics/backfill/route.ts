import { NextRequest, NextResponse } from "next/server";
import { backfillRioMindMetricProvenanceToKg } from "@/lib/riomind/documents/metric-backfill";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const result = await backfillRioMindMetricProvenanceToKg({
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      sourceId: body.sourceId || body.source_id,
      limit: body.limit || 500,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown metric backfill error" },
      { status: 500 }
    );
  }
}
