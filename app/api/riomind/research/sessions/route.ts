import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);

    const result = await db.query(
      `
        SELECT id, owner_key, title, goal, depth, sources, output_type, status, created_at, updated_at
        FROM riomind_research_sessions
        WHERE owner_key = $1
        ORDER BY updated_at DESC
        LIMIT $2
      `,
      [ownerKey, limit]
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      sessions: result.rows.map(mapSession),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "research_sessions_list_failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const body = await request.json().catch(() => ({}));

    const title = clean(body.title || body.goal || "Untitled research");
    const goal = clean(body.goal || "");
    const depth = clean(body.depth || "standard");
    const sources = clean(body.sources || "combined");
    const outputType = clean(body.outputType || body.output_type || "report");
    const status = clean(body.status || "active");

    if (!title) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "research_title_required" },
        { status: 400 }
      );
    }

    const id = randomUUID();

    const result = await db.query(
      `
        INSERT INTO riomind_research_sessions (
          id, owner_key, title, goal, depth, sources, output_type, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, owner_key, title, goal, depth, sources, output_type, status, created_at, updated_at
      `,
      [id, ownerKey, title, goal, depth, sources, outputType, status]
    );

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
        error: error instanceof Error ? error.message : "research_session_create_failed",
      },
      { status: 400 }
    );
  }
}
