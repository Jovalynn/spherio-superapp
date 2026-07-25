import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapReport(row: any) {
  return {
    id: row.id,
    ownerKey: row.owner_key,
    sessionId: row.session_id,
    title: row.title,
    reportType: row.report_type,
    status: row.status,
    content: row.content,
    artifactName: row.artifact_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ownerKey = getRioMindOwnerKey(request.headers);
    const { id } = await context.params;
    const db = getRioMindPgPool();

    const result = await db.query(
      `
      SELECT id, owner_key, session_id, title, report_type, status, content, artifact_name, created_at, updated_at
      FROM riomind_analytics_reports
      WHERE id = $1 AND owner_key = $2
      LIMIT 1
      `,
      [id, ownerKey]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "analytics_report_not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      report: mapReport(result.rows[0]),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "analytics_report_detail_failed",
      },
      { status: 500 }
    );
  }
}
