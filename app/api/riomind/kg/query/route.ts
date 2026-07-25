import { NextRequest, NextResponse } from "next/server";
import { queryRioMindKg, seedCoreAiKnowledgeGraph } from "@/lib/riomind/knowledge-graph/kg-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    if (searchParams.get("seed") === "coreai") {
      const seeded = await seedCoreAiKnowledgeGraph();
      return NextResponse.json({ ok: true, seeded });
    }

    const result = await queryRioMindKg({
      aiLayer: searchParams.get("aiLayer") || searchParams.get("ai_layer") || "shared",
      nodeType: searchParams.get("nodeType") || searchParams.get("node_type") || undefined,
      nodeKey: searchParams.get("nodeKey") || searchParams.get("node_key") || undefined,
      q: searchParams.get("q") || undefined,
      limit: Number(searchParams.get("limit") || 25),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown KG query error" }, { status: 500 });
  }
}
