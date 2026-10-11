import { getRioMindOwnerKey } from "@/lib/riomind/db";
import { requireTeamAccess, TeamAuthorizationError } from "@/lib/riomind/teams/authorization";
import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string; roomId: string }> }) {
  try {
    const { teamId, roomId } = await params;
    const pool = await getReadyRioMindTeamsPool();
    const authenticatedSubject = await getRioMindOwnerKey(req.headers);
    await requireTeamAccess(pool, authenticatedSubject, teamId, false, false, roomId);
    const result = await pool.query(
      `SELECT * FROM riomind_team_room_commitments WHERE team_id = $1 AND room_id = $2 ORDER BY created_at DESC LIMIT 100`,
      [teamId, roomId]
    );
    return NextResponse.json({ ok: true, commitments: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load commitments" }, { status: error instanceof TeamAuthorizationError ? 403 : 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string; roomId: string }> }) {
  try {
    const { teamId, roomId } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();
    const authenticatedSubject = await getRioMindOwnerKey(req.headers);
    await requireTeamAccess(pool, authenticatedSubject, teamId, true, false, roomId);

    const commitment = String(body.commitment || "").trim();
    if (!commitment) return NextResponse.json({ ok: false, error: "Commitment is required" }, { status: 400 });

    const result = await pool.query(
      `INSERT INTO riomind_team_room_commitments
       (team_id, room_id, commitment, owner, due_date, status, created_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        teamId,
        roomId,
        commitment,
        body.owner || null,
        body.dueDate || null,
        body.status || "active",
        authenticatedSubject,
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, commitment: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save commitment" }, { status: error instanceof TeamAuthorizationError ? 403 : 500 });
  }
}
