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

    const sessionResult = await pool.query(
      `SELECT * FROM riomind_team_meeting_voice_sessions
       WHERE meeting_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [meeting.id]
    );

    const participantsResult = await pool.query(
      `SELECT * FROM riomind_team_meeting_voice_participants
       WHERE meeting_id = $1
       ORDER BY created_at ASC
       LIMIT 300`,
      [meeting.id]
    );

    return NextResponse.json({
      ok: true,
      voiceSession: sessionResult.rows[0] || null,
      voiceParticipants: participantsResult.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load voice room" }, { status: 500 });
  }
}
