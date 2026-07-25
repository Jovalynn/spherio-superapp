import { NextRequest, NextResponse } from "next/server";
import { runRioMindStt } from "@/lib/riomind/voice/stt-runtime";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await runRioMindStt({
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      provider: body.provider,
      sessionId: body.sessionId || body.session_id,
      meetingCode: body.meetingCode || body.meeting_code,
      audioTextHint: body.audioTextHint || body.audio_text_hint,
      language: body.language || "en",
      speakerLabel: body.speakerLabel || body.speaker_label || "Speaker",
      metadata: body.metadata || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown STT error" }, { status: 500 });
  }
}
