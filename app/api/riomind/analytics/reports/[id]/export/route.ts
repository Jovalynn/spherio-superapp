import { NextRequest, NextResponse } from "next/server";

import { getRioMindPgPool, getRioMindOwnerKey } from "@/lib/riomind/db";

import { createPdfArtifact } from "@/lib/riomind/artifacts/pdf";
import { createDocxArtifact } from "@/lib/riomind/artifacts/docx";
import { createPptxArtifact } from "@/lib/riomind/artifacts/pptx";
import { createExcelArtifact } from "@/lib/riomind/artifacts/excel";

import { registerRioMindArtifactSafely } from "@/lib/riomind/artifacts/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));
    const format = String(body?.format || "").toLowerCase();

    const ownerKey = getRioMindOwnerKey(request.headers);
    const db = getRioMindPgPool();

    const reportResult = await db.query(
      `
      SELECT *
      FROM riomind_analytics_reports
      WHERE id = $1
      AND owner_key = $2
      LIMIT 1
      `,
      [id, ownerKey]
    );

    if (!reportResult.rows.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "report_not_found",
        },
        { status: 404 }
      );
    }

    const report = reportResult.rows[0];

    let artifact: any = null;

    switch (format) {
      case "pdf":
        artifact = await createPdfArtifact({
          ownerKey,
          title: report.title,
          content: report.content,
        });
        break;

      case "docx":
        artifact = await createDocxArtifact({
          ownerKey,
          title: report.title,
          content: report.content,
        });
        break;

      case "pptx":
        artifact = await createPptxArtifact({
          ownerKey,
          title: report.title,
          content: report.content,
        });
        break;

      case "xlsx":
        artifact = await createExcelArtifact({
          ownerKey,
          title: report.title,
          rows: [
            {
              Report: report.title,
              Content: report.content,
            },
          ],
        });
        break;

      default:
        return NextResponse.json(
          {
            ok: false,
            error: "unsupported_format",
          },
          { status: 400 }
        );
    }

    registerRioMindArtifactSafely({
      ownerKey,
      artifact,
      source: "analytics_report_export",
    });

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      artifact,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "analytics_export_failed",
      },
      { status: 500 }
    );
  }
}
