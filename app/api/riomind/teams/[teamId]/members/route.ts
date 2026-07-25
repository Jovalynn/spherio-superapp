import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

const ALLOWED_ROLES = new Set(["owner", "admin", "manager", "analyst", "contributor", "viewer"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const pool = await getReadyRioMindTeamsPool();
    const result = await pool.query(
      `SELECT * FROM riomind_team_members WHERE team_id = $1 ORDER BY created_at ASC`,
      [teamId]
    );
    return NextResponse.json({ ok: true, members: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to list members" }, { status: 500 });
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

    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const displayName = body.displayName ? String(body.displayName).trim() : null;
    const role = ALLOWED_ROLES.has(body.role) ? body.role : "viewer";

    if (!email && !displayName) {
      return NextResponse.json({ ok: false, error: "Member email or display name is required" }, { status: 400 });
    }

    const result = await pool.query(
      `
      INSERT INTO riomind_team_members (
        team_id, user_id, email, display_name, role, status,
        preferred_language, translation_language, invited_by, metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (team_id, email)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        status = 'active',
        preferred_language = EXCLUDED.preferred_language,
        translation_language = EXCLUDED.translation_language,
        updated_at = now()
      RETURNING *
      `,
      [
        teamId,
        body.userId || null,
        email,
        displayName,
        role,
        body.status || "active",
        body.preferredLanguage || "en",
        body.translationLanguage || null,
        body.invitedBy || "local-user",
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, member: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to add member" }, { status: 500 });
  }
}
