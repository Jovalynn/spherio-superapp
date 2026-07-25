import { NextRequest, NextResponse } from "next/server";
import { runRioMindEvaluation } from "@/lib/riomind/evaluations/evaluation-runtime";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.targetType && !body?.target_type) {
      return NextResponse.json({ ok: false, error: "targetType is required" }, { status: 400 });
    }

    const result = await runRioMindEvaluation({
      aiLayer: body.aiLayer || body.ai_layer || "shared",
      targetType: body.targetType || body.target_type,
      targetId: body.targetId || body.target_id,
      target: body.target || {},
      metadata: body.metadata || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown evaluation runtime error" },
      { status: 500 }
    );
  }
}
