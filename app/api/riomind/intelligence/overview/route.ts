import { NextRequest, NextResponse } from "next/server";
import { getRioMindIntelligenceOverview } from "@/lib/riomind/intelligence/overview";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const result = await getRioMindIntelligenceOverview({
      aiLayer: url.searchParams.get("aiLayer") || "nexus_ai",
      limit: Number(url.searchParams.get("limit") || 8),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown intelligence overview error" },
      { status: 500 }
    );
  }
}
