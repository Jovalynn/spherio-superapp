import { NextRequest, NextResponse } from "next/server";
import { runRioMindAgentWithTools } from "@/lib/riomind/agents/agent-tool-executor";


function normalizeAgentTools(tools: any[]) {
  return (Array.isArray(tools) ? tools : []).map((tool) => ({
    toolName: String(tool?.toolName || tool?.tool_name || tool?.name || tool?.id || "unknown_tool"),
    input: tool?.input || tool?.args || tool?.arguments || {},
  }));
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const goal = String(body?.goal || "").trim();
    if (!goal) {
      return NextResponse.json({ ok: false, error: "goal is required" }, { status: 400 });
    }

    const tools = Array.isArray(body?.tools) ? body.tools : [];
    if (!tools.length) {
      return NextResponse.json({ ok: false, error: "tools array is required" }, { status: 400 });
    }

    const result = await runRioMindAgentWithTools({
      aiLayer: body.aiLayer || body.ai_layer || "shared",
      surface: body.surface || "nexus",
      userId: body.userId || body.user_id || "local-user",
      goal,
      tools: tools.map((tool: any) => ({
        toolName: String(tool.toolName || tool.tool_name || "").trim(),
        input: tool.input || {},
      })).filter((tool: any) => tool.toolName),
      metadata: body.metadata || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown agent execution error" },
      { status: 500 }
    );
  }
}
