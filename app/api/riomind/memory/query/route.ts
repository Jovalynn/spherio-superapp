import { NextRequest, NextResponse } from "next/server";
import { queryRioMindLongTermMemory } from "@/lib/riomind/memory/long-term-memory-query";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const question = url.searchParams.get("question") || url.searchParams.get("q") || "";
    const aiLayer = (url.searchParams.get("aiLayer") || "nexus_ai") as any;
    const limit = Number(url.searchParams.get("limit") || 20);

    const result = await queryRioMindLongTermMemory({ question, aiLayer, limit });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown long-term memory query error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await queryRioMindLongTermMemory({
      question: body.question || body.q || "",
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      limit: body.limit || 20,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown long-term memory query error" },
      { status: 500 }
    );
  }
}
