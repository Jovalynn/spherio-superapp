import { NextRequest, NextResponse } from "next/server";
import { runRioMindRealtimeTranslation, runRioMindVoiceTranslation } from "@/lib/riomind/voice/translation-runtime";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.text) {
      return NextResponse.json({ ok: false, error: "text is required" }, { status: 400 });
    }

    if (Array.isArray(body.targetLanguages || body.target_languages)) {
      const result = await runRioMindRealtimeTranslation({
        aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
        sessionId: body.sessionId || body.session_id,
        meetingCode: body.meetingCode || body.meeting_code,
        text: body.text,
        sourceLanguage: body.sourceLanguage || body.source_language || "auto",
        targetLanguages: body.targetLanguages || body.target_languages,
        provider: body.provider,
        speakerLabel: body.speakerLabel || body.speaker_label || "Realtime Translator",
        metadata: body.metadata || {},
      });

      return NextResponse.json(result);
    }

    const result = await runRioMindVoiceTranslation({
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      sessionId: body.sessionId || body.session_id,
      meetingCode: body.meetingCode || body.meeting_code,
      text: body.text,
      sourceLanguage: body.sourceLanguage || body.source_language || "auto",
      targetLanguage: body.targetLanguage || body.target_language || "en",
      provider: body.provider,
      speakerLabel: body.speakerLabel || body.speaker_label || "Translator",
      metadata: body.metadata || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown translation error" }, { status: 500 });
  }
}
