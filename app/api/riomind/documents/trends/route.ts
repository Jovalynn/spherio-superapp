import { NextRequest, NextResponse } from "next/server";
import { getRioMindDocumentMetricTrends } from "@/lib/riomind/documents/document-trends";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const result = await getRioMindDocumentMetricTrends({
      aiLayer: (url.searchParams.get("aiLayer") || "nexus_ai") as any,
      metric: url.searchParams.get("metric") || undefined,
      limit: Number(url.searchParams.get("limit") || 100),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown document trends error" },
      { status: 500 }
    );
  }
}
