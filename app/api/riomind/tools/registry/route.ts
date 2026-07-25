import { NextRequest, NextResponse } from "next/server";
import { listRioMindTools, registerRioMindTool } from "@/lib/riomind/tools/tool-registry";

export async function GET() {
  try {
    const tools = await listRioMindTools();
    return NextResponse.json({ ok: true, tools });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name) {
      return NextResponse.json({ ok: false, error: "name is required" }, { status: 400 });
    }

    const tool = await registerRioMindTool({
      name: body.name,
      description: body.description,
      aiLayer: body.aiLayer || body.ai_layer,
      permissionScope: body.permissionScope || body.permission_scope,
      schema: body.schema || {},
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true, tool });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
