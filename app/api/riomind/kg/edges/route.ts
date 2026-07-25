import { NextRequest, NextResponse } from "next/server";
import { upsertRioMindKgEdge } from "@/lib/riomind/knowledge-graph/kg-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.relation) {
      return NextResponse.json({ ok: false, error: "relation is required" }, { status: 400 });
    }

    const edge = await upsertRioMindKgEdge({
      aiLayer: body.aiLayer || body.ai_layer || "shared",
      fromNodeId: body.fromNodeId || body.from_node_id,
      toNodeId: body.toNodeId || body.to_node_id,
      from: body.from,
      to: body.to,
      relation: body.relation,
      confidence: body.confidence,
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true, edge });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown KG edge error" }, { status: 500 });
  }
}
