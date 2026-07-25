import { NextRequest, NextResponse } from "next/server";
import { getRioMindEvidenceBundle } from "@/lib/riomind/intelligence/evidence-engine";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const result = await getRioMindEvidenceBundle({
      aiLayer: url.searchParams.get("aiLayer") || "nexus_ai",
      metric: url.searchParams.get("metric") || undefined,
      q: url.searchParams.get("q") || undefined,
      limit: Number(url.searchParams.get("limit") || 12),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown evidence error" },
      { status: 500 }
    );
  }
}
