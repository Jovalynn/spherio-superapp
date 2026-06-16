import { NextRequest, NextResponse } from "next/server";

import { createExcelArtifact } from "@/lib/riomind/artifacts/excel";
import { createPdfArtifact } from "@/lib/riomind/artifacts/pdf";
import { createPptxArtifact } from "@/lib/riomind/artifacts/pptx";
import { registerRioMindArtifactSafely } from "@/lib/riomind/artifacts/registry";
import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function clean(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function contentToRows(content: string) {
  return content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      "#": index + 1,
      "Research Note": line,
    }));
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const format = clean(body.format || "pdf").toLowerCase();

    const reportResult = await db.query(
      `
        SELECT id, session_id, owner_key, title, report_content, report_type
        FROM riomind_research_reports
        WHERE id = $1 AND owner_key = $2
        LIMIT 1
      `,
      [id, ownerKey]
    );

    if (!reportResult.rowCount) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "research_report_not_found" },
        { status: 404 }
      );
    }

    const report = reportResult.rows[0];
    const title = clean(report.title || "Nexus Research Report");
    const content = clean(report.report_content || "");

    let artifact: any;

    if (format === "excel" || format === "xlsx") {
      artifact = await createExcelArtifact({
        ownerKey,
        title,
        columns: ["#", "Research Note"],
        rows: contentToRows(content),
        mode: "research_report",
      });
    } else if (format === "ppt" || format === "pptx" || format === "powerpoint") {
      artifact = await createPptxArtifact({
        ownerKey,
        title,
        content,
        sections: [
          {
            title,
            body: content,
          },
        ],
      });
    } else {
      artifact = await createPdfArtifact({
        ownerKey,
        title,
        content,
        sections: [
          {
            title,
            body: content,
          },
        ],
      });
    }

    registerRioMindArtifactSafely({
      ownerKey,
      artifact,
      source: `research_report_${format}_export`,
    });

    await db.query(
      `
        UPDATE riomind_research_reports
        SET artifact_name = $3, updated_at = NOW()
        WHERE id = $1 AND owner_key = $2
      `,
      [id, ownerKey, artifact?.name || artifact?.filename || null]
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      format,
      artifact,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "research_report_export_failed",
      },
      { status: 500 }
    );
  }
}
