import { NextRequest, NextResponse } from "next/server";
import { getRioMindRelationshipClusters } from "@/lib/riomind/intelligence/relationship-clusters";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const result = await getRioMindRelationshipClusters({
      aiLayer: url.searchParams.get("aiLayer") || "nexus_ai",
      q: url.searchParams.get("q") || "",
      type: url.searchParams.get("type") || "all",
      limit: Number(url.searchParams.get("limit") || 50),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown cluster intelligence error" },
      { status: 500 }
    );
  }
}
