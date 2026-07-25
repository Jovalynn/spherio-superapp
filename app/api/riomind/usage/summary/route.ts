import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);

    const result = await db.query(
      `
        SELECT
          COUNT(*)::int AS total_requests,
          COALESCE(SUM(input_chars), 0)::int AS total_input_chars,
          COALESCE(SUM(output_chars), 0)::int AS total_output_chars,
          COALESCE(SUM(estimated_input_tokens), 0)::int AS total_input_tokens,
          COALESCE(SUM(estimated_output_tokens), 0)::int AS total_output_tokens,
          COALESCE(ROUND(AVG(latency_ms)), 0)::int AS average_latency_ms,
          MIN(created_at) AS first_request_at,
          MAX(created_at) AS latest_request_at
        FROM riomind_usage_events
        WHERE owner_key = $1
      `,
      [ownerKey]
    );

    const byRoute = await db.query(
      `
        SELECT
          COALESCE(route, 'unknown') AS route,
          COUNT(*)::int AS requests,
          COALESCE(SUM(estimated_input_tokens + estimated_output_tokens), 0)::int AS estimated_tokens
        FROM riomind_usage_events
        WHERE owner_key = $1
        GROUP BY COALESCE(route, 'unknown')
        ORDER BY requests DESC, estimated_tokens DESC
        LIMIT 12
      `,
      [ownerKey]
    );

    const byStatus = await db.query(
      `
        SELECT
          COALESCE(status, 'unknown') AS status,
          COUNT(*)::int AS requests
        FROM riomind_usage_events
        WHERE owner_key = $1
        GROUP BY COALESCE(status, 'unknown')
        ORDER BY requests DESC
        LIMIT 12
      `,
      [ownerKey]
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      ownerKey,
      summary: result.rows[0],
      byRoute: byRoute.rows,
      byStatus: byStatus.rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "usage_summary_failed",
      },
      { status: 500 }
    );
  }
}
