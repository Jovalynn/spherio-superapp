import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const conversationId = request.nextUrl.searchParams.get("conversationId");

    const params: unknown[] = [ownerKey];
    let where = "owner_key = $1";

    if (conversationId) {
      params.push(conversationId);
      where += ` AND conversation_id = $${params.length}`;
    }

    const result = await db.query(
      `
        SELECT
          id,
          conversation_id,
          message_id,
          original_name,
          mime_type,
          size_bytes,
          status,
          metadata->>'textPreview' AS text_preview,
          created_at
        FROM riomind_files
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT 100
      `,
      params
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      files: result.rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        messageId: row.message_id,
        name: row.original_name,
        mimeType: row.mime_type,
        sizeBytes: Number(row.size_bytes),
        status: row.status,
        createdAt: row.created_at,
        textPreview: row.text_preview,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "files_list_failed",
      },
      { status: 500 }
    );
  }
}
