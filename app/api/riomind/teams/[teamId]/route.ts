import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const pool = await getReadyRioMindTeamsPool();

    const teamResult = await pool.query(
      `SELECT * FROM riomind_teams WHERE id = $1`,
      [teamId]
    );

    if (!teamResult.rowCount) {
      return NextResponse.json(
        { ok: false, error: "Team not found" },
        { status: 404 }
      );
    }

    const [workspaceResult, membersResult, roomsResult, assetsResult] =
      await Promise.all([
        pool.query(
          `SELECT * FROM riomind_team_workspaces WHERE team_id = $1 ORDER BY created_at ASC`,
          [teamId]
        ),
        pool.query(
          `SELECT * FROM riomind_team_members WHERE team_id = $1 ORDER BY created_at ASC`,
          [teamId]
        ),
        pool.query(
          `SELECT * FROM riomind_team_rooms WHERE team_id = $1 ORDER BY created_at ASC`,
          [teamId]
        ),
        pool.query(
          `SELECT * FROM riomind_team_shared_assets WHERE team_id = $1 ORDER BY created_at DESC LIMIT 100`,
          [teamId]
        ),
      ]);

    return NextResponse.json({
      ok: true,
      team: teamResult.rows[0],
      workspaces: workspaceResult.rows,
      members: membersResult.rows,
      rooms: roomsResult.rows,
      sharedAssets: assetsResult.rows,
    });
  } catch (error: any) {
    console.error("GET /api/riomind/teams/[teamId] failed", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load team" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();

    const result = await pool.query(
      `
      UPDATE riomind_teams
      SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        visibility = COALESCE($4, visibility),
        default_language = COALESCE($5, default_language),
        translation_enabled = COALESCE($6, translation_enabled),
        ai_summary_enabled = COALESCE($7, ai_summary_enabled),
        recording_enabled = COALESCE($8, recording_enabled),
        metadata = COALESCE($9, metadata),
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [
        teamId,
        body.name ?? null,
        body.description ?? null,
        body.visibility ?? null,
        body.defaultLanguage ?? null,
        typeof body.translationEnabled === "boolean" ? body.translationEnabled : null,
        typeof body.aiSummaryEnabled === "boolean" ? body.aiSummaryEnabled : null,
        typeof body.recordingEnabled === "boolean" ? body.recordingEnabled : null,
        body.metadata ?? null,
      ]
    );

    if (!result.rowCount) {
      return NextResponse.json(
        { ok: false, error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, team: result.rows[0] });
  } catch (error: any) {
    console.error("PATCH /api/riomind/teams/[teamId] failed", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to update team" },
      { status: 500 }
    );
  }
}
