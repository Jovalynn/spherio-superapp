import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string; roomId: string }> }
) {
  try {
    const { teamId, roomId } = await params;
    const pool = await getReadyRioMindTeamsPool();

    const result = await pool.query(
      `SELECT * FROM riomind_team_room_notes
       WHERE team_id = $1 AND room_id = $2
       ORDER BY updated_at DESC
       LIMIT 100`,
      [teamId, roomId]
    );

    return NextResponse.json({ ok: true, notes: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load notes" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; roomId: string }> }
) {
  try {
    const { teamId, roomId } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();

    const title = String(body.title || "Meeting Notes").trim();
    const noteBody = String(body.body || "").trim();

    if (!noteBody) {
      return NextResponse.json({ ok: false, error: "Note body is required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO riomind_team_room_notes (
        team_id, room_id, title, body, note_type, created_by, metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        teamId,
        roomId,
        title,
        noteBody,
        body.noteType || "note",
        body.createdBy || "local-user",
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, note: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save note" }, { status: 500 });
  }
}
