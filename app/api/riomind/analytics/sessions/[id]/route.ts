import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedStatuses = new Set(["active", "completed", "archived"]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ownerKey = getRioMindOwnerKey(request.headers);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const status = String(body?.status || "").trim().toLowerCase();

    if (!allowedStatuses.has(status)) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "invalid_status" },
        { status: 400 }
      );
    }

    const pool = getRioMindPgPool();

    await pool.query(`
      ALTER TABLE riomind_analytics_sessions
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ
    `);

    const result = await pool.query(
      `
      UPDATE riomind_analytics_sessions
      SET
        status = $1,
        archived_at = CASE WHEN $1 = 'archived' THEN NOW() ELSE archived_at END,
        completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
      WHERE id = $2 AND owner_key = $3
      RETURNING
        id,
        owner_key AS "ownerKey",
        title,
        mode,
        goal,
        status,
        archived_at AS "archivedAt",
        completed_at AS "completedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [status, id, ownerKey]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "analytics_session_not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      session: result.rows[0],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "analytics_session_update_failed",
      },
      { status: 500 }
    );
  }
}
