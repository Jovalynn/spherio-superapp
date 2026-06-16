import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function mapReport(row: any) {
  return {
    id: row.id,
    sessionId: row.session_id,
    ownerKey: row.owner_key,
    title: row.title,
    reportContent: row.report_content,
    reportType: row.report_type,
    artifactName: row.artifact_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const url = new URL(request.url);
    const sessionId = clean(url.searchParams.get("sessionId"));
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);

    const params: unknown[] = [ownerKey];
    let where = "owner_key = $1";

    if (sessionId) {
      params.push(sessionId);
      where += ` AND session_id = $${params.length}`;
    }

    params.push(limit);

    const result = await db.query(
      `
        SELECT id, session_id, owner_key, title, report_content, report_type, artifact_name, created_at, updated_at
        FROM riomind_research_reports
        WHERE ${where}
        ORDER BY updated_at DESC
        LIMIT $${params.length}
      `,
      params
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      reports: result.rows.map(mapReport),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "research_reports_list_failed",
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

    const sessionId = clean(body.sessionId || body.session_id);
    const title = clean(body.title || "Untitled research report");
    const reportContent = clean(body.reportContent || body.report_content);
    const reportType = clean(body.reportType || body.report_type || "report");

    if (!sessionId || !title || !reportContent) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "session_title_content_required" },
        { status: 400 }
      );
    }

    const sessionCheck = await db.query(
      `
        SELECT id
        FROM riomind_research_sessions
        WHERE id = $1 AND owner_key = $2
        LIMIT 1
      `,
      [sessionId, ownerKey]
    );

    if (!sessionCheck.rowCount) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "research_session_not_found" },
        { status: 404 }
      );
    }

    const id = randomUUID();

    const result = await db.query(
      `
        INSERT INTO riomind_research_reports (
          id, session_id, owner_key, title, report_content, report_type
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, session_id, owner_key, title, report_content, report_type, artifact_name, created_at, updated_at
      `,
      [id, sessionId, ownerKey, title, reportContent, reportType]
    );

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
        error: error instanceof Error ? error.message : "research_report_create_failed",
      },
      { status: 400 }
    );
  }
}
