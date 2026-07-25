import { NextRequest, NextResponse } from "next/server";
import { orchestrateRioMindAgents } from "@/lib/riomind/agents/multi-agent-orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const goal = String(body?.goal || "").trim();
    if (!goal) {
      return NextResponse.json({ ok: false, error: "goal is required" }, { status: 400 });
    }

    const result = await orchestrateRioMindAgents({
      aiLayer: body.aiLayer || body.ai_layer || "shared",
      surface: body.surface || "nexus",
      userId: body.userId || body.user_id || "local-user",
      goal,
      agents: Array.isArray(body.agents)
        ? body.agents.map((agent: any) => ({
            id: String(agent.id || agent.name || "agent").trim(),
            name: agent.name,
            role: agent.role,
            goal: String(agent.goal || goal),
            tools: Array.isArray(agent.tools)
              ? agent.tools.map((tool: any) => ({
                  toolName: String(tool.toolName || tool.tool_name || "").trim(),
                  input: tool.input || {},
                })).filter((tool: any) => tool.toolName)
              : [],
          })).filter((agent: any) => agent.id && agent.tools.length)
        : [],
      metadata: body.metadata || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown multi-agent orchestration error" },
      { status: 500 }
    );
  }
}
