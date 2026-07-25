import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

async function getMeeting(pool: any, meetingCode: string) {
  const result = await pool.query(`SELECT * FROM riomind_team_meetings WHERE meeting_code = $1 LIMIT 1`, [meetingCode]);
  return result.rows[0] || null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ meetingCode: string }> }) {
  try {
    const { meetingCode } = await params;
    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);
    if (!meeting) return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });

    const result = await pool.query(
      `SELECT * FROM riomind_team_meeting_raise_hands WHERE meeting_id = $1 ORDER BY created_at ASC LIMIT 200`,
      [meeting.id]
    );

    return NextResponse.json({ ok: true, raiseHands: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load raised hands" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ meetingCode: string }> }) {
  try {
    const { meetingCode } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);
    if (!meeting) return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });

    const participantName = String(body.participantName || "").trim();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;

    if (!participantName && !email) {
      return NextResponse.json({ ok: false, error: "Participant name or email is required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO riomind_team_meeting_raise_hands (
        meeting_id, participant_name, email, hand_status,
        allowed_to_speak, muted, removed, metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        meeting.id,
        participantName || null,
        email,
        body.handStatus || "raised",
        Boolean(body.allowedToSpeak ?? false),
        Boolean(body.muted ?? true),
        Boolean(body.removed ?? false),
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, raiseHand: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save raised hand" }, { status: 500 });
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

    const raiseHandId = String(body.raiseHandId || "").trim();

    if (!raiseHandId) {
      return NextResponse.json({ ok: false, error: "Raise hand ID is required" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE riomind_team_meeting_raise_hands
       SET
        allowed_to_speak = COALESCE($3, allowed_to_speak),
        muted = COALESCE($4, muted),
        removed = COALESCE($5, removed),
        hand_status = COALESCE($6, hand_status),
        updated_at = now()
       WHERE meeting_id = $1 AND id = $2
       RETURNING *`,
      [
        meeting.id,
        raiseHandId,
        typeof body.allowedToSpeak === "boolean" ? body.allowedToSpeak : null,
        typeof body.muted === "boolean" ? body.muted : null,
        typeof body.removed === "boolean" ? body.removed : null,
        body.handStatus || null,
      ]
    );

    if (!result.rowCount) {
      return NextResponse.json({ ok: false, error: "Raised hand not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, raiseHand: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to update raised hand" },
      { status: 500 }
    );
  }
}
