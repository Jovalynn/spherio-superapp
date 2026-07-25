import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

const STATUSES = new Set(["invited", "accepted", "declined", "tentative", "waiting", "joined", "left", "removed"]);

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
      `SELECT * FROM riomind_team_meeting_participants
       WHERE meeting_id = $1
       ORDER BY created_at ASC
       LIMIT 200`,
      [meeting.id]
    );

    return NextResponse.json({ ok: true, participants: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load participants" }, { status: 500 });
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

    const displayName = String(body.displayName || "").trim();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;

    if (!displayName && !email) {
      return NextResponse.json({ ok: false, error: "Name or email is required" }, { status: 400 });
    }

    const status = STATUSES.has(body.status) ? body.status : "invited";

    const result = await pool.query(
      `INSERT INTO riomind_team_meeting_participants (
        meeting_id, display_name, email, participant_status,
        preferred_language, invited_by, metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        meeting.id,
        displayName || null,
        email,
        status,
        body.preferredLanguage || meeting.default_language || "en",
        body.invitedBy || "local-user",
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, participant: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save participant" }, { status: 500 });
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

    const participantId = String(body.participantId || "").trim();
    const status = String(body.status || "").trim();

    if (!participantId) {
      return NextResponse.json({ ok: false, error: "Participant ID is required" }, { status: 400 });
    }

    if (!STATUSES.has(status)) {
      return NextResponse.json({ ok: false, error: "Invalid participant status" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE riomind_team_meeting_participants
       SET participant_status = $3, updated_at = now()
       WHERE meeting_id = $1 AND id = $2
       RETURNING *`,
      [meeting.id, participantId, status]
    );

    if (!result.rowCount) {
      return NextResponse.json({ ok: false, error: "Participant not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, participant: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to update participant" },
      { status: 500 }
    );
  }
}
