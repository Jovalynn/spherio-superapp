import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

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

    const result = await pool.query(
      `INSERT INTO riomind_team_meeting_voice_sessions (
        meeting_id, status, recording_enabled, started_by, started_at, metadata
      )
      VALUES ($1,'live',$2,$3,now(),$4)
      RETURNING *`,
      [
        meeting.id,
        Boolean(body.recordingEnabled ?? false),
        body.startedBy || "local-user",
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, voiceSession: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to start voice room" }, { status: 500 });
  }
}
