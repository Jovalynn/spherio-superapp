import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";
import { speakTextWithRouter } from "@/lib/riomind/providers/audio-speech-router";

async function getMeeting(pool: any, meetingCode: string) {
  const result = await pool.query(
    `SELECT * FROM riomind_team_meetings WHERE meeting_code = $1 LIMIT 1`,
    [meetingCode]
  );
  return result.rows[0] || null;
}

function normalizeVoiceStyle(style: string) {
  const allowed = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse"]);
  return allowed.has(style) ? style : "alloy";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await params;
    const body = await req.json().catch(() => ({}));

    const text = String(body.text || "").trim();
    const language = String(body.language || "en").trim();
    const speakerEmail = String(body.speakerEmail || "").trim();
    const speakerName = String(body.speakerName || "").trim();

    if (!text) {
      return NextResponse.json({ ok: false, error: "Text is required." }, { status: 400 });
    }

    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);

    if (!meeting) {
      return NextResponse.json({ ok: false, error: "Meeting not found." }, { status: 404 });
    }

    let voiceStyle = String(body.voiceStyle || "").trim();

    if (!voiceStyle && (speakerEmail || speakerName)) {
      const profileResult = await pool.query(
        `SELECT * FROM riomind_team_speaker_voice_profiles
         WHERE meeting_id = $1
           AND consent_status = 'granted'
           AND (
             ($2::text <> '' AND lower(coalesce(speaker_email, '')) = lower($2))
             OR
             ($3::text <> '' AND lower(speaker_name) = lower($3))
           )
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 1`,
        [meeting.id, speakerEmail, speakerName]
      );

      voiceStyle = profileResult.rows[0]?.preferred_voice_style || "";
    }

    const result = await speakTextWithRouter(text, language, normalizeVoiceStyle(voiceStyle || "alloy"));

    return new NextResponse(result.audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": result.contentType || "audio/mpeg",
        "Cache-Control": "no-store",
        "X-RioMind-TTS-Provider": result.provider,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate translated voice." },
      { status: 500 }
    );
  }
}
