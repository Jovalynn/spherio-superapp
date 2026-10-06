import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";
import { runRioMindVoiceTranslation } from "@/lib/riomind/voice/translation-runtime";

async function getMeeting(pool: any, meetingCode: string) {
  const result = await pool.query(
    `SELECT * FROM riomind_team_meetings
     WHERE meeting_code = $1
     LIMIT 1`,
    [meetingCode],
  );

  return result.rows[0] || null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> },
) {
  try {
    const { meetingCode } = await params;
    const body = await req.json().catch(() => ({}));

    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);

    if (!meeting) {
      return NextResponse.json(
        { ok: false, error: "Meeting not found" },
        { status: 404 },
      );
    }

    const text = String(body.text || "").trim();
    const targetLanguage = String(body.targetLanguage || "en").trim();
    const sourceLanguage = String(body.sourceLanguage || "auto").trim();

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Text is required" },
        { status: 400 },
      );
    }

    const result = await runRioMindVoiceTranslation({
      aiLayer: body.aiLayer || "nexus_ai",
      meetingCode,
      sessionId: body.sessionId || undefined,
      text,
      sourceLanguage,
      targetLanguage,
      provider: body.provider,
      speakerLabel: body.speakerLabel || "Translator",
      metadata: {
        ...(body.metadata || {}),
        route: "meeting_translate",
      },
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      translation: {
        sourceLanguage,
        targetLanguage,
        originalText: text,
        translatedText: result.translation.translation,
        provider: result.provider.id,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to translate text",
      },
      { status: 500 },
    );
  }
}
