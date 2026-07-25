import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25), 1), 100);

    const result = await db.query(
      `
        SELECT
          id,
          conversation_id,
          request_type,
          product,
          route,
          agent,
          capability,
          input_chars,
          output_chars,
          estimated_input_tokens,
          estimated_output_tokens,
          latency_ms,
          status,
          created_at
        FROM riomind_usage_events
        WHERE owner_key = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [ownerKey, limit]
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      ownerKey,
      events: result.rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        requestType: row.request_type,
        product: row.product,
        route: row.route,
        agent: row.agent,
        capability: row.capability,
        inputChars: row.input_chars,
        outputChars: row.output_chars,
        estimatedInputTokens: row.estimated_input_tokens,
        estimatedOutputTokens: row.estimated_output_tokens,
        latencyMs: row.latency_ms,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "usage_events_failed",
      },
      { status: 500 }
    );
  }
}
