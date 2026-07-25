import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";
import { SUPPORTED_MEETING_LANGUAGE_CODES } from "@/lib/riomind/teams/languages";
import { runOpenAiRuntime } from "@/lib/riomind/providers/openai-runtime";
import { runMistralRuntime } from "@/lib/riomind/providers/mistral-runtime";

async function getMeeting(pool: any, meetingCode: string) {
  const result = await pool.query(
    `SELECT * FROM riomind_team_meetings WHERE meeting_code = $1 LIMIT 1`,
    [meetingCode]
  );
  return result.rows[0] || null;
}

async function translateText(text: string, sourceLanguage: string, targetLanguage: string) {
  if (!targetLanguage || targetLanguage === sourceLanguage) return text;

  const systemPrompt = `You are RioMind Nexus live meeting voice translator.
Translate live speech transcript accurately into the target language.
Return only the translated transcript text.
Do not explain.
Preserve names, numbers, links, scripture references, technical terms, and speaker intent where appropriate.`;

  const message = `Source language: ${sourceLanguage || "auto"}
Target language: ${targetLanguage}

Speech transcript:
${text}`;

  const openAi = await runOpenAiRuntime({ message, systemPrompt, maxOutputTokens: 900 });

  if (openAi.ok && openAi.response) return openAi.response.trim();

  const mistral = await runMistralRuntime({ message, systemPrompt });

  if (mistral.ok && mistral.response) return mistral.response.trim();

  return `[${targetLanguage} voice translation pending] ${text}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string; transcriptId: string }> }
) {
  try {
    const { meetingCode, transcriptId } = await params;
    const body = await req.json().catch(() => ({}));
    const targetLanguage = String(body.targetLanguage || "").trim();
    const onlyTarget = Boolean(body.onlyTarget);
    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);

    if (!meeting) {
      return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    }

    const transcriptResult = await pool.query(
      `SELECT * FROM riomind_team_meeting_voice_transcripts
       WHERE meeting_id = $1 AND id = $2
       LIMIT 1`,
      [meeting.id, transcriptId]
    );

    if (!transcriptResult.rowCount) {
      return NextResponse.json({ ok: false, error: "Transcript not found" }, { status: 404 });
    }

    const transcript = transcriptResult.rows[0];
    const sourceLanguage = String(transcript.source_language || "auto").trim();
    const text = String(transcript.transcript_text || "").trim();

    const participantsResult = await pool.query(
      `SELECT preferred_language FROM riomind_team_meeting_participants
       WHERE meeting_id = $1
       UNION
       SELECT preferred_language FROM riomind_team_meeting_voice_participants
       WHERE meeting_id = $1`,
      [meeting.id]
    );

    let languages = Array.from(
      new Set(
        participantsResult.rows
          .map((row: any) => String(row.preferred_language || "").trim())
          .filter(Boolean)
      )
    );

    if (targetLanguage && !languages.includes(targetLanguage)) {
      languages.push(targetLanguage);
    }

    if (onlyTarget && targetLanguage) {
      languages = Array.from(
        new Set([targetLanguage, sourceLanguage].filter((lang) => lang && lang !== "auto"))
      );
    } else {
      for (const languageCode of SUPPORTED_MEETING_LANGUAGE_CODES) {
        if (!languages.includes(languageCode)) {
          languages.push(languageCode);
        }
      }

      if (!languages.includes(sourceLanguage) && sourceLanguage !== "auto") {
        languages.push(sourceLanguage);
      }
    }

    const translations: Record<string, string> = {};
    const completedLanguages: string[] = [];
    const failedLanguages: string[] = [];
    const pendingLanguages = [...languages];

    const results = await Promise.allSettled(
      languages.map(async (lang) => ({
        lang,
        translatedText: await translateText(text, sourceLanguage, lang),
      }))
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

    const currentMetadata = transcript.metadata || {};
    const metadata = {
      ...currentMetadata,
      translations: {
        ...(currentMetadata.translations || {}),
        ...translations,
      },
      translation_status: failedLanguages.length ? "partial" : "complete",
      translation_source_language: sourceLanguage,
      translation_pending_languages: pendingLanguages.filter((lang) => !completedLanguages.includes(lang)),
      translation_completed_languages: completedLanguages,
      translation_failed_languages: failedLanguages,
      translation_generated_at: new Date().toISOString(),
    };

    const updated = await pool.query(
      `UPDATE riomind_team_meeting_voice_transcripts
       SET metadata = $3
       WHERE meeting_id = $1 AND id = $2
       RETURNING *`,
      [meeting.id, transcriptId, metadata]
    );

    return NextResponse.json({
      ok: true,
      transcript: updated.rows[0],
      translations,
      languages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fanout voice transcript translations" },
      { status: 500 }
    );
  }
}
