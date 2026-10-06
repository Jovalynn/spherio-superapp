import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";
import { SUPPORTED_MEETING_LANGUAGE_CODES } from "@/lib/riomind/teams/languages";
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

async function translateForFanout(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  meetingCode: string,
) {
  if (!targetLanguage || targetLanguage === sourceLanguage) {
    return text;
  }

  const result = await runRioMindVoiceTranslation({
    meetingCode,
    text,
    sourceLanguage,
    targetLanguage,
    speakerLabel: "Meeting Translator",
    metadata: {
      route: "meeting_translation_fanout",
    },
  });

  if (!result.ok || !result.translation?.translation) {
throw new Error(
  `Translation failed for ${targetLanguage}`,
    );
  }

  return result.translation.translation;
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

    const messageId = String(body.messageId || "").trim();
    const text = String(body.text || "").trim();
    const sourceLanguage = String(
      body.sourceLanguage || "auto",
    ).trim();

    if (!messageId) {
      return NextResponse.json(
        { ok: false, error: "Message ID is required" },
        { status: 400 },
      );
    }

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Text is required" },
        { status: 400 },
      );
    }

    const messageResult = await pool.query(
      `SELECT *
       FROM riomind_team_meeting_messages
       WHERE meeting_id = $1
         AND id = $2
       LIMIT 1`,
      [meeting.id, messageId],
    );

    if (!messageResult.rowCount) {
      return NextResponse.json(
        { ok: false, error: "Message not found" },
        { status: 404 },
      );
    }

    const participantsResult = await pool.query(
      `SELECT preferred_language
       FROM riomind_team_meeting_participants
       WHERE meeting_id = $1

       UNION

       SELECT preferred_language
       FROM riomind_team_meeting_voice_participants
       WHERE meeting_id = $1`,
      [meeting.id],
    );

    const languages = Array.from(
      new Set(
        participantsResult.rows
          .map((row: any) =>
            String(row.preferred_language || "").trim(),
          )
          .filter(Boolean),
      ),
    );

    for (const languageCode of SUPPORTED_MEETING_LANGUAGE_CODES) {
      if (!languages.includes(languageCode)) {
        languages.push(languageCode);
      }
    }

    if (
      sourceLanguage !== "auto" &&
      !languages.includes(sourceLanguage)
    ) {
      languages.push(sourceLanguage);
    }

    const translations: Record<string, string> = {};
    const completedLanguages: string[] = [];
    const failedLanguages: string[] = [];
    const pendingLanguages = [...languages];

    const results = await Promise.allSettled(
      languages.map(async (lang) => ({
        lang,
        translatedText: await translateForFanout(
          text,
          sourceLanguage,
          lang,
          meetingCode,
        ),
      })),
    );

    results.forEach((result, index) => {
      const lang = languages[index];

      if (result.status === "fulfilled") {
        translations[lang] = result.value.translatedText;
        completedLanguages.push(lang);
      } else {
        failedLanguages.push(lang);
      }
    });

    const currentMetadata =
      messageResult.rows[0].metadata || {};

    const metadata = {
      ...currentMetadata,
      translations,
      translation_status:
        failedLanguages.length > 0 ? "partial" : "complete",
      translation_source_language: sourceLanguage,
      translation_pending_languages:
        pendingLanguages.filter(
          (lang) => !completedLanguages.includes(lang),
        ),
      translation_completed_languages: completedLanguages,
      translation_failed_languages: failedLanguages,
      translation_generated_at: new Date().toISOString(),
    };

    const updated = await pool.query(
      `UPDATE riomind_team_meeting_messages
       SET metadata = $3
       WHERE meeting_id = $1
         AND id = $2
       RETURNING *`,
      [meeting.id, messageId, metadata],
    );

    return NextResponse.json({
      ok: true,
      message: updated.rows[0],
      translations,
      languages,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Failed to fanout translations",
      },
      { status: 500 },
    );
  }
}
