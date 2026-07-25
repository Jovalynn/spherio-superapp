import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

const ROLES = new Set(["host", "co_host", "moderator", "participant", "observer"]);

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
      `SELECT * FROM riomind_team_meeting_roles WHERE meeting_id = $1 ORDER BY created_at ASC LIMIT 200`,
      [meeting.id]
    );

    return NextResponse.json({ ok: true, roles: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load roles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ meetingCode: string }> }) {
  try {
    const { meetingCode } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);
    if (!meeting) return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });

    const userName = String(body.userName || "").trim();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const role = ROLES.has(body.role) ? body.role : "participant";

    if (!userName && !email) {
      return NextResponse.json({ ok: false, error: "User name or email is required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO riomind_team_meeting_roles (meeting_id, user_name, email, role, metadata)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [meeting.id, userName || null, email, role, body.metadata || {}]
    );

    return NextResponse.json({ ok: true, role: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save role" }, { status: 500 });
  }
}
