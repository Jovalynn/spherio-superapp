import { NextRequest, NextResponse } from "next/server";
import { queryRioMindKg, upsertRioMindKgNode } from "@/lib/riomind/knowledge-graph/kg-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await queryRioMindKg({
      aiLayer: searchParams.get("aiLayer") || searchParams.get("ai_layer") || "shared",
      nodeType: searchParams.get("nodeType") || searchParams.get("node_type") || undefined,
      nodeKey: searchParams.get("nodeKey") || searchParams.get("node_key") || undefined,
      q: searchParams.get("q") || undefined,
      limit: Number(searchParams.get("limit") || 25),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown KG node query error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.nodeType && !body?.node_type) {
      return NextResponse.json({ ok: false, error: "nodeType is required" }, { status: 400 });
    }

    if (!body?.nodeKey && !body?.node_key) {
      return NextResponse.json({ ok: false, error: "nodeKey is required" }, { status: 400 });
    }

    const node = await upsertRioMindKgNode({
      aiLayer: body.aiLayer || body.ai_layer || "shared",
      nodeType: body.nodeType || body.node_type,
      nodeKey: body.nodeKey || body.node_key,
      title: body.title || body.nodeKey || body.node_key,
      description: body.description || "",
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true, node });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown KG node error" }, { status: 500 });
  }
}
