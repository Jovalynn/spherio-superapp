import { NextRequest, NextResponse } from "next/server";
import { createRioMindAgentRun } from "@/lib/riomind/agents/agent-runtime";
import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool } from "@/lib/riomind/ai-foundation/db";

export async function GET() {
  try {
    await ensureRioMindAiFoundationSchema();
    const result = await getRioMindAiFoundationPool().query(
      `SELECT * FROM riomind_agent_runs ORDER BY created_at DESC LIMIT 25`
    );
    return NextResponse.json({ ok: true, runs: result.rows });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.goal) {
      return NextResponse.json({ ok: false, error: "goal is required" }, { status: 400 });
    }

    const run = await createRioMindAgentRun({
      aiLayer: body.aiLayer || body.ai_layer,
      surface: body.surface,
      userId: body.userId || body.user_id,
      goal: body.goal,
      plan: body.plan || [],
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true, run });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
