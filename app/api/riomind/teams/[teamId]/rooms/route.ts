import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

const ROOM_TYPES = new Set(["team", "meeting", "voice", "project", "analytics", "artifact"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const pool = await getReadyRioMindTeamsPool();
    const result = await pool.query(
      `SELECT * FROM riomind_team_rooms WHERE team_id = $1 ORDER BY created_at ASC`,
      [teamId]
    );
    return NextResponse.json({ ok: true, rooms: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to list rooms" }, { status: 500 });
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

    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Room name is required" }, { status: 400 });
    }

    const roomType = ROOM_TYPES.has(body.roomType) ? body.roomType : "team";

    const workspaceResult = await pool.query(
      `SELECT id FROM riomind_team_workspaces WHERE team_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [teamId]
    );

    const workspaceId = body.workspaceId || workspaceResult.rows[0]?.id || null;

    const result = await pool.query(
      `
      INSERT INTO riomind_team_rooms (
        team_id, workspace_id, name, room_type, room_status, description,
        default_language, translation_enabled, recording_enabled,
        transcription_enabled, ai_summary_enabled, whiteboard_enabled,
        shared_chat_enabled, shared_notes_enabled, created_by, metadata
      )
      VALUES ($1,$2,$3,$4,'active',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
      `,
      [
        teamId,
        workspaceId,
        name,
        roomType,
        body.description || null,
        body.defaultLanguage || "en",
        Boolean(body.translationEnabled ?? false),
        Boolean(body.recordingEnabled ?? false),
        Boolean(body.transcriptionEnabled ?? true),
        Boolean(body.aiSummaryEnabled ?? true),
        Boolean(body.whiteboardEnabled ?? true),
        Boolean(body.sharedChatEnabled ?? true),
        Boolean(body.sharedNotesEnabled ?? true),
        body.createdBy || "local-user",
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, room: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to create room" }, { status: 500 });
  }
}
