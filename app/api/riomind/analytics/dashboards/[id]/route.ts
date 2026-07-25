import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapDashboard(row: any) {
  return {
    id: row.id,
    ownerKey: row.owner_key,
    reportId: row.report_id,
    sessionId: row.session_id,
    title: row.title,
    dashboardType: row.dashboard_type,
    status: row.status,
    dashboardJson: row.dashboard_json,
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
      SELECT
        id,
        owner_key,
        report_id,
        session_id,
        title,
        dashboard_type,
        status,
        dashboard_json,
        created_at,
        updated_at
      FROM riomind_analytics_dashboards
      WHERE id = $1
        AND owner_key = $2
      LIMIT 1
      `,
      [id, ownerKey]
    );

    const dashboard = result.rows[0];

    if (!dashboard) {
      return NextResponse.json(
        {
          ok: false,
          product: "RioMind Nexus",
          error: "analytics_dashboard_not_found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      dashboard: mapDashboard(dashboard),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error:
          error instanceof Error
            ? error.message
            : "analytics_dashboard_detail_failed",
      },
      { status: 500 }
    );
  }
}
