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
      `SELECT * FROM riomind_team_meeting_voice_participants
       WHERE meeting_id = $1
       ORDER BY created_at ASC
       LIMIT 300`,
      [meeting.id]
    );

    return NextResponse.json({ ok: true, voiceParticipants: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load voice participants" }, { status: 500 });
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

    const result = await pool.query(
      `INSERT INTO riomind_team_meeting_voice_participants (
        meeting_id, participant_name, email, role,
        joined_audio, muted, speaking, hand_raised,
        preferred_language, presence_status,
        joined_at, metadata
      )
      VALUES ($1,$2,$3,$4,true,$5,$6,$7,$8,$9,now(),$10)
      RETURNING *`,
      [
        meeting.id,
        body.participantName || "Guest",
        body.email || null,
        body.role || "participant",
        Boolean(body.muted ?? false),
        Boolean(body.speaking ?? false),
        Boolean(body.handRaised ?? false),
        body.preferredLanguage || "en",
        body.presenceStatus || "in_meeting",
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, voiceParticipant: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to join voice room" }, { status: 500 });
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
    const meeting = await getMeeting(pool, meetingCode);

    if (!meeting) {
      return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    }

    const voiceParticipantId = String(body.voiceParticipantId || "").trim();

    if (!voiceParticipantId) {
      return NextResponse.json({ ok: false, error: "Voice participant ID is required" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE riomind_team_meeting_voice_participants
       SET
        joined_audio = COALESCE($3, joined_audio),
        muted = COALESCE($4, muted),
        speaking = COALESCE($5, speaking),
        hand_raised = COALESCE($6, hand_raised),
        preferred_language = COALESCE($7, preferred_language),
        presence_status = COALESCE($8, presence_status),
        updated_at = now()
       WHERE meeting_id = $1 AND id = $2
       RETURNING *`,
      [
        meeting.id,
        voiceParticipantId,
        typeof body.joinedAudio === "boolean" ? body.joinedAudio : null,
        typeof body.muted === "boolean" ? body.muted : null,
        typeof body.speaking === "boolean" ? body.speaking : null,
        typeof body.handRaised === "boolean" ? body.handRaised : null,
        body.preferredLanguage || null,
        body.presenceStatus || null,
      ]
    );

    if (!result.rowCount) {
      return NextResponse.json({ ok: false, error: "Voice participant not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, voiceParticipant: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to update voice participant" }, { status: 500 });
  }
}
