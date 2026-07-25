import { NextRequest, NextResponse } from "next/server";
import { evaluateRioMindPermission } from "@/lib/riomind/guardrails/policy-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.action) {
      return NextResponse.json({ ok: false, error: "action is required" }, { status: 400 });
    }

    const decision = await evaluateRioMindPermission({
      aiLayer: body.aiLayer || body.ai_layer || "shared",
      surface: body.surface || "nexus",
      ownerUserId: body.ownerUserId || body.owner_user_id || "local-user",
      action: body.action,
      resource: body.resource || "",
      role: body.role || "local-owner",
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true, decision });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown guardrail check error" },
      { status: 500 }
    );
  }
}
