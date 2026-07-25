import { readFile } from "fs/promises";

import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ fileId: string }> | { fileId: string };
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { fileId } = await context.params;
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);

    const result = await db.query(
      `
        SELECT
          original_name,
          storage_path,
          mime_type,
          size_bytes
        FROM riomind_files
        WHERE id = $1
          AND owner_key = $2
        LIMIT 1
      `,
      [fileId, ownerKey]
    );

    if (!result.rowCount) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "file_not_found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const buffer = await readFile(row.storage_path);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": row.mime_type || "application/octet-stream",
        "Content-Length": String(row.size_bytes ?? buffer.length),
        "Content-Disposition": `inline; filename="${String(row.original_name).replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "file_content_failed",
      },
      { status: 500 }
    );
  }
}
