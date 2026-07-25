import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await params;
    const pool = await getReadyRioMindTeamsPool();

    const meetingResult = await pool.query(
      `SELECT * FROM riomind_team_meetings
       WHERE meeting_code = $1
       LIMIT 1`,
      [meetingCode]
    );

    if (!meetingResult.rowCount) {
      return NextResponse.json(
        { ok: false, error: "Meeting not found" },
        { status: 404 }
      );
    }

    const meeting = meetingResult.rows[0];

    return NextResponse.json({
      ok: true,
      meeting
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load meeting" },
      { status: 500 }
    );
  }
}


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();

    const result = await pool.query(
      `UPDATE riomind_team_meetings
       SET
        waiting_room_enabled = COALESCE($2, waiting_room_enabled),
        pause_entry_enabled = COALESCE($3, pause_entry_enabled),
        auto_admit_enabled = COALESCE($4, auto_admit_enabled),
        host_only_mute = COALESCE($5, host_only_mute),
        allow_participant_unmute = COALESCE($6, allow_participant_unmute),
        screen_share_mode = COALESCE($7, screen_share_mode),
        meeting_locked = COALESCE($8, meeting_locked),
        meeting_mode = COALESCE($9, meeting_mode),
        updated_at = now()
       WHERE meeting_code = $1
       RETURNING *`,
      [
        meetingCode,
        typeof body.waitingRoomEnabled === "boolean" ? body.waitingRoomEnabled : null,
        typeof body.pauseEntryEnabled === "boolean" ? body.pauseEntryEnabled : null,
        typeof body.autoAdmitEnabled === "boolean" ? body.autoAdmitEnabled : null,
        typeof body.hostOnlyMute === "boolean" ? body.hostOnlyMute : null,
        typeof body.allowParticipantUnmute === "boolean" ? body.allowParticipantUnmute : null,
        body.screenShareMode || null,
        typeof body.meetingLocked === "boolean" ? body.meetingLocked : null,
        body.meetingMode || null,
      ]
    );

    if (!result.rowCount) {
      return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, meeting: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to update meeting controls" },
      { status: 500 }
    );
  }
}
