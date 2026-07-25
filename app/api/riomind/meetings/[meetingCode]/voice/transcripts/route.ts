import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

async function getMeeting(pool: any, meetingCode: string) {
  const result = await pool.query(
    `SELECT * FROM riomind_team_meetings WHERE meeting_code = $1 LIMIT 1`,
    [meetingCode]
  );
  return result.rows[0] || null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await params;
    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);

    if (!meeting) {
      return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    }

    const result = await pool.query(
      `SELECT * FROM riomind_team_meeting_voice_transcripts
       WHERE meeting_id = $1
       ORDER BY created_at ASC
       LIMIT 500`,
      [meeting.id]
    );

    return NextResponse.json({ ok: true, transcripts: result.rows });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load voice transcripts" },
      { status: 500 }
    );
  }
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

    const transcriptText = String(body.transcriptText || "").trim();

    if (!transcriptText) {
      return NextResponse.json({ ok: false, error: "Transcript text is required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO riomind_team_meeting_voice_transcripts (
        meeting_id,
        voice_session_id,
        speaker_name,
        speaker_email,
        source_language,
        transcript_text,
        transcript_type,
        start_ms,
        end_ms,
        metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        meeting.id,
        body.voiceSessionId || null,
        body.speakerName || "Guest",
        body.speakerEmail || null,
        body.sourceLanguage || "auto",
        transcriptText,
        body.transcriptType || "speech",
        body.startMs ?? null,
        body.endMs ?? null,
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, transcript: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to save voice transcript" },
      { status: 500 }
    );
  }
}
