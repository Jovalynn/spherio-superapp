import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function clean(value: unknown, fallback = "") {
  return String(value ?? fallback).replace(/\s+/g, " ").trim();
}

function mapSession(row: any) {
  return {
    id: row.id,
    ownerKey: row.owner_key,
    title: row.title,
    goal: row.goal,
    depth: row.depth,
    sources: row.sources,
    outputType: row.output_type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const status = clean(body.status || "archived");

    const result = await db.query(
      `
        UPDATE riomind_research_sessions
        SET status = $3, updated_at = NOW()
        WHERE id = $1 AND owner_key = $2
        RETURNING id, owner_key, title, goal, depth, sources, output_type, status, created_at, updated_at
      `,
      [id, ownerKey, status]
    );

    if (!result.rowCount) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "research_session_not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      session: mapSession(result.rows[0]),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "research_session_update_failed",
      },
      { status: 400 }
    );
  }
}
