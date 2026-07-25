import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string; roomId: string }> }
) {
  try {
    const { teamId, roomId } = await params;
    const pool = await getReadyRioMindTeamsPool();

    const roomResult = await pool.query(
      `SELECT * FROM riomind_team_rooms WHERE team_id = $1 AND id = $2`,
      [teamId, roomId]
    );

    if (!roomResult.rowCount) {
      return NextResponse.json({ ok: false, error: "Room not found" }, { status: 404 });
    }

    const teamResult = await pool.query(
      `SELECT * FROM riomind_teams WHERE id = $1`,
      [teamId]
    );

    const assetsResult = await pool.query(
      `SELECT * FROM riomind_team_shared_assets
       WHERE team_id = $1 AND (room_id = $2 OR room_id IS NULL)
       ORDER BY created_at DESC
       LIMIT 100`,
      [teamId, roomId]
    );

    return NextResponse.json({
      ok: true,
      team: teamResult.rows[0] || null,
      room: roomResult.rows[0],
      assets: assetsResult.rows,
      intelligence: {
        transcript: null,
        summary: null,
        decisions: [],
        actionItems: [],
        commitments: [],
        status: "foundation_ready"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load room" },
      { status: 500 }
    );
  }
}
