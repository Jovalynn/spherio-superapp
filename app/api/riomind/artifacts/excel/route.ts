import { NextRequest, NextResponse } from "next/server";

import { createExcelArtifact } from "@/lib/riomind/artifacts/excel";
import { getRioMindOwnerKey } from "@/lib/riomind/db";
import { registerRioMindArtifactSafely } from "@/lib/riomind/artifacts/registry";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ownerKey = getRioMindOwnerKey(request.headers);

    const artifact = await createExcelArtifact({
      ownerKey,
      title: body?.title,
      columns: body?.columns,
      rows: body?.rows,
      mode: body?.mode,
    });

    registerRioMindArtifactSafely({
      ownerKey,
      artifact,
      source: "direct_excel_route",
    });

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      artifact,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "excel_artifact_failed";

    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: message,
        message:
          message === "rows_and_columns_required"
            ? "Provide rows as an array of objects and optional columns as an array of column names."
            : "Nexus could not generate the Excel artifact.",
      },
      { status: message === "rows_and_columns_required" ? 400 : 500 }
    );
  }
}
