import { NextRequest, NextResponse } from "next/server";
import { createOpenAiRealtimeSession } from "@/lib/riomind/voice/openai-realtime-adapter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const result = await createOpenAiRealtimeSession({
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      surface: body.surface || "nexus_teams",
      meetingCode: body.meetingCode || body.meeting_code,
      ownerUserId:
        body.ownerUserId ||
        body.owner_user_id ||
        "local-user",
      model: body.model,
      voice: body.voice,
      instructions: body.instructions,
      modalities: body.modalities,

      sourceLanguage:
        body.sourceLanguage ||
        body.source_language ||
        "auto",

      targetLanguage:
        body.targetLanguage ||
        body.target_language ||
        "en",

      translationMode:
        body.translationMode !== undefined
          ? Boolean(body.translationMode)
          : body.translation_mode !== undefined
            ? Boolean(body.translation_mode)
            : true,

      metadata: body.metadata || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown OpenAI realtime session error",
      },
      { status: 500 },
    );
  }
}
