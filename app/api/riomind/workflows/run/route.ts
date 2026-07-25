import { NextRequest, NextResponse } from "next/server";
import { runRioMindWorkflow } from "@/lib/riomind/workflows/workflow-runner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const workflowName = String(body?.workflowName || body?.workflow_name || "").trim();
    const definition = body?.definition;

    if (!workflowName && !definition) {
      return NextResponse.json(
        { ok: false, error: "workflowName or definition is required" },
        { status: 400 }
      );
    }

    const result = await runRioMindWorkflow({
      workflowName,
      definition,
      aiLayer: body.aiLayer || body.ai_layer,
      surface: body.surface,
      userId: body.userId || body.user_id || "local-user",
      input: body.input || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown workflow error" },
      { status: 500 }
    );
  }
}
