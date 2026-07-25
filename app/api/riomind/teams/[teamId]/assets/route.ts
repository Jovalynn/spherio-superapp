import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

const ASSET_TYPES = new Set(["file", "report", "analytics", "artifact", "dashboard", "document", "note"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const pool = await getReadyRioMindTeamsPool();

    const result = await pool.query(
      `SELECT * FROM riomind_team_shared_assets WHERE team_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [teamId]
    );

    return NextResponse.json({ ok: true, assets: result.rows });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to list shared assets" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();

    const assetType = ASSET_TYPES.has(body.assetType) ? body.assetType : "artifact";
    const title = String(body.title || "").trim();

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Asset title is required" },
        { status: 400 }
      );
    }

    const workspaceResult = await pool.query(
      `SELECT id FROM riomind_team_workspaces WHERE team_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [teamId]
    );

    const workspaceId = body.workspaceId || workspaceResult.rows[0]?.id || null;

    const result = await pool.query(
      `
      INSERT INTO riomind_team_shared_assets (
        team_id, workspace_id, room_id, asset_type, asset_id,
        title, source_table, shared_by, shared_scope, metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        teamId,
        workspaceId,
        body.roomId || null,
        assetType,
        body.assetId || null,
        title,
        body.sourceTable || null,
        body.sharedBy || "local-user",
        body.sharedScope || "team",
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, asset: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to share asset" },
      { status: 500 }
    );
  }
}
