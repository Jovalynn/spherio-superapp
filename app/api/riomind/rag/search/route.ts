import { NextRequest, NextResponse } from "next/server";
import { searchRioMindKnowledge } from "@/lib/riomind/rag/rag-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.query) {
      return NextResponse.json({ ok: false, error: "query is required" }, { status: 400 });
    }

    const result = await searchRioMindKnowledge({
      aiLayer: body.aiLayer || body.ai_layer,
      query: body.query,
      limit: body.limit,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
