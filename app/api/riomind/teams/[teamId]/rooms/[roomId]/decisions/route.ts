import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ teamId: string; roomId: string }> }) {
  try {
    const { teamId, roomId } = await params;
    const pool = await getReadyRioMindTeamsPool();
    const result = await pool.query(
      `SELECT * FROM riomind_team_room_decisions WHERE team_id = $1 AND room_id = $2 ORDER BY created_at DESC LIMIT 100`,
      [teamId, roomId]
    );
    return NextResponse.json({ ok: true, decisions: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load decisions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string; roomId: string }> }) {
  try {
    const { teamId, roomId } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();

    const decision = String(body.decision || "").trim();
    if (!decision) return NextResponse.json({ ok: false, error: "Decision is required" }, { status: 400 });

    const result = await pool.query(
      `INSERT INTO riomind_team_room_decisions (team_id, room_id, decision, rationale, status, created_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [teamId, roomId, decision, body.rationale || null, body.status || "active", body.createdBy || "local-user", body.metadata || {}]
    );

    return NextResponse.json({ ok: true, decision: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save decision" }, { status: 500 });
  }
}
