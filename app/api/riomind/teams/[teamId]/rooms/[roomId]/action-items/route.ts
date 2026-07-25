import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ teamId: string; roomId: string }> }) {
  try {
    const { teamId, roomId } = await params;
    const pool = await getReadyRioMindTeamsPool();
    const result = await pool.query(
      `SELECT * FROM riomind_team_room_action_items WHERE team_id = $1 AND room_id = $2 ORDER BY created_at DESC LIMIT 100`,
      [teamId, roomId]
    );
    return NextResponse.json({ ok: true, actionItems: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load action items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string; roomId: string }> }) {
  try {
    const { teamId, roomId } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();

    const title = String(body.title || "").trim();
    if (!title) return NextResponse.json({ ok: false, error: "Action item title is required" }, { status: 400 });

    const result = await pool.query(
      `INSERT INTO riomind_team_room_action_items
       (team_id, room_id, title, description, assignee, due_date, status, priority, created_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        teamId,
        roomId,
        title,
        body.description || null,
        body.assignee || null,
        body.dueDate || null,
        body.status || "open",
        body.priority || "normal",
        body.createdBy || "local-user",
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, actionItem: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save action item" }, { status: 500 });
  }
}
