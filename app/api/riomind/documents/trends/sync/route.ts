import { NextRequest, NextResponse } from "next/server";
import { persistRioMindDocumentMetricTrends } from "@/lib/riomind/documents/document-trends";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const result = await persistRioMindDocumentMetricTrends({
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      metric: body.metric,
      limit: body.limit || 1000,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown document trend sync error" },
      { status: 500 }
    );
  }
}
