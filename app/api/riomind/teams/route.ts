import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

export async function GET() {
  try {
    const pool = await getReadyRioMindTeamsPool();
    const result = await pool.query(`
      SELECT t.*
      FROM riomind_teams t
      ORDER BY t.created_at DESC
      LIMIT 100
    `);
    return NextResponse.json({ ok: true, teams: result.rows });
  } catch (error: any) {
    console.error("GET /api/riomind/teams failed", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to list teams" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const pool = await getReadyRioMindTeamsPool();
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json({ ok: false, error: "Team name is required" }, { status: 400 });
    }

    const ownerUserId = body.ownerUserId ? String(body.ownerUserId) : "local-user";
    const defaultLanguage = body.defaultLanguage ? String(body.defaultLanguage) : "en";
    const slug = `${slugify(body.slug || name) || "team"}-${Math.random().toString(36).slice(2, 7)}`;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const teamResult = await client.query(
        `INSERT INTO riomind_teams
          (name, slug, description, owner_user_id, default_language, translation_enabled, ai_summary_enabled, recording_enabled, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          name,
          slug,
          body.description || null,
          ownerUserId,
          defaultLanguage,
          Boolean(body.translationEnabled ?? false),
          Boolean(body.aiSummaryEnabled ?? true),
          Boolean(body.recordingEnabled ?? false),
          body.metadata || {},
        ]
      );

      const team = teamResult.rows[0];

      const workspaceResult = await client.query(
        `INSERT INTO riomind_team_workspaces
          (team_id, name, description, metadata)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [
          team.id,
          body.workspaceName || "Main Workspace",
          "Shared Nexus workspace for files, reports, analytics, artifacts, rooms, and meetings.",
          {},
        ]
      );

      const memberResult = await client.query(
        `INSERT INTO riomind_team_members
          (team_id, user_id, email, display_name, role, status, preferred_language, metadata)
         VALUES ($1,$2,$3,$4,'owner','active',$5,$6)
         RETURNING *`,
        [
          team.id,
          ownerUserId,
          body.ownerEmail || null,
          body.ownerName || "Owner",
          defaultLanguage,
          {},
        ]
      );

      const roomResult = await client.query(
        `INSERT INTO riomind_team_rooms
          (
            team_id, workspace_id, name, room_type, room_status, description,
            default_language, translation_enabled, recording_enabled,
            transcription_enabled, ai_summary_enabled, whiteboard_enabled,
            shared_chat_enabled, shared_notes_enabled, created_by, metadata
          )
         VALUES ($1,$2,'General','team','active',$3,$4,$5,$6,true,$7,true,true,true,$8,$9)
         RETURNING *`,
        [
          team.id,
          workspaceResult.rows[0].id,
          "Default team room for shared chat, notes, documents, and future meetings.",
          defaultLanguage,
          Boolean(body.translationEnabled ?? false),
          Boolean(body.recordingEnabled ?? false),
          Boolean(body.aiSummaryEnabled ?? true),
          ownerUserId,
          {},
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        ok: true,
        team,
        workspace: workspaceResult.rows[0],
        owner: memberResult.rows[0],
        room: roomResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("POST /api/riomind/teams failed", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to create team" }, { status: 500 });
  }
}
