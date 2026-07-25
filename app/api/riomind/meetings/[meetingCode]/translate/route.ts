import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";
import { runOpenAiRuntime } from "@/lib/riomind/providers/openai-runtime";
import { runMistralRuntime } from "@/lib/riomind/providers/mistral-runtime";

async function getMeeting(pool: any, meetingCode: string) {
  const result = await pool.query(
    `SELECT * FROM riomind_team_meetings WHERE meeting_code = $1 LIMIT 1`,
    [meetingCode]
  );
  return result.rows[0] || null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);

    if (!meeting) {
      return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    }

    const text = String(body.text || "").trim();
    const targetLanguage = String(body.targetLanguage || "en").trim();
    const sourceLanguage = String(body.sourceLanguage || "auto").trim();

    if (!text) {
      return NextResponse.json({ ok: false, error: "Text is required" }, { status: 400 });
    }

    const systemPrompt = `You are RioMind Nexus meeting translator.
Translate the user's text accurately into the target language.
Return only the translated text.
Do not explain.
Do not add quotes.
Preserve names, numbers, links, and technical terms when appropriate.`;

    const message = `Source language: ${sourceLanguage}
Target language: ${targetLanguage}

Text:
${text}`;

    let translatedText: string | null = null;
    let provider = "none";

    const openAi = await runOpenAiRuntime({
      message,
      systemPrompt,
      maxOutputTokens: 700,
    });

    if (openAi.ok && openAi.response) {
      translatedText = openAi.response.trim();
      provider = "openai";
    } else {
      const mistral = await runMistralRuntime({
        message,
        systemPrompt,
      });

      if (mistral.ok && mistral.response) {
        translatedText = mistral.response.trim();
        provider = "mistral";
      }
    }

    if (!translatedText) {
      translatedText = `[${targetLanguage} translation pending] ${text}`;
      provider = "fallback";
    }

    return NextResponse.json({
      ok: true,
      translation: {
        sourceLanguage,
        targetLanguage,
        originalText: text,
        translatedText,
        provider,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to translate text" }, { status: 500 });
  }
}
