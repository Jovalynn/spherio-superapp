import { NextRequest, NextResponse } from "next/server";
import { ingestRioMindDocument } from "@/lib/riomind/rag/rag-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.title || !body?.content) {
      return NextResponse.json({ ok: false, error: "title and content are required" }, { status: 400 });
    }

    const result = await ingestRioMindDocument({
      aiLayer: body.aiLayer || body.ai_layer,
      surface: body.surface,
      ownerUserId: body.ownerUserId || body.owner_user_id,
      title: body.title,
      content: body.content,
      sourceType: body.sourceType || body.source_type,
      sourceUri: body.sourceUri || body.source_uri,
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
