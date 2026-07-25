import { NextRequest, NextResponse } from "next/server";
import { runRioMindTool } from "@/lib/riomind/tools/tool-runtime";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const toolName = String(body?.toolName || body?.tool_name || "").trim();
    if (!toolName) {
      return NextResponse.json({ ok: false, error: "toolName is required" }, { status: 400 });
    }

    const result = await runRioMindTool({
      runId: body.runId || body.run_id || null,
      toolName,
      input: body.input || {},
      aiLayer: body.aiLayer || body.ai_layer || "shared",
      surface: body.surface || "nexus",
      ownerUserId: body.ownerUserId || body.owner_user_id || "local-user",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown tool runtime error" },
      { status: 500 }
    );
  }
}
