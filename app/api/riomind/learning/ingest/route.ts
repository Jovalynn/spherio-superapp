import { NextRequest, NextResponse } from "next/server";
import { ingestRioMindKnowledge } from "@/lib/riomind/learning/learning-ingestion";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await ingestRioMindKnowledge({
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      surface: body.surface || "nexus",
      sourceType: body.sourceType || body.source_type || "manual",
      sourceId: body.sourceId || body.source_id,
      title: body.title,
      text: body.text || body.content || "",
      ownerUserId: body.ownerUserId || body.owner_user_id || "local-user",
      metadata: body.metadata || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown learning ingestion error" },
      { status: 500 }
    );
  }
}
