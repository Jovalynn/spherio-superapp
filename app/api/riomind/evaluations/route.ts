import { NextRequest, NextResponse } from "next/server";
import { listRioMindEvaluations } from "@/lib/riomind/evaluations/evaluation-runtime";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const evaluations = await listRioMindEvaluations({
      aiLayer: searchParams.get("aiLayer") || searchParams.get("ai_layer") || "shared",
      limit: Number(searchParams.get("limit") || 25),
    });

    return NextResponse.json({
      ok: true,
      evaluations,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown evaluation list error" },
      { status: 500 }
    );
  }
}
