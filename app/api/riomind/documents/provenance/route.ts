import { NextRequest, NextResponse } from "next/server";
import { listRioMindKnowledgeProvenance } from "@/lib/riomind/documents/document-provenance";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const result = await listRioMindKnowledgeProvenance({
      aiLayer: url.searchParams.get("aiLayer") || "nexus_ai",
      sourceId: url.searchParams.get("sourceId") || undefined,
      q: url.searchParams.get("q") || undefined,
      limit: Number(url.searchParams.get("limit") || 50),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown provenance query error" },
      { status: 500 }
    );
  }
}
