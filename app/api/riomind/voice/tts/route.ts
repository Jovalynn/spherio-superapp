import { NextRequest, NextResponse } from "next/server";
import { runRioMindTts } from "@/lib/riomind/voice/tts-runtime";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.text) {
      return NextResponse.json({ ok: false, error: "text is required" }, { status: 400 });
    }

    const result = await runRioMindTts({
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      provider: body.provider,
      sessionId: body.sessionId || body.session_id,
      text: body.text,
      voice: body.voice || "default",
      language: body.language || "en",
      metadata: body.metadata || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown TTS error" }, { status: 500 });
  }
}
