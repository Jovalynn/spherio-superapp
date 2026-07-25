import { NextRequest, NextResponse } from "next/server";
import { createRioMindVoiceSession, listRioMindVoiceSessions } from "@/lib/riomind/voice/realtime-session";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const sessions = await listRioMindVoiceSessions({
      aiLayer: searchParams.get("aiLayer") || searchParams.get("ai_layer") || "nexus_ai",
      meetingCode: searchParams.get("meetingCode") || searchParams.get("meeting_code") || undefined,
      limit: Number(searchParams.get("limit") || 25),
    });

    return NextResponse.json({ ok: true, sessions });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown voice session list error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const session = await createRioMindVoiceSession({
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      surface: body.surface || "nexus",
      sessionType: body.sessionType || body.session_type || "realtime",
      provider: body.provider,
      meetingCode: body.meetingCode || body.meeting_code,
      ownerUserId: body.ownerUserId || body.owner_user_id || "local-user",
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true, session });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown voice session error" }, { status: 500 });
  }
}
