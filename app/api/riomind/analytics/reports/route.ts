import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, fallback = "") {
  return String(value ?? fallback).replace(/\s+/g, " ").trim();
}

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

function buildReportContent(session: any, reportType: string) {
  return [
    `# ${session.title}`,
    "",
    `## Report Type`,
    reportType,
    "",
    "## Executive Summary",
    `This analytics report was generated from a RioMind Nexus Analytics Session using the **${session.mode}** mode.`,
    "",
    "## Source Session",
    `- Session ID: ${session.id}`,
    `- Status: ${session.status}`,
    `- Mode: ${session.mode}`,
    "",
    "## Objective",
    session.goal || session.title,
    "",
    "## Methodology",
    "- Define the decision objective and expected output.",
    "- Identify assumptions, missing inputs, and data-quality constraints.",
    "- Structure the analysis into model drivers, computations, findings, risks, and recommendations.",
    "- Prepare the report for executive review, export, and future dashboard visualization.",
    "",
    "## Analysis Framework",
    "| Area | Focus | Output |",
    "|---|---|---|",
    "| Objective | Business or analytical question | Clear decision statement |",
    "| Inputs | Data, assumptions, files, metrics | Data checklist |",
    "| Model | Computations, formulas, scenarios | Analytical model |",
    "| Findings | Patterns, implications, gaps | Insight summary |",
    "| Risks | Uncertainty, assumptions, validation | Risk notes |",
    "| Recommendations | Practical next steps | Action plan |",
    "",
    "## Recommended Deliverables",
    "- Executive report",
    "- Spreadsheet model",
    "- Presentation deck",
    "- Dashboard view",
    "- Exportable artifact",
    "",
    "## Next Steps",
    "1. Review the report assumptions.",
    "2. Add source files or detailed data where available.",
    "3. Generate PDF, DOCX, PPTX, or XLSX exports.",
    "4. Convert the report into a dashboard when ready.",
  ].join("\\n");
}

export async function GET(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);

    await db.query(`
      CREATE TABLE IF NOT EXISTS riomind_analytics_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_key TEXT NOT NULL,
        session_id UUID NOT NULL,
        title TEXT NOT NULL,
        report_type TEXT NOT NULL DEFAULT 'executive',
        status TEXT NOT NULL DEFAULT 'generated',
        content TEXT NOT NULL,
        artifact_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const result = await db.query(
      `
      SELECT id, owner_key, session_id, title, report_type, status, content, artifact_name, created_at, updated_at
      FROM riomind_analytics_reports
      WHERE owner_key = $1
      ORDER BY updated_at DESC
      LIMIT $2
      `,
      [ownerKey, limit]
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
        error: error instanceof Error ? error.message : "analytics_reports_list_failed",
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

    const sessionId = clean(body.sessionId);
    const reportType = clean(body.reportType || "executive");

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "session_id_required" },
        { status: 400 }
      );
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS riomind_analytics_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_key TEXT NOT NULL,
        session_id UUID NOT NULL,
        title TEXT NOT NULL,
        report_type TEXT NOT NULL DEFAULT 'executive',
        status TEXT NOT NULL DEFAULT 'generated',
        content TEXT NOT NULL,
        artifact_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const sessionResult = await db.query(
      `
      SELECT id, owner_key, title, mode, goal, status, created_at, updated_at
      FROM riomind_analytics_sessions
      WHERE id = $1 AND owner_key = $2
      LIMIT 1
      `,
      [sessionId, ownerKey]
    );

    const session = sessionResult.rows[0];

    if (!session) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "analytics_session_not_found" },
        { status: 404 }
      );
    }

    const id = randomUUID();
    const title = `${session.title} — ${reportType} report`;
    const content = buildReportContent(session, reportType);

    const result = await db.query(
      `
      INSERT INTO riomind_analytics_reports (
        id, owner_key, session_id, title, report_type, status, content
      )
      VALUES ($1, $2, $3, $4, $5, 'generated', $6)
      RETURNING id, owner_key, session_id, title, report_type, status, content, artifact_name, created_at, updated_at
      `,
      [id, ownerKey, sessionId, title, reportType, content]
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
        error: error instanceof Error ? error.message : "analytics_report_create_failed",
      },
      { status: 500 }
    );
  }
}
